import {
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
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
  Chip,
  Badge,
  Tooltip,
  InputAdornment
} from '@mui/material'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconTrash,
  IconMinus,
  IconPlus,
  IconSearch,
  IconUser,
  IconShoppingCart,
  IconCash,
  IconCreditCard,
  IconBuildingBank,
  IconDiscount,
  IconUserCheck,
  IconNotes,
  IconChevronDown,
  IconChevronUp
} from '@tabler/icons-react'

import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { useCreateTransaction } from './hook/useCreateTransaction'
import { formatRupiah, getImgUrl } from '@renderer/utils/myFunctions'
import { useMemo, useState } from 'react'

// ================================
// BREADCRUMB CONFIG
// ================================
const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Transaksi' }, { title: 'Buat Transaksi' }]

// ================================
// MAIN COMPONENT
// ================================
export const CreateTransactionPage = () => {
  const [viewMode, setViewMode] = useState('v1')

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

  const [productKeyword, setProductKeyword] = useState('')
  const [checkoutExpanded, setCheckoutExpanded] = useState(false)

  const filteredProductCards = useMemo(() => {
    if (!productKeyword) return products
    const keyword = productKeyword.toLowerCase()
    return products.filter((item) => (item?.name || '').toLowerCase().includes(keyword))
  }, [products, productKeyword])

  const resolveProductImage = (product) => {
    const rawImage = product?.images || product?.image || product?.product_detail?.image || ''
    if (!rawImage) return ''
    if (/^https?:\/\//i.test(rawImage)) return rawImage
    return getImgUrl(rawImage)
  }

  // Check if add button should be disabled
  const isAddDisabled = !selectedProduct || quantity <= 0 || loading.addToCart

  const isCheckoutDisabled = useMemo(() => {
    if (loading.submit || cartItems.length === 0) return true
    if (paymentMethod === 'bank_transfer' && status === 'PAID') {
      if (!referenceNumber || !senderName || !bankRecipient) return true
    }
    if (paymentMethod === 'debit_credit' && status === 'PAID') {
      if (!cardType || !approvalCode || !traceNumber || !referenceNumber) return true
    }
    if (paymentMethod === 'Cash' && status === 'PAID') {
      if (!amountPaid || Number(amountPaid) <= 0) return true
    }
    return false
  }, [
    loading.submit,
    cartItems.length,
    paymentMethod,
    status,
    referenceNumber,
    senderName,
    bankRecipient,
    cardType,
    approvalCode,
    traceNumber,
    amountPaid
  ])

  const PAYMENT_ICONS = {
    Cash: <IconCash size={18} />,
    bank_transfer: <IconBuildingBank size={18} />,
    debit_credit: <IconCreditCard size={18} />
  }
  const PAYMENT_LABELS = { Cash: 'Cash', bank_transfer: 'Transfer', debit_credit: 'Debit/Credit' }

  return (
    <Box>
      {/* Network Status Alert */}
      {!isOnline && (
        <Alert severity="info" sx={{ mb: 2 }}>
          📴 Anda sedang offline. Transaksi tetap bisa dilakukan dan akan disinkronisasi otomatis
          saat kembali online.
        </Alert>
      )}

      {/* Breadcrumb + Mode Toggle */}

      <Breadcrumb showBackButton={true} title="Buat Transaksi" items={BCrumb}>
        <ToggleButtonGroup
          color="primary"
          value={viewMode}
          exclusive
          onChange={(_event, nextMode) => {
            if (nextMode) setViewMode(nextMode)
          }}
          size="small"
          sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}
        >
          <ToggleButton value="v1" sx={{ px: 2.5, fontWeight: 600 }}>
            Tampilan Lama
          </ToggleButton>
          <ToggleButton value="v2" sx={{ px: 2.5, fontWeight: 600 }}>
            🖥️ Mode POS
          </ToggleButton>
        </ToggleButtonGroup>
      </Breadcrumb>

      {/* ================================================================
          V2 — POS LAYOUT
      ================================================================ */}
      {viewMode === 'v2' && (
        <Grid container spacing={2} sx={{ height: 'calc(100vh - 200px)', minHeight: 600 }}>
          {/* ── LEFT PANEL : Product Grid ── */}
          <Grid size={{ xs: 12, lg: 8 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Top bar: customer + search */}
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid size={{ xs: 12, sm: 7 }}>
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
                        label="Pelanggan"
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <IconUser size={16} />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                          endAdornment: (
                            <>
                              {loading.customers && <CircularProgress color="inherit" size={16} />}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                    noOptionsText={loading.customers ? 'Mencari...' : 'Pelanggan tidak ditemukan'}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Cari produk..."
                    value={productKeyword}
                    onChange={(e) => {
                      setProductKeyword(e.target.value)
                      setSearchTermProduct(e.target.value)
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconSearch size={16} />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                {customer && (
                  <Grid size={{ xs: 12 }}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <IconUserCheck size={15} color="green" />
                      <Typography variant="caption" color="success.main">
                        {customer.full_name}
                        {customer.phone ? ` · ${customer.phone}` : ''}
                      </Typography>
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Product cards */}
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                flex: 1,
                overflowY: 'auto',
                minHeight: 0
              }}
            >
              {loading.products ? (
                <Box py={6} textAlign="center">
                  <CircularProgress size={32} />
                  <Typography variant="body2" mt={1} color="text.secondary">
                    Memuat produk...
                  </Typography>
                </Box>
              ) : filteredProductCards.length > 0 ? (
                <Grid container spacing={1.5}>
                  {filteredProductCards.map((product) => {
                    const isSelected = selectedProduct?.id === product.id
                    const imgUrl = resolveProductImage(product)
                    return (
                      <Grid
                        size={{ xs: 6, sm: 4, md: 3 }}
                        key={product.guid || product.id || product.name}
                      >
                        <Card
                          onClick={() => handleProductChange(null, product)}
                          sx={{
                            borderRadius: 2,
                            cursor: 'pointer',
                            border: '2px solid',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            bgcolor: isSelected ? 'primary.50' : 'background.paper',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              borderColor: 'primary.light',
                              boxShadow: 3,
                              transform: 'translateY(-2px)'
                            },
                            position: 'relative',
                            overflow: 'visible'
                          }}
                        >
                          {isSelected && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                bgcolor: 'primary.main',
                                color: 'white',
                                borderRadius: '50%',
                                width: 22,
                                height: 22,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 700,
                                zIndex: 1,
                                boxShadow: 2
                              }}
                            >
                              ✓
                            </Box>
                          )}
                          <CardActionArea>
                            <Box
                              sx={{
                                height: 100,
                                bgcolor: imgUrl ? 'transparent' : 'grey.100',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px 8px 0 0',
                                overflow: 'hidden'
                              }}
                            >
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={product.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.parentNode.innerHTML = `<span style="font-size:2rem">📦</span>`
                                  }}
                                />
                              ) : (
                                <Typography variant="h3" sx={{ opacity: 0.4 }}>
                                  📦
                                </Typography>
                              )}
                            </Box>
                            <CardContent sx={{ p: 1.5, pb: '12px !important' }}>
                              <Tooltip title={product.name} placement="top">
                                <Typography
                                  variant="caption"
                                  fontWeight={600}
                                  display="block"
                                  noWrap
                                  lineHeight={1.3}
                                >
                                  {product.name}
                                </Typography>
                              </Tooltip>
                              <Typography
                                variant="caption"
                                color="primary.main"
                                fontWeight={700}
                                display="block"
                                mt={0.5}
                              >
                                {formatRupiah(product.price_walkin || product.price || 0)}
                              </Typography>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    )
                  })}
                </Grid>
              ) : (
                <Box py={6} textAlign="center">
                  <Typography variant="h3" sx={{ opacity: 0.3 }}>
                    🔍
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Produk tidak ditemukan
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Add-to-cart bar — only shows when a product is selected */}
            {selectedProduct && (
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50'
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
                  {/* Product info */}
                  <Box flex={1} minWidth={0}>
                    <Typography variant="subtitle2" noWrap fontWeight={700}>
                      {selectedProduct.name}
                    </Typography>
                    <Typography variant="caption" color="primary.main" fontWeight={600}>
                      {formatRupiah(price)}
                    </Typography>
                  </Box>

                  {/* Satuan */}
                  <Box width={130}>
                    {isSatuanReadonly ? (
                      <TextField
                        label="Satuan"
                        value={satuanName}
                        size="small"
                        disabled
                        fullWidth
                      />
                    ) : (
                      <Autocomplete
                        value={
                          productSatuanList.find((item) => item.id === selectedSatuanId) || null
                        }
                        onChange={handleSatuanChange}
                        options={productSatuanList}
                        getOptionLabel={(option) => option.satuan?.name || ''}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        renderInput={(params) => (
                          <TextField {...params} label="Satuan" size="small" fullWidth />
                        )}
                      />
                    )}
                  </Box>

                  {/* Qty stepper */}
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                    >
                      <IconMinus size={14} />
                    </IconButton>
                    <TextField
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      size="small"
                      type="number"
                      inputProps={{ min: 1, style: { textAlign: 'center', width: 48 } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setQuantity(quantity + 1)}
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                    >
                      <IconPlus size={14} />
                    </IconButton>
                  </Stack>

                  {/* Add button */}
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddToCart}
                    disabled={isAddDisabled}
                    startIcon={loading.addToCart ? null : <IconShoppingCart size={16} />}
                    sx={{ height: 40, minWidth: 120, borderRadius: 2, fontWeight: 700 }}
                  >
                    {loading.addToCart ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      'Tambah ke Cart'
                    )}
                  </Button>
                </Stack>
              </Paper>
            )}
          </Grid>

          {/* ── RIGHT PANEL : Cart + Checkout ── */}
          <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Cart header */}
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconShoppingCart size={18} />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Keranjang
                  </Typography>
                  {cartItems.length > 0 && (
                    <Badge badgeContent={cartItems.length} color="primary" />
                  )}
                </Stack>
                {cartItems.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {cartItems.length} item
                  </Typography>
                )}
              </Stack>

              {/* Cart items list */}
              <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, maxHeight: 320 }}>
                {loading.cart ? (
                  <Box py={4} textAlign="center">
                    <CircularProgress size={24} />
                  </Box>
                ) : cartItems.length > 0 ? (
                  <Stack spacing={1}>
                    {cartItems.map((row, index) => (
                      <Box
                        key={row.cart_items_id || index}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.default'
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Box flex={1} minWidth={0} pr={1}>
                            <Typography variant="caption" fontWeight={700} display="block" noWrap>
                              {row.product_name}
                            </Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center" mt={0.25}>
                              <Typography variant="caption" color="text.secondary">
                                {row.qty} × {formatRupiah(row.price)}
                              </Typography>
                              {row._offline && (
                                <Chip
                                  label="Offline"
                                  size="small"
                                  color="warning"
                                  sx={{ height: 16, fontSize: 10 }}
                                />
                              )}
                            </Stack>
                          </Box>
                          <Stack alignItems="flex-end" spacing={0.5}>
                            <Typography variant="caption" fontWeight={700} color="primary.main">
                              {formatRupiah(row.qty * row.price)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(row)}
                              color="error"
                              sx={{ p: 0.25 }}
                            >
                              <IconTrash size={14} />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Box py={4} textAlign="center">
                    <Typography variant="h3" sx={{ opacity: 0.25 }}>
                      🛒
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Keranjang masih kosong
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Klik produk untuk menambahkan
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Subtotal summary */}
              {cartItems.length > 0 && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack spacing={0.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Subtotal
                      </Typography>
                      <Typography variant="body2">{formatRupiah(subTotal)}</Typography>
                    </Stack>
                    {discountType && discountAmount && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Diskon
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          -{' '}
                          {discountType === 'percentage'
                            ? `${discountAmount}%`
                            : formatRupiah(discountAmount)}
                        </Typography>
                      </Stack>
                    )}
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="subtitle2" fontWeight={700}>
                        Total
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="primary.main">
                        {formatRupiah(finalGrandTotal)}
                      </Typography>
                    </Stack>
                  </Stack>
                </>
              )}
            </Paper>

            {/* ── Checkout accordion ── */}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
              {/* Accordion header */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                px={2}
                py={1.5}
                sx={{
                  cursor: 'pointer',
                  bgcolor: checkoutExpanded ? 'primary.main' : 'background.paper',
                  color: checkoutExpanded ? 'primary.contrastText' : 'text.primary',
                  transition: 'background 0.2s'
                }}
                onClick={() => setCheckoutExpanded((v) => !v)}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  Detail Pembayaran &amp; Checkout
                </Typography>
                {checkoutExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
              </Stack>

              {checkoutExpanded && (
                <Box p={2}>
                  {/* Customer name fallback */}
                  {!customer && (
                    <Box mb={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Nama Pelanggan"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <IconUser size={15} />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Box>
                  )}

                  {/* Employee */}
                  <Box mb={2}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                      mb={0.5}
                    >
                      <IconUserCheck size={13} /> Karyawan
                    </Typography>
                    <Autocomplete
                      multiple
                      size="small"
                      value={selectedEmployees}
                      onChange={(_event, newValue) => setSelectedEmployees(newValue)}
                      options={employees}
                      getOptionLabel={(option) => option.employee_name || ''}
                      isOptionEqualToValue={(option, value) => option.guid === value.guid}
                      loading={loading.employees}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Pilih karyawan"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loading.employees && (
                                  <CircularProgress color="inherit" size={14} />
                                )}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                    />
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Discount */}
                  <Box mb={2}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                      mb={0.5}
                    >
                      <IconDiscount size={13} /> Diskon
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select
                          value={discountType}
                          onChange={handleDiscountTypeChange}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>Tanpa diskon</em>
                          </MenuItem>
                          <MenuItem value="percentage">% Persen</MenuItem>
                          <MenuItem value="nominal">Rp Nominal</MenuItem>
                        </Select>
                      </FormControl>
                      {discountType && (
                        <TextField
                          size="small"
                          flex={1}
                          placeholder={discountType === 'percentage' ? '0–100' : 'Nominal'}
                          value={discountAmount}
                          onChange={handleDiscountAmountChange}
                          type="number"
                          sx={{ flex: 1 }}
                        />
                      )}
                    </Stack>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Payment method — pill buttons */}
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                      Metode Pembayaran
                    </Typography>
                    <Stack direction="row" spacing={1} mb={1.5}>
                      {['Cash', 'bank_transfer', 'debit_credit'].map((m) => (
                        <Button
                          key={m}
                          size="small"
                          variant={paymentMethod === m ? 'contained' : 'outlined'}
                          onClick={() => handlePaymentMethodChange({ target: { value: m } })}
                          startIcon={PAYMENT_ICONS[m]}
                          sx={{ flex: 1, borderRadius: 3, fontSize: 11, fontWeight: 700 }}
                        >
                          {PAYMENT_LABELS[m]}
                        </Button>
                      ))}
                    </Stack>

                    {/* Status */}
                    <FormControl fullWidth size="small">
                      <InputLabel>Status Pembayaran</InputLabel>
                      <Select
                        value={status}
                        onChange={handleStatusChange}
                        label="Status Pembayaran"
                      >
                        {paymentMethod === 'Cash' && (
                          <MenuItem value="SUBMIT">Belum Bayar</MenuItem>
                        )}
                        <MenuItem value="PAID">Sudah Bayar</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Bank transfer fields */}
                  {paymentMethod === 'bank_transfer' && status === 'PAID' && (
                    <Box mb={2}>
                      <Stack spacing={1.5}>
                        <TextField
                          size="small"
                          fullWidth
                          label="No. Referensi"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          required
                        />
                        <TextField
                          size="small"
                          fullWidth
                          label="Nama Pengirim"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          required
                        />
                        <FormControl fullWidth size="small" required>
                          <InputLabel>Bank Penerima</InputLabel>
                          <Select
                            value={bankRecipient}
                            onChange={(e) => setBankRecipient(e.target.value)}
                            label="Bank Penerima"
                          >
                            {bankOptions.map((bank) => (
                              <MenuItem key={bank.id} value={bank.account_no}>
                                {bank.name} – {bank.account_no}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {/* Bukti upload */}
                        <Box
                          {...getRootProps()}
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            border: '2px dashed',
                            borderColor: uploadImage ? 'success.main' : 'primary.main',
                            borderRadius: 2,
                            bgcolor: uploadImage ? 'success.50' : 'primary.50',
                            cursor: 'pointer'
                          }}
                        >
                          <input {...getInputProps()} />
                          {uploadImage ? (
                            <Typography variant="caption" color="success.main" fontWeight={600}>
                              ✓ {uploadImage.name}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="primary.main">
                              Klik atau drag bukti transfer
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Box>
                  )}

                  {/* Debit/Credit fields */}
                  {paymentMethod === 'debit_credit' && status === 'PAID' && (
                    <Box mb={2}>
                      <Stack spacing={1.5}>
                        <FormControl fullWidth size="small" required>
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
                        <TextField
                          size="small"
                          fullWidth
                          label="Approval Code"
                          value={approvalCode}
                          onChange={(e) => setApprovalCode(e.target.value)}
                          required
                        />
                        <TextField
                          size="small"
                          fullWidth
                          label="Trace Number"
                          value={traceNumber}
                          onChange={(e) => setTraceNumber(e.target.value)}
                          required
                        />
                        <TextField
                          size="small"
                          fullWidth
                          label="No. Referensi"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          required
                        />
                      </Stack>
                    </Box>
                  )}

                  {/* Cash amount paid */}
                  {paymentMethod === 'Cash' && status === 'PAID' && (
                    <Box mb={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Jumlah Bayar"
                        value={amountPaid}
                        onChange={handleAmountPaidChange}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) e.preventDefault()
                        }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                        }}
                      />
                      {change > 0 && (
                        <Stack direction="row" justifyContent="space-between" mt={1} px={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            Kembalian
                          </Typography>
                          <Typography variant="subtitle2" color="success.main" fontWeight={700}>
                            {formatRupiah(change)}
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  )}

                  {/* Notes */}
                  <Box mb={2}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                      mb={0.5}
                    >
                      <IconNotes size={13} /> Catatan
                    </Typography>
                    <Stack spacing={1}>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        label="Catatan Pelanggan"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        label="Catatan Internal"
                        value={notesInternal}
                        onChange={(e) => setNotesInternal(e.target.value)}
                      />
                    </Stack>
                  </Box>

                  {/* Checkout button */}
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handleSubmit}
                    disabled={isCheckoutDisabled}
                    sx={{ borderRadius: 2, fontWeight: 700, py: 1.5, fontSize: 15 }}
                  >
                    {loading.submit ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      `💳 Proses Pembayaran${cartItems.length > 0 ? ` · ${formatRupiah(finalGrandTotal)}` : ''}`
                    )}
                  </Button>
                </Box>
              )}

              {/* Quick checkout when accordion collapsed */}
              {!checkoutExpanded && (
                <Box px={2} pb={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handleSubmit}
                    disabled={isCheckoutDisabled}
                    sx={{ borderRadius: 2, fontWeight: 700, py: 1.5, fontSize: 15 }}
                  >
                    {loading.submit ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      `💳 Bayar${cartItems.length > 0 ? ` · ${formatRupiah(finalGrandTotal)}` : ''}`
                    )}
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ================================================================
          V1 — ORIGINAL LAYOUT
      ================================================================ */}
      <Grid container spacing={3} sx={{ display: viewMode === 'v1' ? 'flex' : 'none' }}>
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
                              <Chip
                                label="Offline"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
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
                    onKeyPress={(event) => {
                      if (!/[0-9]/.test(event.key)) event.preventDefault()
                    }}
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

      {/* [REMOVED - V2 checkout is now integrated in the right panel above]
      {viewMode === 'v2' && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
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
                      <Select
                        value={status}
                        onChange={handleStatusChange}
                        label="Status Pembayaran"
                      >
                        {paymentMethod === 'Cash' && (
                          <MenuItem value="SUBMIT">Belum Bayar</MenuItem>
                        )}
                        <MenuItem value="PAID">Sudah Bayar</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

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

              {paymentMethod === 'Cash' && status === 'PAID' && (
                <Grid container spacing={2} mb={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Jumlah Bayar"
                      value={amountPaid}
                      onKeyPress={(event) => {
                        if (!/[0-9]/.test(event.key)) event.preventDefault()
                      }}
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
      )}
      */}

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
