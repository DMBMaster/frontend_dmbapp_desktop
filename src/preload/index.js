import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  device: {
    deviceName: async () => await ipcRenderer.invoke('get-device-label'),
    deviceUuid: async () => await ipcRenderer.invoke('get-device-uuid'),
    deviceBrand: async () => await ipcRenderer.invoke('get-device-brand'),
    deviceInfo: async () => await ipcRenderer.invoke('get-device-info')
  },

  getMyConfig: async () => {
    return await ipcRenderer.invoke('get-my-config')
  },

  getImage: async () => {
    return await ipcRenderer.invoke('get-assets-path')
  },

  printOrderReceipt(data) {
    ipcRenderer.send('print-order-receipt', data)
  },

  // Auto updater
  checkForUpdates: () => {
    ipcRenderer.send('check-for-updates')
  },

  onUpdateNotification: (callback) => {
    const handler = (_event, message, severity) => callback(message, severity)
    ipcRenderer.on('update:notification', handler)
    return () => {
      ipcRenderer.removeListener('update:notification', handler)
    }
  },

  onUpdateProgress: (callback) => {
    const handler = (_event, percent) => callback(percent)
    ipcRenderer.on('update:download-progress', handler)
    return () => {
      ipcRenderer.removeListener('update:download-progress', handler)
    }
  },

  // Network connectivity - checked from main process
  checkNetworkStatus: async () => {
    return await ipcRenderer.invoke('check-network-status')
  },

  onNetworkStatusChanged: (callback) => {
    const handler = (_event, isOnline) => callback(isOnline)
    ipcRenderer.on('network-status-changed', handler)
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('network-status-changed', handler)
    }
  },

  printThermalLan: async (data) => {
    return await ipcRenderer.invoke('print-thermal-lan', data)
  },

  testThermalPrinter: async ({ printerIp, printerPort = 9100 }) => {
    return await ipcRenderer.invoke('test-thermal-printer', { printerIp, printerPort })
  },

  getAppVersion: async () => {
    return await ipcRenderer.invoke('get-app-version')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
