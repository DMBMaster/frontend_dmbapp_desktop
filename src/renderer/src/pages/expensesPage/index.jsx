import { useMemo, useState } from 'react'
import { UseIndex } from './hook/useIndex'
import {
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Chip,
  IconButton,
  Stack,
  MenuItem,
  Divider,
  Tab,
  Tabs,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Button,
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Snackbar,
  Alert
} from '@mui/material'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender
} from '@tanstack/react-table'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconEye,
  IconFilterCheck,
  IconFilterPause,
  IconFilterX,
  IconFileTypePdf,
  IconFileSpreadsheet,
  IconPlus,
  IconUpload,
  IconTrash,
  IconWifi,
  IconWifiOff
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatDateTime, formatRupiah, getImgUrl } from '@renderer/utils/myFunctions'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
const BCrumb = [
  {
    to: '/',
    title: 'Home'
  },
  {
    title: 'Pengeluaran'
  }
]

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  }
}

export const ExpensesPage = () => {
  const {
    // List data
    data,
    loading,
    outletsData,
    categoryData,
    employeeData,
    fetchData,
    // Modal
    openModal,
    handleOpenModal,
    handleCloseModal,
    // Form
    formData,
    previewImage,
    handleChange,
    handleSelectChange,
    handleNominalChange,
    handleFileChange,
    handleRemoveImage,
    handleSubmit,
    formatNominal,
    // Snackbar
    snackbar,
    handleCloseSnackbar,
    // Network & Pending
    isOnline,
    pendingCount,
    syncPendingExpenses,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    exportToPDF,
    exportToExcel
  } = UseIndex()

  const navigate = useNavigate()

  const [selectedStatusExpanses, setSelectedStatusExpanses] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState()

  // Filter states
  const [selectedOutlet, setSelectedOutlet] = useState(
    outletsData && outletsData.length > 0 ? outletsData[0] : null
  )

  const [filterCategory, setFilterCategory] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Image preview dialog
  const [openPreview, setOpenPreview] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')

  const baseURL = import.meta.env.VITE_API_URL || ''

  // Category filter options
  const categoryFilterOptions = useMemo(() => {
    const options = [{ value: '', label: 'Semua Kategori' }]
    if (categoryData && categoryData.length > 0) {
      categoryData.forEach((category) => {
        options.push({
          value: category.id.toString(),
          label: category.name
        })
      })
    }
    return options
  }, [categoryData])

  // Employee filter options
  const employeeOptions = useMemo(() => {
    const options = [{ value: '', label: 'Semua Karyawan' }]
    if (employeeData && employeeData.length > 0) {
      employeeData.forEach((employee) => {
        options.push({
          value: employee.guid,
          label: employee.employee_name
        })
      })
    }
    return options
  }, [employeeData])

  // Handle fetch data with filters
  const handleFetchData = () => {
    fetchData({
      outletId: selectedOutlet?.guid,
      startDate,
      endDate,
      categoryId: filterCategory,
      employeeId: filterEmployee
    })
  }

  // Get category name helper
  const getCategoryName = (categoryName) => {
    const categoryMap = {
      raw_material: 'Beli Bahan Baku',
      staff_lunch_costs: 'Uang Makan Karyawan',
      credit_and_data: 'Pulsa/Internet',
      utility: 'Utilitas (Listrik, Air, Gas)',
      staff_salary: 'Gaji Staf',
      rent: 'Sewa',
      cash_receipt: 'Kas Bon',
      debt: 'Utang',
      etc: 'Lainnya'
    }
    return categoryMap[categoryName] || categoryName || '-'
  }

  // Get status label
  const getStatusExpenses = (status) => {
    let color = 'warning'
    let label = 'Pending'

    if (status === 2) {
      color = 'success'
      label = 'Approve'
    } else if (status === 3) {
      color = 'error'
      label = 'Reject'
    }

    return <Chip label={label} color={color} size="small" />
  }

  // Filter data by status and search term
  const filteredData = useMemo(() => {
    let result = data

    // Filter by status
    if (selectedStatusExpanses !== 0) {
      result = result.filter((item) => item.status === selectedStatusExpanses)
    }

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(
        (item) =>
          item.reference_number?.toLowerCase().includes(searchLower) ||
          item.user_full_name?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          getCategoryName(item.category_name).toLowerCase().includes(searchLower)
      )
    }

    return result
  }, [data, selectedStatusExpanses, searchTerm])

  // Column helper
  const columnHelper = createColumnHelper()

  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('reference_number', {
        enableSorting: true,
        header: () => (
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Nomor Referensi
          </Typography>
        ),
        cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
      }),
      columnHelper.accessor('created_at', {
        enableSorting: true,
        header: () => (
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Waktu Input
          </Typography>
        ),
        cell: (info) => <Typography variant="body2">{formatDateTime(info.getValue())}</Typography>
      }),
      //   columnHelper.accessor('outlet_name', {
      //     enableSorting: true,
      //     header: () => (
      //       <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
      //         Outlet
      //       </Typography>
      //     ),
      //     cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
      //   }),
      columnHelper.accessor('date', {
        enableSorting: true,
        header: () => (
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Tanggal
          </Typography>
        ),
        cell: (info) => <Typography variant="body2">{formatDate(info.getValue())}</Typography>
      }),
      columnHelper.accessor('user_full_name', {
        enableSorting: true,
        header: () => (
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Dibuat
          </Typography>
        ),
        cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
      }),
      columnHelper.accessor('category_name', {
        enableSorting: true,
        header: () => (
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Kategori
          </Typography>
        ),
        cell: (info) => <Typography variant="body2">{getCategoryName(info.getValue())}</Typography>
      }),
      columnHelper.accessor('description', {
        enableSorting: true,
        header: () => (
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Rincian
          </Typography>
        ),
        cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
      }),
      columnHelper.accessor('nominal', {
        enableSorting: true,
        header: () => (
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Nominal
          </Typography>
        ),
        cell: (info) => (
          <Typography variant="body2">{formatRupiah(Number(info.getValue()))}</Typography>
        )
      }),
      columnHelper.accessor('receipt', {
        enableSorting: false,
        header: () => (
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Bukti
          </Typography>
        ),
        cell: (info) => {
          const receipt = info.getValue()
          if (!receipt) return <Typography variant="body2">-</Typography>

          const imageUrl = `${getImgUrl(receipt)}`

          const handleImageClick = () => {
            setPreviewImageUrl(imageUrl)
            setOpenPreview(true)
          }

          return (
            <img
              src={imageUrl}
              alt="Receipt"
              style={{
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                objectFit: 'cover',
                borderRadius: '4px'
              }}
              onClick={handleImageClick}
            />
          )
        }
      }),
      columnHelper.accessor('status', {
        header: () => (
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Status
          </Typography>
        ),
        cell: (info) => getStatusExpenses(info.getValue())
      }),
      columnHelper.accessor('guid', {
        header: () => (
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Aksi
          </Typography>
        ),
        cell: (info) => {
          return (
            <Box display="flex" justifyContent="center" gap={1}>
              <IconButton
                color="primary"
                onClick={() => {
                  navigate(`/expenses/detail/${info.getValue()}`)
                }}
              >
                <IconEye width={22} />
              </IconButton>
            </Box>
          )
        }
      })
    ],
    [baseURL]
  )

  // Calculate pagination
  const totalCount = filteredData.length
  const pageCount = Math.ceil(totalCount / pageSize)

  // React Table instance
  const table = useReactTable({
    data: filteredData,
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
    manualPagination: false
  })

  return (
    <Box>
      <Breadcrumb title="Riwayat Pengeluaran" items={BCrumb} />
      <Stack direction="row" spacing={2} mb={3} justifyContent="space-between" alignItems="center">
        {/* Network & Pending Status */}
        <Box>
          {pendingCount > 0 && (
            <Chip
              icon={<IconWifiOff size={16} />}
              label={`${pendingCount} pending`}
              color="warning"
              size="small"
              onClick={isOnline ? syncPendingExpenses : undefined}
              sx={{ cursor: isOnline ? 'pointer' : 'default' }}
            />
          )}
        </Box>
        <Button variant="contained" startIcon={<IconPlus size={20} />} onClick={handleOpenModal}>
          Pengeluaran Baru
        </Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          {/* Filter Section */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2}>
              {/* Row 1: Outlet, Tanggal Mulai, Tanggal Akhir */}
              {outletsData && outletsData.length > 1 && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <Autocomplete
                    value={selectedOutlet}
                    onChange={(_, newValue) => {
                      setSelectedOutlet(newValue)
                    }}
                    options={outletsData}
                    getOptionLabel={(option) => option?.name || ''}
                    isOptionEqualToValue={(option, value) => option?.guid === value?.guid}
                    renderInput={(params) => (
                      <TextField {...params} label="Pilih Outlet" fullWidth variant="outlined" />
                    )}
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12, md: outletsData && outletsData.length > 1 ? 4 : 6 }}>
                <TextField
                  id="start-date"
                  label="Tanggal Mulai"
                  type="date"
                  fullWidth
                  variant="outlined"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: outletsData && outletsData.length > 1 ? 4 : 6 }}>
                <TextField
                  id="end-date"
                  label="Tanggal Akhir"
                  type="date"
                  fullWidth
                  variant="outlined"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Row 2: Filter Kategori, Filter Karyawan */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth variant="outlined">
                  <Select
                    labelId="category-filter-label"
                    id="category-filter"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    displayEmpty
                  >
                    {categoryFilterOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth variant="outlined">
                  <Select
                    labelId="employee-filter-label"
                    id="employee-filter"
                    value={filterEmployee}
                    onChange={(e) => setFilterEmployee(e.target.value)}
                    displayEmpty
                  >
                    {employeeOptions.map((employee) => (
                      <MenuItem key={employee.value} value={employee.value}>
                        {employee.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Row 3: Fetch Data Button */}
              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  onClick={handleFetchData}
                  disabled={!startDate || !endDate || loading.fetchData}
                  fullWidth
                  size="large"
                >
                  {loading.fetchData ? 'Loading...' : 'FETCH DATA'}
                </Button>
              </Grid>

              {/* Row 4: Search & Export Buttons */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  variant="outlined"
                  placeholder="Cari (Nomor Ref, Nama, Rincian, Kategori)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<IconFileTypePdf size={20} />}
                  fullWidth
                  onClick={exportToPDF}
                  sx={{ height: '100%' }}
                  disabled={filteredData.length === 0}
                >
                  Export PDF
                </Button>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<IconFileSpreadsheet size={20} />}
                  fullWidth
                  sx={{ height: '100%' }}
                  disabled={filteredData.length === 0}
                  onClick={exportToExcel}
                >
                  Excel
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Table Section */}
          <Paper elevation={0} sx={{ borderRadius: 2 }}>
            {/* Header with Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 3 }}>
              <Tabs
                value={selectedStatusExpanses}
                onChange={(_, newValue) => setSelectedStatusExpanses(newValue)}
                aria-label="expenses status tabs"
              >
                <Tab iconPosition="start" label="SEMUA" {...a11yProps(0)} />
                <Tab
                  iconPosition="start"
                  icon={<IconFilterPause size="18" />}
                  label="PENDING"
                  {...a11yProps(1)}
                />
                <Tab
                  iconPosition="start"
                  icon={<IconFilterCheck size="18" />}
                  label="APPROVE"
                  {...a11yProps(2)}
                />
                <Tab
                  iconPosition="start"
                  icon={<IconFilterX size="18" />}
                  label="REJECT"
                  {...a11yProps(3)}
                />
              </Tabs>
            </Box>
            <Divider />

            {/* Table Section */}
            <TableContainer sx={{ px: 2 }}>
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
                              gap: 1,
                              '&:hover': {
                                color: 'primary.main'
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
                  {loading.fetchData ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center">
                        <CircularProgress />
                        <Typography>Loading...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center">
                        <Typography>No data available</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider />

            {/* Pagination Section */}
            <Stack
              gap={1}
              p={3}
              alignItems="center"
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
            >
              <Typography variant="body1">{totalCount} Rows</Typography>

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
                <Typography>
                  Page {page} of {pageCount || 1}
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
                <Typography>Rows per page:</Typography>
                <Select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  size="small"
                >
                  {[10, 15, 20, 25, 50, 100, 200, 300, 400, 500].map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            </Stack>
          </Paper>

          {/* Image Preview Dialog */}
          <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
            <DialogContent>
              <img src={previewImageUrl} alt="Preview" style={{ width: '100%', height: 'auto' }} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenPreview(false)} color="primary">
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Grid>
      </Grid>

      {/* ========== CREATE EXPENSE MODAL ========== */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Pengeluaran Baru
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              {isOnline ? (
                <Chip icon={<IconWifi size={14} />} label="Online" color="success" size="small" />
              ) : (
                <Chip icon={<IconWifiOff size={14} />} label="Offline" color="error" size="small" />
              )}
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* Tanggal */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Tanggal"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  size="small"
                />
              </Grid>

              {/* Kategori */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Kategori</InputLabel>
                  <Select
                    name="category_name"
                    value={formData.category_name}
                    label="Kategori"
                    onChange={(e) => handleSelectChange('category_name', e.target.value)}
                  >
                    {/* Use dynamic categories from API if available, fallback to static */}
                    {categoryData &&
                      categoryData.length > 0 &&
                      categoryData.map((cat) => (
                        <MenuItem key={cat.guid || cat.id} value={cat.name}>
                          {cat.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Karyawan (Optional) */}
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Karyawan (Opsional)</InputLabel>
                  <Select
                    name="employee_id"
                    value={formData.employee_id}
                    label="Karyawan (Opsional)"
                    onChange={(e) => handleSelectChange('employee_id', e.target.value)}
                    disabled={loading.fetchEmployeeData}
                  >
                    <MenuItem value="">-- Tidak Ada --</MenuItem>
                    {employeeData.map((employee) => (
                      <MenuItem key={employee.guid} value={employee.guid}>
                        {employee.employee_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Nominal */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Nominal"
                  name="nominal"
                  value={formatNominal(formData.nominal)}
                  onChange={handleNominalChange}
                  required
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                  }}
                  placeholder="0"
                />
              </Grid>

              {/* Deskripsi / Rincian */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Rincian / Deskripsi"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  multiline
                  rows={3}
                  size="small"
                  placeholder="Masukkan rincian pengeluaran..."
                />
              </Grid>

              {/* Bukti / Receipt */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Bukti Pengeluaran (Opsional)
                </Typography>

                {!previewImage ? (
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<IconUpload size={18} />}
                    fullWidth
                    sx={{ py: 1.5, borderStyle: 'dashed' }}
                  >
                    Upload Gambar Bukti
                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                  </Button>
                ) : (
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'inline-block',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={previewImage}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 150,
                        display: 'block'
                      }}
                    />
                    <IconButton
                      onClick={handleRemoveImage}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'error.dark' }
                      }}
                    >
                      <IconTrash size={14} />
                    </IconButton>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} disabled={loading.submit}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading.submit}
            startIcon={loading.submit ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {loading.submit ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
