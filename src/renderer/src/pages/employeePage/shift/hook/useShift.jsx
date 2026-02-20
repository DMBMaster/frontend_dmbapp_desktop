import { useNotifier } from '@renderer/components/core/NotificationProvider'
import { userRole } from '@renderer/utils/config'
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table'
import { useDebounce } from '@uidotdev/usehooks'
import { useCallback, useEffect, useState } from 'react'
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import { IconTrash } from '@tabler/icons-react'
import EmployeeService from '@renderer/services/employeeService'
import { usePermissions } from '@renderer/store/usePermission'

const columnHelper = createColumnHelper()

export const UseShift = () => {
  const notifier = useNotifier()
  const employeeService = EmployeeService()

  const [data, setData] = useState([])
  const permissions = usePermissions(userRole)
  const [openDialog, setOpenDialog] = useState({ delete: false })
  const [selectedRow, setSelectedRow] = useState(null)
  const [sorting, setSorting] = useState([])

  const [loading, setLoading] = useState({
    fetchData: false,
    handleDelete: false,
    addData: false
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

  const [shiftData, setShiftData] = useState({
    name: '',
    outlet_id: localStorage.getItem('outletGuid'),
    outlet_name: localStorage.getItem('outletName'),
    clock_in: '',
    clock_out: '',
    reason: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setShiftData((prevData) => ({
      ...prevData,
      [name]: value
    }))
  }

  const handleSubmitShift = async (e) => {
    e.preventDefault()
    setLoading((prev) => ({ ...prev, addData: true }))

    // Validate required fields
    if (!shiftData.name || !shiftData.clock_in || !shiftData.clock_out) {
      notifier.show({
        message: 'Validation Error',
        description: 'Please fill in all required fields.',
        severity: 'error'
      })
      setLoading((prev) => ({ ...prev, addData: false }))
      return
    }

    const formData = new FormData()
    formData.append('name', shiftData.name)
    formData.append('outlet_id', shiftData.outlet_id)
    formData.append('outlet_name', shiftData.outlet_name)
    formData.append('clock_in', shiftData.clock_in)
    formData.append('clock_out', shiftData.clock_out)
    formData.append('reason', shiftData.reason)

    try {
      const response = await employeeService.createShift(formData)

      const result = await response.data
      console.log('Employee data submitted successfully:', result)
      notifier.show({
        message: 'Berhasil Menambahkan Shift',
        description: 'Data shift berhasil ditambahkan.',
        severity: 'success'
      })
      fetchData()

      setShiftData({
        name: '',
        clock_in: '',
        clock_out: ''
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setOpenDialog((prev) => ({ ...prev, addData: false }))
      setLoading((prev) => ({ ...prev, addData: false }))
    }
  }

  const fetchData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        outlet_id: localStorage.getItem('outletGuid')
      }

      const response = await employeeService.getShift(params)
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
        message: 'Gagal Mengambil Data',
        description: message,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }, [employeeService, pageParams.page, pageParams.pageSize, debouncedSearch])

  const handleConfirmDelete = async () => {
    try {
      setLoading((prev) => ({ ...prev, handleDelete: true }))
      const response = await employeeService.deleteShift(selectedRow.id)
      notifier.show({
        message: 'Berhasil Menghapus Shift',
        description: response.message,
        severity: 'success'
      })
      fetchData()
    } catch (error) {
      notifier.show({
        message: 'Gagal Menghapus Shift',
        description: error.response?.data?.message || 'Terjadi kesalahan pada server!',
        severity: 'error'
      })
      console.error('Error fetching room types:', error)
    } finally {
      setOpenDialog((prev) => ({ ...prev, delete: false }))
      setLoading((prev) => ({ ...prev, handleDelete: false }))
    }
  }

  const columns = [
    // Column definitions
    columnHelper.accessor('rowIndex', {
      header: () => 'No',
      cell: (info) => (
        <Typography variant="body1">{info.row.index + 1}</Typography> // Adding 1 to start from 1 instead of 0
      )
    }),
    columnHelper.accessor('name', {
      header: () => 'Nama',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('clock_in', {
      header: () => 'Clock In',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('clock_out', {
      header: () => 'Clock Out',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),

    columnHelper.accessor('status', {
      header: () => 'Status',
      cell: (info) => (
        <Chip
          size="small"
          label={info.getValue() == 'approved' ? 'Disetujui' : 'Menunggu Disetujui'}
          color={info.getValue() == 'approved' ? 'success' : 'error'}
          sx={{ borderRadius: '6px' }}
        />
      )
    }),
    columnHelper.accessor('actions', {
      header: () => 'Aksi', // Header for the "Actions" column
      cell: (info) => {
        return (
          <Box display="flex" justifyContent="center" gap={1}>
            <Tooltip title="Delete">
              <IconButton
                color="error"
                onClick={() => {
                  setOpenDialog((prev) => ({ ...prev, delete: true }))
                  setSelectedRow(info.row.original)
                }}
              >
                <IconTrash width={22} />
              </IconButton>
            </Tooltip>
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
    fetchData,
    table,
    permissions,
    openDialog,
    setOpenDialog,
    handleConfirmDelete,
    shiftData,
    handleChange,
    handleSubmitShift
  }
}
