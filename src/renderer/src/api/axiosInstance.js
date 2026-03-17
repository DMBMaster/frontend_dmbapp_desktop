// hooks/useAxiosInstance.ts
import { LoggerService } from '@renderer/services/loggerService'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNotifier } from '../components/core/NotificationProvider'
import { useConfigStore } from '@renderer/store/configProvider'
import { sendErrorToDiscord } from '@renderer/services/discordLogService'

export const useAxiosInstance = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { config } = useConfigStore.getState()
  const baseURL = config?.API_URL || 'https://api.dmbapp.cloud'
  const token = localStorage.getItem('token')

  const instance = axios.create({
    baseURL: `${baseURL}`,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  })

  const notifier = useNotifier()

  const getCurrentPageInfo = () => ({
    path: location.pathname,
    fullPath: location.pathname + location.search,
    route: location.pathname.split('/').filter(Boolean).join(' → ') || 'Home',
    timestamp: new Date().toISOString()
  })

  const getFullUrl = (requestBaseUrl, requestUrl) => {
    if (!requestUrl) return requestBaseUrl || ''
    if (/^https?:\/\//i.test(requestUrl)) return requestUrl
    if (!requestBaseUrl) return requestUrl
    const normalizedBase = requestBaseUrl.endsWith('/')
      ? requestBaseUrl.slice(0, -1)
      : requestBaseUrl
    const normalizedPath = requestUrl.startsWith('/') ? requestUrl : `/${requestUrl}`
    return `${normalizedBase}${normalizedPath}`
  }

  // ─── Request interceptor ────────────────────────────────────────────────────
  instance.interceptors.request.use(
    (config) => {
      if (config.method?.toUpperCase() === 'GET') return config

      const pageInfo = getCurrentPageInfo()
      const fullUrl = getFullUrl(config.baseURL, config.url)
      LoggerService.debug(
        'AxiosInstance.Request',
        `Making ${config.method?.toUpperCase()} request to ${fullUrl}`,
        {
          request: {
            url: fullUrl,
            method: config.method?.toUpperCase(),
            headers: config.headers,
            baseURL: config.baseURL
          },
          params: config.params,
          payload: config.data,
          meta: { page: pageInfo }
        }
      )
      return config
    },
    (error) => {
      const pageInfo = getCurrentPageInfo()
      LoggerService.error('AxiosInstance.Request', 'Request interceptor error', {
        error: error.message,
        meta: { page: pageInfo }
      })
      return Promise.reject(error)
    }
  )

  // ─── Response interceptor ───────────────────────────────────────────────────
  instance.interceptors.response.use(
    (response) => {
      const pageInfo = getCurrentPageInfo()
      const method = response.config.method?.toUpperCase()
      const fullUrl = getFullUrl(response.config.baseURL, response.config.url)

      if (method === 'GET') return response

      LoggerService.info('AxiosInstance.Response', `Success ${method} ${fullUrl}`, {
        request: { url: fullUrl, method },
        response: {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        },
        meta: { page: pageInfo }
      })
      return response
    },
    async (error) => {
      const status = error.response?.status
      const url = error.config?.url
      const fullUrl = getFullUrl(error.config?.baseURL, url)
      const method = error.config?.method?.toUpperCase()
      const requestParams = error.config?.params
      const requestPayload = error.config?.data
      const pageInfo = getCurrentPageInfo()

      // ── 401 early-exit ────────────────────────────────────────────────────
      if (status === 401) {
        LoggerService.warn('AxiosInstance.Auth', 'Unauthorized access - redirecting to login', {
          reason: 'Token expired or invalid',
          actions: 'Clearing storage and redirecting',
          meta: { page: pageInfo, previousPage: location.pathname }
        })

        // 🔔 Kirim ke Discord
        sendErrorToDiscord({
          level: 'warn',
          source: 'AxiosInstance',
          method,
          url: fullUrl,
          status: 401,
          errorMsg: 'Unauthorized — token expired or invalid',
          requestParams,
          requestPayload,
          page: pageInfo
        })

        localStorage.clear()
        notifier.show({
          message: 'Akses Ditolak',
          description: 'Harap login terlebih dahulu.',
          severity: 'warning'
        })
        if (window.electron?.ipcRenderer) {
          window.electron.ipcRenderer.send('logout')
        } else {
          navigate('/login')
        }
        return Promise.reject(error)
      }

      // ── GET errors — log minimal ──────────────────────────────────────────
      if (method === 'GET') {
        if (status !== 200 || !error.response) {
          LoggerService.error(
            'AxiosInstance.Response',
            `Error ${method} ${fullUrl} - Status: ${status || 'No Response'}`,
            {
              request: { url: fullUrl, method, baseURL: error.config?.baseURL },
              response: error.response
                ? {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                  }
                : undefined,
              error: { message: error.message, code: error.code },
              meta: {
                page: pageInfo,
                userAction: getCurrentUserAction(location.pathname, method, url)
              }
            }
          )

          // 🔔 Kirim ke Discord hanya untuk GET error signifikan (network down / 5xx)
          if (!error.response || status >= 500) {
            sendErrorToDiscord({
              level: 'error',
              source: 'AxiosInstance',
              method,
              url: fullUrl,
              status,
              errorMsg: error.message,
              errorCode: error.code,
              requestParams,
              requestPayload,
              responseData: error.response?.data,
              page: pageInfo
            })
          }
        }
        return Promise.reject(error)
      }

      // ── Non-GET errors — log lengkap ─────────────────────────────────────
      LoggerService.error(
        'AxiosInstance.Response',
        `Error ${method} ${fullUrl} - Status: ${status || 'No Response'}`,
        {
          request: { url: fullUrl, method, baseURL: error.config?.baseURL },
          response: error.response
            ? {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
              }
            : undefined,
          error: { message: error.message, code: error.code },
          meta: { page: pageInfo, userAction: getCurrentUserAction(location.pathname, method, url) }
        }
      )

      // 🔔 Kirim ke Discord untuk semua non-GET errors
      sendErrorToDiscord({
        level: status >= 500 || !error.response ? 'error' : 'warn',
        source: 'AxiosInstance',
        method,
        url: fullUrl,
        status,
        errorMsg: error.message,
        errorCode: error.code,
        requestParams,
        requestPayload,
        responseData: error.response?.data,
        page: pageInfo
      })

      // ── Handle UI notifications per status ────────────────────────────────
      if (status === 403) {
        LoggerService.warn('AxiosInstance.Auth', 'Forbidden access - user lacks permission', {
          url: fullUrl,
          method,
          meta: { page: pageInfo, attemptedAction: getActionDescription(method, fullUrl) }
        })
        notifier.show({
          message: 'Akses Ditolak',
          description: 'Anda tidak memiliki izin untuk halaman ini.',
          severity: 'warning'
        })
      } else if (status === 500) {
        LoggerService.error('AxiosInstance.Server', 'Internal server error', {
          url: fullUrl,
          response: error.response?.data,
          meta: { page: pageInfo }
        })
        notifier.show({
          message: 'Kesalahan Server',
          description: 'Terjadi kesalahan di server, coba lagi nanti.',
          severity: 'error'
        })
      } else if (!error.response) {
        LoggerService.error('AxiosInstance.Network', 'Network error - no response from server', {
          url: fullUrl,
          error: error.message,
          meta: { page: pageInfo }
        })
        notifier.show({
          message: 'Koneksi Gagal',
          description: 'Tidak dapat terhubung ke server.',
          severity: 'error'
        })
      } else {
        LoggerService.warn('AxiosInstance.HTTP', `HTTP Error ${status} for ${method} ${fullUrl}`, {
          request: { url: fullUrl, method },
          response: error.response
            ? { status: error.response.status, data: error.response.data }
            : undefined,
          meta: { page: pageInfo }
        })
      }

      return Promise.reject(error)
    }
  )

  return instance
}

