import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { formatDate, formatRupiah } from '@renderer/utils/myFunctions'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconPlus,
  IconTrash
} from '@tabler/icons-react'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import React from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table'
import { UseIndex } from './hook/useIndex'
import { useNavigate } from 'react-router-dom'
import { TransactionDialog } from './components/DetailTransaction'
import { Eye } from 'lucide-react'

// Column helper for react-table
const columnHelper = createColumnHelper()

export const HistoryTransactionPage = () => {
  const navigate = useNavigate()
  const {
    // Data
    data,
    products,
    categories,
    selectedOutlet,
    loading,
    loadingTrx,
    loadingProduct,

    // Pagination
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    pageCount,

    // Filters
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    status,
    setStatus,
    productId,
    setProductId,
    categoryId,
    setCategoryId,
    searchTerm,
    setSearchTerm,
    statusOptions,

    // Row expansion
    openRows,
    handleRowToggle,

    // Delete
    openDialog,
    handleDeleteClick,
    handleCancelDelete,
    handleConfirmDelete,

    // Handlers
    fetchData,
    handleInputChange,

    // Snackbar
    snackbar,
    handleCloseSnackbar,

    // Permissions
    permissions,

    // Network
    isOnline,

    // Utils
    getStatusLabel
  } = UseIndex()

  // Sorting state for react-table
  const [sorting, setSorting] = React.useState([])

  // Format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Define columns with proper typing
  let columns = []

  if (localStorage.getItem('outletCategoryId') === '1') {
    columns = [
      // Column definitions
      {
        id: 'expand',
        header: () => null, // Empty header
        cell: (info) => {
          // console.log('openRows:', openRows); // Debugging to check the state
          return (
            <IconButton onClick={() => handleRowToggle(info.row.index)}>
              {openRows[info.row.index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )
        }
      },
      // columnHelper.accessor('rowIndex', {
      //     header: () => 'No',
      //     cell: info => (
      //         <Typography variant="body1">{info.row.index + 1}</Typography> // Adding 1 to start from 1 instead of 0
      //     ),
      // }),
      columnHelper.accessor(
        (row) => {
          const accountName = row.transaction_item?.[0]?.account_name
          return accountName || row.reservation_name
        },
        {
          id: 'reservation_name',
          header: () => 'Nama Tamu',
          cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
        }
      ),
      columnHelper.accessor('reservation_name', {
        enableSorting: true,
        header: () => 'Outlet',
        cell: () => (
          <Typography variant="body1">
            {(selectedOutlet && selectedOutlet.outlet_name) || localStorage.getItem('outletName')}
          </Typography>
        )
      }),
      columnHelper.accessor('booking_date', {
        enableSorting: true,
        header: () => 'Waktu Pemesanan',
        cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
      }),
      columnHelper.accessor('channel', {
        enableSorting: true,
        header: () => 'Channel',
        cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
      }),
      columnHelper.accessor('refference_id', {
        enableSorting: true,
        header: () => 'Nomor Reservasi',
        cell: (info) => (
          <Typography variant="body1">
            {info.row.original.refference_id ||
              info.row.original.reservation_number ||
              info.row.original.ticket?.booking_id}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        enableSorting: true,
        header: () => 'Status',
        cell: (info) => (
          <Chip
            size="small"
            label={getStatusLabel(info.getValue())}
            color={
              info.getValue() === 'PAID' || info.getValue() === 'SUCCESS' ? 'success' : 'error'
            }
            sx={{ borderRadius: '6px' }}
          />
        )
      }),
      columnHelper.accessor('transaction_item', {
        enableSorting: true,
        header: () => 'Produk',
        cell: (info) => {
          const parentRoom = info.row.original.product_name
          const transactionItems = info.getValue()
          const products = parentRoom
            ? parentRoom
            : transactionItems
                .map((item) => item.name)
                .filter(Boolean)
                .join(', ')

          return <Typography variant="body1">{products || ''}</Typography>
        }
      }),
      columnHelper.accessor('transaction_item', {
        enableSorting: true,
        header: () => 'Nomor Kamar',
        cell: (info) => {
          const parentRoom = info.row.original.room
          const transactionItems = info.getValue()
          const roomNumbers = parentRoom
            ? parentRoom
            : transactionItems
                .map((item) => item.no_room)
                .filter(Boolean)
                .join(', ')

          return <Typography variant="body1">{roomNumbers || ''}</Typography>
        }
      }),
      columnHelper.accessor('checkin_time', {
        enableSorting: true,
        header: () => 'Check In',
        cell: (info) => {
          const { checkin_time, check_in } = info.row.original
          const formattedCheckin = checkin_time
            ? formatDateTime(checkin_time)
            : formatDate(check_in || '')
          return <Typography variant="body1">{formattedCheckin}</Typography>
        }
      }),

      columnHelper.accessor('checkout_time', {
        enableSorting: true,
        header: () => 'Check Out',
        cell: (info) => {
          const { checkout_time, check_out } = info.row.original
          const formattedCheckout = checkout_time
            ? formatDateTime(checkout_time)
            : formatDate(check_out || '')
          return <Typography variant="body1">{formattedCheckout}</Typography>
        }
      }),
      columnHelper.accessor('grand_total', {
        enableSorting: true,
        header: () => 'Total',
        cell: (info) => <Typography variant="body1">{formatRupiah(info.getValue())}</Typography>
      }),
      columnHelper.accessor('guid', {
        id: 'actions_hotel',
        header: () => 'Aksi',
        cell: (info) => {
          return (
            <Box display="flex" justifyContent="center" gap={1}>
              <TransactionDialog
                transactionId={info.row.original.guid}
                transaction={info.row.original}
                products={products}
                loading={loading}
                fetchData={fetchData}
              />
              <Tooltip title="detail">
                <IconButton
                  color="error"
                  onClick={() => navigate(`/transaction/detail/${info.row.original.guid}`)}
                >
                  <Eye width={22} />
                </IconButton>
              </Tooltip>
              {permissions?.delete && (
                <Tooltip title="Hapus">
                  <IconButton color="error" onClick={() => handleDeleteClick(info?.row?.original)}>
                    <IconTrash width={22} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )
        }
      })
    ]
  } else {
    columns = [
      // Column definitions
      {
        id: 'expand',
        header: () => null, // Empty header
        cell: (info) => {
          // console.log('openRows:', openRows); // Debugging to check the state
          return (
            <IconButton onClick={() => handleRowToggle(info.row.index)}>
              {openRows[info.row.index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )
        }
      },
      // columnHelper.accessor('rowIndex', {
      //     header: () => 'No',
      //     cell: info => (
      //         <Typography variant="body1">{info.row.index + 1}</Typography> // Adding 1 to start from 1 instead of 0
      //     ),
      // }),
      columnHelper.accessor('transaction_no', {
        header: () => 'ID Transaksi',
        cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
      }),
      columnHelper.accessor('booking_id', {
        header: () => 'Kode Pesananan',
        cell: (info) => (
          <Typography variant="body1">
            {info.getValue() || info.row.original.ticket.booking_id}
          </Typography>
        )
      }),
      columnHelper.accessor('created_at', {
        header: () => 'Tanggal',
        cell: (info) => (
          <Typography variant="body1">
            {formatDateTime(info.getValue() || info.row.original.booking_date)}
          </Typography>
        )
      }),
      columnHelper.accessor('reservation_name', {
        header: () => 'Nama Pelanggan',
        cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
      }),
      ...(localStorage.getItem('outletCategoryId') === 15
        ? [
            columnHelper.accessor('no_polisi', {
              header: () => 'No Polisi',
              cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
            })
          ]
        : []),
      columnHelper.accessor('sub_total', {
        header: () => 'Sub Total',
        cell: (info) => <Typography variant="body1">{formatRupiah(info.getValue())}</Typography>
      }),
      columnHelper.accessor('discount_nominal', {
        header: () => 'Diskon',
        cell: (info) => <Typography variant="body1">{formatRupiah(info.getValue())}</Typography>
      }),
      columnHelper.accessor('grand_total', {
        header: () => 'Grand Total',
        cell: (info) => <Typography variant="body1">{formatRupiah(info.getValue())}</Typography>
      }),
      columnHelper.accessor('status', {
        header: () => 'Status',
        cell: (info) => (
          <Chip
            size="small"
            label={getStatusLabel(info.getValue())}
            color={
              info.getValue() === 'PAID' || info.getValue() === 'SUCCESS' ? 'success' : 'error'
            }
            sx={{ borderRadius: '6px' }}
          />
        )
      }),
      columnHelper.accessor('notes', {
        header: () => 'Catatan',
        cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
      }),
      columnHelper.accessor('guid', {
        id: 'actions_other',
        header: () => 'Aksi',
        cell: (info) => {
          return (
            <Box display="flex" justifyContent="center" gap={1}>
              <TransactionDialog
                transactionId={info.row.original.guid}
                transaction={info.row.original}
                products={products}
                loading={loading}
                fetchData={fetchData}
              />
              {permissions?.delete && (
                <Tooltip title="Hapus">
                  <IconButton color="error" onClick={() => handleDeleteClick(info?.row?.original)}>
                    <IconTrash width={22} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )
        }
      })
    ]
  }

  // Initialize react-table
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination: { pageIndex: page - 1, pageSize },
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true
  })

  return (
    <Box>
      {/* Network Status Indicator */}
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          📴 Anda sedang offline. Data ditampilkan dari cache.
        </Alert>
      )}

      <Breadcrumb
        title="Riwayat Transaksi"
        items={[
          {
            to: '/',
            title: 'Home'
          },
          {
            title: 'Transaksi'
          },
          {
            title: 'Riwayat Transaksi'
          }
        ]}
      />
      <Stack direction="row" spacing={2} mb={3} justifyContent="space-between" alignItems="center">
        <Box></Box>
        <Button
          variant="contained"
          startIcon={<IconPlus size={20} />}
          onClick={() => {
            navigate('/transaction/create')
            // if (localStorage.getItem('outletCategoryId') == 1) {
            //   navigate('/transaction/instore')
            // } else {
            //   navigate('/transaction/create')
            // }
          }}
        >
          Transaksi Baru
        </Button>
      </Stack>
      <Grid size={{ xs: 12 }}>
        <Box>
          {/* Date Filter Inputs */}
          <Box>
            <Grid container spacing={2}>
              {/* Start Date Column */}
              <Grid size={{ xs: 3 }}>
                <FormControl fullWidth variant="outlined">
                  <FormLabel htmlFor="start-date">Tanggal Mulai</FormLabel>
                  <TextField
                    id="start-date"
                    type="date"
                    variant="outlined"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    InputLabelProps={{ shrink: true }} // Ensures label is always visible
                  />
                </FormControl>
              </Grid>

              {/* End Date Column */}
              <Grid size={{ xs: 3 }}>
                <FormControl fullWidth variant="outlined">
                  <FormLabel htmlFor="end-date">Tanggal Akhir</FormLabel>
                  <TextField
                    id="end-date"
                    type="date"
                    variant="outlined"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    InputLabelProps={{ shrink: true }} // Ensures label is always visible
                  />
                </FormControl>
              </Grid>
              {/* End Date Column */}
              <Grid size={{ xs: 3 }}>
                <FormControl fullWidth variant="outlined">
                  <FormLabel htmlFor="status-select">Pilih Status</FormLabel>
                  <Select
                    label="Pilih Status"
                    labelId="status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Fetch Button Column */}
              <Grid size={{ xs: 3 }} display="flex" alignItems="center">
                {' '}
                {/* Center the button vertically */}
                <Button
                  variant="contained"
                  onClick={() => fetchData()}
                  disabled={!startDate || !endDate}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Fetch Data
                </Button>
              </Grid>
            </Grid>
          </Box>
          {/* Search Input */}
          <Grid container alignItems="center">
            <Grid size={{ xs: 4 }} pt={2} pr={1.8}>
              <TextField
                variant="outlined"
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                sx={{ mb: 2, mr: 2, width: '100%' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchData() // Memicu pencarian saat tekan "Enter"
                  }
                }}
              />
            </Grid>
            {/* Outlet Select Box */}
            <Grid size={{ xs: 4 }} pl={0.5} pr={0.7}>
              <Autocomplete
                value={products.find((product) => product.guid === productId) || null} // Find the product by GUID
                onChange={(_event, newValue) => {
                  setProductId(newValue?.guid || '') // Set productId to the new value's guid or empty string
                }}
                options={products} // List of product options
                onInputChange={(event, value) => handleInputChange(event, value)}
                getOptionLabel={(option) => option?.name || ''} // Ensure name exists, fallback to empty string
                isOptionEqualToValue={(option, value) => option?.id === value?.id} // Compare by id, handle potential null values
                loading={loadingProduct} // Show loading indicator when fetching products
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pilih Produk"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingProduct ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                noOptionsText={loadingProduct ? 'Searching...' : 'Produk tidak ditemukan'} // Handle no options case
              />
            </Grid>
            {/* Outlet Select Box */}
            <Grid size={{ xs: 4 }} pl={1.2}>
              {categories && (
                <Autocomplete
                  value={categories.find((category) => category.guid === categoryId) || null} // Find the category by GUID
                  onChange={(_event, newValue) => {
                    setCategoryId(newValue ? newValue.guid : '')
                  }}
                  options={categories}
                  getOptionLabel={(option) => option.category_name || ''} // Adjust this according to your API response
                  isOptionEqualToValue={(option, value) => option.guid === value.guid} // Compare options by id
                  loading={loading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Pilih Kategori"
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
              )}
            </Grid>
          </Grid>

          <TableContainer>
            <Table>
              <TableHead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableCell key={header.id}>
                        <Box
                          onClick={header.column.getToggleSortingHandler()}
                          sx={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1, // Memberi jarak antara teks dan icon
                            '&:hover': {
                              color: 'primary.main' // Warna saat hover
                            }
                          }}
                        >
                          <Typography variant="h6" mb={1}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </Typography>
                          {header.column.getCanSort() && (
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column'
                              }}
                            >
                              <ExpandLessIcon
                                sx={{
                                  fontSize: 18,
                                  opacity: header.column.getIsSorted() === 'asc' ? 1 : 0.3,
                                  mb: -0.5
                                }}
                              />
                              <ExpandMoreIcon
                                sx={{
                                  fontSize: 18,
                                  opacity: header.column.getIsSorted() === 'desc' ? 1 : 0.3,
                                  mt: -0.5
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableHead>
              <TableBody>
                {loadingTrx ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      <CircularProgress />
                      <Typography>Loading...</Typography>
                    </TableCell>
                  </TableRow>
                ) : data.length > 0 ? (
                  table.getRowModel().rows.map(
                    (
                      row,
                      rowIndex // Get rowIndex here
                    ) => (
                      <React.Fragment key={row.id}>
                        {/* Main Row */}
                        <TableRow>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>

                        {/* Details Row */}
                        {localStorage.getItem('outletCategoryId') !== 1 && (
                          <TableRow>
                            <TableCell
                              sx={{ paddingBottom: 0, paddingTop: 0 }}
                              colSpan={columns.length}
                            >
                              <Collapse in={openRows[rowIndex]} timeout="auto" unmountOnExit>
                                <Box margin={1}>
                                  <Typography
                                    gutterBottom
                                    variant="h5"
                                    sx={{
                                      mt: 2,
                                      backgroundColor: (theme) => theme.palette.grey[100],
                                      p: '5px 15px',
                                      color: (theme) =>
                                        theme.palette.mode === 'dark'
                                          ? theme.palette.grey.A200
                                          : 'rgba(0, 0, 0, 0.87)'
                                    }}
                                  >
                                    Item Terjual
                                  </Typography>
                                  <Table size="small" aria-label="purchases">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>
                                          <Typography variant="h6">Nama</Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="h6">Satuan</Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="h6">Jumlah</Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="h6">Harga</Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="h6">Sub Total</Typography>
                                        </TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {Array.isArray(row.original.transaction_item) &&
                                      row.original.transaction_item.length > 0 ? (
                                        row.original.transaction_item.map((item, index) => (
                                          <TableRow key={index}>
                                            <TableCell>
                                              <Typography color="textSecondary" fontWeight="400">
                                                {item.name}
                                              </Typography>
                                            </TableCell>
                                            <TableCell>
                                              <Typography color="textSecondary" fontWeight="400">
                                                {item.satuan}
                                              </Typography>
                                            </TableCell>
                                            <TableCell>
                                              <Typography color="textSecondary" fontWeight="400">
                                                {item.qty}
                                              </Typography>
                                            </TableCell>
                                            <TableCell>
                                              <Typography color="textSecondary" fontWeight="400">
                                                {formatRupiah(item.price)}
                                              </Typography>
                                            </TableCell>
                                            <TableCell>
                                              <Typography fontWeight="600">
                                                {formatRupiah(item.sub_total)}
                                              </Typography>
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      ) : (
                                        <TableRow>
                                          <TableCell colSpan={5} align="center">
                                            <Typography color="textSecondary" fontWeight="400">
                                              No transaction items available
                                            </Typography>
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      <Typography color="textPrimary">No data available</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={openDialog} onClose={handleCancelDelete}>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogContent>
              <DialogContentText>Apakah Anda yakin ingin menghapus item ini?</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelDelete} color="primary">
                Batal
              </Button>
              <Button onClick={handleConfirmDelete} color="secondary">
                Hapus
              </Button>
            </DialogActions>
          </Dialog>

          <Divider />
          <Stack
            gap={1}
            p={3}
            alignItems="center"
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
          >
            <Typography variant="body1" color="textPrimary">
              {totalCount} Rows
            </Typography>

            <Stack direction="row" alignItems="center" gap={1}>
              <IconButton size="small" onClick={() => setPage(1)} disabled={page === 1}>
                <IconChevronsLeft />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setPage((prev) => prev - 1)}
                disabled={page === 1}
              >
                <IconChevronLeft />
              </IconButton>
              <Typography variant="body1" color="textPrimary">
                Page {page} of {pageCount}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page === pageCount}
              >
                <IconChevronRight />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setPage(pageCount)}
                disabled={page === pageCount}
              >
                <IconChevronsRight />
              </IconButton>
            </Stack>

            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="body1" color="textPrimary">
                Rows per page:
              </Typography>
              <Select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                {[10, 15, 20, 25].map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>
        </Box>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
