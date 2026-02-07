'use client'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useInstore } from './hook/useInstore'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { Label } from '@mui/icons-material'

const BCrumb = [
  {
    to: '/',
    title: 'Home'
  },
  {
    title: 'Transaksi Baru'
  }
]

export const InstoreTransactionPage = () => {
  // Use the custom hook for all business logic
  const {
    // States
    customers,
    selectedCustomer,
    roomCount,
    roomDetails,
    roomTypes,
    checkInDate,
    checkOutDate,
    guestName,
    guestPhone,
    identityType,
    identityNumber,
    email,
    discountType,
    discountAmount,
    notes,
    loading,
    error,
    isSubmitting,
    isValid,
    snackbarOpen,
    snackbarMessage,
    nightCount,
    paymentMethod,
    referenceNumber,
    senderName,
    bankRecipient,
    cardType,
    approvalCode,
    traceNumber,
    uploadImage,
    banks,
    tenor,
    customTenor,
    roomNumbers,
    listRatePlan,
    allowedCheckInMin,
    minCheckOutDate,

    // Setters
    setSelectedCustomer,
    setCheckInDate,
    setCheckOutDate,
    setGuestName,
    setGuestPhone,
    setIdentityType,
    setIdentityNumber,
    setEmail,
    setNotes,
    setPaymentMethod,
    setReferenceNumber,
    setSenderName,
    setCardType,
    setApprovalCode,
    setTraceNumber,
    setTenor,
    setCustomTenor,

    // Functions
    formatCurrency,
    handleSnackbarClose,
    handleDiscountChange,
    handleChange,
    handleBankSelect,
    handleRoomCountChange,
    handleRoomDetailChange,
    resetForm,
    handleSubmit,
    getRootProps,
    getInputProps
  } = useInstore()

  return (
    <Box>
      {/* breadcrumb */}
      <Breadcrumb showBackButton={true} title="Transaksi Baru" items={BCrumb} />
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={4000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert onClose={handleSnackbarClose} severity="success">
              {snackbarMessage}
            </Alert>
          </Snackbar>
          <Grid item lg={12}>
            <Container maxWidth="xl" sx={{ mt: 4 }}>
              <Typography variant="h4" component="h1" color="textPrimary" gutterBottom>
                Pemesanan Walk In
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  required
                  fullWidth
                  label="Jumlah Kamar"
                  value={roomCount}
                  onChange={handleRoomCountChange}
                  margin="normal"
                  type="number"
                  inputProps={{ min: 1 }}
                />
                {roomCount > 1 && (
                  <>
                    <Typography variant="h6" component="h2" mt={2} gutterBottom>
                      Detail Kamar
                    </Typography>
                  </>
                )}
                {roomDetails.map((room, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      border: '1px solid #ccc',
                      padding: 2,
                      borderRadius: 1
                    }}
                  >
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Pilih Tipe Kamar</InputLabel>
                      <Select
                        required
                        value={room.roomType}
                        onChange={(e) => handleRoomDetailChange(index, 'roomType', e.target.value)}
                        disabled={loading}
                      >
                        <MenuItem value="">
                          <em>Pilih</em>
                        </MenuItem>
                        {!loading &&
                          roomTypes
                            .filter((type) => type.is_minibar === false)
                            .map((type) => (
                              <MenuItem key={type.id} value={type.guid}>
                                {type.product_name} | {formatCurrency(type.price_walkin)}
                              </MenuItem>
                            ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                      <InputLabel>Pilih Rate Plan</InputLabel>
                      <Select
                        required
                        value={room.ratePlan || ''}
                        onChange={(e) => handleRoomDetailChange(index, 'ratePlan', e.target.value)}
                        disabled={!room.roomType || loading}
                      >
                        <MenuItem value="">
                          <em>Pilih Rate Plan</em>
                        </MenuItem>
                        {listRatePlan
                          .filter((plan) => plan.room_type_id === room.roomType)
                          .map((plan) => (
                            <MenuItem key={plan.id} value={plan.id}>
                              {plan.name} |{' '}
                              {formatCurrency(parseFloat(plan.base_price || plan.baseprice))}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>

                    {/* Rate Plan Info Display */}
                    {room.ratePlan && (
                      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          Rate Plan Terpilih
                        </Typography>
                        <Typography variant="caption" display="block">
                          {listRatePlan.find((plan) => plan.id === room.ratePlan)?.name}
                        </Typography>
                        <Typography variant="h6" color="primary.main" sx={{ mt: 1 }}>
                          {formatCurrency(room.ratePlanPrice || 0)} / malam
                        </Typography>
                        {checkInDate && checkOutDate && nightCount > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Total: {formatCurrency((room.ratePlanPrice || 0) * nightCount)} untuk{' '}
                            {nightCount} malam
                          </Typography>
                        )}
                      </Box>
                    )}

                    <FormControl fullWidth margin="normal">
                      <InputLabel>Pilih Nomor Kamar</InputLabel>
                      <Select
                        required
                        value={room.roomNumber || ''}
                        onChange={(e) =>
                          handleRoomDetailChange(index, 'roomNumber', e.target.value)
                        }
                        disabled={!room.roomType}
                      >
                        <MenuItem value="">
                          <em>Pilih Nomor Kamar</em>
                        </MenuItem>
                        {roomNumbers.length > 0 ? (
                          roomNumbers
                            .filter((roomNumber) => [6, 15].includes(roomNumber.status_id)) // Filter kamar aktif
                            .map((roomNumber) => (
                              <MenuItem
                                key={roomNumber.guid}
                                value={roomNumber.guid}
                                disabled={roomDetails.some((r) => r.roomNumber === roomNumber.guid)} // Disable yang sudah dipilih
                              >
                                {roomNumber.room_no}
                              </MenuItem>
                            ))
                        ) : (
                          <MenuItem disabled>
                            <em>Tidak ada nomor kamar tersedia</em>
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>

                    <TextField
                      required
                      fullWidth
                      label="Jumlah Dewasa"
                      value={room.adultCount || ''}
                      onChange={(e) => handleRoomDetailChange(index, 'adultCount', e.target.value)}
                      margin="normal"
                      type="number"
                      inputProps={{ min: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="Jumlah Anak"
                      value={room.childCount || ''}
                      onChange={(e) => handleRoomDetailChange(index, 'childCount', e.target.value)}
                      margin="normal"
                      type="number"
                      inputProps={{ min: 0 }}
                    />

                    <FormControl fullWidth margin="normal">
                      <InputLabel>Breakfast</InputLabel>
                      <Select
                        value={room.breakfast || 'false'}
                        onChange={(e) => handleRoomDetailChange(index, 'breakfast', e.target.value)}
                      >
                        <MenuItem value="false">Tidak</MenuItem>
                        <MenuItem value="true">Ya</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                ))}

                {/* Date Fields */}
                <TextField
                  required
                  fullWidth
                  label="Tanggal Check-in"
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: allowedCheckInMin }}
                />

                <TextField
                  required
                  fullWidth
                  label="Tanggal Check-out"
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: minCheckOutDate }}
                />

                {/* Customer Selection */}
                <Autocomplete
                  fullWidth
                  options={customers}
                  getOptionLabel={(customer) => `${customer.full_name}`}
                  value={selectedCustomer}
                  onChange={(event, newValue) => setSelectedCustomer(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Pilih Customer (Optional)"
                      margin="normal"
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
                  loading={loading}
                  loadingText="Loading customers..."
                />

                {/* Guest Info Fields - Only show if no customer selected */}
                {!selectedCustomer && (
                  <>
                    <TextField
                      required
                      fullWidth
                      label="Nama Tamu"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      margin="normal"
                      variant="outlined"
                    />
                    <TextField
                      required
                      fullWidth
                      label="No. Telepon"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      margin="normal"
                      variant="outlined"
                    />
                    <TextField
                      fullWidth
                      label="Email (Optional)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      margin="normal"
                      type="email"
                      variant="outlined"
                    />
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Jenis Identitas</InputLabel>
                      <Select
                        required
                        value={identityType}
                        onChange={(e) => setIdentityType(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>Pilih Jenis Identitas</em>
                        </MenuItem>
                        <MenuItem value="ktp">KTP</MenuItem>
                        <MenuItem value="sim">SIM</MenuItem>
                        <MenuItem value="passport">Passport</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      required
                      fullWidth
                      label="Nomor Identitas"
                      value={identityNumber}
                      onChange={(e) => setIdentityNumber(e.target.value)}
                      margin="normal"
                      variant="outlined"
                    />
                  </>
                )}

                {/* Notes */}
                <TextField
                  fullWidth
                  label="Catatan (Optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  margin="normal"
                  multiline
                  rows={3}
                  variant="outlined"
                />

                {/* Discount Section */}
                <FormControl fullWidth margin="normal">
                  <InputLabel>Jenis Diskon</InputLabel>
                  <Select value={discountType} onChange={handleDiscountChange}>
                    <MenuItem value="">
                      <em>Tanpa Diskon</em>
                    </MenuItem>
                    <MenuItem value="percentage">Persentase (%)</MenuItem>
                    <MenuItem value="nominal">Nominal (Rp)</MenuItem>
                  </Select>
                </FormControl>

                {discountType && (
                  <TextField
                    fullWidth
                    label={`Jumlah Diskon ${discountType === 'percentage' ? '(%)' : '(Rp)'}`}
                    value={discountAmount}
                    onChange={handleChange}
                    margin="normal"
                    variant="outlined"
                  />
                )}

                {/* Payment Method */}
                <FormControl fullWidth margin="normal">
                  <InputLabel>Metode Pembayaran</InputLabel>
                  <Select
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Pilih Metode Pembayaran</em>
                    </MenuItem>
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="debit_credit">Debit/Credit Card</MenuItem>
                    <MenuItem value="cicilan">Cicilan</MenuItem>
                  </Select>
                </FormControl>

                {/* Payment Method Specific Fields */}
                {paymentMethod === 'Cash' && (
                  <TextField
                    required
                    fullWidth
                    label="Nama Penyetor"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    margin="normal"
                    variant="outlined"
                  />
                )}

                {paymentMethod === 'bank_transfer' && (
                  <>
                    <TextField
                      required
                      fullWidth
                      label="Nomor Referensi"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      margin="normal"
                      variant="outlined"
                    />
                    <TextField
                      required
                      fullWidth
                      label="Nama Pengirim"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      margin="normal"
                      variant="outlined"
                    />
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Bank Tujuan</InputLabel>
                      <Select required value={bankRecipient} onChange={handleBankSelect}>
                        <MenuItem value="">
                          <em>Pilih Bank</em>
                        </MenuItem>
                        {banks.map((bank) => (
                          <MenuItem key={bank.id} value={bank.id}>
                            {bank.name} - {bank.account_no}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Label htmlFor="transfer-proof">Bukti Transfer</Label>
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
                      <p>Drag &apos;n&apos; drop some files here, or click to select files</p>
                    </Box>
                    {uploadImage && (
                      <Box mt={2} textAlign="center">
                        <p>File: {uploadImage.name}</p>
                        <img
                          src={URL.createObjectURL(uploadImage)}
                          alt="Uploaded preview"
                          style={{
                            width: '100%',
                            maxWidth: '300px',
                            height: 'auto'
                          }}
                        />
                      </Box>
                    )}
                  </>
                )}

                {paymentMethod === 'debit_credit' && (
                  <>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Tipe Kartu Pembayaran</InputLabel>
                      <Select
                        required
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value)}
                      >
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

                    <Label htmlFor="card-receipt">Bukti Struk</Label>
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
                      <p>Drag &apos;n&apos; drop some files here, or click to select files</p>
                    </Box>
                    {uploadImage && (
                      <Box mt={2} textAlign="center">
                        <p>File: {uploadImage.name}</p>
                        <img
                          src={URL.createObjectURL(uploadImage)}
                          alt="Uploaded preview"
                          style={{
                            width: '100%',
                            maxWidth: '300px',
                            height: 'auto'
                          }}
                        />
                      </Box>
                    )}
                  </>
                )}

                {paymentMethod === 'cicilan' && (
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
                        disableUnderline: true
                      }}
                    />
                  </FormControl>
                )}
              </form>
            </Container>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} mt={3}>
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid || isSubmitting}
            onClick={handleSubmit}
            color="primary"
          >
            {isSubmitting ? 'Proses...' : 'Pesan Sekarang'}
          </Button>
          <Button variant="outlined" color="error" onClick={resetForm}>
            Cancel
          </Button>
        </Stack>
        {error && (
          <Typography color="error" mt={2}>
            {error}
          </Typography>
        )}
      </form>
    </Box>
  )
}
