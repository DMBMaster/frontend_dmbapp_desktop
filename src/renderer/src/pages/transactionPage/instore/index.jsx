import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { CloudUpload, NightsStay } from '@mui/icons-material'
import { useInstore } from './hook/useInstore'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import BlankCard from '@renderer/components/ui/BlankCard'

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Transaksi Baru' }]

// eslint-disable-next-line react/prop-types
const FieldLabel = ({ children, required }) => (
  <Typography
    variant="caption"
    fontWeight={600}
    color={required ? 'primary.main' : 'text.secondary'}
    display="block"
    mb={0.5}
    sx={{ fontSize: '0.72rem', letterSpacing: 0.3 }}
  >
    {required && (
      <Box component="span" sx={{ color: 'error.main', mr: 0.25, fontWeight: 700 }}>
        *
      </Box>
    )}
    {children}
  </Typography>
)

// eslint-disable-next-line react/prop-types
const SectionCard = ({ title, children }) => (
  <BlankCard
    sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      overflow: 'hidden',
      width: '100%',
      boxSizing: 'border-box'
    }}
  >
    <Box
      sx={{
        px: 2.5,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'grey.50',
        flexShrink: 0,
        borderLeft: '3px solid',
        borderLeftColor: 'primary.main'
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} color="text.primary">
        {title}
      </Typography>
    </Box>
    <Box
      sx={{
        p: 2.5,
        flexGrow: 1,
        '& .MuiSelect-select': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: '0 !important',
          width: '100%',
          boxSizing: 'border-box'
        },
        '& .MuiOutlinedInput-root': { minWidth: '0 !important', width: '100%' },
        '& .MuiFormControl-root': { width: '100%', minWidth: '0 !important' },
        '& .MuiAutocomplete-root': { width: '100%' },
        '& .MuiSelect-root': { width: '100%' }
      }}
    >
      {children}
    </Box>
  </BlankCard>
)

