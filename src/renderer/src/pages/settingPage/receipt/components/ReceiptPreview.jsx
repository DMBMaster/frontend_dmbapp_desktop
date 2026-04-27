/* eslint-disable react/prop-types */
import { Box, Chip, Divider, Paper, Typography } from '@mui/material'
import { useMemo } from 'react'

const previewData = {
  noteNumber: 'CS/01/221107/9999',
  time: new Date().toLocaleString('id-ID'),
  orderNumber: 'ORD-0097',
  cashierOrder: 'Pevita',
  cashierPayment: 'Pevita',
  customer: 'Ghufron',
  servedBy: 'Nanang',
  orderType: 'Dine-In',
  orderName: 'Pak SBY',
  tableNumber: '009',
  items: [
    { name: 'Matcha GO (Pcs) - Japanese Tea', qty: 1, price: 20000 },
    { name: '+ Boba', qty: 1, price: 3000 }
  ],
  subtotal: 23000,
  total: 23000
}

const rowSx = {
  display: 'flex',
  justifyContent: 'space-between',
  mb: 0.5
}

export const ReceiptPreview = ({ settings, socialMediaLines }) => {
  const paperMaxWidth = settings?.paperSize === 'MM80' ? 300 : 220

  const qrTitle = useMemo(() => settings?.qrTitle || 'QR Code', [settings?.qrTitle])
  const webQrTitle = useMemo(() => settings?.webQRTitle || 'Webstruk QR', [settings?.webQRTitle])

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2,
        borderColor: 'grey.300',
        position: { lg: 'sticky' },
        top: { lg: 16 }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Preview Struk
        </Typography>
        <Chip
          size="small"
          label={settings?.paperSize === 'MM80' ? '80mm' : '58mm'}
          sx={{ bgcolor: 'grey.100', fontWeight: 500 }}
        />
      </Box>

      <Box
        sx={{
          fontFamily: 'monospace',
          fontSize: '0.67rem',
          border: '1px dashed',
          borderColor: '#cfd8e3',
          borderRadius: 1,
          p: 1.7,
          maxWidth: paperMaxWidth,
          mx: 'auto',
          bgcolor: 'white',
          color: 'text.primary'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 1.5 }}>
          {settings?.showLogo && (
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              [LOGO]
            </Typography>
          )}
          {settings?.showBusinessName && (
            <Typography variant="body2" fontWeight="bold" display="block">
              NAMA USAHA
            </Typography>
          )}
          {settings?.showOutletName && (
            <Typography variant="caption" display="block">
              Nama Outlet
            </Typography>
          )}
          {settings?.showAddress && (
            <Typography variant="caption" display="block">
              Alamat Outlet
            </Typography>
          )}
          {settings?.showCity && (
            <Typography variant="caption" display="block">
              Kota
            </Typography>
          )}
          {settings?.showProvince && (
            <Typography variant="caption" display="block">
              Provinsi
            </Typography>
          )}
          {settings?.showCountry && (
            <Typography variant="caption" display="block">
              Negara
            </Typography>
          )}
          {settings?.showEmail && (
            <Typography variant="caption" display="block">
              email@example.com
            </Typography>
          )}
          {settings?.showPhone && (
            <Typography variant="caption" display="block">
              +62 812-3456-7890
            </Typography>
          )}
          {settings?.customHeaderText && settings?.headerText && (
            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" display="block">
                {settings.headerText}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

        <Box sx={{ fontSize: '0.7rem', mb: 1 }}>
          {settings?.showNoteNumber && (
            <Box sx={rowSx}>
              <span>No Nota:</span>
              <span>{previewData.noteNumber}</span>
            </Box>
          )}
          {settings?.showTransactionTime && (
            <Box sx={rowSx}>
              <span>Waktu:</span>
              <span>{previewData.time}</span>
            </Box>
          )}
          {settings?.showOrderNumber && (
            <Box sx={rowSx}>
              <span>No Urut:</span>
              <span>{previewData.orderNumber}</span>
            </Box>
          )}
          {settings?.showCashierOrderName && (
            <Box sx={rowSx}>
              <span>Order:</span>
              <span>{previewData.cashierOrder}</span>
            </Box>
          )}
          {settings?.showCashierPaymentName && (
            <Box sx={rowSx}>
              <span>Kasir:</span>
              <span>{previewData.cashierPayment}</span>
            </Box>
          )}
          {settings?.showCustomer && (
            <Box sx={rowSx}>
              <span>Customer:</span>
              <span>{previewData.customer}</span>
            </Box>
          )}
          {settings?.showServedBy && (
            <Box sx={rowSx}>
              <span>Dilayani:</span>
              <span>{previewData.servedBy}</span>
            </Box>
          )}
          {settings?.showOrderType && (
            <Box sx={rowSx}>
              <span>Jenis Order:</span>
              <span>{previewData.orderType}</span>
            </Box>
          )}
          {settings?.showOrderName && (
            <Box sx={rowSx}>
              <span>Nama Order:</span>
              <span>{previewData.orderName}</span>
            </Box>
          )}
          {settings?.showTableNumber && (
            <Box sx={rowSx}>
              <span>No Meja:</span>
              <span>{previewData.tableNumber}</span>
            </Box>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

        <Box sx={{ fontSize: '0.7rem', mb: 1 }}>
          {previewData.items.map((item, idx) => (
            <Box key={idx} sx={{ mb: 0.75 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.name}</span>
              </Box>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary' }}
              >
                <span>
                  {item.qty} x Rp {item.price.toLocaleString('id-ID')}
                </span>
                <span>Rp {(item.qty * item.price).toLocaleString('id-ID')}</span>
              </Box>
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

        <Box sx={{ fontSize: '0.7rem' }}>
          <Box sx={rowSx}>
            <span>Subtotal:</span>
            <span>Rp {previewData.subtotal.toLocaleString('id-ID')}</span>
          </Box>
          <Box sx={{ ...rowSx, fontWeight: 700 }}>
            <span>TOTAL:</span>
            <span>Rp {previewData.total.toLocaleString('id-ID')}</span>
          </Box>
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

        <Box sx={{ textAlign: 'center', fontSize: '0.7rem' }}>
          {settings?.showNotes && (
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Terima kasih atas kunjungan Anda
            </Typography>
          )}

          {settings?.customFooterText && settings?.footerText && (
            <Typography variant="caption" display="block" mb={0.5} sx={{ whiteSpace: 'pre-line' }}>
              {settings.footerText}
            </Typography>
          )}

          {settings?.customQR && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" display="block" mb={0.5}>
                {qrTitle}
              </Typography>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: 'grey.200',
                  mx: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="caption">QR</Typography>
              </Box>
              {!settings?.hideQRLink && settings?.qrLink && (
                <Typography variant="caption" display="block" mt={0.5}>
                  {settings.qrLink}
                </Typography>
              )}
            </Box>
          )}

          {settings?.webQR && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" display="block" mb={0.5}>
                {webQrTitle}
              </Typography>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: 'grey.200',
                  mx: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="caption">QR</Typography>
              </Box>
              {!settings?.hideWebQRLink && (
                <Typography variant="caption" display="block" mt={0.5}>
                  scan.example.com/123
                </Typography>
              )}
            </Box>
          )}

          {settings?.showSocialMedia && (
            <Box sx={{ mt: 1.5 }}>
              {socialMediaLines.length > 0 ? (
                socialMediaLines.map((line, index) => (
                  <Typography key={`social-line-${index}`} variant="caption" display="block">
                    {line}
                  </Typography>
                ))
              ) : (
                <Typography variant="caption" display="block">
                  Belum ada social media
                </Typography>
              )}
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" display="block" mt={2}>
            * Data preview ini hanya contoh
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
}
