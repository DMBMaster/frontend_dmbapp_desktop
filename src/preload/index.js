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

  printOrderReceipt: async (data) => {
    return await ipcRenderer.invoke('print-order-receipt', data)
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

  onUpdateAvailability: (callback) => {
    const handler = (_event, hasUpdate) => callback(Boolean(hasUpdate))
    ipcRenderer.on('update:availability', handler)
    return () => {
      ipcRenderer.removeListener('update:availability', handler)
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
  },

  ce: {
    load: async () => await ipcRenderer.invoke('ce:load'),
    configServer: async (url) => await ipcRenderer.invoke('ce:configServer', url),
    connect: async (port) => await ipcRenderer.invoke('ce:connect', port),
    disconnect: async () => await ipcRenderer.invoke('ce:disconnect'),
    initEncoder: async (hotelInfo) => await ipcRenderer.invoke('ce:initEncoder', hotelInfo),
    getSectors: async () => await ipcRenderer.invoke('ce:getSectors'),
    setSectors: async (mask) => await ipcRenderer.invoke('ce:setSectors', mask),
    initCard: async (hotelInfo) => await ipcRenderer.invoke('ce:initCard', hotelInfo),
    stopInitCard: async () => await ipcRenderer.invoke('ce:stopInitCard'),
    writeCard: async (args) => await ipcRenderer.invoke('ce:writeCard', args),
    writeMasterCard: async (args) => await ipcRenderer.invoke('ce:writeMasterCard', args),
    writeMultipleLocks: async (args) => await ipcRenderer.invoke('ce:writeMultipleLocks', args),
    cancelCard: async (args) => await ipcRenderer.invoke('ce:cancelCard', args),
    readCard: async (hotelInfo) => await ipcRenderer.invoke('ce:readCard', hotelInfo),
    cardNo: async () => await ipcRenderer.invoke('ce:cardNo'),
    clearCard: async (hotelInfo) => await ipcRenderer.invoke('ce:clearCard', hotelInfo),
    deinitCard: async (hotelInfo) => await ipcRenderer.invoke('ce:deinitCard', hotelInfo),
    beep: async () => await ipcRenderer.invoke('ce:beep'),
    version: async () => await ipcRenderer.invoke('ce:version'),
    transformMac: async (mac) => await ipcRenderer.invoke('ce:transformMac', mac)
  },
  com: {
    listPorts: async () => await ipcRenderer.invoke('com:listPorts')
  },
  sciener: {
    getHotelInfo: async (p) => await ipcRenderer.invoke('sciener:getHotelInfo', p),
    token: async (p) => await ipcRenderer.invoke('sciener:token', p),
    refreshToken: async (p) => await ipcRenderer.invoke('sciener:refreshToken', p),
    ensureToken: async (p) => await ipcRenderer.invoke('sciener:ensureToken', p),
    lockList: async (p) => await ipcRenderer.invoke('sciener:lockList', p),
    lockRecordList: async (p) => await ipcRenderer.invoke('sciener:lockRecordList', p),
    lockRecordClear: async (p) => await ipcRenderer.invoke('sciener:lockRecordClear', p),
    lockRecordDelete: async (p) => await ipcRenderer.invoke('sciener:lockRecordDelete', p),
    cardRegister: async (p) => await ipcRenderer.invoke('sciener:cardRegister', p),
    cardRegisterNormal: async (p) => await ipcRenderer.invoke('sciener:cardRegisterNormal', p),
    cardList: async (p) => await ipcRenderer.invoke('sciener:cardList', p),
    cardDelete: async (p) => await ipcRenderer.invoke('sciener:cardDelete', p)
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
