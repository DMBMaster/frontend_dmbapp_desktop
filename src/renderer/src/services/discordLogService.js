/**
 * discordLogger.js
 * Service untuk mengirim error log ke Discord Webhook
 * Dipanggil dari axiosInstance / axiosInstanceB saat terjadi error HTTP
 */

import { DISCORD_WEBHOOK_URL } from '@renderer/utils/config'

// ─── Color palette per severity ──────────────────────────────────────────────
const COLORS = {
  error: 0xe74c3c, // merah
  warn: 0xe67e22, // oranye
  info: 0x3498db, // biru
  debug: 0x95a5a6 // abu
}

// ─── Emoji per severity ───────────────────────────────────────────────────────
const EMOJI = {
  error: '🔴',
  warn: '🟠',
  info: '🔵',
  debug: '⚪'
}

// ─── Cache device info (di-resolve sekali, reuse selanjutnya) ─────────────────
let _cachedDevice = null

/**
 * Ambil device info dari window.api (preload IPC).
 * Fallback ke nilai minimal kalau belum tersedia.
 */
async function getDeviceInfo() {
  if (_cachedDevice) return _cachedDevice

  try {
    const [deviceName, deviceUuid, deviceBrand, deviceInfo] = await Promise.allSettled([
      window.api?.device?.deviceName?.(),
      window.api?.device?.deviceUuid?.(),
      window.api?.device?.deviceBrand?.(),
      window.api?.device?.deviceInfo?.()
    ])

    const info = deviceInfo.status === 'fulfilled' ? deviceInfo.value : {}
    const brand = deviceBrand.status === 'fulfilled' ? deviceBrand.value : {}

    _cachedDevice = {
      uuid: deviceUuid.status === 'fulfilled' ? deviceUuid.value : '—',
      name: deviceName.status === 'fulfilled' ? deviceName.value : info.hostname || '—',
      brand: brand ? `${brand.manufacturer || ''} ${brand.model || ''}`.trim() || '—' : '—',
      platform: info.platform || navigator.platform || '—',
      arch: info.arch || '—',
      osVersion: info.osVersion || '—',
      cpu: info.cpu || '—',
      cpuCores: info.cpuCores || '—',
      totalRam: info.totalRam ? `${info.totalRam} GB` : '—',
      freeRam: info.freeRam ? `${info.freeRam} GB` : '—',
      ipAddress: info.ipAddress || '—',
      macAddress: info.macAddress || '—',
      username: info.username || '—',
      uptime: info.uptime ? `${info.uptime} mnt` : '—'
    }
  } catch {
    _cachedDevice = {
      uuid: '—',
      name: '—',
      brand: '—',
      platform: navigator.platform || '—',
      arch: '—',
      osVersion: '—',
      cpu: '—',
      cpuCores: '—',
      totalRam: '—',
      freeRam: '—',
      ipAddress: '—',
      macAddress: '—',
      username: '—',
      uptime: '—'
    }
  }

  return _cachedDevice
}

// ─── Truncate panjang string agar tidak melewati limit Discord ────────────────
function trunc(str, max = 1024) {
  if (!str) return '—'
  const s = typeof str === 'object' ? JSON.stringify(str, null, 2) : String(str)
  return s.length > max ? s.slice(0, max - 3) + '...' : s
}

