/**
 * electronCrashLogger.js  (Main Process)
 * Taruh di: src/main/services/electronCrashLogger.js
 *
 * Tambahkan di main/index.js paling awal:
 *   import { initElectronCrashLogger } from './services/electronCrashLogger.js'
 *   initElectronCrashLogger()
 */

import { app, ipcMain } from 'electron'
import os from 'os'
import { exec } from 'child_process'
import { DISCORD_WEBHOOK_URL } from '../config'

const COLORS = { crash: 0x992d22, error: 0xe74c3c, warn: 0xe67e22, info: 0x3498db }

let _device = null

function resolveUuid() {
  return new Promise((resolve) => {
    const cmds = {
      win32: 'wmic csproduct get uuid',
      linux: 'cat /etc/machine-id 2>/dev/null || cat /var/lib/dbus/machine-id 2>/dev/null',
      darwin: "system_profiler SPHardwareDataType | awk '/Hardware UUID/ {print $3}'"
    }
    const cmd = cmds[process.platform]
    if (!cmd) return resolve('—')
    exec(cmd, (err, stdout) => {
      if (err) return resolve('—')
      const lines = stdout
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      resolve(process.platform === 'win32' ? lines[1] || '—' : lines[0] || '—')
    })
  })
}

function resolveBrand() {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec('wmic computersystem get manufacturer,model /format:list', (err, stdout) => {
        if (err) return resolve('—')
        const lines = stdout
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
        const mfr = lines.find((l) => l.startsWith('Manufacturer='))?.split('=')[1] || ''
        const model = lines.find((l) => l.startsWith('Model='))?.split('=')[1] || ''
        resolve(`${mfr} ${model}`.trim() || '—')
      })
    } else if (process.platform === 'darwin') {
      exec("system_profiler SPHardwareDataType | grep 'Model Name'", (err, stdout) => {
        resolve(err ? 'Apple' : `Apple ${stdout.split(':')[1]?.trim() || ''}`.trim())
      })
    } else {
      exec('cat /sys/class/dmi/id/sys_vendor 2>/dev/null', (err, stdout) => {
        resolve(err ? '—' : stdout.trim() || '—')
      })
    }
  })
}

async function getDevice() {
  if (_device) return _device
  const [uuid, brand] = await Promise.all([resolveUuid(), resolveBrand()])
  const ifaces = os.networkInterfaces()
  let ip = '—',
    mac = '—'
  for (const iface of Object.values(ifaces)) {
    for (const cfg of iface) {
      if (!cfg.internal && cfg.family === 'IPv4') {
        ip = cfg.address
        mac = cfg.mac
        break
      }
    }
    if (ip !== '—') break
  }
  const cpus = os.cpus()
  _device = {
    uuid,
    brand,
    name: os.hostname(),
    username: os.userInfo().username,
    platform: `${os.platform()} ${os.arch()}`,
    osVersion: os.version(),
    cpu: `${cpus[0]?.model || '—'} (${cpus.length} core)`,
    totalRam: `${Math.round((os.totalmem() / 1024 / 1024 / 1024) * 10) / 10} GB`,
    freeRam: `${Math.round((os.freemem() / 1024 / 1024 / 1024) * 10) / 10} GB`,
    ip,
    mac,
    uptime: `${Math.floor(os.uptime() / 60)} mnt`
  }
  return _device
}

function trunc(val, max = 1024) {
  if (val == null) return '—'
  const s = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)
  return s.length > max ? s.slice(0, max - 3) + '...' : s
}

function fmtStack(stack, max = 900) {
  if (!stack) return '—'
  const s = stack.replace(/\r/g, '').trim()
  return s.length > max ? s.slice(0, max - 3) + '...' : s
}

