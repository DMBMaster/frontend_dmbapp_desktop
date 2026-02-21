import { app, ipcMain } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createWindow } from './window.js'
import { registerAppIpc } from './ipc/app.ipc.js'
import { registerDeviceIpc } from './ipc/device.ipc.js'
import { registerPrinterIpc } from './ipc/printer.ipc.js'
import { registerWindowIpc } from './ipc/window.ipc.js'
import {
  startNetworkMonitoring,
  stopNetworkMonitoring,
  registerNetworkIpc
} from './services/network.service.js'
import { setupAutoUpdater } from './services/updater.service.js'
import { logAppToServer } from './services/logger.service.js'

registerAppIpc()
registerDeviceIpc()
registerPrinterIpc()
registerWindowIpc()
registerNetworkIpc()

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  logAppToServer()
  startNetworkMonitoring()
  setupAutoUpdater()

  app.on('activate', function () {
    const { BrowserWindow } = require('electron')
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopNetworkMonitoring()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
