import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Divider,
  Stack,
  IconButton,
  Select,
  Dialog,
  DialogActions,
  DialogContent,
  Alert,
  FormControl,
  InputLabel,
  Autocomplete,
  CircularProgress,
  DialogTitle,
  DialogContentText,
  Paper,
  Chip
} from '@mui/material'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconTrash
} from '@tabler/icons-react'

import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { useCreateTransaction } from './hook/useCreateTransaction'
import { formatRupiah } from '@renderer/utils/myFunctions'

// ================================
// BREADCRUMB CONFIG
// ================================
const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Transaksi' }, { title: 'Buat Transaksi' }]

// ================================
// MAIN COMPONENT
// ================================
export const CreateTransactionPage = () => {
  const {
    // Network status
    isOnline,

    // Loading states
    loading,

    // Master data
    products,
    customers,
    employees,
    bankOptions,
    productSatuanList,

    // Cart
    cartItems,
    subTotal,
    finalGrandTotal,

    // Customer
    customer,
    setCustomer,
    customerName,
    setCustomerName,
    setSearchTermCustomer,

    // Product selection
    selectedProduct,
    setSearchTermProduct,
    quantity,
    setQuantity,
    price,
    satuanName,
    selectedSatuanId,
    isSatuanReadonly,
    handleProductChange,
    handleSatuanChange,

    // Employee
    selectedEmployees,
    setSelectedEmployees,

    // Discount
    discountType,
    discountAmount,
    handleDiscountTypeChange,
    handleDiscountAmountChange,

    // Payment
    paymentMethod,
    status,
    amountPaid,
    change,
    handlePaymentMethodChange,
    handleStatusChange,
    handleAmountPaidChange,

    // Bank Transfer
    referenceNumber,
    setReferenceNumber,
    senderName,
    setSenderName,
    bankRecipient,
    setBankRecipient,
    uploadImage,
    getRootProps,
    getInputProps,

    // Debit/Credit
    cardType,
    setCardType,
    approvalCode,
    setApprovalCode,
    traceNumber,
    setTraceNumber,

    // Notes
    notes,
    setNotes,
    notesInternal,
    setNotesInternal,

    // Cart actions
    handleAddToCart,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    deleteDialog,

    // Checkout
    handleSubmit,

    // Pagination
    page,
    setPage,
    pageSize,
    setPageSize
  } = useCreateTransaction()

  // Check if add button should be disabled
  const isAddDisabled = !selectedProduct || quantity <= 0 || loading.addToCart

  return (
    <Box>
      {/* Network Status Alert */}
      {!isOnline && (
        <Alert severity="info" sx={{ mb: 2 }}>
          📴 Anda sedang offline. Transaksi tetap bisa dilakukan dan akan disinkronisasi otomatis
          saat kembali online.
        </Alert>
      )}

      {/* Breadcrumb */}
      <Breadcrumb showBackButton={true} title="Buat Transaksi" items={BCrumb} />

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* ================================
            CUSTOMER & PRODUCT SELECTION
        ================================ */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            {/* Customer Selection */}
            <Grid container spacing={2} mb={2}>
              <Grid size={{ xs: 12, md: 9 }}>
                <Autocomplete
                  value={customer}
                  onChange={(_event, newValue) => setCustomer(newValue)}
                  onInputChange={(_event, value) => setSearchTermCustomer(value)}
                  options={customers}
                  getOptionLabel={(option) => option.full_name || ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  loading={loading.customers}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Customer"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loading.customers && <CircularProgress color="inherit" size={20} />}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  noOptionsText={loading.customers ? 'Mencari...' : 'Pelanggan tidak ditemukan'}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="text.secondary" mt={2}>
                  Telepon: {customer?.phone || '-'}
                </Typography>
              </Grid>
            </Grid>

            {/* Product Selection */}
            <Box mt={2} p={2} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Grid container spacing={2} alignItems="center">
                {/* Product Autocomplete */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <Autocomplete
                    value={selectedProduct}
                    onChange={handleProductChange}
                    onInputChange={(_event, value) => setSearchTermProduct(value)}
                    options={products}
                    getOptionLabel={(option) => option.name || ''}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    loading={loading.products}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Pilih Produk"
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading.products && <CircularProgress color="inherit" size={20} />}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                    noOptionsText={loading.products ? 'Mencari...' : 'Produk tidak ditemukan'}
                  />
                </Grid>

                {/* Price */}
                <Grid size={{ xs: 6, md: 2 }}>
                  <TextField label="Harga" value={formatRupiah(price)} fullWidth disabled />
                </Grid>

                {/* Product Name */}
                <Grid size={{ xs: 6, md: 2 }}>
                  <TextField
                    label="Nama Item"
                    value={selectedProduct?.name || ''}
                    fullWidth
                    disabled
                  />
                </Grid>

                {/* Quantity */}
                <Grid size={{ xs: 6, md: 2 }}>
                  <TextField
                    label="Jumlah"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                {/* Satuan */}
                <Grid size={{ xs: 6, md: 2 }}>
                  {isSatuanReadonly ? (
                    <TextField label="Satuan" value={satuanName} fullWidth disabled />
                  ) : (
                    <Autocomplete
                      value={productSatuanList.find((item) => item.id === selectedSatuanId) || null}
                      onChange={handleSatuanChange}
                      options={productSatuanList}
                      getOptionLabel={(option) => option.satuan?.name || ''}
                      isOptionEqualToValue={(option, value) => option.id === value?.id}
                      renderInput={(params) => (
                        <TextField {...params} label="Pilih Satuan" fullWidth />
                      )}
                    />
                  )}
                </Grid>

                {/* Add Button */}
                <Grid size={{ xs: 12, md: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddToCart}
                    disabled={isAddDisabled}
                    fullWidth
                    sx={{ height: 56 }}
                  >
                    {loading.addToCart ? <CircularProgress size={24} color="inherit" /> : 'Tambah'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* ================================
            CART TABLE
        ================================ */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ borderRadius: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell>Satuan</TableCell>
                    <TableCell>Harga</TableCell>
                    <TableCell>Jumlah</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell align="center">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading.cart ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : cartItems.length > 0 ? (
                    cartItems.map((row, index) => (
                      <TableRow key={row.cart_items_id || index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.customer_name || '-'}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <span>{row.product_name}</span>
                            {row._offline && (
                              <Chip label="Offline" size="small" color="warning" variant="outlined" />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {row.product_satuan?.satuan?.name ||
                            row.product?.satuan_detail?.name ||
                            '-'}
                        </TableCell>
                        <TableCell>{formatRupiah(row.price)}</TableCell>
                        <TableCell>{row.qty}</TableCell>
                        <TableCell>{formatRupiah(row.qty * row.price)}</TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            color="warning"
                            size="small"
                            onClick={() => handleDeleteClick(row)}
                            startIcon={<IconTrash size={16} />}
                          >
                            Hapus
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary">Keranjang kosong</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Divider />
            <Stack direction="row" justifyContent="space-between" p={2} alignItems="center">
              <Typography variant="body2">{cartItems.length} Items</Typography>

              <Stack direction="row" gap={1} alignItems="center">
                <IconButton onClick={() => setPage(1)} disabled={page === 1} size="small">
                  <IconChevronsLeft size={18} />
                </IconButton>
                <IconButton onClick={() => setPage(page - 1)} disabled={page === 1} size="small">
                  <IconChevronLeft size={18} />
                </IconButton>
                <Typography variant="body2">Page {page}</Typography>
                <IconButton onClick={() => setPage(page + 1)} size="small">
                  <IconChevronRight size={18} />
                </IconButton>
                <IconButton onClick={() => setPage(page + 1)} size="small">
                  <IconChevronsRight size={18} />
                </IconButton>
              </Stack>

              <Stack direction="row" alignItems="center" gap={1}>
                <Typography variant="body2">Rows per page:</Typography>
                <Select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  size="small"
                >
                  {[10, 15, 20, 25].map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* ================================
            PAYMENT SECTION
        ================================ */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            {/* Customer Name (if no customer selected) */}
            {!customer && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Pelanggan
                </Typography>
                <TextField
                  fullWidth
                  label="Nama Pelanggan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  variant="outlined"
                />
              </Box>
            )}

            {/* Employee Selection */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Karyawan
              </Typography>
              <Autocomplete
                multiple
                value={selectedEmployees}
                onChange={(_event, newValue) => setSelectedEmployees(newValue)}
                options={employees}
                getOptionLabel={(option) => option.employee_name || ''}
                isOptionEqualToValue={(option, value) => option.guid === value.guid}
                loading={loading.employees}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pilih Karyawan"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading.employees && <CircularProgress color="inherit" size={20} />}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            </Box>

            {/* Discount Section */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Diskon Pesanan
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Pilih Diskon</InputLabel>
                    <Select
                      value={discountType}
                      onChange={handleDiscountTypeChange}
                      label="Pilih Diskon"
                    >
                      <MenuItem value="">
                        <em>Tidak ada diskon</em>
                      </MenuItem>
                      <MenuItem value="percentage">Diskon Persen</MenuItem>
                      <MenuItem value="nominal">Diskon Nominal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {discountType && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label={
                        discountType === 'nominal'
                          ? 'Besar Diskon (Nominal)'
                          : 'Besar Diskon (Persentase)'
                      }
                      value={discountAmount}
                      onChange={handleDiscountAmountChange}
                      type="number"
                      placeholder={`Masukkan diskon ${discountType === 'nominal' ? 'nominal' : '%'}`}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Payment Method */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Pembayaran
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Metode Pembayaran</InputLabel>
                    <Select
                      value={paymentMethod}
                      onChange={handlePaymentMethodChange}
                      label="Metode Pembayaran"
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="bank_transfer">Transfer</MenuItem>
                      <MenuItem value="debit_credit">Debit/Credit</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Status Pembayaran</InputLabel>
                    <Select value={status} onChange={handleStatusChange} label="Status Pembayaran">
                      {paymentMethod === 'Cash' && <MenuItem value="SUBMIT">Belum Bayar</MenuItem>}
                      <MenuItem value="PAID">Sudah Bayar</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Bank Transfer Fields */}
            {paymentMethod === 'bank_transfer' && status === 'PAID' && (
              <Box mb={3}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Nomor Referensi"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Nama Pengirim"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth required>
                      <InputLabel>Bank Penerima</InputLabel>
                      <Select
                        value={bankRecipient}
                        onChange={(e) => setBankRecipient(e.target.value)}
                        label="Bank Penerima"
                      >
                        {bankOptions.map((bank) => (
                          <MenuItem key={bank.id} value={bank.account_no}>
                            {bank.name} - {bank.account_no}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" mb={1}>
                      Bukti Struk
                    </Typography>
                    <Box
                      {...getRootProps()}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        border: '2px dashed',
                        borderColor: 'primary.main',
                        borderRadius: 2,
                        bgcolor: 'primary.light',
                        cursor: 'pointer'
                      }}
                    >
                      <input {...getInputProps()} />
                      <Typography color="primary">
                        Drag & drop file atau klik untuk memilih
                      </Typography>
                    </Box>
                    {uploadImage && (
                      <Box mt={2} textAlign="center">
                        <Typography variant="body2">File: {uploadImage.name}</Typography>
                        <img
                          src={URL.createObjectURL(uploadImage)}
                          alt="Preview"
                          style={{ maxWidth: 300, height: 'auto', marginTop: 8 }}
                        />
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Debit/Credit Fields */}
            {paymentMethod === 'debit_credit' && status === 'PAID' && (
              <Box mb={3}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth required>
                      <InputLabel>Tipe Kartu</InputLabel>
                      <Select
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value)}
                        label="Tipe Kartu"
                      >
                        <MenuItem value="debit">Debit</MenuItem>
                        <MenuItem value="credit">Kredit</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Approval Code"
                      value={approvalCode}
                      onChange={(e) => setApprovalCode(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Trace Number"
                      value={traceNumber}
                      onChange={(e) => setTraceNumber(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Nomor Referensi"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      required
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Notes */}
            <Grid container spacing={2} mb={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Catatan Pelanggan"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Catatan Internal"
                  value={notesInternal}
                  onChange={(e) => setNotesInternal(e.target.value)}
                />
              </Grid>
            </Grid>

            {/* Cash Payment Amount */}
            {paymentMethod === 'Cash' && status === 'PAID' && (
              <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Jumlah Bayar"
                    value={amountPaid}
                    onChange={handleAmountPaidChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" color="text.secondary">
                    Kembalian:
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {formatRupiah(change)}
                  </Typography>
                </Grid>
              </Grid>
            )}

            {/* Totals */}
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body1" color="text.secondary">
                  Sub Total:
                </Typography>
                <Typography variant="h6">{formatRupiah(subTotal)}</Typography>
              </Grid>
              <Grid xs={12} md={6}>
                <Typography variant="body1" color="text.secondary">
                  Total Belanja:
                </Typography>
                <Typography variant="h5" color="primary" fontWeight={700}>
                  {formatRupiah(finalGrandTotal)}
                </Typography>
              </Grid>
            </Grid>

            {/* Submit Button */}
            <Box mt={3} textAlign="right">
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleSubmit}
                disabled={loading.submit || cartItems.length === 0}
              >
                {loading.submit ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Proses Sekarang'
                )}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleCancelDelete}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus item {deleteDialog.item?.product_name} dari keranjang?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Batal</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
