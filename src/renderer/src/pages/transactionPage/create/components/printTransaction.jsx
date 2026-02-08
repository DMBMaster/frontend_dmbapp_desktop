import { formatRupiah } from '@renderer/utils/myFunctions'

export const buildReceiptHTML = (order) => {
  const itemsHTML =
    order.items?.length > 0
      ? order.items
          .map(
            (item) => `
        <div class="item">
          <div class="item-name">${item.productName}</div>

          <div class="item-row">
            <span>${item.quantity} x ${formatRupiah(item.price)}</span>
          </div>

          ${item.notes ? `<div class="item-note">Catatan: ${item.notes}</div>` : ''}

          <div class="divider"></div>
        </div>
      `
          )
          .join('')
      : `<div class="empty">Tidak ada item</div>`

  return `
  
    <div class="receipt">
      <div class="receipt-header" style="text-align:center; margin-bottom:12px;">
        <div>No Faktur : ${order.invoiceNo || '-'}</div>
        <div>Tgl Faktur : ${order.invoiceDate || '-'}</div>
        <div>Jatuh Tempo : ${order.dueDate || '-'}</div>
        <div>Pelanggan : ${order.customerName || '-'}</div>
        <div style="margin:8px 0;">------------</div>
      </div>

      <div class="items">
        ${itemsHTML}
      </div>

      <div class="summary">
        <div class="row">
          <span>Subtotal</span>
          <span>${formatRupiah(order.totalAmount)}</span>
        </div>

        ${
          order.discount
            ? `<div class="row">
                <span>Diskon</span>
                <span>- ${formatRupiah(order.discount)}</span>
              </div>`
            : ''
        }

        ${
          order.tax
            ? `<div class="row">
                <span>Pajak</span>
                <span>${formatRupiah(order.tax)}</span>
              </div>`
            : ''
        }

        <div class="row total">
          <span>TOTAL</span>
          <span>${formatRupiah(order.grandTotal)}</span>
        </div>
      </div>
    </div>
  `
}