function normalizeRequestData(value) {
  if (value == null || value === '') return undefined
  if (typeof value !== 'string') return value

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

/**
 * Kirim error log HTTP ke Discord webhook.
 *
 * @param {object} opts
 * @param {'error'|'warn'|'info'|'debug'} opts.level
 * @param {string}  opts.source       - e.g. "AxiosInstance" / "AxiosInstanceB"
 * @param {string}  opts.method       - HTTP method (GET, POST, …)
 * @param {string}  opts.url          - endpoint URL
 * @param {number}  [opts.status]     - HTTP status code
 * @param {string}  [opts.errorMsg]   - pesan error
 * @param {string}  [opts.errorCode]  - axios error code (ERR_NETWORK, etc.)
 * @param {object}  [opts.requestParams] - query params request
 * @param {object|string} [opts.requestPayload] - body/payload request
 * @param {object}  [opts.responseData] - body response dari server
 * @param {object}  [opts.page]       - { path, route, timestamp }
 */
export async function sendErrorToDiscord(opts) {
  const {
    level = 'error',
    source = 'AxiosInstance',
    method = '—',
    url = '—',
    status,
    errorMsg,
    errorCode,
    requestParams,
    requestPayload,
    responseData,
    page
  } = opts

  try {
    const device = await getDeviceInfo()
    const color = COLORS[level] ?? COLORS.error
    const emoji = EMOJI[level] ?? '🔴'
    const now = new Date().toISOString()
    const appVer = (await window.api?.getAppVersion?.()) || '—'
    const normalizedRequestPayload = normalizeRequestData(requestPayload)

    // ── Tentukan judul berdasarkan status ─────────────────────────────────────
    let title = `${emoji} HTTP Error ${status ?? 'No Response'} — ${method} ${url}`
    if (!status) title = `${emoji} Network Error — ${method} ${url}`
    if (status === 401) title = `${emoji} Unauthorized (401) — ${method} ${url}`
    if (status === 403) title = `${emoji} Forbidden (403) — ${method} ${url}`
    if (status === 500) title = `${emoji} Server Error (500) — ${method} ${url}`

    const embed = {
      title,
      color,
      timestamp: now,
      footer: {
        text: `SATUDMB Desktop • ${source} • v${appVer}`
      },
      fields: [
        // ── Request info ────────────────────────────────────────────────────
        {
          name: '📡 Request',
          value: [
            `**Method:** \`${method}\``,
            `**URL:** \`${trunc(url, 256)}\``,
            `**Status:** \`${status ?? 'No Response'}\``,
            errorCode ? `**Code:** \`${errorCode}\`` : null
          ]
            .filter(Boolean)
            .join('\n'),
          inline: false
        },

        // ── Error message ────────────────────────────────────────────────────
        ...(errorMsg
          ? [
              {
                name: '❌ Error Message',
                value: `\`\`\`${trunc(errorMsg, 512)}\`\`\``,
                inline: false
              }
            ]
          : []),

        ...(requestParams
          ? [
              {
                name: '🧾 Request Params',
                value: `\`\`\`json\n${trunc(requestParams, 800)}\`\`\``,
                inline: false
              }
            ]
          : []),

        ...(normalizedRequestPayload
          ? [
              {
                name: '📤 Request Payload',
                value: `\`\`\`json\n${trunc(normalizedRequestPayload, 800)}\`\`\``,
                inline: false
              }
            ]
          : []),

        // ── Response body ────────────────────────────────────────────────────
        ...(responseData
          ? [
              {
                name: '📦 Response Data',
                value: `\`\`\`json\n${trunc(responseData, 800)}\`\`\``,
                inline: false
              }
            ]
          : []),

        // ── Page info ─────────────────────────────────────────────────────────
        {
          name: '🖥️ Halaman',
          value: [
            `**Route:** \`${page?.route || '—'}\``,
            `**Path:** \`${page?.fullPath || page?.path || '—'}\``
          ].join('\n'),
          inline: true
        },

        // ── Waktu ─────────────────────────────────────────────────────────────
        {
          name: '🕐 Waktu',
          value: page?.timestamp || now,
          inline: true
        },

        // ── Spacer ────────────────────────────────────────────────────────────
        { name: '\u200b', value: '\u200b', inline: false },

        // ── Device identity ───────────────────────────────────────────────────
        {
          name: '💻 Device',
          value: [
            `**Nama:** \`${device.name}\``,
            `**Brand:** \`${device.brand}\``,
            `**UUID:** \`${device.uuid}\``,
            `**User:** \`${device.username}\``
          ].join('\n'),
          inline: true
        },

        // ── Sistem ────────────────────────────────────────────────────────────
        {
          name: '⚙️ Sistem',
          value: [
            `**OS:** \`${device.platform} ${device.arch}\``,
            `**Versi:** \`${trunc(device.osVersion, 80)}\``,
            `**CPU:** \`${trunc(device.cpu, 80)} (${device.cpuCores} core)\``,
            `**RAM:** \`${device.freeRam} free / ${device.totalRam}\``
          ].join('\n'),
          inline: true
        },

        // ── Network ────────────────────────────────────────────────────────────
        {
          name: '🌐 Network',
          value: [
            `**IP:** \`${device.ipAddress}\``,
            `**MAC:** \`${device.macAddress}\``,
            `**Uptime:** \`${device.uptime}\``
          ].join('\n'),
          inline: true
        }
      ]
    }

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    })
  } catch (err) {
    // Jangan throw — jangan sampai logger crash app
    console.warn('[DiscordLogger] Failed to send log:', err.message)
  }
}
