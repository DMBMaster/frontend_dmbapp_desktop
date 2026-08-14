import { ipcMain } from 'electron'
import { listComPorts } from '../services/comPorts.service.js'
import {
  loadDllWrapper,
  configServer,
  connectComm,
  disconnectComm,
  initCardEncoder,
  getSectors,
  setSectors,
  initCard,
  stopInitCard,
  writeCard,
  writeMasterCard,
  writeMultipleLocks,
  cancelCard,
  readCard,
  getCardNo,
  clearCard,
  deInitCard,
  beep,
  getVersion,
  transformMAC
} from '../services/cardEncoder.service.js'

function wrap(name, fn) {
  ipcMain.handle(`ce:${name}`, (_e, ...args) => {
    try {
      return fn(...args)
    } catch (err) {
      return { code: -1, ok: false, message: err.message || String(err) }
    }
  })
}

export function registerCardEncoderIpc() {
  ipcMain.handle('ce:load', () => loadDllWrapper())
  ipcMain.handle('com:listPorts', () => listComPorts())

  wrap('configServer', configServer)
  wrap('connect', connectComm)
  wrap('disconnect', disconnectComm)
  wrap('initEncoder', initCardEncoder)
  wrap('getSectors', getSectors)
  wrap('setSectors', setSectors)
  wrap('initCard', initCard)
  wrap('stopInitCard', stopInitCard)
  wrap('writeCard', writeCard)
  wrap('writeMasterCard', writeMasterCard)
  wrap('writeMultipleLocks', writeMultipleLocks)
  wrap('cancelCard', cancelCard)
  wrap('readCard', readCard)
  wrap('cardNo', getCardNo)
  wrap('clearCard', clearCard)
  wrap('deinitCard', deInitCard)
  wrap('beep', beep)
  wrap('version', getVersion)
  ipcMain.handle('ce:transformMac', (_e, mac) => transformMAC(mac))
}
