import { ipcMain, BrowserWindow, app } from 'electron'
import path from 'path'
import ThermalPrinter from 'node-thermal-printer'
const { printer: ThermalPrinterLib, types: PrinterTypes } = ThermalPrinter

const getPageSizeFromReceipt = (paperSize = 'MM58') => {
  if (paperSize === 'MM80') {
    return { width: 80000, height: 200000 }
  }
  return { width: 58000, height: 200000 }
}

const printOrderReceiptInternal = async (data = {}) => {
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

  try {
    await rWin.loadURL(RESOURCES_PATH_PRINT)

    const payload = JSON.stringify(data || {})
    await rWin.webContents.executeJavaScript(`(function(){
      try {
        const data = ${payload}
        const h1 = document.getElementById('header1')
        const h2 = document.getElementById('header2')
        const h3 = document.getElementById('header3')
        h1.innerText = data.header1 || ''
        h2.innerText = data.header2 || ''
        h3.innerText = data.header3 || ''
        if (!data.header1) h1.style.display = 'none'
        if (!data.header2) h2.style.display = 'none'
        if (!data.header3) h3.style.display = 'none'
        if (!data.header1 && !data.header2 && !data.header3) {
          var lines = document.querySelectorAll('.line')
          if (lines[0]) lines[0].style.display = 'none'
        }
        document.getElementById('content').innerHTML = data.contentHTML || ''
        const f1 = document.getElementById('footer1')
        const f2 = document.getElementById('footer2')
        const f3 = document.getElementById('footer3')
        f1.innerText = data.footer1 || ''
        f2.innerText = data.footer2 || ''
        f3.innerText = data.footer3 || ''
        if (!data.footer1) f1.style.display = 'none'
        if (!data.footer2) f2.style.display = 'none'
        if (!data.footer3) f3.style.display = 'none'
        if (!data.footer1 && !data.footer2 && !data.footer3) {
          var lines2 = document.querySelectorAll('.line')
          if (lines2[1]) lines2[1].style.display = 'none'
        }
      } catch (e) { console.error(e) }
    })()`)

    const copies = Math.max(1, Number(data?.copies || 1))
    const pageSize = getPageSizeFromReceipt(data?.paperSize)

    await new Promise((resolve, reject) => {
      setTimeout(() => {
        rWin.webContents.print(
          {
            silent: true,
            margins: { marginType: 'printableArea' },
            printBackground: true,
            pagesPerSheet: 1,
            landscape: false,
            collate: false,
            copies,
            pageSize
          },
          (success, errorType) => {
            if (!success) {
              reject(new Error(errorType || 'Gagal mencetak struk'))
              return
            }
            resolve(true)
          }
        )
      }, 200)
    })

    return { success: true }
  } catch (error) {
    console.error('Print order receipt error:', error)
    return { success: false, error: error?.message || 'Gagal mencetak struk' }
  } finally {
    if (!rWin.isDestroyed()) rWin.close()
  }
}

export function registerPrinterIpc() {
  ipcMain.on('print-order-receipt', (_, data) => {
    void printOrderReceiptInternal(data)
  })

  ipcMain.handle('print-order-receipt', async (_, data) => {
    return await printOrderReceiptInternal(data)
  })

  ipcMain.handle('print-thermal-lan', async (_, data) => {
    try {
      const { printerIp, printerPort = 9100, ...printData } = data
      const receiptSettings = printData.receiptSettings || {}
      const useCustomHeader = Boolean(receiptSettings.customHeaderText && receiptSettings.headerText)
      const showUnitPrice = receiptSettings.showUnitPrice !== false
      const showNotes = receiptSettings.showNotes !== false

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
      if (useCustomHeader) {
        printer.bold(true)
        printer.setTextSize(1, 1)
        printer.println(String(receiptSettings.headerText))
        printer.bold(false)
      } else if (printData.header1) {
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

          if (showUnitPrice) {
            printer.tableCustom([
              { text: `  ${item.qty}x ${item.price}`, align: 'LEFT', width: 0.5 },
              { text: item.subtotal, align: 'RIGHT', width: 0.5 }
            ])
          } else {
            printer.tableCustom([
              { text: `  Qty ${item.qty}`, align: 'LEFT', width: 0.5 },
              { text: item.subtotal, align: 'RIGHT', width: 0.5 }
            ])
          }

          if (item.variants) {
            printer.println(`  Varian: ${item.variants}`)
          }

          if (showNotes && item.notes) {
            printer.println(`  * ${item.notes}`)
          }
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
