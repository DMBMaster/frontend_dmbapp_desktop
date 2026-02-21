import { ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import { readFileSync } from 'fs'
import { app } from 'electron'

export function registerAppIpc() {
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
}
