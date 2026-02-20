import { useNotifier } from '@renderer/components/core/NotificationProvider'
import EmployeeService from '@renderer/services/employeeService'
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
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import { IconTrash } from '@tabler/icons-react'
import { usePermissions } from '@renderer/store/usePermission'
const columnHelper = createColumnHelper()

export const UseSchedule = () => {
  const notifier = useNotifier()
  const employeeService = EmployeeService()

  const [data, setData] = useState([])
  const permissions = usePermissions(userRole)
  const [openDialog, setOpenDialog] = useState({
    delete: false,
    import: false,
    updateData: false,
    addData: false
  })
  const [selectedRow, setSelectedRow] = useState(null)
  const [sorting, setSorting] = useState([])

  const [loading, setLoading] = useState({
    fetchData: false,
    handleDelete: false,
    handleUpdateOutletEmployee: false,
    handleResetConfirm: false,
    handleSubmitImportEmployee: false,
    fetchShifts: false,
    handleConfirmShift: false,
    addData: false
  })

  const [pageParams, setPageParams] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    pageCount: 0,
    searchTerm: ''
  })
  const debouncedSearch = useDebounce(pageParams.searchTerm, 500)
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [userId, setUserId] = useState('')
  const [newUser, setNewUser] = useState({})
  const [employee, setEmployee] = useState([])
  const [schedule, setSchedule] = useState({
    outlet_id: localStorage.getItem('outletGuid'),
    outlet_name: localStorage.getItem('outletName'),
    employee_id: '',
    employee_name: '',
    employee_position: '',
    user_id: '',
    date: '',
    clock_in: '',
    clock_out: ''
  })

  const [importSchedule, setImportSchedule] = useState({
    file: null,
    name: '',
    type: '',
    url: ''
  })

  const fetchData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        ob: 'date',
        d: 'DESC',
        outlet_id: selectedOutlet?.guid || null,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(userId && { user_id: userId })
      }

      const response = await employeeService.getScheduleEmployee(params)
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
  }, [employeeService, pageParams.page, pageParams.pageSize, debouncedSearch, userId])

  const fetchEmployees = async () => {
    try {
      setLoading((prev) => ({ ...prev, fetchEmployees: true }))
      const params = {
        p: 1,
        ps: 20,
        outlet_id: selectedOutlet?.guid || null
      }

      const response = await employeeService.getEmployees(params)
      const data = response.data || []

      setEmployee(data)
    } catch (error) {
      console.log(error)
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Mengambil Data Employee',
        description: message,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchEmployees: false }))
    }
  }
  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleDelete = async () => {
    try {
      setLoading((prev) => ({ ...prev, handleDelete: true }))
      await employeeService.deleteScheduleEmployee(selectedRow.id)
      notifier.show({
        message: 'Berhasil Menghapus Schedule',
        description: 'Schedule berhasil dihapus.',
        severity: 'success'
      })
      fetchData()
    } catch (error) {
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Menghapus Schedule',
        description: message,
        severity: 'error'
      })
      console.error('Error deleting schedule:', error)
    } finally {
      setOpenDialog((prev) => ({ ...prev, delete: false }))
      setLoading((prev) => ({ ...prev, handleDelete: false }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading((prev) => ({ ...prev, addData: true }))

    const formData = new FormData()
    formData.append('outlet_id', schedule.outlet_id)
    formData.append('outlet_name', schedule.outlet_name)
    formData.append('employee_id', schedule.employee_id)
    formData.append('employee_name', schedule.employee_name)
    formData.append('employee_position', schedule.employee_position)
    formData.append('user_id', schedule.user_id)
    formData.append('date', schedule.date)
    formData.append('clock_in', schedule.clock_in)
    formData.append('clock_out', schedule.clock_out)

    try {
      const response = await employeeService.createScheduleEmployee(formData)
      const result = await response.data
      notifier.show({
        message: 'Berhasil Menambahkan Schedule',
        description: result.message || 'Schedule berhasil ditambahkan.',
        severity: 'success'
      })
      setOpenDialog((prev) => ({ ...prev, addData: false }))
      fetchData()

      setSchedule({
        outlet_id: localStorage.getItem('outletGuid'),
        outlet_name: localStorage.getItem('outletName'),
        employee_id: '',
        employee_name: '',
        employee_position: '',
        user_id: '',
        date: '',
        clock_in: '',
        clock_out: ''
      })
    } catch (error) {
      notifier.show({
        message: 'Gagal Menambahkan Schedule',
        description: error.response?.data?.message || 'Terjadi kesalahan pada server!',
        severity: 'error'
      })
      console.error('Error:', error)
      if (error.response) {
        console.error('Error during check-in', error.response.data.message)
        notifier.show({
          message: 'Gagal Menambahkan Schedule',
          description: error.response.data.message || 'Terjadi kesalahan pada server!',
          severity: 'error'
        })
      }
    } finally {
      setLoading((prev) => ({ ...prev, addData: false }))
    }
  }
  const handleSubmitImport = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await employeeService.importScheduleEmployee(attachmentUrl)
      notifier.show({
        message: 'Berhasil Mengimpor Schedule',
        description: response.data?.message || 'Schedule berhasil diimpor.',
        severity: 'success'
      })
      setOpenDialog((prev) => ({ ...prev, import: false }))
      fetchData()
      setImportSchedule({ file: '' })
    } catch (error) {
      console.error('Error:', error)
      notifier.show({
        message: 'Gagal Mengimpor Schedule',
        description: error.response?.data?.message || 'Terjadi kesalahan pada server!',
        severity: 'error'
      })

      if (error.response) {
        console.log('Server Response:', error.response.data)
        notifier.show({
          message: 'Gagal Mengimpor Schedule',
          description: error.response.data.message || 'Terjadi kesalahan pada server!',
          severity: 'error'
        })
      } else if (error.request) {
        console.log('No Response from Server:', error.request)
        notifier.show({
          message: 'Gagal Mengimpor Schedule',
          description: 'Tidak ada respons dari server. Silakan coba lagi.',
          severity: 'error'
        })
      } else {
        console.log('Error Setting Up Request:', error.message)
        notifier.show({
          message: 'Gagal Mengimpor Schedule',
          description: error.message || 'Terjadi kesalahan saat mengirim permintaan!',
          severity: 'error'
        })
      }

      setImportSchedule({ file: '' })
    } finally {
      setLoading(false)
    }
  }

  const handleEChange = (e) => {
    const newUser = e.target.value
    console.log(newUser, 'isi user employee')
    setSchedule((prevData) => ({
      ...prevData,
      employee_id: newUser.guid,
      user_id: newUser.user_id,
      employee_name: newUser.employee_name,
      employee_position: newUser.position
    }))
    setNewUser(newUser)
  }

  const handleChange2 = (e) => {
    const { name, value } = e.target
    setSchedule((prevData) => ({
      ...prevData,
      [name]: value
    }))
  }

  const handleEmployeeChange = (e) => {
    const newUserId = e.target.value
    setUserId(newUserId)
  }

  const columns = [
    columnHelper.accessor('rowIndex', {
      header: () => 'No',
      cell: (info) => <Typography variant="body1">{info.row.index + 1}</Typography>
    }),
    columnHelper.accessor('employee_name', {
      header: () => 'Nama',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('employee_position', {
      header: () => 'Posisi',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('date', {
      header: () => 'Tanggal',
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
      header: () => 'Aksi',
      cell: (info) => {
        return (
          <Box display="flex" justifyContent="center" gap={1}>
            <Tooltip title="Delete">
              <IconButton
                color="error"
                onClick={() => {
                  setSelectedRow(info.row.original)
                  setOpenDialog((prev) => ({ ...prev, delete: true }))
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
  }, [pageParams.page, pageParams.pageSize, debouncedSearch, userId])

  return {
    data,
    loading,
    pageParams,
    setPageParams,
    table,
    columns,
    permissions,
    selectedRow,
    newUser,
    importSchedule,
    setImportSchedule,
    handleDelete,
    userId,
    handleEmployeeChange,
    employee,
    openDialog,
    setOpenDialog,
    handleSubmit,
    handleEChange,
    handleChange2,
    handleSubmitImport,
    setAttachmentUrl,
    schedule
  }
}
