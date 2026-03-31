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
export const buildReceiptHTML = (order) => {
  const itemsHTML =
    order.items?.length > 0
      ? order.items
          .map(
            (item) => `
        <div class="item-block">
          <div class="item-row">
            <span class="item-qty">${item.quantity}</span>
            <span class="item-name">${item.productName}</span>
            <span class="item-price">${item.price === 0 ? 'FREE' : formatRupiah(item.price * item.quantity)}</span>
          </div>
          ${item.price !== 0 ? `<div class="item-detail">${item.quantity} x ${formatRupiah(item.price)}</div>` : ''}
          ${item.notes ? `<div class="item-note">* ${item.notes}</div>` : ''}
        </div>`
          )
          .join('')
      : `<div class="empty-items">Tidak ada item</div>`

  const now = new Date()
  const tanggal =
    order.invoiceDate ||
    now
      .toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })
      .replace(/\//g, '-')
  const jam = now.toLocaleTimeString('id-ID', {
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
    width: 280px;
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
  <div class="header-name">${order.outletName || 'OUTLET'}</div>
  ${order.outletAddress ? `<div class="header-addr">${order.outletAddress}</div>` : ''}
  <div class="section-title">---PAYMENT---</div>
  <div class="sep-bold"></div>

  <div class="info-row"><span class="info-label">Tanggal</span><span class="info-colon">:</span><span>${tanggal}</span></div>
  <div class="info-row"><span class="info-label">Jam Masuk</span><span class="info-colon">:</span><span>${jam}</span></div>
  <div class="info-row"><span class="info-label">Nama Tamu</span><span class="info-colon">:</span><span>${order.customerName || 'Umum'}</span></div>
  ${order.cashierName ? `<div class="info-row"><span class="info-label">Kasir</span><span class="info-colon">:</span><span>${order.cashierName}</span></div>` : ''}
  ${order.invoiceNo ? `<div class="info-row"><span class="info-label">No. Invoice</span><span class="info-colon">:</span><span>${order.invoiceNo}</span></div>` : ''}

  <div class="sep-bold"></div>

  <div class="items-section">
    ${itemsHTML}
  </div>

  <div class="summary-section">
    ${summaryHTML}
  </div>

  <div class="sep-bold"></div>
  <div class="footer-section">
    ${order.footer || 'Thank You For Coming !!!'}
  </div>
  ${order.notes ? `<div class="footer-note">Note : ${order.notes}</div>` : ''}
</body>
</html>`
}
