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
import { Typography } from '@mui/material'
import { usePermissions } from '@renderer/store/usePermission'
import { formatDate } from '@renderer/utils/myFunctions'
import ProductImageCell from '@renderer/pages/inventoryPage/opname/components/showImage'
import TransactionDetailService from '@renderer/services/transactionDetailService'

const columnHelper = createColumnHelper()

export const UseRoomActivity = () => {
  const notifier = useNotifier()
  const transactionDetailService = TransactionDetailService()

  const [data, setData] = useState([])
  const permissions = usePermissions(userRole)
  const [sorting, setSorting] = useState([])

  const [loading, setLoading] = useState({
    fetchData: false,
    handleDelete: false,
    handleSubmit: false
  })
  // Pagination
  const [pageParams, setPageParams] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    pageCount: 0,
    searchTerm: ''
  })
  const debouncedSearch = useDebounce(pageParams.searchTerm, 500)

  const fetchData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        outlet_id: selectedOutlet?.guid,
        ...(debouncedSearch && { search: debouncedSearch })
      }

      const response = await transactionDetailService.getRoomsActivity(params)
      const products = response.data || []
      const meta = response.meta

      setData(products)
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
          pageCount: Math.ceil(products.length / prev.pageSize)
        }))
      }
    } catch (error) {
      console.log(error)
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Mengambil Data Kategori',
        description: message,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }, [pageParams, debouncedSearch])

  const columns = [
    columnHelper.accessor('user_full_name', {
      header: () => 'Nomor Kamar',
      cell: (info) => <Typography variant="body1">{info.row.original.room.room_no}</Typography>
    }),
    columnHelper.accessor('status', {
      header: () => 'Status',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('created_at', {
      header: () => 'Pengguna',
      cell: (info) => <Typography variant="body1">{info.row.original.user_detail.name}</Typography>
    }),
    columnHelper.accessor('description', {
      header: () => 'Deskripsi',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('description', {
      header: () => 'Gambar',
      cell: (info) => (
        <Typography variant="body1">
          {info.row.original.file && info.row.original.file.length > 0 ? (
            info.row.original.file.map((file, index) => (
              <ProductImageCell key={index} imageUrli={file}></ProductImageCell>
            ))
          ) : (
            <Typography fontSize="14px"></Typography>
          )}
        </Typography>
      )
    }),
    columnHelper.accessor('created_at', {
      header: () => 'Create',
      cell: (info) => <Typography variant="body1">{formatDate(info.getValue())}</Typography>
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
    permissions
  }
}
