import React, { useRef } from 'react'
import { Button, Box, Typography, Dialog, DialogContent } from '@mui/material'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import PropTypes from 'prop-types'

export const BreakfastVoucher = ({ data }) => {
  const [open, setOpen] = React.useState(false)
  const printRef = useRef()

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML
    const originalContents = document.body.innerHTML

    document.body.innerHTML = printContents
    window.print()
    document.body.innerHTML = originalContents
    window.location.reload()
  }

  const now = new Date()
  const formattedDateTime = now.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

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
          <b>Voucher Breakfast</b>
        </p>
        <p style={{ marginTop: '-10px' }}>Nomor Kamar : {data.transaction_item?.no_room}</p>
        <p
          style={{
            marginTop: '-12px'
          }}
        >
          Jumlah Pax : {data.pax}
        </p>
        <p
          style={{
            marginTop: '-12px'
          }}
        >
          Dicetak : {userData?.full_name}
        </p>
        <p
          style={{
            marginTop: '-12px'
          }}
        >
          Cetak : {formattedDateTime}
        </p>
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

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <QRCodeSVG value={data.guid} size={120} level="H" includeMargin />
        </div>

        <p
          style={{
            marginTop: '20px',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}
          className="thank-you"
        >
          Nikmati sarapan lezat yang telah disiapkan khusus untuk Anda. Pastikan jumlah pax sesuai
          dengan tamu yang terdaftar.
        </p>
      </div>
      <Box sx={{ ml: 'auto !important' }}>
        <Button variant="text" color="primary" onClick={() => setOpen(true)}>
          Cetak QR
        </Button>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Voucher Breakfast
            </Typography>
            <QRCodeCanvas value={`${data.guid}`} size={180} level="H" includeMargin />
            <Typography variant="body1" mt={2}>
              Nama: {data.transaction_item?.account_name}
            </Typography>
            <Typography variant="body2">
              Nomor Kamar: {data.transaction_item?.no_room} • Pax: {data.pax}
            </Typography>
            {data.transaction_item?.note && (
              <Typography variant="caption">Catatan: {data.transaction_item?.note}</Typography>
            )}
          </Box>
          <Box
            sx={{ textAlign: 'center', mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            <Button variant="contained" color="primary" onClick={handlePrint}>
              Print Voucher
            </Button>
            <Button
              variant="outlined"
              color="success"
              onClick={() => {
                // const message = `Halo, berikut adalah detail Voucher Breakfast:%0A%0ANama: ${data.transaction_item.account_name}%0ANomor Kamar: ${data.transaction_item.no_room}%0APax: ${data.pax}%0A%0ALink QR/ID: ${data.guid}`;
                // const phoneNumber = ''; // masukkan nomor WhatsApp di sini, misal '6281234567890'
                // window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
              }}
            >
              Kirim ke WhatsApp
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

BreakfastVoucher.propTypes = {
  data: PropTypes.shape({
    guid: PropTypes.string.isRequired,
    pax: PropTypes.number,
    transaction_item: PropTypes.shape({
      no_room: PropTypes.string,
      account_name: PropTypes.string,
      note: PropTypes.string
    })
  }).isRequired
}
