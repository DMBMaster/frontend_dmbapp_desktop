import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconEdit,
  IconPlus,
  IconTrash
} from '@tabler/icons-react'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import ExpensesCategoryService from '@renderer/services/expensesCategoryService'
import { useNetworkStore } from '@renderer/store/networkStore'
import { usePermissions } from '@renderer/store/usePermission'
import { userRole } from '@renderer/utils/config'
import { useDebounce } from '@uidotdev/usehooks'

const initialFormData = {
  name: '',
  description: '',
  limitAmount: '',
  limitPeriod: 'Monthly'
}

const limitPeriodOptions = [
  { label: 'Harian', value: 'Daily' },
  { label: 'Mingguan', value: 'Weekly' },
  { label: 'Bulanan', value: 'Monthly' },
  { label: 'Tahunan', value: 'Yearly' }
]

const formatCurrency = (value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return 'Tanpa Limit'
  return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`
}

export const ExpensesCategoryPage = () => {
  const permissions = usePermissions(userRole)
  const isOnline = useNetworkStore((state) => state.isOnline)
  const expensesCategoryService = ExpensesCategoryService()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500)

  const [openFormDialog, setOpenFormDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedGuid, setSelectedGuid] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(initialFormData)

  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const rowsPerPageOptions = useMemo(() => [10, 25, 50], [])

  const showMessage = (message, severity = 'success') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  const fetchData = useCallback(async () => {
    if (!permissions.read) return

    setLoading(true)
    try {
      const outletId = localStorage.getItem('outletGuid') || localStorage.getItem('outletId')
      const params = {
        p: page,
        ps: pageSize,
        outletId,
        search: debouncedSearch?.trim() || undefined
      }

      const response = await expensesCategoryService.getExpensesCategories(params)
      const list = Array.isArray(response?.data) ? response.data : []
      const meta = response?.meta || {}

      const nextTotal = Number(meta?.total ?? meta?.totalCount ?? list.length)
      const safeTotal = Number.isFinite(nextTotal) ? nextTotal : list.length
      const nextPageCount = Number(meta?.lastPage ?? meta?.pageCount ?? 0)
      const safePageCount =
        nextPageCount > 0 ? nextPageCount : Math.max(1, Math.ceil(safeTotal / pageSize))

      setData(list)
      setTotalCount(safeTotal)
      setPageCount(safePageCount)
    } catch (error) {
      showMessage(
        error?.response?.data?.message || 'Gagal mengambil data kategori pengeluaran.',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, expensesCategoryService, page, pageSize, permissions.read])

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreate = () => {
    setIsEditing(false)
    setSelectedGuid('')
    setFormData(initialFormData)
    setOpenFormDialog(true)
  }

  const handleOpenEdit = (row) => {
    setIsEditing(true)
    setSelectedGuid(row?.guid || '')
    setFormData({
      name: row?.name || '',
      description: row?.description || '',
      limitAmount: row?.limitAmount ? String(row.limitAmount) : '',
      limitPeriod: row?.limitPeriod || 'Monthly'
    })
    setOpenFormDialog(true)
  }

  const handleCloseForm = () => {
    setOpenFormDialog(false)
    setFormData(initialFormData)
  }

  const handleSubmit = async () => {
    if (!formData.name?.trim()) {
      showMessage('Nama kategori wajib diisi.', 'error')
      return
    }

    const outletId = localStorage.getItem('outletGuid') || localStorage.getItem('outletId')
    const payload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      limitAmount: formData.limitAmount ? Number(formData.limitAmount) : null,
      limitPeriod: formData.limitPeriod || 'Monthly',
      outletId
    }

    try {
      if (isEditing && selectedGuid) {
        await expensesCategoryService.updateExpensesCategory(selectedGuid, payload)
        showMessage('Kategori berhasil diperbarui.')
      } else {
        await expensesCategoryService.createExpensesCategory(payload)
        showMessage('Kategori berhasil ditambahkan.')
      }

      handleCloseForm()
      fetchData()
    } catch (error) {
      showMessage(error?.response?.data?.message || 'Gagal menyimpan kategori.', 'error')
    }
  }

  const handleDeleteClick = (guid) => {
    setSelectedGuid(guid)
    setOpenDeleteDialog(true)
  }

  const handleDelete = async () => {
    try {
      await expensesCategoryService.deleteExpensesCategory(selectedGuid)
      setOpenDeleteDialog(false)
      showMessage('Kategori berhasil dihapus.')
      fetchData()
    } catch (error) {
      showMessage(error?.response?.data?.message || 'Gagal menghapus kategori.', 'error')
    }
  }

  return permissions.read ? (
    <Box>
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Anda sedang offline. Data kategori ditampilkan dari cache.
        </Alert>
      )}

      <Breadcrumb
        title="Kategori Pengeluaran"
        subtitle="Kelola kategori untuk transaksi pengeluaran"
        items={[
          { to: '/', title: 'Home' },
          { to: '/expenses', title: 'Pengeluaran' },
          { title: 'Kategori Pengeluaran' }
        ]}
      />

      <Stack direction="row" spacing={2} mb={3} justifyContent="space-between" alignItems="center">
        <TextField
          variant="outlined"
          size="small"
          label="Cari kategori"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPage(1)
          }}
          sx={{ width: { xs: '100%', md: 340 } }}
        />
        {permissions.create && (
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={handleOpenCreate}>
            Tambah Kategori
          </Button>
        )}
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="h6">Nama Kategori</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="h6">Deskripsi</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="h6">Limit Pengeluaran</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="h6">Periode</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="h6">Aksi</Typography>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                    <Typography mt={1}>Memuat data...</Typography>
                  </TableCell>
                </TableRow>
              ) : data.length > 0 ? (
                data.map((row) => (
                  <TableRow hover key={row.guid || row.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {row.name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.description || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatCurrency(row.limitAmount)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.limitPeriod || '-'}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" justifyContent="center">
                        {permissions.update && (
                          <IconButton color="primary" onClick={() => handleOpenEdit(row)}>
                            <IconEdit size={18} />
                          </IconButton>
                        )}
                        {permissions.delete && (
                          <IconButton color="error" onClick={() => handleDeleteClick(row.guid)}>
                            <IconTrash size={18} />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      Belum ada data kategori pengeluaran
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

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
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              <IconChevronLeft />
            </IconButton>
            <Typography variant="body1" color="textPrimary">
              Page {page} of {pageCount || 1}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              disabled={page >= pageCount}
            >
              <IconChevronRight />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setPage(pageCount)}
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
              size="small"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
            >
              {rowsPerPageOptions.map((size) => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </Stack>
      </Paper>

      <Dialog open={openFormDialog} onClose={handleCloseForm} fullWidth maxWidth="sm">
        <DialogTitle>
          {isEditing ? 'Edit Kategori Pengeluaran' : 'Tambah Kategori Pengeluaran'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              required
              fullWidth
              label="Nama Kategori"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Deskripsi"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
            <TextField
              fullWidth
              type="number"
              label="Limit Pengeluaran (Rp)"
              value={formData.limitAmount}
              onChange={(e) => setFormData((prev) => ({ ...prev, limitAmount: e.target.value }))}
              placeholder="Kosongkan jika tidak ada limit"
            />
            <TextField
              select
              fullWidth
              label="Periode Limit"
              value={formData.limitPeriod}
              onChange={(e) => setFormData((prev) => ({ ...prev, limitPeriod: e.target.value }))}
            >
              {limitPeriodOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Batal</Button>
          <Button onClick={handleSubmit} variant="contained">
            Simpan
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>Apakah Anda yakin ingin menghapus kategori ini?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Batal</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Hapus
          </Button>
        </DialogActions>
      </Dialog>

      {snackbarOpen && (
        <Alert
          severity={snackbarSeverity}
          onClose={() => setSnackbarOpen(false)}
          sx={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1400 }}
        >
          {snackbarMessage}
        </Alert>
      )}
    </Box>
  ) : (
    <Alert severity="error">Anda tidak memiliki izin untuk mengakses halaman ini.</Alert>
  )
}
