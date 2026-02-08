import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { autoUpdater } from 'electron-updater'
import path from 'path'
import { readFileSync } from 'fs'
import { net } from 'electron'
import dns from 'dns'

let mainWindow
let networkCheckInterval = null
let lastKnownStatus = null // track to avoid spamming renderer with same status
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    fullscreen: true,
    frame: false,
    center: true,
    titleBarStyle: 'hidden',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      webSecurity: false,
      nodeIntegration: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.setFullScreen(true)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.handle('get-my-config', async () => {
  try {
    const jsonPath = is.dev
      ? join(__dirname, '../../resources/assets/config/config.json')
      : join(process.resourcesPath, 'resources/assets/config/config.json')

    const content = readFileSync(jsonPath, 'utf8')
    return JSON.parse(content)
  } catch (err) {
    console.error('Gagal membaca config:', err)
    return null
  }
})

ipcMain.handle('get-assets-path', async () => {
  const assetsPathConfig = is.dev
    ? join(__dirname, '../../resources/assets')
    : join(process.resourcesPath, 'resources/assets')

  return assetsPathConfig
})

ipcMain.on('print-order-receipt', (_, data) => {
  const rWin = new BrowserWindow({
    show: false,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      webSecurity: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js')
    }
  })

  const RESOURCES_PATH_PRINT = app.isPackaged
    ? path.join(process.resourcesPath, `resources/assets/receipt/print-order-receipt.html`)
    : path.join(__dirname, `../../resources/assets/receipt/print-order-receipt.html`)

  // rWin.loadFile(RESOURCES_PATH_PRINT);
  rWin.loadURL(RESOURCES_PATH_PRINT).then(() => {
    // send structured payload into print window and let it render HTML
    const payload = JSON.stringify(data || {})
    rWin.webContents.executeJavaScript(`(function(){
      try {
        const data = ${payload}
        document.getElementById('header1').innerText = data.header1 || ''
        document.getElementById('header2').innerText = data.header2 || ''
        document.getElementById('header3').innerText = data.header3 || ''
        document.getElementById('content').innerHTML = data.contentHTML || ''
        document.getElementById('footer1').innerText = data.footer1 || ''
        document.getElementById('footer2').innerText = data.footer2 || ''
        document.getElementById('footer3').innerText = data.footer3 || ''
      } catch (e) { console.error(e) }
    })()`)

    setTimeout(() => {
      rWin.webContents.print({
        silent: true,
        margins: {
          marginType: 'printableArea'
        },
        printBackground: false,
        pagesPerSheet: 1,
        landscape: false,
        header: 'Header of the Page',
        footer: 'Footer of the Page',
        collate: false
      })
    }, 200)
  })
})

// ================================
// NETWORK CONNECTIVITY CHECK (Main Process)
// ================================

/**
 * Check real internet connectivity from main process using DNS + HTTP
 * Returns true if internet is available, false otherwise
 */
async function checkInternetConnectivity() {
  // Step 1: Quick check with Electron's net.isOnline()
  if (!net.isOnline()) {
    return false
  }

  // Step 2: DNS resolve to verify real internet (not just LAN)
  const dnsCheck = () =>
    new Promise((resolve) => {
      dns.resolve('www.google.com', (err) => {
        resolve(!err)
      })
    })

  // Step 3: Try HTTP request as fallback
  const httpCheck = () =>
    new Promise((resolve) => {
      try {
        const request = net.request({
          method: 'HEAD',
          url: 'https://clients3.google.com/generate_204'
        })

        const timeout = setTimeout(() => {
          request.abort()
          resolve(false)
        }, 5000)

        request.on('response', (response) => {
          clearTimeout(timeout)
          resolve(response.statusCode >= 200 && response.statusCode < 400)
        })

        request.on('error', () => {
          clearTimeout(timeout)
          resolve(false)
        })

        request.end()
      } catch {
        resolve(false)
      }
    })

  // Try DNS first (faster), fallback to HTTP
  const dnsResult = await dnsCheck()
  if (dnsResult) return true

  // DNS failed, try HTTP as fallback
  const httpResult = await httpCheck()
  return httpResult
}

/**
 * Send network status to renderer if changed
 */
function sendNetworkStatus(isOnline) {
  if (lastKnownStatus === isOnline) return // No change, skip

  lastKnownStatus = isOnline
  console.log(`🌐 Network status changed: ${isOnline ? 'Online' : 'Offline'}`)

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('network-status-changed', isOnline)
  }
}

/**
 * Start periodic network checking
 */
function startNetworkMonitoring() {
  // Initial check
  checkInternetConnectivity().then((isOnline) => {
    sendNetworkStatus(isOnline)
  })

  // Periodic check every 10 seconds
  networkCheckInterval = setInterval(async () => {
    const isOnline = await checkInternetConnectivity()
    sendNetworkStatus(isOnline)
  }, 10000)
}

/**
 * Stop network monitoring
 */
function stopNetworkMonitoring() {
  if (networkCheckInterval) {
    clearInterval(networkCheckInterval)
    networkCheckInterval = null
  }
}

// IPC handler: renderer can request a manual check
ipcMain.handle('check-network-status', async () => {
  const isOnline = await checkInternetConnectivity()
  sendNetworkStatus(isOnline)
  return isOnline
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  // Start network monitoring after window is created
  startNetworkMonitoring()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// ================================
// AUTO UPDATER
// ================================

// Konfigurasi auto update
autoUpdater.autoDownload = false

// Allow dev mode untuk testing auto updater
if (is.dev) {
  autoUpdater.forceDevUpdateConfig = true
  // Optional: set custom dev update server if you have one
  // autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml')
}

// IPC handler untuk manual check updates
ipcMain.on('check-for-updates', () => {
  console.log('🔍 Checking for updates...')
  autoUpdater
    .checkForUpdates()
    .then(() => {
      console.log('✅ Update check initiated')
    })
    .catch((err) => {
      console.error('❌ Update check failed:', err)
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          'update:notification',
          'Gagal memeriksa pembaruan. Periksa koneksi internet Anda.',
          'error'
        )
      }
    })
})

// Event: Update tersedia
autoUpdater.on('update-available', (info) => {
  console.log('🎉 Update available:', info.version)

  // Send notification to renderer
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
        console.log('📥 Starting update download...')
        autoUpdater.downloadUpdate()
      } else {
        console.log('⏭️ Update skipped by user')
      }
    })
})

// Event: Update tidak tersedia (sudah versi terbaru)
autoUpdater.on('update-not-available', (info) => {
  console.log('✅ App is up to date. Current version:', info.version)

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(
      'update:notification',
      `Aplikasi sudah versi terbaru (${info.version})`,
      'success'
    )
  }
})

// Event: Error saat check update
autoUpdater.on('error', (err) => {
  console.error('❌ Auto updater error:', err)

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
  console.log(`📥 Download progress: ${progress}%`)

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update:download-progress', progress)
  }
})

// Event: Update downloaded
autoUpdater.on('update-downloaded', (info) => {
  console.log('✅ Update downloaded:', info.version)

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
        console.log('🔄 Installing update and restarting...')
        autoUpdater.quitAndInstall()
      }
    })
})

app.on('window-all-closed', () => {
  stopNetworkMonitoring()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
