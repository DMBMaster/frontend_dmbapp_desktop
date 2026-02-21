import { useNotifier } from '@renderer/components/core/NotificationProvider'
import { selectedOutlet, userRole } from '@renderer/utils/config'
import { useDebounce } from '@uidotdev/usehooks'
import { useCallback, useEffect, useState } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table'
import { IconButton, Typography } from '@mui/material'
import { usePermissions } from '@renderer/store/usePermission'
import PurchaseService from '@renderer/services/purchaseService'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ProductImageCell from '../components/ShowImage'

const columnHelper = createColumnHelper()

export const UsePurchaseOrder = () => {
  const notifier = useNotifier()
  const purchaseService = PurchaseService()

  const [data, setData] = useState([])
  const permissions = usePermissions(userRole)
  const [sorting, setSorting] = useState([])
  const [selectedRow] = useState(null)

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
  const [openRows, setOpenRows] = useState({})
  const [selectedImage, setSelectedImage] = useState({
    src: '',
    alt: ''
  })

  const handleRowToggle = (rowId) => {
    setOpenRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }))
  }

  const fetchData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        transaction_type: 'IN',
        outlet_id: selectedOutlet?.guid || null,
        category: 'buy'
      }
      const response = await purchaseService.getPurchaseOrder(params)
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
    columnHelper.accessor('no_facture', {
      header: () => 'Nomor',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('created_at', {
      header: () => 'Tanggal',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('date', {
      header: () => 'Item',
      cell: (info) => <Typography variant="body1">{info.row.original.items.length}</Typography>
    }),
    columnHelper.accessor('date', {
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
    columns,
    permissions,
    selectedRow,
    openDialog,
    setOpenDialog,
    openRows,
    selectedImage,
    setSelectedImage
  }
}
