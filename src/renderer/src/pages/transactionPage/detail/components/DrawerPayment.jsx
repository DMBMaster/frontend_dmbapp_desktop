import React from 'react'
import {
  Drawer,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Button,
  CircularProgress,
  Box
} from '@mui/material'
import { useDropzone } from 'react-dropzone'
import PropTypes from 'prop-types'
import ComponentService from '@renderer/services/componentService'
import MediaService from '@renderer/services/mediaService'
import { useNotifier } from '@renderer/components/core/NotificationProvider'

export const AddPaymentDrawer = ({ guid, fetchData, open, onClose, balanceDue }) => {
  const notifier = useNotifier()
  const componentService = ComponentService()
  const mediaService = MediaService()
  const [price, setPrice] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [loadingSubmit, setLoadingSubmit] = React.useState(false)
  const [paymentMethod, setPaymentMethod] = React.useState('Cash')
  const [cardType, setCardType] = React.useState('')
  const [approvalCode, setApprovalCode] = React.useState('')
  const [traceNumber, setTraceNumber] = React.useState('')
  const [referenceNumber, setReferenceNumber] = React.useState('')
  const [uploadImage, setUploadImage] = React.useState(null)
  const [senderName, setSenderName] = React.useState('')
  const [bankRecipient, setBankRecipient] = React.useState('')
  const [bankOptions, setBankOptions] = React.useState([])
  const [attatchmentUrl, setAttachmentUrl] = React.useState('')

  const handlePaymentMethodChange = (event) => {
    console.log(event.target.value)
    setPaymentMethod(event.target.value)
  }

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Remove non-digit characters
    setPrice(value)
  }

  const handleAddItem = async () => {
    if (isFormValid()) {
      try {
        setLoadingSubmit(true)

        const newItem = {
          transaction_id: guid,
          type: paymentMethod === 'deposit' ? 'OUT' : 'IN',
          payment_method: paymentMethod,
          amount: price,
          notes: notes,
          reference_number: referenceNumber,
          sender_name: senderName,
          bank_name: bankRecipient,
          receipt: attatchmentUrl ? uploadImage.name : ''
        }

        await componentService.addPayment(newItem)
        console.log('Payment added successfully')
        fetchData()
        onClose()
      } catch (err) {
        console.error('Error adding payment:', err)
        alert('Failed to add payment')
      } finally {
        setLoadingSubmit(false)
      }
    } else {
      alert('Please fill out all required fields.')
    }
  }

  React.useEffect(() => {
    const fetchBankOptions = async () => {
      try {
        const response = await componentService.getPaymentMethods()
        setBankOptions(response.data)
      } catch (error) {
        console.error('Error fetching bank options:', error)
      }
    }

    fetchBankOptions()
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    accept: 'image/*',
    onDrop: async (acceptedFiles) => {
      setUploadImage(acceptedFiles[0])
      try {
        const result = await mediaService.uploadReceipt(acceptedFiles[0])
        setAttachmentUrl(result.url)
        notifier.show({
          message: 'File uploaded successfully',
          description: 'Receipt uploaded successfully',
          severity: 'success'
        })
      } catch (error) {
        notifier.show({
          message: 'Error uploading file',
          description: `There was an error uploading the receipt. ${error.message}`,
          severity: 'error'
        })
      }
    }
  })

  const isFormValid = () => {
    if (!price || price <= 0) return false

    if (paymentMethod === 'bank_transfer') {
      return referenceNumber && senderName && bankRecipient && uploadImage
    } else if (paymentMethod === 'debit_credit') {
      return cardType && approvalCode && traceNumber && referenceNumber && uploadImage
    }
    return true
  }

  const formatNumber = (amount) => {
    return new Intl.NumberFormat('id-ID').format(amount)
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <div style={{ width: 500, padding: 20 }}>
        <Typography variant="h6" gutterBottom>
          ADD PAYMENT
        </Typography>
        <Typography variant="h6" gutterBottom>
          Balance Due: Rp {formatNumber(balanceDue)}
        </Typography>
        {/* Category Dropdown */}
        <FormControl fullWidth margin="normal" disabled={false}>
          <InputLabel>Payment Type</InputLabel>
          <Select
            value={paymentMethod}
            onChange={handlePaymentMethodChange}
            label="Pilih Pembayaran"
          >
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="deposit">Deposit</MenuItem>
            <MenuItem value="bank_transfer">Transfer</MenuItem>
            <MenuItem value="debit_credit">Credit Card</MenuItem>
          </Select>
        </FormControl>

        {paymentMethod === 'bank_transfer' && (
          <>
            <TextField
              fullWidth
              required
              label="Nomor Referensi"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              margin="normal"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Nama Pengirim"
              value={senderName}
              required
              onChange={(e) => setSenderName(e.target.value)}
              margin="normal"
              variant="outlined"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Bank Penerima</InputLabel>
              <Select
                required
                value={bankRecipient}
                onChange={(e) => setBankRecipient(e.target.value)}
              >
                {bankOptions.map((bank) => (
                  <MenuItem key={bank.id} value={bank.account_no}>
                    {bank.name} - {bank.account_no}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <InputLabel sx={{ ml: 1.5, mt: 1 }}>Bukti Struk</InputLabel>
            <FormControl fullWidth margin="normal">
              <Box
                mt={0}
                fontSize="12px"
                sx={{
                  backgroundColor: 'primary.light',
                  color: 'primary.main',
                  padding: '30px',
                  textAlign: 'center',
                  border: `1px dashed`,
                  display: 'block',
                  borderColor: 'primary.main'
                }}
                {...getRootProps({ className: 'dropzone' })}
              >
                <input {...getInputProps()} />
                <p>Drag and drop some files here, or click to select files</p>
              </Box>
            </FormControl>
            {uploadImage && (
              <Box mt={2} textAlign="center">
                <p>File: {uploadImage.name}</p>
                <img
                  src={URL.createObjectURL(uploadImage)}
                  alt="Uploaded preview"
                  style={{ width: '100%', maxWidth: '300px', height: 'auto' }} // Adjust the size as needed
                />
              </Box>
            )}
          </>
        )}

        {/* Conditional Fields for Debit/Credit */}
        {paymentMethod === 'debit_credit' && (
          <>
            <FormControl fullWidth margin="normal">
              <InputLabel>Tipe Kartu Pembayaran</InputLabel>
              <Select required value={cardType} onChange={(e) => setCardType(e.target.value)}>
                <MenuItem value="debit">Debit</MenuItem>
                <MenuItem value="credit">Kredit</MenuItem>
              </Select>
            </FormControl>
            <TextField
              required
              fullWidth
              label="Approval Code"
              value={approvalCode}
              onChange={(e) => setApprovalCode(e.target.value)}
              margin="normal"
              variant="outlined"
            />
            <TextField
              required
              fullWidth
              label="Seri Trace"
              value={traceNumber}
              onChange={(e) => setTraceNumber(e.target.value)}
              margin="normal"
              variant="outlined"
            />
            <TextField
              fullWidth
              required
              label="Nomor Referensi"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              margin="normal"
              variant="outlined"
            />

            <InputLabel sx={{ ml: 1.5, mt: 1 }}>Bukti Struk</InputLabel>
            <FormControl fullWidth margin="normal">
              <Box
                mt={0}
                fontSize="12px"
                sx={{
                  backgroundColor: 'primary.light',
                  color: 'primary.main',
                  padding: '30px',
                  textAlign: 'center',
                  border: `1px dashed`,
                  display: 'block',
                  borderColor: 'primary.main'
                }}
                {...getRootProps({ className: 'dropzone' })}
              >
                <input {...getInputProps()} />
                <p>Drag and drop some files here, or click to select files</p>
              </Box>
            </FormControl>
            {uploadImage && (
              <Box mt={2} textAlign="center">
                <p>File: {uploadImage.name}</p>
                <img
                  src={URL.createObjectURL(uploadImage)}
                  alt="Uploaded preview"
                  style={{ width: '100%', maxWidth: '300px', height: 'auto' }} // Adjust the size as needed
                />
              </Box>
            )}
          </>
        )}

        {/* Price Field */}
        <TextField
          fullWidth
          margin="normal"
          label="Amount"
          type="text" // Use text to allow formatted display
          value={formatNumber(price)} // Format number for display
          onChange={handleChange} // Handle raw input
        />

        {/* Notes Field */}
        <TextField
          fullWidth
          margin="normal"
          label="Notes"
          multiline
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Actions */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddItem}
            disabled={loadingSubmit || !isFormValid()}
          >
            {loadingSubmit ? <CircularProgress size={24} /> : 'Tambah'}
          </Button>
          <Button variant="outlined" onClick={onClose}>
            Batal
          </Button>
        </div>
      </div>
    </Drawer>
  )
}

AddPaymentDrawer.propTypes = {
  guid: PropTypes.string.isRequired,
  fetchData: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  balanceDue: PropTypes.number.isRequired
}
