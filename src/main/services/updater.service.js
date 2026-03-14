import { autoUpdater } from 'electron-updater'
import { ipcMain, dialog } from 'electron'
import { is } from '@electron-toolkit/utils'
import { mainWindow } from '../window.js'
import { DISCORD_WEBHOOK_URL } from '../config.js'

// Helper kirim ke Discord via crash logger yang sudah init di index.js
// (ipcMain handler 'discord:log' sudah terdaftar oleh initElectronCrashLogger)
function sendUpdaterLog({ level, title, fields }) {
  try {
    const COLORS = { crash: 0x992d22, error: 0xe74c3c, warn: 0xe67e22, info: 0x3498db }

    fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title,
            color: COLORS[level] ?? COLORS.info,
            timestamp: new Date().toISOString(),
            footer: { text: 'SATUDMB Desktop • AutoUpdater' },
            fields: fields || []
          }
        ]
      })
    }).catch((err) => console.warn('[Updater] Discord log failed:', err.message))
  } catch (err) {
    console.warn('[Updater] sendUpdaterLog error:', err.message)
  }
}

export function setupAutoUpdater() {
  autoUpdater.autoDownload = false
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'DMBMaster',
    repo: 'frontend_dmbapp_desktop',
    private: true,
    token: process.env.GH_TOKEN
  })

  if (is.dev) {
    autoUpdater.forceDevUpdateConfig = true
  }

  // IPC: manual check updates dari renderer
  ipcMain.on('check-for-updates', () => {
    if (is.dev) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          'update:notification',
          'Aplikasi dalam mode development. Auto-update hanya tersedia untuk versi production yang sudah di-package.',
          'info'
        )
        mainWindow.webContents.send('update:availability', false)
      }
      return
    }
    autoUpdater.checkForUpdates()
  })

  // ── Update tersedia ───────────────────────────────────────────────────────
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version)

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:availability', true)
      mainWindow.webContents.send(
        'update:notification',
        `Versi baru ${info.version} tersedia!`,
        'info'
      )
    }

    // ✅ Log ke Discord
    sendUpdaterLog({
      level: 'info',
      title: `🆕 Update Tersedia — v${info.version}`,
      fields: [
        { name: '📦 Versi', value: `\`${info.version}\``, inline: true },
        { name: '📅 Release', value: `\`${info.releaseDate || '—'}\``, inline: true },
        {
          name: '📝 Notes',
          value: info.releaseNotes ? String(info.releaseNotes).slice(0, 300) : '—',
          inline: false
        }
      ]
    })

    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update tersedia',
        message: `Versi baru ${info.version} tersedia. Mau download sekarang?`,
        buttons: ['Ya', 'Nanti']
      })
      .then((result) => {
        if (result.response === 0) {
          console.log('Starting update download...')
          autoUpdater.downloadUpdate()
        } else {
          console.log('Update skipped by user')
        }
      })
  })

  // ── Sudah versi terbaru ───────────────────────────────────────────────────
  autoUpdater.on('update-not-available', (info) => {
    console.log('App is up to date. Current version:', info.version)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:availability', false)
      mainWindow.webContents.send(
        'update:notification',
        `Aplikasi sudah versi terbaru (${info.version})`,
        'success'
      )
    }
  })

  // ── ✅ Error updater — log ke Discord ─────────────────────────────────────
  autoUpdater.on('error', (err) => {
    console.error('Auto updater error:', err)

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        'update:notification',
        'Terjadi kesalahan saat memeriksa pembaruan',
        'error'
      )
    }

    sendUpdaterLog({
      level: 'error',
      title: '🔴 AutoUpdater Error',
      fields: [
        {
          name: '❌ Error',
          value: `\`\`\`\n${String(err?.message || err).slice(0, 700)}\n\`\`\``,
          inline: false
        },
        ...(err?.stack
          ? [
              {
                name: '📋 Stack',
                value: `\`\`\`\n${String(err.stack).slice(0, 700)}\n\`\`\``,
                inline: false
              }
            ]
          : [])
      ]
    })
  })

  // ── Download progress ─────────────────────────────────────────────────────
  autoUpdater.on('download-progress', (progressObj) => {
    const progress = Math.round(progressObj.percent)
    console.log(`Download progress: ${progress}%`)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:download-progress', progress)
    }
  })

  // ── Update downloaded ─────────────────────────────────────────────────────
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version)

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:availability', true)
      mainWindow.webContents.send(
        'update:notification',
        `Update ${info.version} siap diinstall`,
        'success'
      )
    }

    // ✅ Log ke Discord
    sendUpdaterLog({
      level: 'info',
      title: `✅ Update Downloaded — v${info.version}`,
      fields: [
        { name: '📦 Versi', value: `\`${info.version}\``, inline: true },
        { name: '📅 Tanggal', value: `\`${new Date().toLocaleString('id-ID')}\``, inline: true }
      ]
    })

    dialog
      .showMessageBox(mainWindow, {
        title: 'Update Siap',
        message: `Update versi ${info.version} telah diunduh. Aplikasi akan restart untuk instalasi.`,
        buttons: ['Install Sekarang', 'Nanti']
      })
      .then((result) => {
        if (result.response === 0) {
          console.log('Installing update and restarting...')
          autoUpdater.quitAndInstall()
        }
      })
  })
}
