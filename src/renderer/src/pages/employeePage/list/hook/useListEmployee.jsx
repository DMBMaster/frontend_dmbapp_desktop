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
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material'
import { getImgUrl } from '@renderer/utils/myFunctions'
import { IconCalendar, IconEdit, IconPassword, IconSend2 } from '@tabler/icons-react'
import MediaService from '@renderer/services/mediaService'
import { usePermissions } from '@renderer/store/usePermission'
const columnHelper = createColumnHelper()

export const UseListEmployee = () => {
  const notifier = useNotifier()
  const employeeService = EmployeeService()
  const mediaService = MediaService()

  const [data, setData] = useState([])
  const permissions = usePermissions(userRole)
  const [openDialog, setOpenDialog] = useState({
    delete: false,
    import: false,
    resetPin: false,
    resetPassword: false,
    shift: false,
    updateOutlet: false,
    addData: false
  })
  const [selectedDeleteId, setSelectedDeleteId] = useState(null)
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

  const [openPreview, setOpenPreview] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')

  const [pageParams, setPageParams] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    pageCount: 0,
    searchTerm: ''
  })
  const debouncedSearch = useDebounce(pageParams.searchTerm, 500)
  const [shifts, setShifts] = useState([])
  const [selectedNewOutlet, setSelectedNewOutlet] = useState('')
  const [selectedEmployeeForUpdate, setSelectedEmployeeForUpdate] = useState(null)
  const [selectedShift, setSelectedShift] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState()
  const [files, setFiles] = useState([])

  const [employeeData, setEmployeeData] = useState({
    name: '',
    email: '',
    gender: '',
    address: '',
    position: '',
    file: null
  })

  const fetchShifts = async () => {
    setLoading((prev) => ({ ...prev, fetchShifts: true }))
    const params = {
      // p: page,
      // ps: pageSize,
      outlet_id: localStorage.getItem('outletGuid')
    }

    try {
      const response = await employeeService.getShift(params)
      setShifts(response?.data || [])
    } catch (error) {
      console.error('Error fetching shifts:', error)
    } finally {
      setLoading((prev) => ({ ...prev, fetchShifts: false }))
    }
  }

  useEffect(() => {
    if (openDialog.shift) {
      fetchShifts()
    }
  }, [openDialog.shift])

  useEffect(() => {
    setSelectedShift('')
    setSelectedEmployeeForUpdate(null)
    setSelectedNewOutlet('')
  }, [openDialog.shift, openDialog.updateOutlet])

  const handleFileChange2 = (event) => {
    setFiles([...event.target.files])
  }

  const handleSubmitEmployee = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validate required fields
    if (
      !employeeData.name ||
      !employeeData.email ||
      !employeeData.gender ||
      !employeeData.address ||
      !employeeData.position ||
      !employeeData.file
    ) {
      notifier.show({
        message: 'Gagal Menambahkan Karyawan',
        description: 'Harap isi semua field yang diperlukan.',
        severity: 'error'
      })
      setLoading(false)
      return
    }

    const formData = new FormData()
    formData.append('employee_name', employeeData.name)
    formData.append('email', employeeData.email)
    formData.append('gender', employeeData.gender)
    formData.append('employee_address', employeeData.address)
    formData.append('position', employeeData.position)
    formData.append('photo', employeeData.file)

    try {
      const userEmail = employeeData.email
      const userResponse = await employeeService.checkEmailUser(userEmail)

      if (userResponse.status == 'ok' && userResponse.data.uid) {
        const userId = userResponse.data.uid
        const formData = new FormData()
        formData.append('files', employeeData.file)
        formData.append('user_id', userId)
        const mediaUploadResponse = await mediaService.uploadAttendanceUser(formData)

        if (mediaUploadResponse.url) {
          const employeeFormData = new FormData()
          employeeFormData.append('outlet_id', localStorage.getItem('outletGuid'))
          employeeFormData.append('user_id', userId)
          employeeFormData.append('employee_name', employeeData.name)
          employeeFormData.append('email', employeeData.email)
          employeeFormData.append('gender', employeeData.gender)
          employeeFormData.append('employee_address', employeeData.address)
          employeeFormData.append('position', employeeData.position)
          employeeFormData.append('photo', mediaUploadResponse.url)

          const employeeResponse = await employeeService.createEmployee(employeeFormData)

          if (employeeResponse.data.status === 'ok') {
            notifier.show({
              message: 'Berhasil Menambahkan Karyawan',
              description: employeeResponse.message || 'Karyawan berhasil ditambahkan.',
              severity: 'success'
            })
            setOpenDialog((prev) => ({ ...prev, addData: false }))

            setEmployeeData({
              name: '',
              email: '',
              gender: '',
              address: '',
              position: '',
              file: null
            })
          } else {
            notifier.show({
              message: 'Gagal Menambahkan Karyawan',
              description:
                employeeResponse.message || 'Terjadi kesalahan saat menambahkan karyawan.',
              severity: 'error'
            })
          }

          fetchData()
        } else {
          console.error('Error uploading file:', mediaUploadResponse.statusText)
        }
      } else {
        console.error('Error fetching user:', userResponse.statusText)
      }
    } catch (error) {
      notifier.show({
        message: 'Gagal Menambahkan Karyawan',
        description:
          error.response?.data?.message || 'Terjadi kesalahan saat menambahkan karyawan.',
        severity: 'error'
      })
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitImportEmployee = async (e) => {
    e.preventDefault()
    setLoading((prev) => ({ ...prev, handleSubmitImportEmployee: true }))

    if (!files || files.length === 0) {
      notifier.show({
        message: 'Gagal Import Employee',
        description: 'Unggah setidaknya satu file.',
        severity: 'error'
      })
      setLoading((prev) => ({ ...prev, handleSubmitImportEmployee: false }))
      return
    }
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData()
      formData.append('file', files[i])
      formData.append('outlet_id', localStorage.getItem('outletGuid'))

      try {
        await employeeService.importEmployee(formData)
        notifier.show({
          message: 'Berhasil Import Employee',
          description: 'Employee berhasil diimport.',
          severity: 'success'
        })
        setFiles([])
        setOpenDialog((prev) => ({ ...prev, import: false }))
      } catch (error) {
        notifier.show({
          message: 'Gagal Import Employee',
          description:
            error.response?.data?.message || 'Terjadi kesalahan saat mengimport employee.',
          severity: 'error'
        })
      } finally {
        setLoading((prev) => ({ ...prev, handleSubmitImportEmployee: false }))
      }
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setEmployeeData((prevData) => ({
      ...prevData,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    setEmployeeData((prevData) => ({
      ...prevData,
      file: e.target.files[0]
    }))
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

      const response = await employeeService.getEmployees(params)
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
        message: 'Gagal Mengambil Data Employee',
        description: message,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }, [employeeService, pageParams.page, pageParams.pageSize, debouncedSearch])

  const handleDelete = async (id) => {
    try {
      setLoading((prev) => ({ ...prev, handleDelete: true }))
      await employeeService.deleteEmployee(id)
      notifier.show({
        message: 'Berhasil Menghapus Employee',
        description: 'Employee berhasil dihapus.',
        severity: 'success'
      })
      fetchData()
    } catch (error) {
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Menghapus Employee',
        description: message,
        severity: 'error'
      })
      console.error('Error deleting employee:', error)
    } finally {
      setLoading((prev) => ({ ...prev, handleDelete: false }))
    }
  }

  const handleCloseUpdateOutlet = () => {
    setOpenDialog((prev) => ({ ...prev, updateOutlet: false }))
    setSelectedEmployeeForUpdate(null)
    setSelectedNewOutlet('')
  }

  const handleUpdateOutletEmployee = async () => {
    setLoading((prev) => ({ ...prev, handleUpdateOutletEmployee: true }))
    try {
      await employeeService.changeOutletEmploye({
        employee_id: selectedEmployee?.guid,
        outlet_id: selectedNewOutlet
      })
      notifier.show({
        message: 'Berhasil Update Outlet Karyawan',
        description: 'Outlet karyawan berhasil diupdate.',
        severity: 'success'
      })
      fetchData()
      handleCloseUpdateOutlet()
    } catch (error) {
      console.error('Error:', error)
      notifier.show({
        message: 'Gagal Update Outlet Karyawan',
        description:
          error.response?.data?.message || 'Terjadi kesalahan saat mengupdate outlet karyawan.',
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, handleUpdateOutletEmployee: false }))
    }
  }

  const handleConfirmShift = async () => {
    setLoading((prev) => ({ ...prev, handleConfirmShift: true }))
    try {
      const formData = new FormData()
      formData.append('shift_id', selectedShift)
      formData.append('employee_id', selectedEmployee?.guid)
      formData.append('employee_name', selectedEmployee?.employee_name)
      formData.append('employee_position', selectedEmployee?.position)
      formData.append('user_id', selectedEmployee?.user_id)
      const result = await employeeService.assignShift(formData)
      notifier.show({
        message: 'Berhasil Mengatur Jadwal Shift',
        description: result.message || 'Jadwal shift berhasil diatur.',
        severity: 'success'
      })
      fetchData()
      setOpenDialog((prev) => ({ ...prev, shift: false }))
    } catch (error) {
      console.error('Error:', error)
      notifier.show({
        message: 'Gagal Mengatur Jadwal Shift',
        description:
          error.response?.data?.message || 'Terjadi kesalahan saat mengatur jadwal shift.',
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, handleConfirmShift: false }))
    }
  }

  const handleResetConfirm = async (body) => {
    setLoading((prev) => ({ ...prev, handleResetConfirm: true }))
    const formData = new FormData()
    formData.append('email', selectedEmployee?.user_data?.email)
    if (body == 'password') {
      try {
        await employeeService.forgotPassword(formData)
        notifier.show({
          message: 'Berhasil Reset Password',
          description:
            'Password baru berhasil dikirim ke email ' + selectedEmployee?.user_data?.email,
          severity: 'success'
        })
      } catch (error) {
        console.error('Error:', error)
        notifier.show({
          message: 'Gagal Reset Password',
          description: error.response?.data?.message || 'Terjadi kesalahan saat reset password.',
          severity: 'error'
        })
      } finally {
        setLoading((prev) => ({ ...prev, handleResetConfirm: false }))
        setOpenDialog((prev) => ({ ...prev, resetPassword: false }))
      }
    } else {
      try {
        await employeeService.resetPin(formData)
        notifier.show({
          message: 'Berhasil Reset Pin',
          description: 'Pin baru berhasil dikirim ke email ' + selectedEmployee?.user_data?.email,
          severity: 'success'
        })
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading((prev) => ({ ...prev, handleResetConfirm: false }))
        setOpenDialog((prev) => ({ ...prev, resetPin: false }))
      }
    }
  }

  const columns = [
    columnHelper.accessor('rowIndex', {
      header: () => 'No',
      cell: (info) => <Typography variant="body1">{info.row.index + 1}</Typography>
    }),
    columnHelper.accessor('outlet.name', {
      header: () => 'Outlet',
      cell: (info) => <Typography variant="h6">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('employee_name', {
      header: () => 'Nama',
      cell: (info) => <Typography variant="h6">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('user_data.email', {
      header: () => 'Email',
      cell: (info) => <Typography variant="h6">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('phone', {
      header: () => 'Nomor HP',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('gender', {
      header: () => 'Jenis Kelamin',
      cell: (info) => {
        return (
          <Typography variant="body1">
            {info.getValue() === 'P' ? 'Perempuan' : 'Laki-Laki'}
          </Typography>
        )
      }
    }),
    columnHelper.accessor('employee_address', {
      header: () => 'Alamat',
      cell: (info) => (
        <Typography variant="subtitle1" color="textSecondary">
          {info.getValue()}
        </Typography>
      )
    }),
    columnHelper.accessor('position', {
      header: () => 'Posisi',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('photo', {
      header: () => 'Photo',
      cell: (info) => {
        const photoURL = `${getImgUrl(info.getValue())}`
        const handleImageClick = () => {
          setPreviewImageUrl(photoURL)
          setOpenPreview(true)
        }
        return (
          <>
            <Avatar
              onClick={() => handleImageClick(photoURL)}
              src={photoURL}
              alt="Employee Photo"
              sx={{ width: 42, height: 42, cursor: 'pointer' }}
            />
            {/* Image preview dialog */}
            <Dialog open={openPreview} onClose={() => setOpenPreview(false)}>
              <DialogContent>
                <img
                  src={previewImageUrl}
                  alt="Preview"
                  style={{ width: '100%', height: 'auto' }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenPreview(false)} color="primary">
                  Close
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )
      }
    }),
    columnHelper.accessor('shift.shift.name', {
      header: () => 'Nama Shift',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('shift.shift.clock_in', {
      header: () => 'Clock In',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('shift.shift.clock_out', {
      header: () => 'Clock Out',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('actions', {
      header: () => 'Aksi',
      cell: (info) => {
        return (
          <Box display="flex" justifyContent="center" gap={1}>
            <Tooltip title="Atur Jadwal Shift">
              <IconButton
                color="success"
                onClick={() => {
                  setSelectedEmployee(info.row.original)
                  setOpenDialog((prev) => ({ ...prev, shift: true }))
                }}
              >
                <IconCalendar width={22} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset Password">
              <IconButton
                color="error"
                onClick={() => {
                  setSelectedEmployee(info.row.original)
                  setOpenDialog((prev) => ({ ...prev, resetPassword: true }))
                }}
              >
                <IconPassword width={22} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Reset Pin">
              <IconButton
                color="warning"
                onClick={() => {
                  setSelectedEmployee(info.row.original)
                  setOpenDialog((prev) => ({ ...prev, resetPin: true }))
                }}
              >
                <IconSend2 width={22} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Update Outlet">
              <IconButton
                color="info"
                onClick={() => {
                  setSelectedEmployee(info.row.original)
                  setOpenDialog((prev) => ({ ...prev, updateOutlet: true }))
                }}
              >
                <IconEdit width={22} />
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
    table,
    permissions,
    openDialog,
    setOpenDialog,
    selectedDeleteId,
    setSelectedDeleteId,
    loading,
    fetchData,
    handleDelete,
    openPreview,
    setOpenPreview,
    previewImageUrl,
    setPreviewImageUrl,
    pageParams,
    setPageParams,
    selectedNewOutlet,
    setSelectedNewOutlet,
    selectedEmployeeForUpdate,
    setSelectedEmployeeForUpdate,
    handleCloseUpdateOutlet,
    handleUpdateOutletEmployee,
    selectedShift,
    setSelectedShift,
    handleResetConfirm,
    setSelectedEmployee,
    files,
    setFiles,
    handleFileChange2,
    handleSubmitImportEmployee,
    shifts,
    handleConfirmShift,
    employeeData,
    setEmployeeData,
    handleChange,
    handleFileChange,
    handleSubmitEmployee
  }
}
