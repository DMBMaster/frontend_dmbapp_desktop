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
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { usePermissions } from '@renderer/store/usePermission'
import SupplierService from '@renderer/services/supplierService'

const columnHelper = createColumnHelper()

export const UseSupplier = () => {
  const notifier = useNotifier()
  const supplierService = SupplierService()

  const [data, setData] = useState([])
  const permissions = usePermissions(userRole)
  const [openDialog, setOpenDialog] = useState({ delete: false, form: false })
  const [selectedDeleteId, setSelectedDeleteId] = useState(null)
  const [selectedRow, setSelectedRow] = useState(null)
  const [sorting, setSorting] = useState([])

  const [loading, setLoading] = useState({
    fetchData: false,
    handleDelete: false,
    handleSubmit: false
  })

  const [supplierData, setSupplierData] = useState({
    outlet_id: localStorage.getItem('outletGuid'),
    name: '',
    address: '',
    phone: '',
    no_rekening: ''
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
  const [isEditing, setIsEditing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        outletId: selectedOutlet?.guid || null,
        ob: 'id',
        d: 'DESC',
        ...(debouncedSearch && { search: debouncedSearch })
      }

      const response = await supplierService.getSuplierByOutlet(
        selectedOutlet?.guid || null,
        params
      )
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
        message: 'Gagal Mengambil Data Supplier',
        description: message,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }, [supplierService, pageParams.page, pageParams.pageSize, debouncedSearch])

  const handleDelete = async (id) => {
    try {
      setLoading((prev) => ({ ...prev, handleDelete: true }))
      await supplierService.deleteSuplier(id)
      notifier.show({
        message: 'Berhasil Menghapus Supplier',
        description: 'Supplier berhasil dihapus.',
        severity: 'success'
      })
      fetchData()
    } catch (error) {
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Menghapus Supplier',
        description: message,
        severity: 'error'
      })
      console.error('Error deleting supplier:', error)
    } finally {
      setLoading((prev) => ({ ...prev, handleDelete: false }))
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setSupplierData((prevData) => ({
      ...prevData,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading((prev) => ({ ...prev, handleSubmit: true }))

    if (
      !supplierData.name ||
      !supplierData.address ||
      !supplierData.phone ||
      !supplierData.no_rekening
    ) {
      notifier.show({
        message: 'Gagal Menyimpan Supplier',
        description: 'Harap isi semua field yang diperlukan.',
        severity: 'error'
      })
      setLoading((prev) => ({ ...prev, handleSubmit: false }))
      return // Prevent submission if required fields are empty
    }

    let response
    if (isEditing) {
      try {
        response = await supplierService.updateSuplier(
          selectedRow?.guid || selectedRow?.id,
          supplierData
        )

        const result = await response.data
        console.log('Employee data submitted successfully:', result)
        notifier.show({
          message: 'Berhasil Update Supplier',
          description: `${result.message || 'Data supplier berhasil diperbarui.'} `,
          severity: 'success'
        })
        handleClose() // Close the dialog
        fetchData()
        setSupplierData({
          outlet_id: localStorage.getItem('outletGuid'),
          name: '',
          address: '',
          phone: '',
          no_rekening: ''
        })
        setOpenDialog((prev) => ({ ...prev, form: false }))
      } catch (error) {
        notifier.show({
          message: 'Gagal update data',
          description: error.response?.data?.message || 'Terjadi kesalahan saat update data.',
          severity: 'error'
        })
      } finally {
        setLoading((prev) => ({ ...prev, handleSubmit: false }))
      }
    } else {
      try {
        response = await supplierService.createSuplier(supplierData)
        const result = await response.data
        notifier.show({
          message: 'Berhasil Menambah Supplier',
          description: `${result.message || 'Data supplier berhasil disimpan.'} `,
          severity: 'success'
        })
        handleClose() // Close the dialog
        fetchData()
        setSupplierData({
          outlet_id: localStorage.getItem('outletGuid'),
          name: '',
          address: '',
          phone: '',
          no_rekening: ''
        })
        setOpenDialog((prev) => ({ ...prev, form: false }))
      } catch (error) {
        notifier.show({
          message: 'Gagal menyimpan data',
          description: error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.',
          severity: 'error'
        })
      } finally {
        setLoading((prev) => ({ ...prev, handleSubmit: false }))
      }
    }
  }

  const handleClose = () => {
    setOpenDialog((prev) => ({ ...prev, form: false }))
    setSupplierData({
      outlet_id: localStorage.getItem('outletGuid'),
      name: '',
      address: '',
      phone: '',
      no_rekening: ''
    })
    setIsEditing(false)
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

    // Kode
    columnHelper.accessor('name', {
      enableSorting: true,
      header: () => 'Nama',
      cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
    }),

    // Nama
    columnHelper.accessor('phone', {
      enableSorting: true,
      header: () => 'Nomor HP',
      cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
    }),
    columnHelper.accessor('address', {
      enableSorting: true,
      header: () => 'Alamat',
      cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
    }),
    columnHelper.accessor('no_rekening', {
      enableSorting: true,
      header: () => 'Nomor Rekening',
      cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
    }),
    // Aksi
    columnHelper.display({
      id: 'actions',
      header: () => 'Aksi',
      cell: (info) => {
        return (
          <Box display="flex" justifyContent="center" gap={1}>
            {permissions.update && (
              <Tooltip title="Edit">
                <IconButton
                  color="success"
                  onClick={() => {
                    setSelectedRow(info.row.original)
                    setIsEditing(true)
                    setSupplierData({
                      name: info.row.original.name || '',
                      address: info.row.original.address || '',
                      phone: info.row.original.phone || '',
                      no_rekening: info.row.original.no_rekening || ''
                    })
                    setOpenDialog((prev) => ({ ...prev, form: true }))
                  }}
                >
                  <IconEdit width={22} />
                </IconButton>
              </Tooltip>
            )}
            {permissions.delete && (
              <Tooltip title="Delete">
                <IconButton
                  color="error"
                  onClick={() => {
                    handleDeleteClick(info.row.original)
                  }}
                >
                  <IconTrash width={22} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      }
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
    handleCancelDelete,
    handleConfirmDelete,
    handleClose,
    isEditing,
    supplierData,
    handleChange,
    handleSubmit,
    setOpenDialog
  }
}