// ─── Standalone (background sync, tanpa React hooks) ───────────────────────
export const createStandaloneAxios = () => {
  const { config } = useConfigStore.getState()
  const baseURL = config?.API_URL || 'https://api.dmbapp.cloud'
  const token = localStorage.getItem('token')

  const instance = axios.create({
    baseURL: `${baseURL}`,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  })

  const getFullUrl = (requestBaseUrl, requestUrl) => {
    if (!requestUrl) return requestBaseUrl || ''
    if (/^https?:\/\//i.test(requestUrl)) return requestUrl
    if (!requestBaseUrl) return requestUrl
    const normalizedBase = requestBaseUrl.endsWith('/')
      ? requestBaseUrl.slice(0, -1)
      : requestBaseUrl
    const normalizedPath = requestUrl.startsWith('/') ? requestUrl : `/${requestUrl}`
    return `${normalizedBase}${normalizedPath}`
  }

  instance.interceptors.request.use(
    (requestConfig) => {
      const currentToken = localStorage.getItem('token')
      if (currentToken) requestConfig.headers.Authorization = `Bearer ${currentToken}`
      return requestConfig
    },
    (error) => {
      console.error('[StandaloneAxios] Request error:', error.message)
      return Promise.reject(error)
    }
  )

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status
      const url = error.config?.url
      const fullUrl = getFullUrl(error.config?.baseURL, url)
      const method = error.config?.method?.toUpperCase()
      const requestParams = error.config?.params
      const requestPayload = error.config?.data

      console.error(
        `[StandaloneAxios] Error ${method} ${fullUrl} - Status: ${status || 'No Response'}`
      )

      if (status === 401) {
        console.warn('[StandaloneAxios] Unauthorized - token may be expired')
      }

      // 🔔 Kirim ke Discord untuk error signifikan dari background sync
      if (!error.response || status >= 500 || status === 401) {
        sendErrorToDiscord({
          level: status >= 500 || !error.response ? 'error' : 'warn',
          source: 'StandaloneAxios',
          method,
          url: fullUrl,
          status,
          errorMsg: error.message,
          errorCode: error.code,
          requestParams,
          requestPayload,
          responseData: error.response?.data
        })
      }

      return Promise.reject(error)
    }
  )

  return instance
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const getCurrentUserAction = (currentPath, method, url) => {
  const currentSection = currentPath.split('/').filter(Boolean)[0] || 'dashboard'
  let action = `Mengakses halaman ${currentSection}`
  if (method && url) action += ` → ${getActionDescription(method, url)}`
  return action
}

const getActionDescription = (method, url) => {
  const urlParts = url.split('/').filter(Boolean)
  const resource = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || 'data'
  switch (method) {
    case 'GET':
      return `Mengambil data ${resource}`
    case 'POST':
      return `Membuat ${resource} baru`
    case 'PUT':
    case 'PATCH':
      return `Memperbarui ${resource}`
    case 'DELETE':
      return `Menghapus ${resource}`
    default:
      return `Melakukan aksi ${method} pada ${resource}`
  }
}