export const InstoreTransactionPage = () => {
  const {
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
    isMonthlyTransaction,
    subTotal,
    grandTotal,
    totalDiscount,
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
    formatCurrency,
    handleCheckboxChange,
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
    <Box sx={{ width: '100%' }}>
      <Breadcrumb showBackButton={true} title="Transaksi Baru" items={BCrumb} />

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

      <form onSubmit={handleSubmit}>
        {/* ── 4-Column Section ── */}
        <Box sx={{ px: 2, pt: 1, pb: 2, width: '100%', boxSizing: 'border-box' }}>
          <Grid container spacing={2} alignItems="stretch">
            {/* ── Booking Details ── */}
            <Grid
              item
              xs={12}
              md={6}
              lg={3}
              sx={{ display: 'flex', minWidth: 0, '& > *': { width: '100%' } }}
            >
              <SectionCard title="Booking Details">
                <Box mb={2}>
                  <FieldLabel>Jumlah Kamar</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    value={roomCount}
                    onChange={handleRoomCountChange}
                    type="number"
                    inputProps={{ min: 1 }}
                  />
                </Box>
                <Box mb={2}>
                  <FieldLabel required>Check In Date</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: allowedCheckInMin }}
                  />
                </Box>
                <Box mb={2}>
                  <FieldLabel required>Check Out Date</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: minCheckOutDate }}
                  />
                </Box>
                {nightCount > 0 && (
                  <Box
                    sx={{
                      mb: 2,
                      px: 1.5,
                      py: 0.75,
                      bgcolor: 'primary.light',
                      borderRadius: 2,
                      display: 'flex',
                      gap: 0.75,
                      alignItems: 'center',
                      border: '1px solid',
                      borderColor: 'primary.main'
                    }}
                  >
                    <NightsStay sx={{ fontSize: 14, color: 'primary.main' }} />
                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                      Durasi: {nightCount} malam
                    </Typography>
                  </Box>
                )}
                <FormControlLabel
                  sx={{ mt: 0.5 }}
                  control={
                    <Checkbox
                      checked={isMonthlyTransaction}
                      onChange={handleCheckboxChange}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.secondary">
                      Transaksi Bulanan
                    </Typography>
                  }
                />
              </SectionCard>
            </Grid>

            {/* ── Guest Details ── */}
            <Grid
              item
              xs={12}
              md={6}
              lg={3}
              sx={{ display: 'flex', minWidth: 0, '& > *': { width: '100%' } }}
            >
              <SectionCard title="Guest Details">
                <Box mb={2}>
                  <FieldLabel>Pilih Pelanggan (Opsional)</FieldLabel>
                  <Autocomplete
                    fullWidth
                    size="small"
                    options={customers}
                    getOptionLabel={(c) => c.full_name || ''}
                    value={selectedCustomer}
                    onChange={(_, v) => setSelectedCustomer(v)}
                    loading={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Cari Pelanggan"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading ? <CircularProgress color="inherit" size={14} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Box>
                <Box mb={2}>
                  <FieldLabel required>Nama Pemesan</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </Box>
                <Box mb={2}>
                  <FieldLabel>E-mail Pemesan</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    type="email"
                    placeholder="Masukkan E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Box>
                <Box mb={2}>
                  <FieldLabel required>Nomor HP</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                  />
                </Box>
                <Box mb={2}>
                  <FieldLabel required>Jenis Identitas</FieldLabel>
                  <FormControl fullWidth size="small">
                    <Select
                      value={identityType}
                      onChange={(e) => setIdentityType(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Pilih</em>
                      </MenuItem>
                      <MenuItem value="ktp">KTP</MenuItem>
                      <MenuItem value="sim">SIM</MenuItem>
                      <MenuItem value="passport">Passport</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box mb={1}>
                  <FieldLabel required>Nomor Identitas</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Masukkan Nomor Identitas"
                    value={identityNumber}
                    onChange={(e) => setIdentityNumber(e.target.value)}
                  />
                </Box>
              </SectionCard>
            </Grid>

            {/* ── Room Details ── */}
            <Grid
              item
              xs={12}
              md={6}
              lg={3}
              sx={{ display: 'flex', minWidth: 0, '& > *': { width: '100%' } }}
            >
              <SectionCard title="Room Details">
                {!roomDetails || roomDetails.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Isi Jumlah Kamar terlebih dahulu
                  </Typography>
                ) : (
                  roomDetails.map((room, index) => (
                    <Box key={index}>
                      {roomDetails.length > 1 && (
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="primary.main"
                          display="block"
                          mb={1.5}
                          sx={{ letterSpacing: 0.5, textTransform: 'uppercase' }}
                        >
                          Kamar {index + 1}
                        </Typography>
                      )}
                      <Box mb={2}>
                        <FieldLabel required>Tipe Kamar</FieldLabel>
                        <FormControl fullWidth size="small">
                          <Select
                            value={room.roomType}
                            onChange={(e) =>
                              handleRoomDetailChange(index, 'roomType', e.target.value)
                            }
                            disabled={loading}
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>Pilih Tipe Kamar</em>
                            </MenuItem>
                            {roomTypes
                              .filter((t) => t.is_minibar === false)
                              .map((t) => (
                                <MenuItem key={t.id} value={t.guid}>
                                  {t.product_name}
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </Box>
                      <Box mb={2}>
                        <FieldLabel>Rate Plan</FieldLabel>
                        <FormControl fullWidth size="small">
                          <Select
                            value={room.ratePlan || ''}
                            onChange={(e) =>
                              handleRoomDetailChange(index, 'ratePlan', e.target.value)
                            }
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>Pilih Rate Plan</em>
                            </MenuItem>
                            {listRatePlan
                              .filter((p) => p.roomtypeid === room.roomType)
                              .map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                  {p.name} &mdash; {formatCurrency(parseFloat(p.baseprice || 0))}
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                        {room.ratePlan && nightCount > 0 && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            mt={0.5}
                          >
                            Total: {formatCurrency((room.ratePlanPrice || 0) * nightCount)} /{' '}
                            {nightCount} malam
                          </Typography>
                        )}
                      </Box>
                      <Box mb={2}>
                        <FieldLabel>Breakfast</FieldLabel>
                        <RadioGroup
                          row
                          value={room.breakfast || 'false'}
                          onChange={(e) =>
                            handleRoomDetailChange(index, 'breakfast', e.target.value)
                          }
                        >
                          <FormControlLabel
                            value="true"
                            control={<Radio size="small" />}
                            label={<Typography variant="body2">Yes</Typography>}
                          />
                          <FormControlLabel
                            value="false"
                            control={<Radio size="small" />}
                            label={<Typography variant="body2">No</Typography>}
                          />
                        </RadioGroup>
                      </Box>
                      <Box mb={2}>
                        <FieldLabel required>Nomor Kamar</FieldLabel>
                        <FormControl fullWidth size="small">
                          <Select
                            value={room.roomNumber || ''}
                            onChange={(e) =>
                              handleRoomDetailChange(index, 'roomNumber', e.target.value)
                            }
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>Pilih Kamar</em>
                            </MenuItem>
                            {roomNumbers.length > 0 ? (
                              roomNumbers
                                .filter((rn) => [6, 15].includes(rn.status_id))
                                .map((rn) => (
                                  <MenuItem
                                    key={rn.guid}
                                    value={rn.guid}
                                    disabled={roomDetails.some(
                                      (r, i) => i !== index && r.roomNumber === rn.guid
                                    )}
                                  >
                                    {rn.room_no}
                                  </MenuItem>
                                ))
                            ) : (
                              <MenuItem disabled>
                                <em>Tidak ada kamar tersedia</em>
                              </MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      </Box>
                      <Box mb={2}>
                        <FieldLabel required>Jumlah Dewasa</FieldLabel>
                        <FormControl fullWidth size="small">
                          <Select
                            value={room.adultCount || ''}
                            onChange={(e) =>
                              handleRoomDetailChange(index, 'adultCount', e.target.value)
                            }
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>-</em>
                            </MenuItem>
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                              <MenuItem key={n} value={String(n)}>
                                {n}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                      <Box mb={2}>
                        <FieldLabel>Jumlah Anak</FieldLabel>
                        <FormControl fullWidth size="small">
                          <Select
                            value={room.childCount || ''}
                            onChange={(e) =>
                              handleRoomDetailChange(index, 'childCount', e.target.value)
                            }
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>-</em>
                            </MenuItem>
                            {[0, 1, 2, 3, 4].map((n) => (
                              <MenuItem key={n} value={String(n)}>
                                {n}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                      {index < roomDetails.length - 1 && <Divider sx={{ my: 2.5 }} />}
                    </Box>
                  ))
                )}
              </SectionCard>
            </Grid>

            {/* ── Notes & Discount ── */}
            <Grid
              item
              xs={12}
              md={6}
              lg={3}
              sx={{ display: 'flex', minWidth: 0, '& > *': { width: '100%' } }}
            >
              <SectionCard title="Catatan & Diskon">
                <Box mb={2}>
                  <FieldLabel>Catatan (Keterangan)</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={4}
                    placeholder="Silahkan masukkan catatan"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Box>
                <Box mb={2}>
                  <FieldLabel>Jenis Diskon</FieldLabel>
                  <FormControl fullWidth size="small">
                    <Select value={discountType} onChange={handleDiscountChange} displayEmpty>
                      <MenuItem value="">
                        <em>Tidak Ada Diskon</em>
                      </MenuItem>
                      <MenuItem value="percentage">Persentase (%)</MenuItem>
                      <MenuItem value="nominal">Nominal (Rp)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                {discountType && (
                  <Box mb={2}>
                    <FieldLabel>
                      Jumlah Diskon {discountType === 'percentage' ? '(%)' : '(Rp)'}
                    </FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      value={discountAmount}
                      onChange={handleChange}
                    />
                  </Box>
                )}

                {/* Summary Box */}
                {(subTotal > 0 || grandTotal > 0) && (
                  <Box
                    sx={{
                      mt: 'auto',
                      pt: 2,
                      borderTop: '1px dashed',
                      borderColor: 'divider'
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" mb={0.75}>
                      <Typography variant="body2" color="text.secondary">
                        Sub Total
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {formatCurrency(subTotal)}
                      </Typography>
                    </Stack>
                    {totalDiscount > 0 && (
                      <Stack direction="row" justifyContent="space-between" mb={0.75}>
                        <Typography variant="body2" color="text.secondary">
                          Diskon
                        </Typography>
                        <Typography variant="body2" color="error.main" fontWeight={500}>
                          - {formatCurrency(totalDiscount)}
                        </Typography>
                      </Stack>
                    )}
                    <Box
                      sx={{
                        mt: 1,
                        px: 1.5,
                        py: 0.875,
                        bgcolor: 'primary.light',
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: 'primary.main',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={700}>
                        Grand Total
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                        {formatCurrency(grandTotal)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </SectionCard>
            </Grid>
          </Grid>
        </Box>

        {/* ── Metode Pembayaran ── */}
        <Box sx={{ px: 2, pb: 2 }}>
          <BlankCard>
            <Box
              sx={{
                px: 2.5,
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'grey.50',
                borderLeft: '3px solid',
                borderLeftColor: 'primary.main'
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                Metode Pembayaran
              </Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ maxWidth: '100%', mb: paymentMethod ? 3 : 0 }}>
                <FieldLabel required>Jenis Pembayaran</FieldLabel>
                <FormControl fullWidth size="small">
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Pilih Metode</em>
                    </MenuItem>
                    <MenuItem value="Cash">Tunai</MenuItem>
                    <MenuItem value="bank_transfer">Transfer Bank</MenuItem>
                    <MenuItem value="debit_credit">Debit / Kredit</MenuItem>
                    <MenuItem value="cicilan">Cicilan</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {paymentMethod === 'Cash' && (
                <Box sx={{ maxWidth: '100%' }}>
                  <FieldLabel required>Nama Penyetor</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </Box>
              )}

              {paymentMethod === 'bank_transfer' && (
                <Grid container spacing={2} sx={{ mt: 0 }}>
                  <Grid item xs={12} sm={4}>
                    <FieldLabel required>Nomor Referensi</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FieldLabel required>Nama Pengirim</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FieldLabel required>Bank Penerima</FieldLabel>
                    <FormControl fullWidth size="small">
                      <Select value={bankRecipient} onChange={handleBankSelect} displayEmpty>
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
                  </Grid>
                  <Grid item xs={12}>
                    <FieldLabel>Bukti Transfer</FieldLabel>
                    <Box
                      sx={{
                        p: 2.5,
                        textAlign: 'center',
                        border: '2px dashed',
                        borderColor: 'primary.main',
                        borderRadius: 2,
                        cursor: 'pointer',
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        transition: 'opacity 0.2s',
                        '&:hover': { opacity: 0.85 }
                      }}
                      {...getRootProps()}
                    >
                      <input {...getInputProps()} />
                      <CloudUpload sx={{ fontSize: 30, mb: 0.5, opacity: 0.8 }} />
                      <Typography variant="body2" fontWeight={500}>
                        Drag &amp; drop file di sini
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        atau klik untuk pilih file
                      </Typography>
                    </Box>
                    {uploadImage && (
                      <Stack alignItems="center" mt={2} spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          {uploadImage.name}
                        </Typography>
                        <Box
                          component="img"
                          src={URL.createObjectURL(uploadImage)}
                          alt="preview"
                          sx={{ maxWidth: 280, borderRadius: 1 }}
                        />
                      </Stack>
                    )}
                  </Grid>
                </Grid>
              )}

              {paymentMethod === 'debit_credit' && (
                <Grid container spacing={2} sx={{ mt: 0 }}>
                  <Grid item xs={12} sm={3}>
                    <FieldLabel required>Tipe Kartu</FieldLabel>
                    <FormControl fullWidth size="small">
                      <Select
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>Pilih</em>
                        </MenuItem>
                        <MenuItem value="debit">Debit</MenuItem>
                        <MenuItem value="credit">Kredit</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FieldLabel required>Approval Code</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      value={approvalCode}
                      onChange={(e) => setApprovalCode(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FieldLabel required>Seri Trace</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      value={traceNumber}
                      onChange={(e) => setTraceNumber(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FieldLabel required>Nomor Referensi</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FieldLabel>Bukti Struk</FieldLabel>
                    <Box
                      sx={{
                        p: 2.5,
                        textAlign: 'center',
                        border: '2px dashed',
                        borderColor: 'primary.main',
                        borderRadius: 2,
                        cursor: 'pointer',
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        transition: 'opacity 0.2s',
                        '&:hover': { opacity: 0.85 }
                      }}
                      {...getRootProps()}
                    >
                      <input {...getInputProps()} />
                      <CloudUpload sx={{ fontSize: 30, mb: 0.5, opacity: 0.8 }} />
                      <Typography variant="body2" fontWeight={500}>
                        Drag &amp; drop file di sini
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        atau klik untuk pilih file
                      </Typography>
                    </Box>
                    {uploadImage && (
                      <Stack alignItems="center" mt={2} spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          {uploadImage.name}
                        </Typography>
                        <Box
                          component="img"
                          src={URL.createObjectURL(uploadImage)}
                          alt="preview"
                          sx={{ maxWidth: 280, borderRadius: 1 }}
                        />
                      </Stack>
                    )}
                  </Grid>
                </Grid>
              )}

              {paymentMethod === 'cicilan' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={12}>
                    <FieldLabel>Tenor</FieldLabel>
                    <FormControl fullWidth size="small">
                      <Select value={tenor} onChange={(e) => setTenor(e.target.value)} displayEmpty>
                        <MenuItem value="">
                          <em>Pilih Tenor</em>
                        </MenuItem>
                        {[1, 2, 3, 6, 12].map((n) => (
                          <MenuItem key={n} value={String(n)}>
                            {n} bulan
                          </MenuItem>
                        ))}
                        <MenuItem value="custom">Custom</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {tenor === 'custom' && (
                    <Grid item xs={12} sm={4}>
                      <FieldLabel>Tenor Custom (bulan)</FieldLabel>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={customTenor}
                        onChange={(e) => setCustomTenor(e.target.value)}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                  )}
                </Grid>
              )}
            </Box>
          </BlankCard>
        </Box>

        {/* ── Action Buttons ── */}
        <Box sx={{ px: 2, pb: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              type="submit"
              variant="contained"
              disableElevation
              disabled={!isValid || isSubmitting}
              onClick={handleSubmit}
              color="primary"
              sx={{ minWidth: 140, py: 1, fontWeight: 600, letterSpacing: 0.3 }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={14} color="inherit" sx={{ mr: 1 }} />
                  Proses...
                </>
              ) : (
                'Pesan Sekarang'
              )}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={resetForm}
              sx={{ py: 1, fontWeight: 600 }}
            >
              Batal
            </Button>
          </Stack>
          {error && (
            <Typography variant="body2" color="error" mt={1}>
              {error}
            </Typography>
          )}
        </Box>
      </form>
    </Box>
  )
}
