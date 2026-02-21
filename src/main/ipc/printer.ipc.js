import { ipcMain, BrowserWindow, app } from 'electron'
import path from 'path'
import ThermalPrinter from 'node-thermal-printer'
const { printer: ThermalPrinterLib, types: PrinterTypes } = ThermalPrinter

export function registerPrinterIpc() {
  ipcMain.on('print-order-receipt', (_, data) => {
    const rWin = new BrowserWindow({
      show: false,
      webPreferences: {
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

    rWin.loadURL(RESOURCES_PATH_PRINT).then(() => {
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
          margins: { marginType: 'printableArea' },
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

      if (!printerIp) throw new Error('printerIp wajib diisi')

      const printer = new ThermalPrinterLib({
        type: PrinterTypes.EPSON,
        interface: `tcp://${printerIp}:${printerPort}`,
        timeout: 5000,
        width: 32,
        characterSet: 'WPC1252',
        removeSpecialCharacters: false,
        lineCharacter: '-'
      })

      const isConnected = await printer.isPrinterConnected()
      if (!isConnected) {
        throw new Error(`Printer tidak dapat dijangkau di ${printerIp}:${printerPort}`)
      }

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

      console.log('Thermal print berhasil!')
      return { success: true }
    } catch (err) {
      console.error('Thermal print error:', err)
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
}
