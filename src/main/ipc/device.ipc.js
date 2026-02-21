import { ipcMain } from 'electron'
import os from 'os'
import { exec } from 'child_process'

export function registerDeviceIpc() {
  ipcMain.handle('get-device-label', () => {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch()
    }
  })

  ipcMain.handle('get-device-uuid', async () => {
    return new Promise((resolve, reject) => {
      if (process.platform === 'win32') {
        exec('wmic csproduct get uuid', (error, stdout) => {
          if (error) {
            reject(error)
            return
          }
          const lines = stdout
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
          resolve(lines[1] || '')
        })
      } else if (process.platform === 'linux') {
        exec(
          'cat /etc/machine-id 2>/dev/null || cat /var/lib/dbus/machine-id 2>/dev/null',
          (error, stdout) => {
            if (error) {
              reject(error)
              return
            }
            resolve(stdout.trim())
          }
        )
      } else if (process.platform === 'darwin') {
        exec(
          "system_profiler SPHardwareDataType | awk '/Hardware UUID/ {print $3}'",
          (error, stdout) => {
            if (error) {
              reject(error)
              return
            }
            resolve(stdout.trim())
          }
        )
      } else {
        reject(new Error('Unsupported platform'))
      }
    })
  })

  ipcMain.handle('get-device-brand', async () => {
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        exec('wmic computersystem get manufacturer,model /format:list', (error, stdout) => {
          if (error) return resolve({ manufacturer: '', model: '' })
          const lines = stdout
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
          const manufacturer = lines.find((l) => l.startsWith('Manufacturer='))?.split('=')[1] || ''
          const model = lines.find((l) => l.startsWith('Model='))?.split('=')[1] || ''
          resolve({ manufacturer, model })
        })
      } else if (process.platform === 'linux') {
        exec(
          'cat /sys/class/dmi/id/sys_vendor 2>/dev/null; echo "---"; cat /sys/class/dmi/id/product_name 2>/dev/null',
          (error, stdout) => {
            if (error) return resolve({ manufacturer: '', model: '' })
            const parts = stdout.split('---').map((s) => s.trim())
            resolve({ manufacturer: parts[0] || '', model: parts[1] || '' })
          }
        )
      } else if (process.platform === 'darwin') {
        exec(
          "system_profiler SPHardwareDataType | grep -E 'Model Name|Model Identifier'",
          (error, stdout) => {
            if (error) return resolve({ manufacturer: 'Apple', model: '' })
            const lines = stdout
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean)
            const modelName = lines.find((l) => l.startsWith('Model Name:'))?.split(': ')[1] || ''
            const modelId =
              lines.find((l) => l.startsWith('Model Identifier:'))?.split(': ')[1] || ''
            resolve({ manufacturer: 'Apple', model: modelName || modelId })
          }
        )
      } else {
        resolve({ manufacturer: '', model: '' })
      }
    })
  })

  ipcMain.handle('get-device-info', async () => {
    const networkIfaces = os.networkInterfaces()
    let ipAddress = ''
    let macAddress = ''

    for (const iface of Object.values(networkIfaces)) {
      for (const config of iface) {
        if (!config.internal && config.family === 'IPv4') {
          ipAddress = config.address
          macAddress = config.mac
          break
        }
      }
      if (ipAddress) break
    }

    const cpus = os.cpus()

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      osVersion: os.version(),
      cpu: cpus[0]?.model || '',
      cpuCores: cpus.length,
      totalRam: Math.round((os.totalmem() / 1024 / 1024 / 1024) * 10) / 10,
      freeRam: Math.round((os.freemem() / 1024 / 1024 / 1024) * 10) / 10,
      uptime: Math.floor(os.uptime() / 60),
      ipAddress,
      macAddress,
      username: os.userInfo().username
    }
  })
}
