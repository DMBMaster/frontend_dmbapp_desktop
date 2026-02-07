import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getMyConfig: async () => {
    return await ipcRenderer.invoke('get-my-config')
  },

  getImage: async () => {
    return await ipcRenderer.invoke('get-assets-path')
  },

  printOrderReceipt(data) {
    ipcRenderer.send('print-order-receipt', data)
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
