import { useNotifier } from '@renderer/components/core/NotificationProvider'
import { selectedOutlet, userRole } from '@renderer/utils/config'
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table'
import { useDebounce } from '@uidotdev/usehooks'
import { useCallback, useEffect, useState } from 'react'
import { IconButton, Typography } from '@mui/material'
import { usePermissions } from '@renderer/store/usePermission'
import PurchaseService from '@renderer/services/purchaseService'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { formatDate, getFirstDayOfCurrentMonth, getToday } from '@renderer/utils/myFunctions'
import ProductImageCell from '@renderer/pages/inventoryPage/purchase/order/components/ShowImage'

const columnHelper = createColumnHelper()

export const UseStockMovement = () => {
  const notifier = useNotifier()
  const purchaseService = PurchaseService()

  const [data, setData] = useState([])
  const permissions = usePermissions(userRole)
  const [openDialog, setOpenDialog] = useState({ delete: false, form: false })
  const [openRows, setOpenRows] = useState({})
  const [sorting, setSorting] = useState([])
  const [selectedImage, setSelectedImage] = useState({
    src: '',
    alt: ''
  })

  const [loading, setLoading] = useState({
    fetchData: false,
    handleDelete: false,
    handleSubmit: false,
    fetchProducts: false,
    fetchDataCategory: false,
    exportData: false
  })

  const [pageParams, setPageParams] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    pageCount: 0,
    searchTerm: '',
    startDate: getFirstDayOfCurrentMonth(),
    endDate: getToday(),
    categoryId: '',
    productId: ''
  })
  const debouncedSearch = useDebounce(pageParams.searchTerm, 500)

  const handleConfirmDelete = async (id) => {
    try {
      setLoading((prev) => ({ ...prev, handleDelete: true }))
      await purchaseService.deletePreOrders(id)
      notifier.show({
        message: 'Berhasil Menghapus Data',
        description: 'Data berhasil dihapus.',
        severity: 'success'
      })
      fetchData()
    } catch (error) {
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Menghapus Data',
        description: message,
        severity: 'error'
      })
      console.error('Error deleting product:', error)
    } finally {
      setLoading((prev) => ({ ...prev, handleDelete: false }))
    }
  }

  const fetchData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        outlet_id: selectedOutlet?.guid || null,
        ...(debouncedSearch && { search: debouncedSearch })
      }

      const response = await purchaseService.getStockMovement(params)
      const data = response.data || []
      const meta = response.meta

      setData(data)
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
          pageCount: Math.ceil(data.length / prev.pageSize)
        }))
      }
    } catch (error) {
      console.log(error)
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
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
          <IconButton onClick={() => setOpenRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }))}>
            {openRows[rowId] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )
      }
    }),
    columnHelper.accessor('no_facture', {
      header: () => 'Nomor',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('created_at', {
      header: () => 'Tanggal',
      cell: (info) => <Typography variant="body1">{formatDate(info.getValue())}</Typography>
    }),
    columnHelper.accessor('date', {
      header: () => 'Item',
      cell: (info) => <Typography variant="body1">{info.row.original.items.length}</Typography>
    }),
    columnHelper.accessor('notes', {
      header: () => 'Dari',
      cell: (info) => (
        <Typography variant="body1">
          {info.row.original.items[0]?.from_outlet?.outlet_name ?? '-'}
        </Typography>
      )
    }),
    columnHelper.accessor('notes', {
      header: () => 'Menuju',
      cell: (info) => (
        <Typography variant="body1">
          {info.row.original.items[0]?.to_outlet?.outlet_name ?? '-'}
        </Typography>
      )
    }),
    columnHelper.accessor('receipt', {
      header: () => 'Lampiran',
      cell: (info) => <ProductImageCell imageUrli={info.row.original.receipt}></ProductImageCell>
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
  }, [pageParams.page, pageParams.pageSize, debouncedSearch])

  return {
    data,
    loading,
    pageParams,
    setPageParams,
    table,
    permissions,
    openDialog,
    setOpenDialog,
    fetchData,
    handleConfirmDelete,
    openRows,
    setSelectedImage,
    selectedImage
  }
}
