import { autoUpdater } from 'electron-updater'
import { ipcMain, dialog } from 'electron'
import { is } from '@electron-toolkit/utils'
import { mainWindow } from '../window.js'

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
      }
      return
    }
    autoUpdater.checkForUpdates()
  })

  // Event: Update tersedia
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version)

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        'update:notification',
        `Versi baru ${info.version} tersedia!`,
        'info'
      )
    }

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

  // Event: Sudah versi terbaru
  autoUpdater.on('update-not-available', (info) => {
    console.log('App is up to date. Current version:', info.version)

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        'update:notification',
        `Aplikasi sudah versi terbaru (${info.version})`,
        'success'
      )
    }
  })

  // Event: Error updater
  autoUpdater.on('error', (err) => {
    console.error('Auto updater error:', err)

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        'update:notification',
        'Terjadi kesalahan saat memeriksa pembaruan',
        'error'
      )
    }
  })

  // Event: Download progress
  autoUpdater.on('download-progress', (progressObj) => {
    const progress = Math.round(progressObj.percent)
    console.log(`Download progress: ${progress}%`)

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:download-progress', progress)
    }
  })

  // Event: Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version)

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        'update:notification',
        `Update ${info.version} siap diinstall`,
        'success'
      )
    }

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
