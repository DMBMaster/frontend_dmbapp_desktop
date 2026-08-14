import { ipcMain } from 'electron'
import {
  getHotelInfo,
  oauthToken,
  refreshToken,
  ensureToken,
  lockList,
  lockRecordList,
  lockRecordClear,
  lockRecordDelete,
  cardRegister,
  cardRegisterNormal,
  cardList,
  cardDelete
} from '../services/sciener.service.js'

export function registerScienerIpc() {
  ipcMain.handle('sciener:getHotelInfo', (_e, p) => getHotelInfo(p))
  ipcMain.handle('sciener:token', (_e, p) => oauthToken(p))
  ipcMain.handle('sciener:refreshToken', (_e, p) => refreshToken(p))
  ipcMain.handle('sciener:ensureToken', (_e, p) => ensureToken(p))
  ipcMain.handle('sciener:lockList', (_e, p) => lockList(p))
  ipcMain.handle('sciener:lockRecordList', (_e, p) => lockRecordList(p))
  ipcMain.handle('sciener:lockRecordClear', (_e, p) => lockRecordClear(p))
  ipcMain.handle('sciener:lockRecordDelete', (_e, p) => lockRecordDelete(p))
  ipcMain.handle('sciener:cardRegister', (_e, p) => cardRegister(p))
  ipcMain.handle('sciener:cardRegisterNormal', (_e, p) => cardRegisterNormal(p))
  ipcMain.handle('sciener:cardList', (_e, p) => cardList(p))
  ipcMain.handle('sciener:cardDelete', (_e, p) => cardDelete(p))
}
