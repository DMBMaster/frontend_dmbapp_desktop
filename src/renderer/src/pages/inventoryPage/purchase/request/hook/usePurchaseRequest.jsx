import { useNotifier } from '@renderer/components/core/NotificationProvider'
import { selectedOutlet, userRole } from '@renderer/utils/config'
import { useDebounce } from '@uidotdev/usehooks'
import { useCallback, useEffect, useState } from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { usePermissions } from '@renderer/store/usePermission'
import PurchaseService from '@renderer/services/purchaseService'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useNavigate } from 'react-router-dom'

const columnHelper = createColumnHelper()

export const UsePurchaseRequest = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const notifier = useNotifier()
  const purchaseService = PurchaseService()

  const [data, setData] = useState([])
  const permissions = usePermissions(userRole)
  const [sorting, setSorting] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)

  const [openDialog, setOpenDialog] = useState({
    updateData: false,
    deleteData: false
  })

  const [loading, setLoading] = useState({
    fetchData: false,
    handleDelete: false,
    imageModal: false
  })

  const [pageParams, setPageParams] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    pageCount: 0,
    searchTerm: ''
  })
  const debouncedSearch = useDebounce(pageParams.searchTerm, 500)
  const [rejectionReason, setRejectionReason] = useState('')
  const [menuState, setMenuState] = useState({ rowId: null, anchorEl: null })
  const [openRows, setOpenRows] = useState({})
  const [selectedImage, setSelectedImage] = useState({
    src: '',
    alt: ''
  })

  const handleRowToggle = (rowId) => {
    setOpenRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }))
  }

  const handleMenuOpen = (event, rowId) => {
    setMenuState({ rowId, anchorEl: event.currentTarget })
  }

  const handleMenuClose = () => {
    setMenuState({ rowId: null, anchorEl: null })
  }

  const handleDelete = async () => {
    try {
      setLoading((prev) => ({ ...prev, handleDelete: true }))
      const response = await purchaseService.deletePreOrders(selectedRow.guid)
      notifier.show({
        message: 'Permintaan Pembelian berhasil dihapus',
        description: response.data.message || 'Data permintaan pembelian telah berhasil dihapus.',
        severity: 'success'
      })
      fetchData()
      setOpenDialog((prev) => ({ ...prev, deleteData: false }))
    } catch (error) {
      notifier.show({
        message: 'Gagal menghapus Permintaan Pembelian',
        description:
          error.response?.data?.message ||
          'Terjadi kesalahan saat menghapus data permintaan pembelian.',
        severity: 'error'
      })
    }
  }

  const handleApprove = async (invoice) => {
    try {
      const response = await purchaseService.approvePreOrder(invoice.guid)
      notifier.show({
        message: 'Pengajuan Disetujui',
        description: response.data.message || 'Pengajuan pembelian berhasil disetujui.',
        severity: 'success'
      })
      fetchData()
    } catch (error) {
      console.error('Error during approval request:', error)
      notifier.show({
        message: 'Gagal Menyetujui Pengajuan',
        description: 'Terjadi kesalahan saat menyetujui pengajuan. Silakan coba lagi.',
        severity: 'error'
      })
    }
    handleMenuClose()
  }

  const handleReject = async (invoice) => {
    if (!rejectionReason) {
      notifier.show({
        message: 'Rejection Reason Required',
        description: 'Please provide a reason for rejection before submitting.',
        severity: 'warning'
      })
      return
    }
    try {
      const response = await purchaseService.rejectPreOrder(invoice.guid, {
        reason: rejectionReason
      })
      notifier.show({
        message: 'Pengajuan Ditolak',
        description: response.data.message || 'Pengajuan pembelian berhasil ditolak.',
        severity: 'success'
      })
      fetchData()
      setOpenDialog((prev) => ({ ...prev, updateData: false }))
      setRejectionReason('')
      setSelectedRow(null)
    } catch (error) {
      console.error('Error during rejection request:', error)
      notifier.show({
        message: 'Gagal Menolak Pengajuan',
        description: 'Terjadi kesalahan saat menolak pengajuan. Silakan coba lagi.',
        severity: 'error'
      })
    }
  }

  const fetchData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        outlet_id: selectedOutlet?.guid || null
      }
      const response = await purchaseService.getPreOrders(params)
      const responseData = response.data || []
      const meta = response.meta

      setData(responseData)
      if (meta) {
        setPageParams((prev) => ({
          ...prev,
          page: meta.page,
          pageSize: meta.perPage,
          totalCount: meta.totalCount,
          pageCount: meta.pageCount
        }))
      } else {
        setPageParams((prev) => ({
          ...prev,
          pageCount: Math.ceil(responseData.length / prev.pageSize)
        }))
      }
    } catch (error) {
      console.log(error)
      const message = error.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Mengambil Data',
        description: message,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }, [purchaseService, pageParams.page, pageParams.pageSize, debouncedSearch])

  const columns = [
    columnHelper.accessor('rowIndex', {
      id: 'expand',
      header: () => '',
      cell: (info) => {
        const rowId = info.row.original.guid ?? info.row.id
        return (
          <IconButton onClick={() => handleRowToggle(rowId)}>
            {openRows[rowId] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )
      }
    }),
    columnHelper.accessor('nomor', {
      header: () => 'Nomor',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('created_at', {
      header: () => 'Tanggal',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('date', {
      header: () => 'Item',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('status', {
      header: () => 'Status',
      cell: (info) => {
        const status = info.getValue()
        if (status === 1)
          return (
            <Chip
              color="success"
              label="Approved"
              size="small"
              sx={{ color: theme.palette.success.contrastText }}
            />
          )
        if (status === 0)
          return (
            <Chip
              color="warning"
              label="Pengajuan"
              size="small"
              sx={{ color: theme.palette.warning.contrastText }}
            />
          )
        if (status === 2)
          return (
            <Chip
              color="error"
              label="Tidak Disetujui"
              size="small"
              sx={{ color: theme.palette.error.contrastText }}
            />
          )
        if (status === 3)
          return (
            <Chip
              color="error"
              label="Batal"
              size="small"
              sx={{ color: theme.palette.error.contrastText }}
            />
          )
        return ''
      }
    }),
    columnHelper.accessor('notes', {
      header: () => 'Catatan',
      cell: (info) => <Typography variant="body1">{info.getValue() ?? '-'}</Typography>
    }),
    columnHelper.accessor('actions', {
      header: () => 'Aksi',
      cell: (info) => {
        const invoice = info.row.original
        const rowId = invoice.guid ?? info.row.id
        const isMenuOpen = menuState.rowId === rowId

        return (
          <Box display="flex" justifyContent="center" gap={1}>
            {(invoice.status === 0 || invoice.status === 2) && (
              <>
                <Tooltip title="Edit Permintaan Pembelian">
                  <IconButton
                    color="success"
                    onClick={() => navigate(`/inventory/purchase/request/edit/${invoice.guid}`)}
                  >
                    <IconEdit width={22} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Permintaan Pembelian">
                  <IconButton
                    color="error"
                    onClick={() => {
                      setSelectedRow(invoice)
                      setOpenDialog((prev) => ({ ...prev, deleteData: true }))
                    }}
                  >
                    <IconTrash width={22} />
                  </IconButton>
                </Tooltip>

                {permissions.update && permissions.purchasing && (
                  <Tooltip title="More Options">
                    <IconButton
                      color="default"
                      onClick={(event) =>
                        setMenuState({ anchorEl: event.currentTarget, rowId: rowId })
                      }
                    >
                      <MoreVertIcon width={22} />
                    </IconButton>
                    <Menu
                      anchorEl={menuState.anchorEl}
                      open={Boolean(menuState.anchorEl)}
                      onClose={() => setMenuState({ anchorEl: null, rowId: null })}
                    >
                      <MenuItem
                        onClick={() => {
                          handleApprove(invoice)
                        }}
                      >
                        Setujui
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setSelectedRow(invoice)
                          setOpenDialog((prev) => ({ ...prev, updateData: true }))
                        }}
                      >
                        Tolak
                      </MenuItem>
                    </Menu>

                    {/* Rejection Reason Dialog */}
                    <Dialog open={openDialog.updateData} onClose={() => setOpenDialog(false)}>
                      <DialogTitle>Tolak</DialogTitle>
                      <DialogContent>
                        <TextField
                          label="Alasan Menolak"
                          multiline
                          fullWidth
                          rows={4}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={() => setOpenDialog(false)} color="primary">
                          Cancel
                        </Button>
                        <Button onClick={() => handleReject(invoice)} color="secondary">
                          Tolak
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </Tooltip>
                )}
              </>
            )}

            {permissions.update && permissions.purchasing && (
              <>
                <Tooltip title="More Options">
                  <IconButton color="default" onClick={(e) => handleMenuOpen(e, rowId)}>
                    <MoreVertIcon width={22} />
                  </IconButton>
                </Tooltip>

                {/* Menu per-row: hanya terbuka untuk row yang klik */}
                <Menu
                  anchorEl={isMenuOpen ? menuState.anchorEl : null}
                  open={isMenuOpen}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => handleApprove(invoice)}>Setujui</MenuItem>
                  <MenuItem
                    onClick={() => {
                      setSelectedRow(invoice)
                      setOpenDialog((prev) => ({ ...prev, updateData: true }))
                      handleMenuClose()
                    }}
                  >
                    Tolak
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        )
      }
    })
  ]

  const RejectionDialog = () => (
    <Dialog
      open={openDialog.updateData}
      onClose={() => {
        setOpenDialog((prev) => ({ ...prev, updateData: false }))
        setRejectionReason('')
        setSelectedRow(null)
      }}
    >
      <DialogTitle>Tolak Pengajuan</DialogTitle>
      <DialogContent>
        <TextField
          label="Alasan Menolak"
          multiline
          fullWidth
          rows={4}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setOpenDialog((prev) => ({ ...prev, updateData: false }))
            setRejectionReason('')
            setSelectedRow(null)
          }}
          color="primary"
        >
          Cancel
        </Button>
        <Button
          onClick={() => selectedRow && handleReject(selectedRow)}
          color="error"
          variant="contained"
          disabled={!rejectionReason}
        >
          Tolak
        </Button>
      </DialogActions>
    </Dialog>
  )

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

  useEffect(() => {
    fetchData()
  }, [pageParams.page, pageParams.pageSize, debouncedSearch])

  return {
    data,
    loading,
    pageParams,
    setPageParams,
    table,
    columns,
    permissions,
    selectedRow,
    openDialog,
    setOpenDialog,
    openRows,
    RejectionDialog,
    selectedImage,
    setSelectedImage,
    handleDelete
  }
}