async function sendDiscord({ level = 'crash', title, fields = [] }) {
  try {
    const device = await getDevice()
    const version = app.getVersion?.() || '—'

    const embed = {
      title,
      color: COLORS[level] ?? COLORS.crash,
      timestamp: new Date().toISOString(),
      footer: { text: `SATUDMB Desktop • Main Process • v${version}` },
      fields: [
        ...fields,
        { name: '\u200b', value: '\u200b', inline: false },
        {
          name: '💻 Device',
          value: `**Nama:** \`${device.name}\`\n**Brand:** \`${device.brand}\`\n**UUID:** \`${device.uuid}\`\n**User:** \`${device.username}\``,
          inline: true
        },
        {
          name: '⚙️ Sistem',
          value: `**OS:** \`${device.platform}\`\n**Ver:** \`${trunc(device.osVersion, 70)}\`\n**CPU:** \`${trunc(device.cpu, 70)}\`\n**RAM:** \`${device.freeRam} / ${device.totalRam}\``,
          inline: true
        },
        {
          name: '🌐 Network',
          value: `**IP:** \`${device.ip}\`\n**MAC:** \`${device.mac}\`\n**Uptime:** \`${device.uptime}\``,
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
    console.warn('[CrashLogger] Discord send failed:', err.message)
  }
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

function onUncaughtException(err) {
  console.error('[CRASH] uncaughtException:', err)
  sendDiscord({
    level: 'crash',
    title: '💥 Uncaught Exception — Main Process',
    fields: [
      {
        name: '❌ Error',
        value: `**${trunc(err?.name, 80)}:** ${trunc(err?.message, 400)}`,
        inline: false
      },
      { name: '📋 Stack Trace', value: `\`\`\`\n${fmtStack(err?.stack)}\n\`\`\``, inline: false }
    ]
  })
}

function onUnhandledRejection(reason) {
  console.error('[CRASH] unhandledRejection:', reason)
  const msg = reason instanceof Error ? reason.message : String(reason)
  const stack = reason instanceof Error ? reason.stack : null
  sendDiscord({
    level: 'crash',
    title: '💥 Unhandled Promise Rejection — Main Process',
    fields: [
      { name: '❌ Reason', value: `\`\`\`\n${trunc(msg, 700)}\n\`\`\``, inline: false },
      ...(stack
        ? [{ name: '📋 Stack Trace', value: `\`\`\`\n${fmtStack(stack)}\n\`\`\``, inline: false }]
        : [])
    ]
  })
}

function onRendererGone(_event, webContents, details) {
  console.error('[CRASH] render-process-gone:', details)
  sendDiscord({
    level: 'crash',
    title: '💥 Renderer Process Crash',
    fields: [
      {
        name: '🔍 Detail',
        value: `**Reason:** \`${details.reason}\`\n**Exit Code:** \`${details.exitCode ?? '—'}\`\n**URL:** \`${webContents?.getURL?.() || '—'}\``,
        inline: false
      }
    ]
  })
}

function onChildProcessGone(_event, details) {
  if (details.reason === 'exited' && details.exitCode === 0) return
  console.error('[CRASH] child-process-gone:', details)
  sendDiscord({
    level: 'crash',
    title: `💥 Child Process Crash — ${details.type || 'unknown'}`,
    fields: [
      {
        name: '🔍 Detail',
        value: `**Type:** \`${details.type || '—'}\`\n**Reason:** \`${details.reason}\`\n**Exit Code:** \`${details.exitCode ?? '—'}\``,
        inline: false
      }
    ]
  })
}

// Forward log dari renderer process ke Discord
function onRendererLog(_event, payload) {
  sendDiscord(payload)
}

// ─── Init ─────────────────────────────────────────────────────────────────────
export function initElectronCrashLogger() {
  process.on('uncaughtException', onUncaughtException)
  process.on('unhandledRejection', onUnhandledRejection)
  app.on('render-process-gone', onRendererGone)
  app.on('child-process-gone', onChildProcessGone)
  ipcMain.on('discord:log', onRendererLog)
  console.log('[CrashLogger] Initialized ✅')
}
