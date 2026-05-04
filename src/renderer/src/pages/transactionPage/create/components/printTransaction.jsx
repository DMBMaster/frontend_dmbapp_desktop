import { formatRupiah } from '@renderer/utils/myFunctions'

/**
 * Build thermal-style receipt HTML matching real thermal printer output.
 *
 * order shape:
 *   invoiceNo, invoiceDate, customerName, cashierName,
 *   outletName, outletAddress,
 *   items: [{ productName, quantity, price, notes }],
 *   totalAmount (subtotal), discount, tax, grandTotal,
 *   paymentMethod, amountPaid, change,
 *   notes (order notes), footer
 */
const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const getDefaultSettings = () => ({
  paperSize: 'MM58',
  showBusinessName: true,
  showOutletName: true,
  showAddress: true,
  showCity: false,
  showProvince: false,
  showCountry: false,
  showEmail: false,
  showPhone: false,
  customHeaderText: false,
  headerText: '',
  showNoteNumber: true,
  showTransactionTime: true,
  showOrderNumber: true,
  showCashierPaymentName: true,
  showCustomer: true,
  showOrderType: false,
  showTableNumber: false,
  showUnitPrice: true,
  showNotes: true,
  customFooterText: false,
  footerText: ''
})

export const buildReceiptHTML = (order, receiptSettings = {}) => {
  const settings = { ...getDefaultSettings(), ...(receiptSettings || {}) }
  const paperWidth = settings.paperSize === 'MM80' ? 360 : 280

  const itemsHTML =
    order.items?.length > 0
      ? order.items
          .map(
            (item) => `
        <div class="item-block">
          <div class="item-row">
            <span class="item-qty">${item.quantity}</span>
            <span class="item-name">${escapeHtml(item.productName)}</span>
            <span class="item-price">${item.price === 0 ? 'FREE' : formatRupiah(item.price * item.quantity)}</span>
          </div>
          ${settings.showUnitPrice && item.price !== 0 ? `<div class="item-detail">${item.quantity} x ${formatRupiah(item.price)}</div>` : ''}
          ${item.variants ? `<div class="item-detail">Varian: ${escapeHtml(item.variants)}</div>` : ''}
          ${item.notes ? `<div class="item-note">* ${escapeHtml(item.notes)}</div>` : ''}
        </div>`
          )
          .join('')
      : `<div class="empty-items">Tidak ada item</div>`

  const invoiceDateObj = order.invoiceDate ? new Date(order.invoiceDate) : new Date()
  const tanggal = invoiceDateObj
    .toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })
    .replace(/\//g, '-')
  const jam = invoiceDateObj.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  // Helper to build colon-aligned summary row
  const sumRow = (label, value, bold = false) =>
    `<div class="sum-row${bold ? ' sum-bold' : ''}"><span class="sum-label">${label}</span><span class="sum-colon">:</span><span class="sum-value">${value}</span></div>`

  // Build summary section
  let summaryHTML = ''
  summaryHTML += `<div class="sep-dash"></div>`
  summaryHTML += sumRow('Sub Total', formatRupiah(order.totalAmount))
  if (order.discount) {
    summaryHTML += sumRow('Diskon', `- ${formatRupiah(order.discount)}`)
  }
  if (order.tax) {
    summaryHTML += sumRow('Pajak', formatRupiah(order.tax))
  }
  if (order.discount || order.tax) {
    summaryHTML += `<div class="sep-dash"></div>`
    summaryHTML += sumRow('Total Bill', formatRupiah(order.grandTotal))
  }
  summaryHTML += `<div class="sep-dash"></div>`
  summaryHTML += sumRow('Grand Total', formatRupiah(order.grandTotal), true)
  summaryHTML += `<div class="sep-dash"></div>`
  summaryHTML += sumRow(
    order.paymentMethod || 'Cash',
    order.amountPaid ? formatRupiah(order.amountPaid) : formatRupiah(order.grandTotal)
  )
  summaryHTML += `<div class="sep-dash"></div>`
  if (order.change !== undefined) {
    summaryHTML += sumRow('Kembali', formatRupiah(order.change || 0), true)
  }

  const headerLines = []
  if (settings.customHeaderText && settings.headerText) {
    headerLines.push(
      `<div class="header-addr">${escapeHtml(settings.headerText).replace(/\n/g, '<br/>')}</div>`
    )
  } else {
    if (settings.showBusinessName && order.businessName) {
      headerLines.push(`<div class="header-name">${escapeHtml(order.businessName)}</div>`)
    }
    if (settings.showOutletName && order.outletName) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.outletName)}</div>`)
    }
    if (settings.showAddress && order.outletAddress) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.outletAddress)}</div>`)
    }
    if (settings.showCity && order.city) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.city)}</div>`)
    }
    if (settings.showProvince && order.province) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.province)}</div>`)
    }
    if (settings.showCountry && order.country) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.country)}</div>`)
    }
    if (settings.showEmail && order.email) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.email)}</div>`)
    }
    if (settings.showPhone && order.phone) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.phone)}</div>`)
    }
  }

  const infoRows = []
  if (settings.showNoteNumber && order.invoiceNo) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">No Nota</span><span class="info-colon">:</span><span>${escapeHtml(order.invoiceNo)}</span></div>`
    )
  }
  if (settings.showTransactionTime) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">Tanggal</span><span class="info-colon">:</span><span>${tanggal}</span></div>`
    )
    infoRows.push(
      `<div class="info-row"><span class="info-label">Jam</span><span class="info-colon">:</span><span>${jam}</span></div>`
    )
  }
  if (settings.showOrderNumber && order.orderNumber) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">No Order</span><span class="info-colon">:</span><span>${escapeHtml(order.orderNumber)}</span></div>`
    )
  }
  if (settings.showCustomer && order.customerName) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">Customer</span><span class="info-colon">:</span><span>${escapeHtml(order.customerName)}</span></div>`
    )
  }
  if (settings.showCashierPaymentName && order.cashierName) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">Kasir</span><span class="info-colon">:</span><span>${escapeHtml(order.cashierName)}</span></div>`
    )
  }
  if (settings.showOrderType && order.orderType) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">Tipe Order</span><span class="info-colon">:</span><span>${escapeHtml(order.orderType)}</span></div>`
    )
  }
  if (settings.showTableNumber && order.tableNumber) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">No Meja</span><span class="info-colon">:</span><span>${escapeHtml(order.tableNumber)}</span></div>`
    )
  }

  const footerText =
    settings.customFooterText && settings.footerText ? settings.footerText : order.footer

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    color: #111;
    background: #fff;
    width: ${paperWidth}px;
    padding: 12px 8px;
  }

  /* --- Header --- */
  .header-name {
    font-size: 14px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 2px;
  }
  .header-addr {
    font-size: 11px;
    text-align: center;
    line-height: 1.4;
  }
  .section-title {
    font-weight: bold;
    text-align: center;
    letter-spacing: 2px;
    margin: 4px 0;
  }

  /* --- Separators --- */
  .sep-dash { border-top: 1px dashed #333; margin: 6px 0; }
  .sep-bold { border-top: 2px solid #111; margin: 6px 0; }

  /* --- Info rows (Tanggal, Jam, etc.) --- */
  .info-row {
    display: flex;
    font-size: 11px;
    margin: 2px 0;
  }
  .info-label { min-width: 90px; }
  .info-colon { margin: 0 4px; }

  /* --- Items --- */
  .item-block { margin: 4px 0; }
  .item-row {
    display: flex;
    align-items: flex-start;
    font-size: 11px;
  }
  .item-qty { min-width: 20px; font-weight: bold; }
  .item-name { flex: 1; font-weight: bold; word-break: break-word; }
  .item-price { min-width: 80px; text-align: right; font-weight: bold; }
  .item-detail { font-size: 10px; color: #555; padding-left: 20px; }
  .item-note { font-size: 10px; color: #666; font-style: italic; padding-left: 20px; }
  .empty-items { text-align: center; font-style: italic; color: #999; }

  /* --- Summary (colon-aligned) --- */
  .sum-row {
    display: flex;
    margin: 2px 0;
    font-size: 11px;
  }
  .sum-label { flex: 1; text-align: right; }
  .sum-colon { margin: 0 6px; }
  .sum-value { min-width: 90px; text-align: right; }
  .sum-bold { font-weight: bold; font-size: 12px; }

  /* --- Footer --- */
  .footer-section {
    text-align: center;
    margin-top: 10px;
    font-size: 11px;
    line-height: 1.6;
  }
  .footer-note {
    text-align: left;
    margin-top: 6px;
    font-size: 10px;
    line-height: 1.4;
  }
</style>
</head>
<body>
  ${headerLines.length > 0 ? headerLines.join('') : `<div class="header-name">${escapeHtml(order.outletName || 'OUTLET')}</div>`}
  <div class="section-title">---PAYMENT---</div>
  <div class="sep-bold"></div>

  ${infoRows.join('')}

  <div class="sep-bold"></div>

  <div class="items-section">
    ${itemsHTML}
  </div>

  <div class="summary-section">
    ${summaryHTML}
  </div>

  <div class="sep-bold"></div>
  <div class="footer-section">
    ${escapeHtml(footerText || 'Thank You For Coming !!!').replace(/\n/g, '<br/>')}
  </div>
  ${settings.showNotes && order.notes ? `<div class="footer-note">Note : ${escapeHtml(order.notes)}</div>` : ''}
</body>
</html>`
}

/**
 * Build thermal-style Check-Out (CO) receipt HTML.
 *
 * order shape:
 *   transactionNo, createdAt, bookingDate, outletCategoryId,
 *   cashierName, reservationName, noPolisi,
 *   outletName, businessName, outletAddress, city, province, country, email, phone,
 *   items: [{ name, qty, price, subTotal }],
 *   subTotal, discountNominal, grandTotal,
 *   status, paidBy, paidCash, returnCash,
 *   printCount, lastPrintedBy, lastPrintedAt
 */
export const buildCOReceiptHTML = (order, receiptSettings = {}) => {
  const settings = { ...getDefaultSettings(), ...(receiptSettings || {}) }
  const paperWidth = settings.paperSize === 'MM80' ? 360 : 280

  const toNumber = (value) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const fmtNum = (amount) => formatRupiah(toNumber(amount))

  const sumRow = (label, value, bold = false) =>
    `<div class="sum-row${bold ? ' sum-bold' : ''}"><span class="sum-label">${label}</span><span class="sum-colon">:</span><span class="sum-value">${value}</span></div>`

  // Header lines
  const headerLines = []
  if (settings.customHeaderText && settings.headerText) {
    headerLines.push(
      `<div class="header-addr">${escapeHtml(settings.headerText).replace(/\n/g, '<br/>')}</div>`
    )
  } else {
    if (settings.showBusinessName && order.businessName) {
      headerLines.push(`<div class="header-name">${escapeHtml(order.businessName)}</div>`)
    }
    if (settings.showOutletName && order.outletName) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.outletName)}</div>`)
    }
    if (settings.showAddress && order.outletAddress) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.outletAddress)}</div>`)
    }
    if (settings.showCity && order.city) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.city)}</div>`)
    }
    if (settings.showProvince && order.province) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.province)}</div>`)
    }
    if (settings.showCountry && order.country) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.country)}</div>`)
    }
    if (settings.showEmail && order.email) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.email)}</div>`)
    }
    if (settings.showPhone && order.phone) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.phone)}</div>`)
    }
  }

  // Transaction date: hotel (outletCategoryId=1) uses bookingDate, others use createdAt
  const rawDate =
    order.outletCategoryId === '1' || order.outletCategoryId === 1
      ? order.bookingDate || order.createdAt
      : order.createdAt || order.bookingDate
  const dateObj = rawDate ? new Date(rawDate) : new Date()
  const waktuStr = dateObj.toLocaleString('id-ID')

  // Info rows
  const infoRows = []
  if (settings.showNoteNumber && order.transactionNo) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">No Nota</span><span class="info-colon">:</span><span>${escapeHtml(order.transactionNo)}</span></div>`
    )
  }
  if (settings.showTransactionTime) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">Waktu</span><span class="info-colon">:</span><span>${waktuStr}</span></div>`
    )
  }
  if (settings.showCashierPaymentName && order.cashierName) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">Kasir</span><span class="info-colon">:</span><span>${escapeHtml(order.cashierName)}</span></div>`
    )
  }
  if (settings.showCustomer && order.reservationName) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">Customer</span><span class="info-colon">:</span><span>${escapeHtml(order.reservationName)}</span></div>`
    )
  }
  if (order.noPolisi && String(order.noPolisi).trim()) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">No Polisi</span><span class="info-colon">:</span><span>${escapeHtml(order.noPolisi)}</span></div>`
    )
  }

  // Items HTML
  const items = Array.isArray(order.items) ? order.items : []
  const itemsHTML =
    items.length > 0
      ? items
          .map(
            (item) => `
        <div class="item-block">
          <div class="item-row">
            <span class="item-name">${escapeHtml(item.name)}</span>
          </div>
          <div class="item-row">
            <span class="item-qty">${toNumber(item.qty)}</span>
            <span style="flex:1;font-size:10px;color:#555"> x ${fmtNum(item.price)}</span>
            <span class="item-price">${fmtNum(item.subTotal ?? toNumber(item.qty) * toNumber(item.price))}</span>
          </div>
        </div>`
          )
          .join('')
      : `<div class="empty-items">Tidak ada item</div>`

  // Summary HTML
  let summaryHTML = ''
  summaryHTML += sumRow('Sub Total', fmtNum(order.subTotal))
  summaryHTML += sumRow('Diskon', fmtNum(order.discountNominal ?? 0))
  summaryHTML += `<div class="sep-dash"></div>`
  summaryHTML += sumRow('Grand Total', fmtNum(order.grandTotal), true)
  if (order.status === 'PAID' && order.paidBy === 'Cash') {
    summaryHTML += `<div class="sep-dash"></div>`
    summaryHTML += sumRow('Bayar', fmtNum(order.paidCash))
    summaryHTML += sumRow('Kembalian', fmtNum(order.returnCash ?? 0), true)
  }

  // Footer text
  const footerText =
    settings.customFooterText && settings.footerText
      ? settings.footerText
      : 'Terima kasih atas kunjungan Anda'

  // Print count info
  const printCountHTML =
    order.printCount > 0
      ? `<div style="font-size:9px;color:#666;font-style:italic;margin-bottom:4px;">Terakhir dicetak: ${escapeHtml(order.lastPrintedBy || '')} (${order.lastPrintedAt ? new Date(order.lastPrintedAt).toLocaleString('id-ID') : '-'})<br/>Total Cetak: ${order.printCount}x</div>`
      : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    color: #111;
    background: #fff;
    width: ${paperWidth}px;
    padding: 12px 8px;
  }
  .header-name { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 2px; }
  .header-addr { font-size: 11px; text-align: center; line-height: 1.4; }
  .section-title { font-weight: bold; text-align: center; letter-spacing: 2px; margin: 4px 0; }
  .sep-dash { border-top: 1px dashed #333; margin: 6px 0; }
  .sep-bold { border-top: 2px solid #111; margin: 6px 0; }
  .info-row { display: flex; font-size: 11px; margin: 2px 0; }
  .info-label { min-width: 90px; }
  .info-colon { margin: 0 4px; }
  .item-block { margin: 4px 0; }
  .item-row { display: flex; align-items: flex-start; font-size: 11px; }
  .item-qty { min-width: 20px; font-weight: bold; }
  .item-name { flex: 1; font-weight: bold; word-break: break-word; }
  .item-price { min-width: 80px; text-align: right; font-weight: bold; }
  .empty-items { text-align: center; font-style: italic; color: #999; }
  .sum-row { display: flex; margin: 2px 0; font-size: 11px; }
  .sum-label { flex: 1; text-align: right; }
  .sum-colon { margin: 0 6px; }
  .sum-value { min-width: 90px; text-align: right; }
  .sum-bold { font-weight: bold; font-size: 12px; }
  .footer-section { text-align: center; margin-top: 10px; font-size: 11px; line-height: 1.6; }
</style>
</head>
<body>
  ${headerLines.length > 0 ? headerLines.join('') : `<div class="header-name">${escapeHtml(order.outletName || 'OUTLET')}</div>`}
  <div class="sep-bold"></div>
  <div class="section-title">CHECK OUT</div>
  <div class="sep-bold"></div>

  ${infoRows.join('')}

  <div class="sep-bold"></div>

  <div class="items-section">
    ${itemsHTML}
  </div>

  <div class="sep-bold"></div>

  <div class="summary-section">
    ${summaryHTML}
  </div>

  <div class="sep-bold"></div>
  <div class="footer-section">
    ${printCountHTML}
    ${escapeHtml(footerText).replace(/\n/g, '<br/>')}
  </div>
</body>
</html>`
}

/**
 * Build thermal-style receipt HTML for transaction history (print icon).
 * Layout matches the preview modal exactly:
 *   header → separator → info rows → separator → items → separator → summary → separator → footer
 *
 * order shape:
 *   transactionNo, createdAt, bookingDate, outletCategoryId,
 *   cashierName, reservationName, noPolisi,
 *   outletName, businessName, outletAddress, city, province, country, email, phone,
 *   items: [{ name, qty, price, subTotal }],
 *   subTotal, discountNominal, grandTotal,
 *   status, paidBy, paidCash, returnCash,
 *   printCount, lastPrintedBy, lastPrintedAt, footer
 */
export const buildReceiptHistoryHTML = (order, receiptSettings = {}) => {
  const settings = { ...getDefaultSettings(), ...(receiptSettings || {}) }
  const paperWidth = settings.paperSize === 'MM80' ? 360 : 280

  const toNumber = (value) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  const fmtNum = (amount) => formatRupiah(toNumber(amount))

  const sumRow = (label, value, bold = false) =>
    `<div class="sum-row${bold ? ' sum-bold' : ''}"><span class="sum-label">${label}</span><span class="sum-colon">:</span><span class="sum-value">${value}</span></div>`

  // Header
  const headerLines = []
  if (settings.customHeaderText && settings.headerText) {
    headerLines.push(
      `<div class="header-addr">${escapeHtml(settings.headerText).replace(/\n/g, '<br/>')}</div>`
    )
  } else {
    if (settings.showBusinessName && order.businessName) {
      headerLines.push(`<div class="header-name">${escapeHtml(order.businessName)}</div>`)
    }
    if (settings.showOutletName && order.outletName) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.outletName)}</div>`)
    }
    if (settings.showAddress && order.outletAddress) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.outletAddress)}</div>`)
    }
    if (settings.showCity && order.city) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.city)}</div>`)
    }
    if (settings.showProvince && order.province) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.province)}</div>`)
    }
    if (settings.showCountry && order.country) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.country)}</div>`)
    }
    if (settings.showEmail && order.email) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.email)}</div>`)
    }
    if (settings.showPhone && order.phone) {
      headerLines.push(`<div class="header-addr">${escapeHtml(order.phone)}</div>`)
    }
  }

  // Date — hotel (outletCategoryId=1) uses bookingDate, others use createdAt
  const rawDate =
    order.outletCategoryId === '1' || order.outletCategoryId === 1
      ? order.bookingDate || order.createdAt
      : order.createdAt || order.bookingDate
  const waktuStr = rawDate ? new Date(rawDate).toLocaleString('id-ID') : '-'

  // Info rows
  const infoRows = []
  if (settings.showNoteNumber && order.transactionNo) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">No Nota</span><span class="info-colon">:</span><span>${escapeHtml(order.transactionNo)}</span></div>`
    )
  }
  if (settings.showTransactionTime) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">Waktu</span><span class="info-colon">:</span><span>${waktuStr}</span></div>`
    )
  }
  if (settings.showCashierPaymentName && order.cashierName) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">Kasir</span><span class="info-colon">:</span><span>${escapeHtml(order.cashierName)}</span></div>`
    )
  }
  if (settings.showCustomer && order.reservationName) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">Customer</span><span class="info-colon">:</span><span>${escapeHtml(order.reservationName)}</span></div>`
    )
  }
  if (order.noPolisi && String(order.noPolisi).trim()) {
    infoRows.push(
      `<div class="info-row"><span class="info-label">No Polisi</span><span class="info-colon">:</span><span>${escapeHtml(order.noPolisi)}</span></div>`
    )
  }

  // Items
  const items = Array.isArray(order.items) ? order.items : []
  const itemsHTML =
    items.length > 0
      ? items
          .map(
            (item) => `
        <div class="item-block">
          <div style="font-weight:bold;font-size:11px;word-break:break-word;">${escapeHtml(item.name)}</div>
          <div class="item-row">
            <span style="flex:1;font-size:10px;">${toNumber(item.qty)} x ${fmtNum(item.price)}</span>
            <span class="item-price">${fmtNum(item.subTotal ?? toNumber(item.qty) * toNumber(item.price))}</span>
          </div>
        </div>`
          )
          .join('')
      : `<div class="empty-items">Tidak ada item</div>`

  // Summary
  let summaryHTML = ''
  summaryHTML += sumRow('Sub Total', fmtNum(order.subTotal))
  summaryHTML += sumRow('Diskon', fmtNum(order.discountNominal ?? 0))
  summaryHTML += `<div class="sep-dash"></div>`
  summaryHTML += sumRow('Grand Total', fmtNum(order.grandTotal), true)
  if (order.status === 'PAID' && order.paidBy === 'Cash') {
    summaryHTML += `<div class="sep-dash"></div>`
    summaryHTML += sumRow('Bayar', fmtNum(order.paidCash))
    summaryHTML += sumRow('Kembalian', fmtNum(order.returnCash ?? 0), true)
  }

  // Footer
  const footerText =
    settings.customFooterText && settings.footerText
      ? settings.footerText
      : order.footer || 'Terima kasih atas kunjungan Anda'

  const printCountHTML =
    order.printCount > 0
      ? `<div style="font-size:9px;color:#666;font-style:italic;margin-bottom:4px;">Terakhir dicetak: ${escapeHtml(order.lastPrintedBy || '')} (${order.lastPrintedAt ? new Date(order.lastPrintedAt).toLocaleString('id-ID') : '-'})<br/>Total Cetak: ${order.printCount}x</div>`
      : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    color: #111;
    background: #fff;
    width: ${paperWidth}px;
    padding: 12px 8px;
  }
  .header-name { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 2px; }
  .header-addr { font-size: 11px; text-align: center; line-height: 1.4; }
  .sep-dash { border-top: 1px dashed #333; margin: 6px 0; }
  .info-row { display: flex; font-size: 11px; margin: 2px 0; }
  .info-label { min-width: 90px; }
  .info-colon { margin: 0 4px; }
  .item-block { margin: 4px 0; }
  .item-row { display: flex; align-items: flex-start; font-size: 11px; }
  .item-price { min-width: 80px; text-align: right; font-weight: bold; }
  .empty-items { text-align: center; font-style: italic; color: #999; }
  .sum-row { display: flex; margin: 2px 0; font-size: 11px; }
  .sum-label { flex: 1; text-align: right; }
  .sum-colon { margin: 0 6px; }
  .sum-value { min-width: 90px; text-align: right; }
  .sum-bold { font-weight: bold; font-size: 12px; }
  .footer-section { text-align: center; margin-top: 10px; font-size: 11px; line-height: 1.6; }
</style>
</head>
<body>
  ${headerLines.length > 0 ? headerLines.join('') : `<div class="header-name">${escapeHtml(order.outletName || 'OUTLET')}</div>`}

  <div class="sep-dash"></div>

  ${infoRows.join('')}

  <div class="sep-dash"></div>

  ${itemsHTML}

  <div class="sep-dash"></div>

  ${summaryHTML}

  <div class="sep-dash"></div>

  <div class="footer-section">
    ${printCountHTML}
    ${escapeHtml(footerText).replace(/\n/g, '<br/>')}
  </div>
</body>
</html>`
}
