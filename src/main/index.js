import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { autoUpdater } from 'electron-updater'
import path from 'path'
import { readFileSync } from 'fs'
import { net } from 'electron'
import dns from 'dns'
import ThermalPrinter from 'node-thermal-printer'
const { printer: ThermalPrinterLib, types: PrinterTypes } = ThermalPrinter

let mainWindow
let networkCheckInterval = null
let lastKnownStatus = null // track to avoid spamming renderer with same status
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 900,
    minHeight: 670,
    show: false,
    autoHideMenuBar: true,
    // fullscreen: true,
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
    // mainWindow.setFullScreen(true)
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

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

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

ipcMain.handle('print-thermal-lan', async (_, data) => {
  try {
    const { printerIp, printerPort = 9100, ...printData } = data

    if (!printerIp) {
      throw new Error('printerIp wajib diisi')
    }

    const printer = new ThermalPrinterLib({
      type: PrinterTypes.EPSON, // ganti ke STAR jika pakai Star printer
      interface: `tcp://${printerIp}:${printerPort}`,
      timeout: 5000,
      width: 32, // karakter per baris (32 untuk 58mm, 42 untuk 80mm)
      characterSet: 'WPC1252',
      removeSpecialCharacters: false,
      lineCharacter: '-'
    })

    const isConnected = await printer.isPrinterConnected()
    if (!isConnected) {
      throw new Error(`Printer tidak dapat dijangkau di ${printerIp}:${printerPort}`)
    }

    // ---- Cetak Konten ----

    // Header
    printer.alignCenter()
    if (printData.header1) {
      printer.bold(true)
      printer.setTextSize(1, 1)
      printer.println(printData.header1)
      printer.bold(false)
    }
    if (printData.header2) printer.println(printData.header2)
    if (printData.header3) printer.println(printData.header3)

    printer.drawLine()

    // Info Order
    printer.alignLeft()
    if (printData.orderNumber) {
      printer.tableCustom([
        { text: 'No. Order', align: 'LEFT', width: 0.5 },
        { text: `: ${printData.orderNumber}`, align: 'LEFT', width: 0.5 }
      ])
    }
    if (printData.date) {
      printer.tableCustom([
        { text: 'Tanggal', align: 'LEFT', width: 0.5 },
        { text: `: ${printData.date}`, align: 'LEFT', width: 0.5 }
      ])
    }
    if (printData.cashierName) {
      printer.tableCustom([
        { text: 'Kasir', align: 'LEFT', width: 0.5 },
        { text: `: ${printData.cashierName}`, align: 'LEFT', width: 0.5 }
      ])
    }

    printer.drawLine()

    // Items
    if (printData.items && Array.isArray(printData.items)) {
      for (const item of printData.items) {
        printer.bold(true)
        printer.println(item.name)
        printer.bold(false)
        printer.tableCustom([
          { text: `  ${item.qty}x ${item.price}`, align: 'LEFT', width: 0.5 },
          { text: item.subtotal, align: 'RIGHT', width: 0.5 }
        ])
      }
    }

    printer.drawLine()

    // Totals
    if (printData.subtotal) {
      printer.tableCustom([
        { text: 'Subtotal', align: 'LEFT', width: 0.5 },
        { text: printData.subtotal, align: 'RIGHT', width: 0.5 }
      ])
    }
    if (printData.tax) {
      printer.tableCustom([
        { text: 'Pajak', align: 'LEFT', width: 0.5 },
        { text: printData.tax, align: 'RIGHT', width: 0.5 }
      ])
    }
    if (printData.discount) {
      printer.tableCustom([
        { text: 'Diskon', align: 'LEFT', width: 0.5 },
        { text: printData.discount, align: 'RIGHT', width: 0.5 }
      ])
    }
    if (printData.total) {
      printer.bold(true)
      printer.tableCustom([
        { text: 'TOTAL', align: 'LEFT', width: 0.5 },
        { text: printData.total, align: 'RIGHT', width: 0.5 }
      ])
      printer.bold(false)
    }
    if (printData.cash) {
      printer.tableCustom([
        { text: 'Bayar', align: 'LEFT', width: 0.5 },
        { text: printData.cash, align: 'RIGHT', width: 0.5 }
      ])
    }
    if (printData.change) {
      printer.tableCustom([
        { text: 'Kembalian', align: 'LEFT', width: 0.5 },
        { text: printData.change, align: 'RIGHT', width: 0.5 }
      ])
    }

    printer.drawLine()

    // Footer
    printer.alignCenter()
    if (printData.footer1) printer.println(printData.footer1)
    if (printData.footer2) printer.println(printData.footer2)
    if (printData.footer3) printer.println(printData.footer3)

    printer.cut()

    await printer.execute()
    console.log('✅ Thermal print berhasil!')
    return { success: true }
  } catch (err) {
    console.error('❌ Thermal print error:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('test-thermal-printer', async (_, { printerIp, printerPort = 9100 }) => {
  try {
    const printer = new ThermalPrinterLib({
      type: PrinterTypes.EPSON,
      interface: `tcp://${printerIp}:${printerPort}`,
      timeout: 3000
    })
    const isConnected = await printer.isPrinterConnected()
    return { connected: isConnected }
  } catch (err) {
    return { connected: false, error: err.message }
  }
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

ipcMain.on('window-minimize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  window?.minimize()
})

ipcMain.on('window-maximize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window?.isMaximized()) {
    window.unmaximize()
  } else {
    window?.maximize()
  }
})

ipcMain.on('window-close', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  window?.close()
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
  // Cek apakah dalam mode development
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
