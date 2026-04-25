import { useNotifier } from '@renderer/components/core/NotificationProvider'
import RatePlanService from '@renderer/services/ratePlanService'
import { selectedOutlet, userRole } from '@renderer/utils/config'
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table'
import { useDebounce } from '@uidotdev/usehooks'
import { useEffect, useState } from 'react'
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { formatRupiah } from '@renderer/utils/myFunctions'
import { usePermissions } from '@renderer/store/usePermission'

const columnHelper = createColumnHelper()

const defaultFormData = {
  outlet_id: localStorage.getItem('outletGuid') || '',
  product_id: '',
  name: '',
  description: '',
  max_nigths: 1,
  standart_guest_price: 2,
  max_guest_allowed: 4,
  extra_adult_allowed: 2,
  extra_children_allow: 2,
  extra_adult_charge: 0,
  extra_child_charge: 0,
  show_booking: true,
  rate_price: 0,
  min_nights: 1,
  min_rate_price: 0,
  cancel_policy_id: '',
  deposit_amount: 0,
  is_breakfast: false
}

export const UseRatePlan = () => {
  const notifier = useNotifier()
  const ratePlanService = RatePlanService()

  const [data, setData] = useState([])
  const permissions = usePermissions(userRole)
  const [openDialog, setOpenDialog] = useState({ delete: false, update: false, add: false })
  const [selectedDeleteId, setSelectedDeleteId] = useState(null)
  const [selectedRow, setSelectedRow] = useState(null)
  const [sorting, setSorting] = useState([])
  const [products, setProducts] = useState([])
  const [cancelPolicies, setCancelPolicies] = useState([])

  const [loading, setLoading] = useState({
    fetchData: false,
    handleDelete: false,
    handleSubmit: false
  })

  const [pageParams, setPageParams] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    pageCount: 0,
    searchTerm: ''
  })
  const debouncedSearch = useDebounce(pageParams.searchTerm, 500)

  const [formData, setFormData] = useState({ ...defaultFormData })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({ ...defaultFormData, outlet_id: localStorage.getItem('outletGuid') || '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading((prev) => ({ ...prev, handleSubmit: true }))

    try {
      if (openDialog.update && selectedRow) {
        await ratePlanService.updateRatePlan(selectedRow.guid, formData)
        notifier.show({
          message: 'Berhasil Memperbarui Rate Plan',
          description: 'Rate Plan berhasil diperbarui.',
          severity: 'success'
        })
      } else {
        await ratePlanService.createRatePlan(formData)
        notifier.show({
          message: 'Berhasil Menambahkan Rate Plan',
          description: 'Rate Plan berhasil ditambahkan.',
          severity: 'success'
        })
      }

      fetchData()
      resetForm()
      setSelectedRow(null)
      setOpenDialog({ delete: false, update: false, add: false })
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message)
      notifier.show({
        message: openDialog.update ? 'Gagal Memperbarui Rate Plan' : 'Gagal Menambahkan Rate Plan',
        description: error.response?.data?.message || 'Terjadi kesalahan pada server!',
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, handleSubmit: false }))
    }
  }

  const fetchData = async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        outlet_id: selectedOutlet?.guid || localStorage.getItem('outletGuid'),
        ...(debouncedSearch && { search: debouncedSearch })
      }

      const response = await ratePlanService.getRatePlans(params)
      const items = response.data || []
      const meta = response.meta

      setData(items)
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
          pageCount: Math.ceil(items.length / prev.pageSize)
        }))
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Mengambil Data Rate Plan',
        description: message,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await ratePlanService.getProductsForSelect({
        // p: 1,
        // ps: 100,
        outlet_id: selectedOutlet?.guid || localStorage.getItem('outletGuid')
      })
      setProducts(response.data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCancelPolicies = async () => {
    try {
      const response = await ratePlanService.getCancelPolicies()
      setCancelPolicies(response.data || [])
    } catch (error) {
      console.error('Error fetching cancel policies:', error)
    }
  }

  const handleDelete = async (id) => {
    try {
      setLoading((prev) => ({ ...prev, handleDelete: true }))
      await ratePlanService.deleteRatePlan(id)
      notifier.show({
        message: 'Berhasil Menghapus Rate Plan',
        description: 'Rate Plan berhasil dihapus.',
        severity: 'success'
      })
      fetchData()
    } catch (error) {
      const message = error.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Menghapus Rate Plan',
        description: message,
        severity: 'error'
      })
      console.error('Error deleting rate plan:', error)
    } finally {
      setLoading((prev) => ({ ...prev, handleDelete: false }))
    }
  }

  const handleDeleteClick = (item) => {
    setSelectedDeleteId(item.id || item.guid || null)
    setOpenDialog({ delete: true, update: false, add: false })
  }

  const handleCancelDelete = () => {
    setSelectedDeleteId(null)
    setOpenDialog({ delete: false, update: false, add: false })
  }

  const handleConfirmDelete = async () => {
    if (!selectedDeleteId) return handleCancelDelete()
    try {
      await handleDelete(selectedDeleteId)
    } finally {
      handleCancelDelete()
    }
  }

  const handleEditClick = (item) => {
    setSelectedRow(item)
    setFormData({
      outlet_id: item.outlet_id || localStorage.getItem('outletGuid') || '',
      product_id: item.product_id || '',
      name: item.name || '',
      description: item.description || '',
      max_nigths: item.max_nigths ?? 1,
      standart_guest_price: item.standart_guest_price ?? 2,
      max_guest_allowed: item.max_guest_allowed ?? 4,
      extra_adult_allowed: item.extra_adult_allowed ?? 2,
      extra_children_allow: item.extra_children_allow ?? 2,
      extra_adult_charge: item.extra_adult_charge ?? 0,
      extra_child_charge: item.extra_child_charge ?? 0,
      show_booking: item.show_booking ?? true,
      rate_price: item.rate_price ?? 0,
      min_nights: item.min_nights ?? 1,
      min_rate_price: item.min_rate_price ?? 0,
      cancel_policy_id: item.cancel_policy_id || '',
      deposit_amount: item.deposit_amount ?? 0,
      is_breakfast: item.is_breakfast ?? false
    })
    setOpenDialog({ delete: false, update: true, add: false })
  }

  const columns = [
    columnHelper.accessor('rowIndex', {
      header: () => 'No',
      cell: (info) => <Typography variant="body1">{info.row.index + 1}</Typography>
    }),
    columnHelper.accessor('name', {
      enableSorting: true,
      header: () => 'Rate Plan',
      cell: (info) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {info.getValue()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {info.row.original.description}
          </Typography>
        </Box>
      )
    }),
    columnHelper.accessor('product_name', {
      header: () => 'Produk',
      cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
    }),
    columnHelper.accessor('rate_price', {
      header: () => 'Harga',
      cell: (info) => (
        <Typography variant="body2" fontWeight={600}>
          {formatRupiah(info.getValue())}
        </Typography>
      )
    }),
    columnHelper.accessor('min_rate_price', {
      header: () => 'Min Harga',
      cell: (info) => <Typography variant="body2">{formatRupiah(info.getValue())}</Typography>
    }),
    columnHelper.accessor('min_nights', {
      header: () => 'Min/Max Malam',
      cell: (info) => (
        <Typography variant="body2">
          {info.getValue()} - {info.row.original.max_nigths} malam
        </Typography>
      )
    }),
    columnHelper.accessor('standart_guest_price', {
      header: () => 'Tamu',
      cell: (info) => (
        <Typography variant="body2">
          {info.getValue()} / {info.row.original.max_guest_allowed}
        </Typography>
      )
    }),
    columnHelper.accessor('is_breakfast', {
      header: () => 'Sarapan',
      cell: (info) => (
        <Chip
          label={info.getValue() ? 'Termasuk' : 'Tidak Termasuk'}
          color={info.getValue() ? 'success' : 'default'}
          size="small"
        />
      )
    }),
    columnHelper.accessor('show_booking', {
      header: () => 'Status',
      cell: (info) => (
        <Chip
          label={info.getValue() ? 'Aktif' : 'Nonaktif'}
          color={info.getValue() ? 'success' : 'default'}
          size="small"
        />
      )
    }),
    columnHelper.display({
      id: 'actions',
      header: () => 'Aksi',
      cell: (info) => (
        <Box display="flex" gap={1}>
          {/* {permissions.update && ( */}
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="warning"
              onClick={() => handleEditClick(info.row.original)}
            >
              <IconEdit size={18} />
            </IconButton>
          </Tooltip>
          {/* )} */}
          {/* {permissions.delete && ( */}
          <Tooltip title="Hapus">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteClick(info.row.original)}
            >
              <IconTrash size={18} />
            </IconButton>
          </Tooltip>
          {/* )} */}
        </Box>
      )
    })
  ]

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageParams.page, pageParams.pageSize, debouncedSearch])

  useEffect(() => {
    fetchProducts()
    fetchCancelPolicies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    data,
    loading,
    pageParams,
    setPageParams,
    fetchData,
    table,
    permissions,
    openDialog,
    setOpenDialog,
    handleDeleteClick,
    handleCancelDelete,
    handleConfirmDelete,
    handleEditClick,
    selectedRow,
    setSelectedRow,
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    resetForm,
    products,
    cancelPolicies
  }
}
