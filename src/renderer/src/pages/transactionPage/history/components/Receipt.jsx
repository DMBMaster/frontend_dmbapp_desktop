/* eslint-disable react/prop-types */
import { Button, CircularProgress, IconButton } from '@mui/material'
import { IconPrinter } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import ReceiptService from '@renderer/services/receiptService'
import { buildReceiptHistoryHTML } from '@renderer/pages/transactionPage/create/components/printTransaction'

const Receipt = ({ data }) => {
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
        const merchantId = localStorage.getItem('outletGuid') || localStorage.getItem('outletId')
        if (merchantId) {
          const res = await receiptService.getReceiptSettings({ merchant_id: merchantId })
          setReceiptSettings(res?.data ?? null)
        }
      } catch (err) {
        console.error('Failed to load receipt settings:', err)
      } finally {
        setLoadingSettings(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const userData = JSON.parse(localStorage.getItem('loginData'))

  const getSettings = () => {
    const base = {
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
      showUnitPrice: true,
      showNotes: true,
      customFooterText: false,
      footerText: ''
    }
    return receiptSettings ? { ...base, ...receiptSettings } : base
  }

  const toNumber = (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  const fmt = (v) => new Intl.NumberFormat('id-ID').format(toNumber(v))

  const buildOrder = () => {
    const settings = getSettings()
    const transactionItems = Array.isArray(data?.transaction_item) ? data.transaction_item : []

    // Normalize printData from settings
    const rawPrintData = receiptSettings?.printData
    let normalizedPrintData = {}
    if (Array.isArray(rawPrintData)) {
      rawPrintData.forEach((item) => {
        if (item && typeof item === 'object' && item.name) {
          normalizedPrintData[item.name] = item.value
        }
      })
    } else if (typeof rawPrintData === 'object' && rawPrintData !== null) {
      normalizedPrintData = rawPrintData
    }

    return {
      businessName:
        normalizedPrintData.businessName ||
        localStorage.getItem('merchantName') ||
        localStorage.getItem('outletName') ||
        '',
      outletName: normalizedPrintData.outletName || localStorage.getItem('outletName') || '',
      outletAddress: normalizedPrintData.address || localStorage.getItem('outletAddress') || '',
      phone: normalizedPrintData.phone || localStorage.getItem('outletPhone') || '',
      email: normalizedPrintData.email || localStorage.getItem('outletEmail') || '',
      city: normalizedPrintData.city || localStorage.getItem('outletCity') || '',
      province: normalizedPrintData.province || localStorage.getItem('outletProvince') || '',
      country: normalizedPrintData.country || localStorage.getItem('outletCountry') || '',
      outletCategoryId: localStorage.getItem('outletCategoryId'),
      transactionNo: data?.transaction_no || '',
      createdAt: data?.created_at,
      bookingDate: data?.booking_date,
      cashierName: userData?.full_name || '-',
      reservationName: data?.reservation_name || '',
      noPolisi: data?.no_polisi || '',
      items: transactionItems.map((item) => ({
        name: item.name,
        qty: toNumber(item.qty),
        price: toNumber(item.price),
        subTotal: toNumber(item.sub_total)
      })),
      subTotal: toNumber(data?.sub_total),
      discountNominal: toNumber(data?.discount_nominal ?? 0),
      grandTotal: toNumber(data?.grand_total),
      status: data?.status,
      paidBy: data?.paid_by,
      paidCash: toNumber(data?.paid_cash),
      returnCash: toNumber(data?.return_cash ?? 0),
      printCount: data?.print_count ?? 0,
      lastPrintedBy: data?.last_printed_by,
      lastPrintedAt: data?.last_printed_at,
      footer: settings.footerText || 'Terima kasih atas kunjungan Anda'
    }
  }

  const handlePrint = async () => {
    setPrinting(true)
    try {
      const settings = getSettings()
      const order = buildOrder()
      const contentHTML = buildReceiptHistoryHTML(order, settings)
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
        console.error('Print receipt gagal:', result?.error || 'Unknown error')
      }
      setShowPreview(false)
    } catch (err) {
      console.error('Print receipt error:', err)
    } finally {
      setPrinting(false)
    }
  }

  const renderPreview = () => {
    const settings = getSettings()
    const paperMaxWidth = settings.paperSize === 'MM80' ? '320px' : '240px'
    const transactionItems = Array.isArray(data?.transaction_item) ? data.transaction_item : []

    const outletCategoryId = localStorage.getItem('outletCategoryId')
    const rawDate =
      outletCategoryId === '1'
        ? data?.booking_date || data?.created_at
        : data?.created_at || data?.booking_date

    // Normalize printData
    const rawPrintData = receiptSettings?.printData
    let normalizedPrintData = {}
    if (Array.isArray(rawPrintData)) {
      rawPrintData.forEach((item) => {
        if (item && typeof item === 'object' && item.name) {
          normalizedPrintData[item.name] = item.value
        }
      })
    } else if (typeof rawPrintData === 'object' && rawPrintData !== null) {
      normalizedPrintData = rawPrintData
    }

    const printData = {
      businessName:
        normalizedPrintData.businessName ||
        localStorage.getItem('merchantName') ||
        localStorage.getItem('outletName') ||
        '',
      outletName: normalizedPrintData.outletName || localStorage.getItem('outletName') || '',
      address: normalizedPrintData.address || localStorage.getItem('outletAddress') || '',
      phone: normalizedPrintData.phone || localStorage.getItem('outletPhone') || '',
      email: normalizedPrintData.email || localStorage.getItem('outletEmail') || ''
    }

    const headerText = settings.headerText || settings.header || ''
    const footerText =
      settings.customFooterText && (settings.footerText || settings.footer)
        ? settings.footerText || settings.footer
        : 'Terima kasih atas kunjungan Anda'

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
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              {settings.showBusinessName && printData.businessName && (
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{printData.businessName}</div>
              )}
              {settings.showOutletName && printData.outletName && (
                <div style={{ fontSize: '12px' }}>{printData.outletName}</div>
              )}
              {settings.showAddress && printData.address && (
                <div style={{ fontSize: '11px' }}>{printData.address}</div>
              )}
              {settings.showEmail && printData.email && (
                <div style={{ fontSize: '11px' }}>{printData.email}</div>
              )}
              {settings.showPhone && printData.phone && (
                <div style={{ fontSize: '11px' }}>{printData.phone}</div>
              )}
              {settings.customHeaderText && headerText && (
                <div
                  style={{
                    marginTop: '4px',
                    paddingTop: '4px',
                    borderTop: '1px dashed #ccc',
                    fontSize: '11px'
                  }}
                >
                  {headerText}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', margin: '5px 0' }}>----------------------------</div>

            {/* Transaction Info */}
            <div style={{ fontSize: '11px', marginBottom: '8px' }}>
              {settings.showNoteNumber && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>No Nota:</span>
                  <span>{data?.transaction_no}</span>
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
                  <span>{userData?.full_name || '-'}</span>
                </div>
              )}
              {settings.showCustomer && data?.reservation_name && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Customer:</span>
                  <span>{data.reservation_name}</span>
                </div>
              )}
              {data?.no_polisi?.trim() && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>No Polisi:</span>
                  <span>{data.no_polisi}</span>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', margin: '5px 0' }}>----------------------------</div>

            {/* Items */}
            {transactionItems.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '5px' }}>
                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {toNumber(item.qty)} x {fmt(item.price)}
                  </span>
                  <span>{fmt(item.sub_total)}</span>
                </div>
              </div>
            ))}

            <div style={{ textAlign: 'center', margin: '5px 0' }}>----------------------------</div>

            {/* Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Sub Total:</span>
              <span>{fmt(data?.sub_total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Diskon:</span>
              <span>{fmt(data?.discount_nominal ?? 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Grand Total:</span>
              <span>{fmt(data?.grand_total)}</span>
            </div>
            {data?.status === 'PAID' && data?.paid_by === 'Cash' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bayar:</span>
                  <span>{fmt(data.paid_cash)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 'bold'
                  }}
                >
                  <span>Kembalian:</span>
                  <span>{fmt(data.return_cash ?? 0)}</span>
                </div>
              </>
            )}

            <div style={{ textAlign: 'center', margin: '5px 0' }}>----------------------------</div>

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '8px' }}>
              {data?.print_count > 0 && (
                <div
                  style={{
                    fontSize: '9px',
                    color: '#666',
                    fontStyle: 'italic',
                    marginBottom: '4px'
                  }}
                >
                  Terakhir dicetak: {data.last_printed_by} (
                  {data.last_printed_at
                    ? new Date(data.last_printed_at).toLocaleString('id-ID')
                    : '-'}
                  )
                  <br />
                  Total Cetak: {data.print_count}x
                </div>
              )}
              <div>{footerText}</div>
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
      <IconButton disabled>
        <CircularProgress size={20} />
      </IconButton>
    )
  }

  return (
    <>
      <IconButton onClick={() => setShowPreview(true)} color="info">
        <IconPrinter />
      </IconButton>

      {showPreview && renderPreview()}
    </>
  )
}

export default Receipt
