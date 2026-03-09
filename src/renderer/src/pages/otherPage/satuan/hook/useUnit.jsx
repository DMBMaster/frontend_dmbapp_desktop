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
import { Box, Button, Typography } from '@mui/material'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { usePermissions } from '@renderer/store/usePermission'
import ProductService from '@renderer/services/productService'

const columnHelper = createColumnHelper()

export const UseUnit = () => {
  const notifier = useNotifier()
  const productService = ProductService()

  const [data, setData] = useState([])
  const permissions = usePermissions(userRole)
  const [openDialog, setOpenDialog] = useState({ delete: false, update: false, add: false })
  const [selectedDeleteId, setSelectedDeleteId] = useState(null)
  const [selectedRow, setSelectedRow] = useState(null)
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
  const [formData, setFormData] = useState({
    outlet_id: selectedOutlet?.guid || null,
    name: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading((prev) => ({ ...prev, handleSubmit: true }))

    try {
      let response

      if (openDialog.update && selectedRow) {
        const requestBody = {
          category_name: formData.name,
          description: formData.description,
          is_book_engine: formData.is_book_engine,
          parent_id: null,
          outlet_id: localStorage.getItem('outletGuid')
        }

        response = await productService.updateUnitsProducts(selectedRow.id, requestBody)

        notifier.show({
          message: 'Berhasil Memperbarui Satuan',
          description: 'Satuan berhasil diperbarui.',
          severity: 'success'
        })
      } else {
        const requestBody = {
          category_name: formData.name,
          description: formData.description,
          parent_id: null,
          is_book_engine: formData.is_book_engine,
          outlet_id: localStorage.getItem('outletGuid')
        }

        response = await productService.createUnitsProducts(requestBody)
        notifier.show({
          message: 'Berhasil Menambahkan Satuan',
          description: 'Satuan berhasil ditambahkan.',
          severity: 'success'
        })
      }
      console.log('Response:', response.data.data)
      fetchData()
      setFormData({
        name: '',
        description: '',
        is_book_engine: false
      })
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message)
      notifier.show({
        message: openDialog.update ? 'Gagal Memperbarui Kategori' : 'Gagal Menambahkan Kategori',
        description: error.response?.data?.message || 'Terjadi kesalahan pada server!',
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, handleSubmit: false }))
    }
  }

  const fetchData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        outlet_id: selectedOutlet.guid,
        ...(debouncedSearch && { search: debouncedSearch })
      }

      const response = await productService.getUnitsProducts(params)
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

  const handleDelete = async (id) => {
    try {
      setLoading((prev) => ({ ...prev, handleDelete: true }))
      await productService.deleteUnitsProducts(id)
      notifier.show({
        message: 'Berhasil Menghapus Satuan',
        description: 'Satuan berhasil dihapus.',
        severity: 'success'
      })
      fetchData()
    } catch (error) {
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Menghapus Satuan',
        description: message,
        severity: 'error'
      })
      console.error('Error deleting product:', error)
    } finally {
      setLoading((prev) => ({ ...prev, handleDelete: false }))
    }
  }

  const handleDeleteClick = (item) => {
    setSelectedDeleteId(item.guid || item.id || null)
    setOpenDialog({ delete: true })
  }

  const handleCancelDelete = () => {
    setSelectedDeleteId(null)
    setOpenDialog({ delete: false })
  }

  const handleConfirmDelete = async () => {
    if (!selectedDeleteId) return handleCancelDelete()
    try {
      await handleDelete(selectedDeleteId)
    } finally {
      handleCancelDelete()
    }
  }

  const columns = [
    columnHelper.accessor('rowIndex', {
      header: () => 'No',
      cell: (info) => <Typography variant="body1">{info.row.index + 1}</Typography>
    }),
    columnHelper.accessor('name', {
      header: () => 'Nama',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('actions', {
      header: () => 'Aksi',
      cell: (info) => (
        <Box display="flex" gap={1}>
          {info.row.original.outlet_id != null && (
            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                setSelectedRow(info.row.original)
                setOpenDialog({ update: true })
              }}
              startIcon={<IconEdit />}
            >
              Edit
            </Button>
          )}
          {info.row.original.outlet_id != null && (
            <Button
              variant="contained"
              color="error"
              onClick={() => handleDeleteClick(info.row.original)}
              startIcon={<IconTrash />}
            >
              Hapus
            </Button>
          )}
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
  }, [pageParams.page, pageParams.pageSize, debouncedSearch])

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
    selectedRow,
    setSelectedRow,
    formData,
    setFormData,
    handleChange,
    handleSubmit
  }
}
