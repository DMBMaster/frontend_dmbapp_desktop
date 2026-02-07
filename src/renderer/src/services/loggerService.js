import { loggerDB } from '@renderer/db/loggerDB'
import { withLocalLogger } from '@renderer/utils/config'

const safeSerialize = (value) => {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

// Fungsi untuk mendapatkan informasi device dari browser
const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'server',
      platform: 'server',
      language: 'unknown',
      timezone: 'unknown'
    }
  }

  // Deteksi browser
  const ua = navigator.userAgent
  let browser = 'Unknown'
  let os = 'Unknown'

  // Deteksi browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg')) browser = 'Edge'

  // Deteksi OS
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'MacOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

  // Deteksi tipe device
  let deviceType = 'Desktop'
  if (ua.includes('Mobile')) deviceType = 'Mobile'
  if (ua.includes('Tablet')) deviceType = 'Tablet'

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    deviceType,
    browser,
    os
  }
}

// Fungsi untuk mendapatkan IP local (hanya untuk development/local)
const getLocalIP = async () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve('server')
      return
    }

    // Untuk environment local, kita bisa menggunakan WebRTC untuk mendapatkan IP local
    const RTCPeerConnection =
      window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection

    if (!RTCPeerConnection) {
      resolve('local-device')
      return
    }

    try {
      const pc = new RTCPeerConnection({ iceServers: [] })
      pc.createDataChannel('')
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => resolve('local-device'))

      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) {
          resolve('local-device')
          return
        }

        const candidate = ice.candidate.candidate
        const match = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/)
        if (match) {
          resolve(match[1])
        } else {
          resolve('local-device')
        }
        pc.close()
      }

      // Timeout fallback
      setTimeout(() => {
        resolve('local-device')
        pc.close()
      }, 1000)
    } catch (error) {
      console.warn('Failed to get local IP:', error)
      resolve('local-device')
    }
  })
}

// Fungsi untuk mendapatkan informasi lengkap
const getClientInfo = async () => {
  const deviceInfo = getDeviceInfo()
  const ip = await getLocalIP()

  return {
    device: deviceInfo,
    ip,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    hostname: typeof window !== 'undefined' ? window.location.hostname : undefined
  }
}

const saveLog = async (data) => {
  try {
    // Dapatkan informasi client
    if (withLocalLogger) {
      const clientInfo = await getClientInfo()

      const cleaned = {
        ...data,
        request: data.request ? safeSerialize(data.request) : undefined,
        payload: data.payload ? safeSerialize(data.payload) : undefined,
        response: data.response ? safeSerialize(data.response) : undefined,
        meta: data.meta
          ? {
              ...(typeof data.meta === 'object' ? data.meta : {}),
              client: clientInfo
            }
          : { client: clientInfo },
        created_at: new Date().toISOString()
      }

      await loggerDB.logs.add(cleaned)
    }
  } catch (error) {
    console.error('Failed to save log:', error)
  }
}

export const LoggerService = {
  async info(action, message, extra) {
    await saveLog({
      type: 'INFO',
      action,
      message,
      ...extra,
      created_at: new Date().toISOString()
    })
  },

  async warn(action, message, extra) {
    await saveLog({
      type: 'WARN',
      action,
      message,
      ...extra,
      created_at: new Date().toISOString()
    })
  },

  async error(action, message, extra) {
    await saveLog({
      type: 'ERROR',
      action,
      message,
      ...extra,
      created_at: new Date().toISOString()
    })
  },

  async debug(action, message, extra) {
    await saveLog({
      type: 'DEBUG',
      action,
      message,
      ...extra,
      created_at: new Date().toISOString()
    })
  }
}
