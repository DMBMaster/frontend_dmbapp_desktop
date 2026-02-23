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
  InputAdornment
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
  IconList,
  IconPlus,
  IconUpload,
  IconTrash,
  IconWifi,
  IconWifiOff
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatDateTime, formatRupiah, getImgUrl } from '@renderer/utils/myFunctions'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { listOutlets } from '@renderer/utils/config'
import { PictureAsPdf } from '@mui/icons-material'

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Pengeluaran' }]

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  }
}

export const ExpensesPage = () => {
  const {
    data,
    loading,
    categoryData,
    employeeData,
    fetchData,
    openModal,
    handleOpenModal,
    handleCloseModal,
    formData,
    previewImage,
    handleChange,
    handleSelectChange,
    handleNominalChange,
    handleFileChange,
    handleRemoveImage,
    handleSubmit,
    formatNominal,
    isOnline,
    pendingCount,
    syncPendingExpenses,
    exportToPDF,
    exportToExcel,
    pageParams,
    setPageParams
  } = UseIndex()

  const {
    page,
    pageSize,
    totalCount,
    pageCount,
    searchTerm,
    outletId,
    startDate,
    endDate,
    categoryId,
    employeeId,
    status
  } = pageParams

  const navigate = useNavigate()
  const [sorting, setSorting] = useState([])

  // Image preview dialog
  const [openPreview, setOpenPreview] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')

  // Tab index: 0=Semua, 1=Pending, 2=Approve, 3=Reject
  const selectedTab = status === '' ? 0 : status

  const handleTabChange = (_, newValue) => {
    // newValue: 0,1,2,3
    setPageParams((prev) => ({
      ...prev,
      status: newValue === 0 ? '' : newValue,
      page: 1
    }))
  }

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

  const getStatusChip = (status) => {
    if (status === 2) return <Chip label="Approve" color="success" size="small" />
    if (status === 3) return <Chip label="Reject" color="error" size="small" />
    return <Chip label="Pending" color="warning" size="small" />
  }

  // Column helper
  const columnHelper = createColumnHelper()

  const columns = useMemo(
    () => [
      columnHelper.accessor('reference_number', {
        enableSorting: true,
        header: () => (
          <Typography variant="body2" fontWeight="bold">
            Nomor Referensi
          </Typography>
        ),
        cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
      }),
      columnHelper.accessor('created_at', {
        enableSorting: true,
        header: () => (
          <Typography variant="body2" fontWeight="bold">
            Waktu Input
          </Typography>
        ),
        cell: (info) => <Typography variant="body2">{formatDateTime(info.getValue())}</Typography>
      }),
      columnHelper.accessor('outlet_detail.outlet.outlet_name', {
        enableSorting: true,
        header: () => (
          <Typography variant="body2" fontWeight="bold">
            Outlet
          </Typography>
        ),
        cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
      }),
      columnHelper.accessor('date', {
        enableSorting: true,
        header: () => (
          <Typography variant="body2" fontWeight="bold">
            Tanggal
          </Typography>
        ),
        cell: (info) => <Typography variant="body2">{formatDate(info.getValue())}</Typography>
      }),
      columnHelper.accessor('user_full_name', {
        enableSorting: true,
        header: () => (
          <Typography variant="body2" fontWeight="bold">
            Dibuat
          </Typography>
        ),
        cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
      }),
      columnHelper.accessor('category_name', {
        enableSorting: true,
        header: () => (
          <Typography variant="body2" fontWeight="bold">
            Kategori
          </Typography>
        ),
        cell: (info) => <Typography variant="body2">{getCategoryName(info.getValue())}</Typography>
      }),
      columnHelper.accessor('description', {
        enableSorting: true,
        header: () => (
          <Typography variant="body2" fontWeight="bold">
            Rincian
          </Typography>
        ),
        cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
      }),
      columnHelper.accessor('nominal', {
        enableSorting: true,
        header: () => (
          <Typography variant="body2" fontWeight="bold">
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
          <Typography variant="body2" fontWeight="bold">
            Bukti
          </Typography>
        ),
        cell: (info) => {
          const receiptPath = info.getValue()
          if (!receiptPath) {
            return (
              <Typography variant="body2" color="text.secondary">
                Tidak ada bukti
              </Typography>
            )
          }

          const normalizedPath = receiptPath.replace('/file/', '/')
          const fullUrl = getImgUrl(normalizedPath)
          const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(normalizedPath || '')

          if (isImage) {
            return (
              <img
                src={fullUrl}
                alt="Bukti"
                style={{
                  width: 40,
                  height: 40,
                  cursor: 'pointer',
                  objectFit: 'cover',
                  borderRadius: 4
                }}
                onClick={() => {
                  setPreviewImageUrl(fullUrl)
                  setOpenPreview(true)
                }}
              />
            )
          }

          return (
            <a href={fullUrl} target="_blank" rel="noopener noreferrer">
              <PictureAsPdf fontSize="small" />
            </a>
          )
        }
      }),
      columnHelper.accessor('status', {
        enableSorting: false,
        header: () => (
          <Typography variant="body2" fontWeight="bold">
            Status
          </Typography>
        ),
        cell: (info) => getStatusChip(info.getValue())
      }),
      columnHelper.accessor('guid', {
        enableSorting: false,
        header: () => (
          <Typography variant="body2" fontWeight="bold">
            Aksi
          </Typography>
        ),
        cell: (info) => (
          <Box display="flex" justifyContent="center">
            <IconButton
              color="primary"
              size="small"
              onClick={() => navigate(`/expenses/detail/${info.getValue()}`)}
            >
              <IconEye width={22} />
            </IconButton>
          </Box>
        )
      })
    ],
    []
  )

  // React Table instance — pakai data langsung dari server (filtering sudah server-side)
  const table = useReactTable({
    data,
    columns,
    pageCount: pageParams.pageCount,
    state: {
      pagination: {
        pageIndex: pageParams.page - 1,
        pageSize: pageParams.pageSize
      },
      sorting
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex: pageParams.page - 1, pageSize: pageParams.pageSize })
          : updater
      setPageParams((prev) => ({
        ...prev,
        page: next.pageIndex + 1,
        pageSize: next.pageSize
      }))
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true
  })

  // Outlet options untuk Autocomplete
  const selectedOutletOption = listOutlets.find((o) => o?.outlet?.guid === outletId) || null

  return (
    <Box>
      <Breadcrumb title="Riwayat Pengeluaran" items={BCrumb} />

      {/* Header Actions */}
      <Stack direction="row" spacing={2} mb={3} justifyContent="space-between" alignItems="center">
        <Box>
          {pendingCount > 0 && (
            <Chip
              icon={<IconWifiOff size={16} />}
              label={`${pendingCount} pending (klik untuk sync)`}
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
          {/* ===== Filter Section ===== */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2}>
              {/* Outlet — hanya tampil jika lebih dari 1 outlet */}
              {listOutlets && listOutlets.length > 1 && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <Autocomplete
                    value={selectedOutletOption}
                    onChange={(_, newValue) => {
                      setPageParams((prev) => ({
                        ...prev,
                        outletId: newValue?.guid || '',
                        page: 1
                      }))
                    }}
                    options={listOutlets}
                    getOptionLabel={(option) => option?.outlet?.outlet_name || option?.name || ''}
                    isOptionEqualToValue={(option, value) =>
                      option?.outlet?.guid === value?.outlet?.guid
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Pilih Outlet" fullWidth size="small" />
                    )}
                  />
                </Grid>
              )}

              {/* Tanggal Mulai */}
              <Grid size={{ xs: 12, md: listOutlets && listOutlets.length > 1 ? 4 : 6 }}>
                <TextField
                  label="Tanggal Mulai"
                  type="date"
                  fullWidth
                  size="small"
                  value={startDate}
                  onChange={(e) =>
                    setPageParams((prev) => ({ ...prev, startDate: e.target.value, page: 1 }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Tanggal Akhir */}
              <Grid size={{ xs: 12, md: listOutlets && listOutlets.length > 1 ? 4 : 6 }}>
                <TextField
                  label="Tanggal Akhir"
                  type="date"
                  fullWidth
                  size="small"
                  value={endDate}
                  onChange={(e) =>
                    setPageParams((prev) => ({ ...prev, endDate: e.target.value, page: 1 }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Filter Kategori */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  loading={loading.fetchCategoryData}
                  value={categoryData.find((c) => c.guid === categoryId) || null}
                  onChange={(_, newValue) => {
                    setPageParams((prev) => ({
                      ...prev,
                      categoryId: newValue ? newValue.guid : '',
                      page: 1
                    }))
                  }}
                  options={categoryData}
                  getOptionLabel={(option) => option.name || ''}
                  isOptionEqualToValue={(option, value) => option.guid === value.guid}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter Kategori"
                      fullWidth
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loading.fetchCategoryData ? (
                              <CircularProgress color="inherit" size={18} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Filter Karyawan */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  loading={loading.fetchEmployeeData}
                  value={employeeData.find((e) => e.guid === employeeId) || null}
                  onChange={(_, newValue) => {
                    setPageParams((prev) => ({
                      ...prev,
                      employeeId: newValue ? newValue.guid : '',
                      page: 1
                    }))
                  }}
                  options={employeeData}
                  getOptionLabel={(option) => option.employee_name || option.name || ''}
                  isOptionEqualToValue={(option, value) => option.guid === value.guid}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter Karyawan"
                      fullWidth
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loading.fetchEmployeeData ? (
                              <CircularProgress color="inherit" size={18} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Tombol Fetch Data */}
              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  onClick={fetchData}
                  disabled={!startDate || !endDate || loading.fetchData}
                  fullWidth
                  size="large"
                >
                  {loading.fetchData ? 'Loading...' : 'FETCH DATA'}
                </Button>
              </Grid>

              {/* Search + Export */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Cari (Nomor Ref, Nama, Rincian, Kategori)"
                  value={searchTerm}
                  onChange={(e) =>
                    setPageParams((prev) => ({ ...prev, searchTerm: e.target.value, page: 1 }))
                  }
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
                  disabled={data.length === 0}
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
                  disabled={data.length === 0}
                  onClick={exportToExcel}
                >
                  Excel
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* ===== Table Section ===== */}
          <Paper elevation={0} sx={{ borderRadius: 2 }}>
            {/* Status Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 3 }}>
              <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                aria-label="expenses status tabs"
              >
                <Tab
                  iconPosition="start"
                  icon={<IconList size={18} />}
                  label="SEMUA"
                  {...a11yProps(0)}
                />
                <Tab
                  iconPosition="start"
                  icon={<IconFilterPause size={18} />}
                  label="PENDING"
                  {...a11yProps(1)}
                />
                <Tab
                  iconPosition="start"
                  icon={<IconFilterCheck size={18} />}
                  label="APPROVE"
                  {...a11yProps(2)}
                />
                <Tab
                  iconPosition="start"
                  icon={<IconFilterX size={18} />}
                  label="REJECT"
                  {...a11yProps(3)}
                />
              </Tabs>
            </Box>
            <Divider />

            {/* Table */}
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
                              cursor: header.column.getCanSort() ? 'pointer' : 'default',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              '&:hover': { color: 'primary.main' }
                            }}
                          >
                            <Typography variant="h6" mb={1}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </Typography>
                            {header.column.getCanSort() && (
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
                      <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={32} />
                        <Typography mt={1}>Memuat data...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : data.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} hover>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">Tidak ada data</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider />

            {/* Pagination */}
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
                <IconButton
                  size="small"
                  onClick={() => setPageParams((prev) => ({ ...prev, page: 1 }))}
                  disabled={page === 1}
                >
                  <IconChevronsLeft />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setPageParams((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={page === 1}
                >
                  <IconChevronLeft />
                </IconButton>
                <Typography variant="body1" color="textPrimary">
                  Page {page} of {pageCount || 1}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setPageParams((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={page >= pageCount}
                >
                  <IconChevronRight />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setPageParams((prev) => ({ ...prev, page: pageCount }))}
                  disabled={page >= pageCount}
                >
                  <IconChevronsRight />
                </IconButton>
              </Stack>

              <Stack direction="row" alignItems="center" gap={1}>
                <Typography variant="body1" color="textPrimary">
                  Rows per page:
                </Typography>
                <Select
                  value={pageSize}
                  onChange={(e) =>
                    setPageParams((prev) => ({
                      ...prev,
                      pageSize: Number(e.target.value),
                      page: 1
                    }))
                  }
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
      </Grid>

      {/* Image Preview Dialog */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
        <DialogContent>
          <img src={previewImageUrl} alt="Preview" style={{ width: '100%', height: 'auto' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreview(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* ===== CREATE EXPENSE MODAL ===== */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Pengeluaran Baru
            </Typography>
            <Chip
              icon={isOnline ? <IconWifi size={14} /> : <IconWifiOff size={14} />}
              label={isOnline ? 'Online' : 'Offline'}
              color={isOnline ? 'success' : 'error'}
              size="small"
            />
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
                    {categoryData.map((cat) => (
                      <MenuItem key={cat.guid || cat.id} value={cat.name}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Karyawan */}
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
                        {employee.employee_name || employee.name}
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

              {/* Deskripsi */}
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

              {/* Bukti */}
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
                      style={{ maxWidth: '100%', maxHeight: 150, display: 'block' }}
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
    </Box>
  )
}
