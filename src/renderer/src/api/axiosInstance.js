// hooks/useAxiosInstance.ts
import { LoggerService } from '@renderer/services/loggerService'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNotifier } from '../components/core/NotificationProvider'
import { useConfigStore } from '@renderer/store/configProvider'

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

  // Fungsi untuk mendapatkan informasi halaman saat ini
  const getCurrentPageInfo = () => {
    return {
      path: location.pathname,
      fullPath: location.pathname + location.search,
      route: location.pathname.split('/').filter(Boolean).join(' → ') || 'Home',
      timestamp: new Date().toISOString()
    }
  }

  // Interceptor untuk request (logging)
  instance.interceptors.request.use(
    (config) => {
      // Skip logging untuk GET requests
      if (config.method?.toUpperCase() === 'GET') {
        return config
      }

      const pageInfo = getCurrentPageInfo()

      // Log request hanya untuk non-GET methods
      LoggerService.debug(
        'AxiosInstance.Request',
        `Making ${config.method?.toUpperCase()} request to ${config.url}`,
        {
          request: {
            url: config.url,
            method: config.method?.toUpperCase(),
            headers: config.headers,
            baseURL: config.baseURL
          },
          params: config.params,
          payload: config.data,
          meta: {
            page: pageInfo
          }
        }
      )
      return config
    },
    (error) => {
      const pageInfo = getCurrentPageInfo()

      LoggerService.error('AxiosInstance.Request', 'Request interceptor error', {
        error: error.message,
        meta: {
          page: pageInfo
        }
      })
      return Promise.reject(error)
    }
  )

  // Interceptor untuk handle response dan error global
  instance.interceptors.response.use(
    (response) => {
      const pageInfo = getCurrentPageInfo()
      const method = response.config.method?.toUpperCase()

      // Skip logging untuk successful GET responses
      if (method === 'GET') {
        return response
      }

      // Log successful responses hanya untuk non-GET methods
      LoggerService.info('AxiosInstance.Response', `Success ${method} ${response.config.url}`, {
        request: {
          url: response.config.url,
          method: method
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        },
        meta: {
          page: pageInfo
        }
      })
      return response
    },
    (error) => {
      const status = error.response?.status
      const url = error.config?.url
      const method = error.config?.method?.toUpperCase()
      const pageInfo = getCurrentPageInfo()

      if (status === 401) {
        LoggerService.warn('AxiosInstance.Auth', 'Unauthorized access - redirecting to login', {
          reason: 'Token expired or invalid',
          actions: 'Clearing storage and redirecting',
          meta: {
            page: pageInfo,
            previousPage: location.pathname
          }
        })
        localStorage.clear()
        notifier.show({
          message: 'Akses Ditolak',
          description: 'Harap login terlebih dahulu.',
          severity: 'warning'
        })
        localStorage.clear()
        // window.electron?.ipcRenderer.send('window-close')
        if (window.electron && window.electron.ipcRenderer) {
          window.electron.ipcRenderer.send('logout')
        } else {
          navigate('/login')
        }
        return Promise.reject(error) // Return rejected promise untuk menghentikan chain
      }

      // Skip logging untuk GET errors (kecuali error penting)
      if (method === 'GET') {
        // Hanya log GET errors untuk status error tertentu
        if (status !== 200 || !error.response) {
          LoggerService.error(
            'AxiosInstance.Response',
            `Error ${method} ${url} - Status: ${status || 'No Response'}`,
            {
              request: {
                url: error.config?.url,
                method: method,
                baseURL: error.config?.baseURL
              },
              response: error.response
                ? {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                  }
                : undefined,
              error: {
                message: error.message,
                code: error.code
              },
              meta: {
                page: pageInfo,
                userAction: getCurrentUserAction(location.pathname, method, url)
              }
            }
          )
        }
        // Untuk GET errors lainnya, skip logging
        return Promise.reject(error)
      }

      // Log error details untuk non-GET methods
      LoggerService.error(
        'AxiosInstance.Response',
        `Error ${method} ${url} - Status: ${status || 'No Response'}`,
        {
          request: {
            url: error.config?.url,
            method: method,
            baseURL: error.config?.baseURL
          },
          response: error.response
            ? {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
              }
            : undefined,
          error: {
            message: error.message,
            code: error.code
          },
          meta: {
            page: pageInfo,
            userAction: getCurrentUserAction(location.pathname, method, url)
          }
        }
      )

      // Handle different error statuses
      if (status === 401) {
        LoggerService.warn('AxiosInstance.Auth', 'Unauthorized access - redirecting to login', {
          reason: 'Token expired or invalid',
          actions: 'Clearing storage and redirecting',
          meta: {
            page: pageInfo,
            previousPage: location.pathname
          }
        })
        localStorage.clear()
        notifier.show({
          message: 'Akses Ditolak',
          description: 'Harap login terlebih dahulu.',
          severity: 'warning'
        })
        navigate('/login')
      } else if (status === 403) {
        LoggerService.warn('AxiosInstance.Auth', 'Forbidden access - user lacks permission', {
          url: error.config?.url,
          method: method,
          meta: {
            page: pageInfo,
            attemptedAction: getActionDescription(method, url)
          }
        })
        notifier.show({
          message: 'Akses Ditolak',
          description: 'Anda tidak memiliki izin untuk halaman ini.',
          severity: 'warning'
        })
      } else if (status === 500) {
        LoggerService.error('AxiosInstance.Server', 'Internal server error', {
          url: error.config?.url,
          response: error.response?.data,
          meta: {
            page: pageInfo
          }
        })
        notifier.show({
          message: 'Kesalahan Server',
          description: 'Terjadi kesalahan di server, coba lagi nanti.',
          severity: 'error'
        })
      } else if (!error.response) {
        LoggerService.error('AxiosInstance.Network', 'Network error - no response from server', {
          url: error.config?.url,
          error: error.message,
          meta: {
            page: pageInfo
          }
        })
        notifier.show({
          message: 'Koneksi Gagal',
          description: 'Tidak dapat terhubung ke server.',
          severity: 'error'
        })
      } else {
        // Log other HTTP errors untuk non-GET methods
        LoggerService.warn('AxiosInstance.HTTP', `HTTP Error ${status} for ${method} ${url}`, {
          request: {
            url: error.config?.url,
            method: method
          },
          response: error.response
            ? {
                status: error.response.status,
                data: error.response.data
              }
            : undefined,
          meta: {
            page: pageInfo
          }
        })
      }

      return Promise.reject(error)
    }
  )

  return instance
}

