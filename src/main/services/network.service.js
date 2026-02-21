import { net, ipcMain } from 'electron'
import dns from 'dns'
import { mainWindow } from '../window.js'

let networkCheckInterval = null
let lastKnownStatus = null

/**
 * Check real internet connectivity from main process using DNS + HTTP
 */
async function checkInternetConnectivity() {
  if (!net.isOnline()) return false

  const dnsCheck = () =>
    new Promise((resolve) => {
      dns.resolve('www.google.com', (err) => resolve(!err))
    })

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

  const dnsResult = await dnsCheck()
  if (dnsResult) return true

  return await httpCheck()
}

/**
 * Send network status to renderer if changed
 */
function sendNetworkStatus(isOnline) {
  if (lastKnownStatus === isOnline) return

  lastKnownStatus = isOnline
  console.log(`Network status changed: ${isOnline ? 'Online' : 'Offline'}`)

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('network-status-changed', isOnline)
  }
}

/**
 * Start periodic network checking
 */
export function startNetworkMonitoring() {
  checkInternetConnectivity().then(sendNetworkStatus)

  networkCheckInterval = setInterval(async () => {
    const isOnline = await checkInternetConnectivity()
    sendNetworkStatus(isOnline)
  }, 1000)
}

/**
 * Stop network monitoring
 */
export function stopNetworkMonitoring() {
  if (networkCheckInterval) {
    clearInterval(networkCheckInterval)
    networkCheckInterval = null
  }
}

/**
 * Register IPC handler for manual network check from renderer
 */
export function registerNetworkIpc() {
  ipcMain.handle('check-network-status', async () => {
    const isOnline = await checkInternetConnectivity()
    sendNetworkStatus(isOnline)
    return isOnline
  })
}
