'use client'
import { IconButton } from '@mui/material'
import { IconPrinter } from '@tabler/icons-react'
import React, { useRef, useState } from 'react'

const Receipt = (data) => {
  console.log(data, 'isi data trx preview')
  const [showPreview, setShowPreview] = useState(false)
  const printRef = useRef()

  const numberFormat = (amount) => {
    return new Intl.NumberFormat('id-ID').format(amount) // Using 'id-ID' for Indonesian formatting
  }

  const formatNumber = (amount) => {
    return new Intl.NumberFormat('id-ID').format(amount) // Using 'id-ID' for Indonesian formatting
  }

  const receiptData = {
    outlet_name: localStorage.getItem('outletName'),
    outlet_address: localStorage.getItem('outletAddress'),
    outlet_phone: localStorage.getItem('outletPhone'),
    outlet_email: localStorage.getItem('outletEmail'),
    outlet: localStorage.getItem('defaultOutlet'),
    date: data.data.created_at,
    invoice: data.data.transaction_no,
    items: data.data.transaction_item.map((item) => ({
      name: item.name,
      qty: item.qty,
      unitPrice: item.price,
      total: item.qty * item.sub_total
    })),
    totalQty: data.data.transaction_item.reduce((sum, item) => sum + item.qty, 0),
    total: data.data.grand_total,
    grand_total: data.data.grand_total,
    sub_total: data.data.sub_total,
    paid: 300000,
    change: 50000
  }

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML // Get the receipt content
    const originalContents = document.body.innerHTML

    document.body.innerHTML = printContents // Temporarily replace the page content
    window.print() // Trigger the print dialog
    document.body.innerHTML = originalContents // Restore the original content
    window.location.reload() // Refresh the page to avoid display issues
  }

  const userData = JSON.parse(localStorage.getItem('loginData'))

  return (
    <>
      <div ref={printRef} style={{ display: 'none' }} className="thermal-print">
        <h3
          style={{
            marginBottom: '-1px',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
          className="store-name"
        >
          {localStorage.getItem('outletName')}
        </h3>
        {/* <p style={{
                            fontSize:'11px',
                            marginTop: '0px',
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                        }} className="store-address">{localStorage.getItem("outletAddress")}</p> */}
        <p
          style={{
            fontSize: '11px',
            marginTop: '-1px',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
          className="store-contact"
        >
          {localStorage.getItem('outletPhone')}
        </p>
        <p
          style={{
            marginTop: '-12px',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
          className="divider"
        >
          ----------------------------
        </p>

        <p
          style={{
            marginTop: '-10px',
            marginBottom: '18px',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
          className="divider"
        >
          <b>Bill</b>
        </p>

        <p
          style={{
            marginTop: '-10px'
          }}
        >
          ID Transaksi : {data.data.transaction_no}
        </p>
        {localStorage.getItem('outletCategoryId') === '1' && (
          <p style={{ marginTop: '-12px' }}>
            Tanggal :{' '}
            {data.data.booking_date
              ? new Date(data.data.booking_date).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })
              : '-'}
          </p>
        )}

        {localStorage.getItem('outletCategoryId') !== '1' && (
          <p style={{ marginTop: '-12px' }}>
            Tanggal :{' '}
            {data.data.created_at
              ? new Date(data.data.created_at).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })
              : '-'}
          </p>
        )}
        <p style={{ marginTop: '-12px' }}>
          Waktu Cetak :{' '}
          {new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </p>

        <p
          style={{
            marginTop: '-10px'
          }}
        >
          Nama Kasir : {userData?.full_name}
        </p>
        {data.data.no_polisi?.trim() && (
          <p style={{ marginTop: '-10px' }}>Nomor Polisi : {data.data.no_polisi}</p>
        )}
        {/* <p style={{
                    marginTop: '-12px',
                }}>Jatuh Tempo : {invoice.due_date ? new Date(invoice?.due_date).toLocaleDateString('en-GB', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                }) : '-'}</p> */}
        {/* {data.data.ticket?.customer_id.trim() && (
                <p style={{
                    marginTop: '-12px',
                }}>Pelanggan : {invoice.to_company_name}</p>
                )} */}
        <p
          style={{
            marginTop: '-12px',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
          className="divider"
        >
          ----------------------------
        </p>

        <table
          border="0"
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            textAlign: 'left',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          <tbody>
            {data.data.transaction_item.map((item, index) => (
              <React.Fragment key={index}>
                {/* Row for item name */}
                <tr>
                  <td colSpan="3" style={{ padding: '0px', fontWeight: 'bold' }}>
                    {item.name}
                  </td>
                </tr>

                {/* Row for qty x price and subtotal */}
                <tr>
                  <td style={{ padding: '0px', textAlign: 'left', width: '50%' }}>
                    {item.qty} x {item.price.toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '0px', textAlign: 'right', width: '50%' }}>
                    {item.sub_total.toLocaleString('id-ID')}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <p
          style={{
            marginTop: '5px',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
          className="divider"
        >
          ----------------------------
        </p>

        <table
          border="0"
          style={{
            borderCollapse: 'collapse',
            fontFamily: 'Arial, sans-serif',
            width: '100%' // Ensures the table stretches across the available space
          }}
        >
          <tbody>
            <tr>
              <td style={{ textAlign: 'left', fontWeight: 'bold' }}>Jumlah Item</td>
              <td style={{ textAlign: 'right' }}>
                {numberFormat(data.data.transaction_item.reduce((sum, item) => sum + item.qty, 0))}
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left', fontWeight: 'bold' }}>Metode Bayar</td>
              <td style={{ textAlign: 'right' }}>{data.data.paid_by}</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left', fontWeight: 'bold' }}>Status</td>
              <td style={{ textAlign: 'right' }}>
                {data.data.status == 'PAID' ? 'Sudah Bayar' : 'Belum Bayar'}
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left', fontWeight: 'bold' }}>Sub Total</td>
              <td style={{ textAlign: 'right' }}>{numberFormat(data.data.sub_total)}</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left', fontWeight: 'bold' }}>Diskon</td>
              <td style={{ textAlign: 'right' }}>
                {formatNumber(data.data.discount_nominal ?? 0)}
              </td>
            </tr>
            {/* <tr>
                            <td style={{ textAlign: "left", fontWeight: "bold" }}>PPN</td>
                            <td style={{ textAlign: "right" }}>{numberFormat(invoice.sum_tax)}</td>
                        </tr> */}
            <tr>
              <td style={{ textAlign: 'left', fontWeight: 'bold' }}>
                <b>Grand Total</b>
              </td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                <b>{formatNumber(data.data.grand_total)}</b>
              </td>
            </tr>
            {data.data.status == 'PAID' && data.data.paid_by == 'Cash' && (
              <tr>
                <td style={{ textAlign: 'left', fontWeight: 'bold' }}>
                  <b>Bayar</b>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  <b>{formatNumber(data.data.paid_cash)}</b>
                </td>
              </tr>
            )}
            {data.data.status == 'PAID' && data.data.paid_by == 'Cash' && (
              <tr>
                <td style={{ textAlign: 'left', fontWeight: 'bold' }}>
                  <b>Kembalian</b>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  <b>{formatNumber(data.data.return_cash)}</b>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p
          style={{
            marginTop: '5px',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
          className="divider"
        >
          ----------------------------
        </p>
        {/* <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "20px",
                        marginTop: "20px",
                        textAlign: "center",
                    }}
                >
                    <div>
                        <p>Dibuat oleh</p>
                        <div
                            style={{
                                borderBottom: "1px solid black",
                                width: "80%",
                                margin: "80px auto 20px auto"
                            }}
                        ></div>
                    </div>
                    <div>
                        <p>Diperiksa Oleh</p>
                        <div
                            style={{
                                borderBottom: "1px solid black",
                                width: "80%",
                                margin: "80px auto 20px auto"
                            }}
                        ></div>
                    </div>
                    <div>
                        <p>Disetujui Oleh</p>
                        <div
                            style={{
                                borderBottom: "1px solid black",
                                width: "80%",
                                margin: "80px auto 20px auto"
                            }}
                        ></div>
                    </div>
                    <div>
                        <p>Diterima Oleh</p>
                        <div
                            style={{
                                borderBottom: "1px solid black",
                                width: "80%",
                                margin: "80px auto 20px auto"
                            }}
                        ></div>
                        <p style={{ marginTop: '-10px' }}>Pelanggan</p>
                    </div>
                </div> */}
        <p
          style={{
            marginTop: '30px',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
          className="thank-you"
        >
          Thank you for your purchase!
        </p>
      </div>
      <div>
        <IconButton onClick={() => setShowPreview(true)} variant="contained" color="info">
          <IconPrinter />
        </IconButton>
        {/* <button onClick={() => setShowPreview(true)}>Preview Receipt</button> */}

        {/* Preview Modal */}
        {showPreview && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div
              style={{ background: '#fff', padding: '20px', width: '300px', borderRadius: '5px' }}
            >
              {/* Receipt Preview */}
              <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                <p style={{ textAlign: 'center' }}>Receipt</p>
                <p style={{ textAlign: 'center' }}>{receiptData.date}</p>
                <p>ID Transaksi: {receiptData.invoice}</p>
                <hr />
                {receiptData.items.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      {item.qty} x {item.name}
                    </span>
                    <span>Rp {item.total.toLocaleString()}</span>
                  </div>
                ))}
                <hr />
                {/* <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Total Qty:</span>
                                    <span>{receiptData.totalQty}</span>
                                </div> */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Sub Total:</span>
                  <span>Rp {receiptData.sub_total.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Grand Total:</span>
                  <span>Rp {receiptData.grand_total.toLocaleString()}</span>
                </div>
                {/* <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Diskon :</span>
                                <span>Rp {receiptData.paid.toLocaleString()}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Change:</span>
                                <span>Rp {receiptData.change.toLocaleString()}</span>
                            </div> */}
                <hr />
                <p style={{ textAlign: 'center' }}>Thank you for your trust!</p>
              </div>

              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button onClick={handlePrint} style={{ marginRight: '10px' }}>
                  Print
                </button>
                <button onClick={() => setShowPreview(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Receipt
