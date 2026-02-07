/* eslint-disable react/prop-types */
import {
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Divider,
  Typography,
  Box,
  Grid,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DialogActions,
  CircularProgress
} from '@mui/material'
import { useState } from 'react'
import IconEye from '@mui/icons-material/Visibility' // Or replace with a custom eye icon if needed
import CloseIcon from '@mui/icons-material/Close'
import axios from 'axios'
import { useDropzone } from 'react-dropzone'
import Receipt from './Receipt'
import CO from './CO'
import TransactionService from '@renderer/services/transactionService'
import { Label } from '@mui/icons-material'

// eslint-disable-next-line react/prop-types
export const TransactionDialog = ({ transactionId, transaction, products, loading, fetchData }) => {
  const transactionService = TransactionService()
  const [open, setOpen] = useState(false) // Modal closed by default
  const [addItemOpen, setAddItemOpen] = useState(false) // Add item dialog
  const [newItem, setNewItem] = useState({ product_guid: '', qty: 1 }) // New item state
  const [selectedProduct, setSelectedProduct] = useState(null)

  const [openPaymentDialog, setOpenPaymentDialog] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState('')

  const [referenceNumber, setReferenceNumber] = useState('')
  const [senderName, setSenderName] = useState('')
  const [bankRecipient, setBankRecipient] = useState('')
  const [, setBankRecipientName] = useState('')
  const [, setBankAccountRecipient] = useState('')
  const [approvalCode, setApprovalCode] = useState('')
  const [traceNumber, setTraceNumber] = useState('')
  const [, setAttachmentUrl] = useState('')
  const [uploadImage, setUploadImage] = useState(null)

  const [banks] = useState([])
  const [tenor, setTenor] = useState('')
  const [customTenor, setCustomTenor] = useState('')
  const [error, setError] = useState('')
  const [cardType, setCardType] = useState('')
  const [change, setChange] = useState(0)

  // Fungsi untuk membuka dialog pemilihan pembayaran
  const handleOpenPaymentDialog = () => {
    setOpenPaymentDialog(true)
  }

  const { getRootProps, getInputProps } = useDropzone({
    accept: 'image/*', // Specify file types you want to accept
    onDrop: async (acceptedFiles) => {
      setUploadImage(acceptedFiles[0])
      const formData = new FormData()
      acceptedFiles.forEach((file) => {
        formData.append('files', file)
      })

      // Upload files to the server
      try {
        const response = await axios.post('/api/media-service/upload/receipt', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        console.log(response.data.data)

        // Assuming the response contains the URL of the uploaded file
        setAttachmentUrl(response.data.data.download.actual)
        // setSuccessMessage('File uploaded successfully!');
      } catch (error) {
        let errorMessage = 'An unexpected error occurred. Please try again later.' // Default error message

        // Check if the error response exists and contains the expected structure
        if (
          error.response &&
          error.response.data &&
          error.response.data.data &&
          error.response.data.data.message
        ) {
          errorMessage = error.response.data.data.message // Extract the error message
        } else if (error.response && error.response.data && error.response.data.message) {
          // If the message is in a different structure, fallback to that
          errorMessage = error.response.data.message
        }

        // Optionally, set an error state for further processing
        setError(errorMessage)

        // If you want to log the full error for debugging (this is optional)
        console.error('Error during API request:', error)
      }
    }
  })

  const handleBankSelect = (event) => {
    const selectedBankId = event.target.value
    console.log(selectedBankId, 'selected bank id') // Logs the selected bank's id

    // Find the selected bank object based on the bank id
    const selectedBank = banks.find((bank) => bank.id === selectedBankId)

    if (selectedBank) {
      setBankRecipient(selectedBank.id) // Set bank name
      setBankRecipientName(selectedBank.name) // Set bank name
      setBankAccountRecipient(selectedBank.account_no) // Set bank account number
    }
  }

  const [amountPaid, setAmountPaid] = useState('')

  // Fungsi untuk menutup dialog pemilihan pembayaran
  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false)
    setSelectedPayment('')
  }

  const handleUpdatePayment = async () => {
    let requestBody = {
      status: 'PAID',
      paid_by: selectedPayment,
      paid_cash: amountPaid,
      return_cash: change
    }

    requestBody = Object.fromEntries(
      Object.entries(requestBody).filter(([key, value]) => {
        if (key === 'paid_cash' || key === 'return_cash') {
          return value >= 0
        }
        return value !== null && value !== undefined && value !== ''
      })
    )

    try {
      await transactionService.updateTransaction(transaction.guid, requestBody)
    } catch (error) {
      console.error('Error updating payment:', error)
    } finally {
      await fetchData()
      handleClosePaymentDialog()
    }
  }

  const handleClickOpen = () => {
    setOpen(true) // Open the dialog when the button is clicked
  }

  const handleClose = () => {
    setOpen(false) // Close the dialog
  }

  const handleDetail = (guid) => {
    window.location.href = `/transaction/detail/${guid}`
  }

  const formatNumber = (amount) => {
    return new Intl.NumberFormat('id-ID').format(amount) // Using 'id-ID' for Indonesian formatting
  }

  const handleAddItemOpen = () => {
    setAddItemOpen(true)
  }

  const handleAddItemClose = () => {
    setAddItemOpen(false)
  }

  const handleNewItemChange = (e) => {
    const { name, value } = e.target
    setNewItem((prev) => ({ ...prev, [name]: value }))
  }

  const handleAmountPaidChange = (event) => {
    const inputValue = event.target.value

    let formattedValue = formatNominal(inputValue)
    setChange(parseCurrencyToInt(inputValue) - transaction.grand_total)

    setAmountPaid(formattedValue)
  }

  const handleAddItemSubmit = async () => {
    const products = [
      {
        product_id: newItem.product_guid,
        qty: newItem.qty.toString()
      }
    ]

    try {
      await transactionService.addTransactionItem(transactionId, products)
      await fetchData()
      handleAddItemClose()
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  const statusMapping = {
    PAID: 'Lunas',
    EXPIRED: 'Batal',
    CANCEL: 'Batal',
    SUBMIT: 'Belum Bayar'
  }

  const parseCurrencyToInt = (currencyStr) => {
    // Remove the currency symbol and any whitespace
    const cleanedString = currencyStr.replace(/[^0-9]/g, '') // Remove non-digit characters
    return parseInt(cleanedString, 10) // Convert to integer
  }

  function convertDate(dateString) {
    // Create a Date object from the input string
    const dateObject = new Date(dateString)

    // Format the date to DD/MM/YYYY
    const formattedDate = `${String(dateObject.getDate()).padStart(2, '0')}/${String(dateObject.getMonth() + 1).padStart(2, '0')}/${dateObject.getFullYear()}`

    // Format the time to HH:mm:ss
    const hours = String(dateObject.getHours()).padStart(2, '0')
    const minutes = String(dateObject.getMinutes()).padStart(2, '0')
    const seconds = String(dateObject.getSeconds()).padStart(2, '0')

    // Combine date and time
    return `${formattedDate} ${hours}:${minutes}:${seconds}`
  }

  const formatNominal = (value) => {
    const cleanValue = value.replace(/[^0-9]/g, '') // Remove non-digit characters
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cleanValue)
  }

  return (
    <div>
      {/* Tooltip with IconButton */}
      <Tooltip title="View">
        <IconButton
          color="primary"
          onClick={handleClickOpen} // Open the transaction dialog
        >
          <IconEye width={22} />
        </IconButton>
      </Tooltip>

      {/* Transaction Detail Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <Box display="flex" alignItems="center" justifyContent="space-between" pt={2} pr={2} pl={2}>
          <DialogTitle sx={{ padding: 0 }}>Detail Transaksi</DialogTitle>
          <IconButton color="inherit" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box display="flex" alignItems="center" justifyContent="flex-end" pt={2} pr={2} pl={2}>
          <Receipt data={transaction} />
          <CO data={transaction} />
          {localStorage.getItem('outletCategoryId') === '1' && (
            <IconButton color="success" onClick={() => handleDetail(transaction.guid)}>
              <IconEye />
            </IconButton>
          )}
        </Box>
        <DialogContent style={{ minWidth: '600px' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={9}>
              {' '}
              {/* First column: Email input */}
              <TextField label="Masukan Email" fullWidth variant="outlined" margin="normal" />
            </Grid>
            <Grid item xs={12} md={3} mt={2}>
              {' '}
              {/* Second column: Button */}
              <Button
                fullWidth
                style={{ height: '45px' }}
                variant="contained"
                mt={3}
                color="primary"
              >
                Kirim Struk
              </Button>
            </Grid>
          </Grid>
          {/* <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <div>
                            <strong>{transaction?.outlet?.outlet_name}</strong>
                        </div>
                        <div>{transaction?.outlet?.phone}</div>
                    </div> */}
          <Box mt={1} mb={1}>
            <Typography variant="h6" mb={1} mt={2}>
              <strong>Detail Pembelian</strong>
            </Typography>
            <Divider />
            <Box display="flex" justifyContent="space-between" mt={1}>
              <Box flex={1} mr={1}>
                <Typography variant="body1" mb={0.5}>
                  Waktu Transaksi
                </Typography>
                <Typography variant="body1" mb={0.5}>
                  ID Transaksi
                </Typography>
                {/* <Typography variant="body1">Pelanggan: #222</Typography> */}
                {localStorage.getItem('outletCategoryId') == 1 && (
                  <Typography variant="body1" mb={0.5}>
                    Channel
                  </Typography>
                )}
                <Typography variant="body1" mb={0.5}>
                  Metode Pembayaran
                </Typography>
                <Typography variant="body1" mb={0.5}>
                  Status
                </Typography>
                <Typography variant="body1" mb={0.5}>
                  Catatan
                </Typography>
              </Box>
              <Box flex={1} ml={1} display="flex" flexDirection="column" alignItems="flex-end">
                <Typography variant="body1" mb={0.5}>
                  {transaction.created_at
                    ? convertDate(transaction.created_at)
                    : convertDate(transaction.booking_date) || '-'}
                </Typography>
                <Typography variant="body1" mb={0.5}>
                  {transaction.transaction_no ||
                    transaction.ticket?.transaction?.transaction_no ||
                    '-'}
                </Typography>
                {localStorage.getItem('outletCategoryId') == 1 && (
                  <Typography variant="body1" mb={0.5}>
                    {transaction.channel}
                  </Typography>
                )}
                <Typography variant="body1" mb={0.5}>
                  {(transaction.paid_by === 'cashless' && transaction.status === 'SUBMIT') ||
                  (transaction.ticket?.transaction?.paid_by === 'cashless' &&
                    transaction.ticket?.transaction?.status === 'SUBMIT')
                    ? '-'
                    : transaction.paid_by || transaction.ticket?.transaction?.paid_by || '-'}
                </Typography>
                <Typography variant="body1" mb={0.5}>
                  {statusMapping[transaction?.status] || 'Status Tidak Diketahui'}
                </Typography>
                <Typography variant="body1" mb={0.5}>
                  {transaction.notes || transaction.ticket?.transaction?.notes || '-'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          <Box mt={1} mb={1}>
            {transaction.transaction_item.map((x, index) => (
              <Box mt={1} mb={1} key={index}>
                <Typography variant="body1">
                  <strong>{x.name}</strong>
                </Typography>
                <Box display="flex" justifyContent="space-between">
                  <Box flex={1} mr={1}>
                    <Typography mt={0.5} variant="body1">
                      {x.qty}x @{formatNumber(x.price)}
                    </Typography>
                  </Box>
                  <Box flex={1} ml={1} display="flex" flexDirection="column" alignItems="flex-end">
                    <Typography mb={0.5} variant="body1">
                      {' '}
                      {formatNumber(x.sub_total)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          <Divider mt={2} />

          <Box mt={2} mb={1}>
            <Box display="flex" justifyContent="space-between" mt={1}>
              <Box flex={1} mr={1}>
                <Typography variant="body1" mb={0.5}>
                  Subtotal
                </Typography>
                <Typography variant="body1" mb={0.5}>
                  Pajak
                </Typography>
                <Typography variant="body1" mb={0.5}>
                  Diskon
                </Typography>
                {/* <Typography variant="body1">Redeem Poin</Typography> */}
              </Box>
              <Box flex={1} ml={1} display="flex" flexDirection="column" alignItems="flex-end">
                <Typography variant="body1" mb={0.5}>
                  {' '}
                  {transaction.sub_total
                    ? formatNumber(transaction.sub_total)
                    : formatNumber(transaction?.ticket?.transaction?.sub_total)}
                </Typography>
                <Typography variant="body1" mb={0.5}>
                  {transaction.tax && !isNaN(transaction.tax)
                    ? formatNumber(transaction.tax)
                    : transaction?.ticket?.transaction?.tax &&
                        !isNaN(transaction?.ticket?.transaction?.tax)
                      ? formatNumber(transaction?.ticket?.transaction?.tax)
                      : '-'}
                </Typography>

                <Typography variant="body1" mb={0.5}>
                  {' '}
                  {transaction.discount_nominal
                    ? formatNumber(transaction.discount_nominal)
                    : transaction?.ticket?.transaction?.discount_nominal}
                </Typography>
                {/* <Typography variant="body1"> 8.000</Typography> */}
              </Box>
            </Box>
          </Box>

          <Divider mt={2} />

          <Box mt={1}>
            <Box display="flex" justifyContent="space-between" mt={1}>
              <Box flex={1} mr={1}>
                <Typography variant="body1">
                  <strong>Grand Total</strong>
                </Typography>
              </Box>
              <Box flex={1} ml={1} display="flex" flexDirection="column" alignItems="flex-end">
                <Typography variant="body1" color="textPrimary">
                  <strong>{formatNumber(transaction.grand_total)}</strong>
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box display="flex" justifyContent="space-between" mt={4}>
            {transaction.status === 'SUBMIT' && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleAddItemOpen}
                style={{ marginTop: '20px', width: '130px', height: '40px' }}
              >
                Tambah Item
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenPaymentDialog}
              style={{ marginTop: '20px', width: '130px', height: '40px' }}
            >
              Update
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog}>
        <DialogTitle>Pilih Metode Pembayaran</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel>Metode Pembayaran</InputLabel>
            <Select value={selectedPayment} onChange={(e) => setSelectedPayment(e.target.value)}>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="bank_transfer">Transfer Bank</MenuItem>
              <MenuItem value="debit_credit">Credit Card</MenuItem>
            </Select>
          </FormControl>

          {selectedPayment === 'Cash' && (
            <>
              <TextField
                fullWidth
                label="Bayar"
                variant="outlined"
                value={amountPaid}
                onChange={handleAmountPaidChange}
                sx={{ mt: 2 }} // Menggunakan sx untuk margin-top
              />
              <Typography variant="h6" mt={2}>
                Kembali:
              </Typography>
              <Typography variant="h6" color="primary">
                Rp {change ?? 0}
              </Typography>
            </>
          )}

          {selectedPayment === 'bank_transfer' && (
            <>
              <TextField
                fullWidth
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
                onChange={(e) => setSenderName(e.target.value)}
                margin="normal"
                variant="outlined"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Bank Penerima</InputLabel>
                <Select value={bankRecipient} onChange={handleBankSelect} displayEmpty>
                  {/* If still loading, show a loading spinner */}
                  {loading ? (
                    <MenuItem value="" disabled>
                      <CircularProgress size={24} />
                    </MenuItem>
                  ) : // Map over the banks data and create MenuItem for each bank
                  Array.isArray(banks) && banks.length > 0 ? (
                    banks.map((bank) => (
                      <MenuItem key={bank.id} value={bank.id}>
                        {' '}
                        {/* Use the bank.id here */}
                        {bank.name} - {bank.account_no}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No banks available
                    </MenuItem>
                  )}

                  {/* Optionally display error message if there's an error */}
                  {error && (
                    <MenuItem value="" disabled>
                      {error}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              <Label htmlFor="username">Bukti Transfer</Label>
              <Box
                mt={0}
                fontSize="12px"
                sx={{
                  backgroundColor: 'primary.light',
                  color: 'primary.main',
                  padding: '30px',
                  textAlign: 'center',
                  border: `1px dashed`,
                  borderColor: 'primary.main'
                }}
                {...getRootProps({ className: 'dropzone' })}
              >
                <input {...getInputProps()} />
                <p>Drag n drop some files here, or click to select files</p>
              </Box>
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

          {selectedPayment === 'debit_credit' && (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>Tipe Kartu Pembayaran</InputLabel>
                <Select required value={cardType} onChange={(e) => setCardType(e.target.value)}>
                  <MenuItem value="debit">Debit</MenuItem>
                  <MenuItem value="credit">Kredit</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Approval Code"
                value={approvalCode}
                onChange={(e) => setApprovalCode(e.target.value)}
                margin="normal"
                variant="outlined"
              />
              <TextField
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

              <Label htmlFor="username">Bukti Struk</Label>
              <Box
                mt={0}
                fontSize="12px"
                sx={{
                  backgroundColor: 'primary.light',
                  color: 'primary.main',
                  padding: '30px',
                  textAlign: 'center',
                  border: `1px dashed`,
                  borderColor: 'primary.main'
                }}
                {...getRootProps({ className: 'dropzone' })}
              >
                <input {...getInputProps()} />
                <p>Drag n drop some files here, or click to select files</p>
              </Box>
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

          {selectedPayment === 'cicilan' && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Tenor</InputLabel>
              <Select value={tenor} onChange={(e) => setTenor(e.target.value)}>
                <MenuItem value="">
                  <em>Pilih Tenor</em>
                </MenuItem>
                <MenuItem value="1">1</MenuItem>
                <MenuItem value="2">2</MenuItem>
                <MenuItem value="3">3</MenuItem>
                <MenuItem value="6">6</MenuItem>
                <MenuItem value="12">12</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
          )}
          {tenor === 'custom' && (
            <FormControl fullWidth margin="normal">
              <TextField
                type="number"
                value={customTenor}
                onChange={(e) => setCustomTenor(e.target.value)}
                placeholder="Masukkan tenor bayar"
                min={1}
                fullWidth
                margin="normal"
                InputProps={{
                  disableUnderline: true // Optional: removes underline for a cleaner look
                }}
              />
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUpdatePayment} variant="contained" color="primary">
            Simpan
          </Button>
          <Button onClick={handleClosePaymentDialog} color="secondary">
            Batal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog
        open={addItemOpen}
        onClose={handleAddItemClose}
        PaperProps={{ style: { width: '400px' } }}
      >
        <DialogTitle>Tambah Item</DialogTitle>
        <DialogContent>
          <Autocomplete
            value={selectedProduct}
            onChange={(event, newValue) => {
              // Set the selected product and the product_guid
              setSelectedProduct(newValue)
              setNewItem((prev) => ({
                ...prev,
                product_guid: newValue ? newValue.guid : '' // Set the product_guid based on selection
              }))
            }}
            options={products}
            getOptionLabel={(option) =>
              option.name + ' - Rp ' + formatNumber(option.price_walkin) || ''
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            loading={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Pilih Produk"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />
          <TextField
            label="Jumlah"
            name="qty"
            type="number"
            value={newItem.qty}
            onChange={handleNewItemChange}
            fullWidth
            variant="outlined"
            margin="normal"
          />
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button variant="contained" color="primary" onClick={handleAddItemSubmit}>
              Tambah
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  )
}