// ================================
// STANDALONE AXIOS INSTANCE (tanpa React hooks)
// Untuk digunakan di background sync (tanpa React hooks)
// ================================
export const createStandaloneAxios = () => {
  // Get config from store (tanpa hook)
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

  // Simple interceptor untuk request (minimal logging)
  instance.interceptors.request.use(
    (requestConfig) => {
      // Refresh token di setiap request (kalau berubah)
      const currentToken = localStorage.getItem('token')
      if (currentToken) {
        requestConfig.headers.Authorization = `Bearer ${currentToken}`
      }
      return requestConfig
    },
    (error) => {
      console.error('[StandaloneAxios] Request error:', error.message)
      return Promise.reject(error)
    }
  )

  // Simple interceptor untuk response
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status
      const url = error.config?.url

      console.error(
        `[StandaloneAxios] Error ${error.config?.method?.toUpperCase()} ${url} - Status: ${status || 'No Response'}`
      )

      if (status === 401) {
        console.warn('[StandaloneAxios] Unauthorized - token may be expired')
      }

      return Promise.reject(error)
    }
  )

  return instance
}

// Helper function untuk mendeskripsikan aksi user
const getCurrentUserAction = (currentPath, method, url) => {
  const pathSegments = currentPath.split('/').filter(Boolean)
  const currentSection = pathSegments[0] || 'dashboard'

  let action = `Mengakses halaman ${currentSection}`

  if (method && url) {
    const apiAction = getActionDescription(method, url)
    action += ` → ${apiAction}`
  }

  return action
}

// Helper function untuk mendeskripsikan aksi API
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
