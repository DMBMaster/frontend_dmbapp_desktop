/* eslint-disable react/prop-types */
import { Button, CircularProgress, IconButton } from '@mui/material'
import { useEffect, useState } from 'react'
import ReceiptService from '@renderer/services/receiptService'
import { buildCOReceiptHTML } from '@renderer/pages/transactionPage/create/components/printTransaction'

const CO = ({ data }) => {
  const [showPreview, setShowPreview] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [receiptSettings, setReceiptSettings] = useState(null)
  const [printing, setPrinting] = useState(false)

  const receiptService = ReceiptService()

  useEffect(() => {
    const load = async () => {
      try {
        const cached = receiptService.getCachedReceiptSettings()
        if (cached) {
          setReceiptSettings(cached)
          setLoadingSettings(false)
          return
        }
        const merchantId =
          localStorage.getItem('outletGuid') || localStorage.getItem('outletId')
        if (merchantId) {
          const res = await receiptService.getReceiptSettings({ merchant_id: merchantId })
          setReceiptSettings(res?.data ?? null)
        }
      } catch (err) {
        console.error('Failed to load receipt settings for CO:', err)
      } finally {
        setLoadingSettings(false)
      }
    }
    load()
  }, [])

  const userData = JSON.parse(localStorage.getItem('loginData'))

  const buildOrder = () => ({
    outletName: localStorage.getItem('outletName') || '',
    businessName: localStorage.getItem('outletName') || '',
    outletAddress: localStorage.getItem('outletAddress') || '',
    city: localStorage.getItem('outletCity') || '',
    province: localStorage.getItem('outletProvince') || '',
    country: localStorage.getItem('outletCountry') || '',
    email: localStorage.getItem('outletEmail') || '',
    phone: localStorage.getItem('outletPhone') || '',
    outletCategoryId: localStorage.getItem('outletCategoryId'),
    transactionNo: data.transaction_no,
    createdAt: data.created_at,
    bookingDate: data.booking_date,
    cashierName: userData?.full_name || '-',
    reservationName: data.reservation_name || '',
    noPolisi: data.no_polisi || '',
    items: Array.isArray(data.transaction_item)
      ? data.transaction_item.map((item) => ({
          name: item.name,
          qty: item.qty,
          price: item.price,
          subTotal: item.sub_total
        }))
      : [],
    subTotal: data.sub_total,
    discountNominal: data.discount_nominal ?? 0,
    grandTotal: data.grand_total,
    status: data.status,
    paidBy: data.paid_by,
    paidCash: data.paid_cash,
    returnCash: data.return_cash,
    printCount: data.print_count ?? 0,
    lastPrintedBy: data.last_printed_by,
    lastPrintedAt: data.last_printed_at
  })

  const getSettings = () =>
    receiptSettings || {
      paperSize: 'MM58',
      showBusinessName: true,
      showOutletName: true,
      showAddress: true,
      showPhone: true,
      showEmail: false,
      showNoteNumber: true,
      showTransactionTime: true,
      showCashierPaymentName: true,
      showCustomer: true,
      showNotes: true
    }

  const handlePrint = async () => {
    setPrinting(true)
    try {
      const order = buildOrder()
      const settings = getSettings()
      const contentHTML = buildCOReceiptHTML(order, settings)
      const dataToprint = {
        header1: '',
        header2: '',
        header3: '',
        contentHTML,
        footer1: '',
        footer2: '',
        footer3: '',
        paperSize: settings.paperSize || 'MM58',
        copies: 1,
        receiptSettings: settings
      }
      const result = await window.api.printOrderReceipt(dataToprint)
      if (!result?.success) {
        console.error('Print CO gagal:', result?.error || 'Unknown error')
      }
      setShowPreview(false)
    } catch (err) {
      console.error('Print CO error:', err)
    } finally {
      setPrinting(false)
    }
  }

  const renderPreview = () => {
    const settings = getSettings()
    const paperMaxWidth = settings.paperSize === 'MM80' ? '320px' : '240px'
    const order = buildOrder()
    const toNumber = (v) => {
      const n = Number(v)
      return Number.isFinite(n) ? n : 0
    }
    const fmt = (v) => new Intl.NumberFormat('id-ID').format(toNumber(v))
    const rawDate =
      order.outletCategoryId === '1' || order.outletCategoryId === 1
        ? order.bookingDate || order.createdAt
        : order.createdAt || order.bookingDate

    return (
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
          alignItems: 'center',
          zIndex: 9999
        }}
      >
        <div
          style={{
            background: '#fff',
            padding: '20px',
            width: paperMaxWidth,
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '5px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#000' }}>
            {/* Header */}
            {settings.showBusinessName && order.businessName && (
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                {order.businessName}
              </div>
            )}
            {settings.showAddress && order.outletAddress && (
              <div style={{ textAlign: 'center', fontSize: '11px' }}>{order.outletAddress}</div>
            )}
            {settings.showPhone && order.phone && (
              <div style={{ textAlign: 'center', fontSize: '11px' }}>{order.phone}</div>
            )}

            <div style={{ borderTop: '2px solid #111', margin: '4px 0' }} />
            <div style={{ textAlign: 'center', fontWeight: 'bold', letterSpacing: '2px' }}>
              CHECK OUT
            </div>
            <div style={{ borderTop: '2px solid #111', margin: '4px 0' }} />

            {/* Transaction Info */}
            {settings.showNoteNumber && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>No Nota:</span>
                <span>{order.transactionNo}</span>
              </div>
            )}
            {settings.showTransactionTime && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Waktu:</span>
                <span>{rawDate ? new Date(rawDate).toLocaleString('id-ID') : '-'}</span>
              </div>
            )}
            {settings.showCashierPaymentName && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Kasir:</span>
                <span>{order.cashierName}</span>
              </div>
            )}
            {settings.showCustomer && order.reservationName && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Customer:</span>
                <span>{order.reservationName}</span>
              </div>
            )}
            {order.noPolisi && String(order.noPolisi).trim() && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>No Polisi:</span>
                <span>{order.noPolisi}</span>
              </div>
            )}

            <div style={{ borderTop: '2px solid #111', margin: '5px 0' }} />

            {/* Items */}
            {order.items.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '4px' }}>
                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {toNumber(item.qty)} x {fmt(item.price)}
                  </span>
                  <span>{fmt(item.subTotal ?? toNumber(item.qty) * toNumber(item.price))}</span>
                </div>
              </div>
            ))}

            <div style={{ borderTop: '2px solid #111', margin: '5px 0' }} />

            {/* Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Sub Total:</span>
              <span>{fmt(order.subTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Diskon:</span>
              <span>{fmt(order.discountNominal ?? 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Grand Total:</span>
              <span>{fmt(order.grandTotal)}</span>
            </div>
            {order.status === 'PAID' && order.paidBy === 'Cash' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bayar:</span>
                  <span>{fmt(order.paidCash)}</span>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}
                >
                  <span>Kembalian:</span>
                  <span>{fmt(order.returnCash ?? 0)}</span>
                </div>
              </>
            )}

            <div style={{ borderTop: '2px solid #111', margin: '5px 0' }} />
            <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '8px' }}>
              Terima kasih atas kunjungan Anda
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              marginTop: '16px',
              display: 'flex',
              gap: '10px',
              justifyContent: 'center'
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={printing}
              onClick={handlePrint}
              startIcon={printing ? <CircularProgress size={14} /> : undefined}
            >
              {printing ? 'Mencetak...' : 'Print'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowPreview(false)}
              disabled={printing}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loadingSettings) {
    return (
      <IconButton disabled size="small">
        <CircularProgress size={18} />
      </IconButton>
    )
  }

  return (
    <>
      <Button
        onClick={() => setShowPreview(true)}
        variant="contained"
        sx={{ borderRadius: '50%', minWidth: 40, width: 40, height: 40, padding: 0 }}
      >
        CO
      </Button>

      {showPreview && renderPreview()}
    </>
  )
}

export default CO

