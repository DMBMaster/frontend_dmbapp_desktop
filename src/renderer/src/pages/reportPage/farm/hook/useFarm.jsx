import { Typography } from '@mui/material'
import { useNotifier } from '@renderer/components/core/NotificationProvider'
import FarmService from '@renderer/services/farmService'
import { selectedOutlet } from '@renderer/utils/config'
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { useDebounce } from '@uidotdev/usehooks'
import { useCallback, useState } from 'react'
const columnHelper = createColumnHelper()

export const UseReportFarm = () => {
  const notifier = useNotifier()
  const farmService = FarmService()
  const [dataAyamKampung, setDataAyamKampung] = useState([])
  const [dataAyamPedaging, setDataAyamPedaging] = useState([])
  const [dataAyamPetelur, setDataAyamPetelur] = useState([])
  const [dataLele, setDataLele] = useState([])
  const [dataPinahan, setDataPinahan] = useState([])

  const [importFile, setImportFile] = useState(null)

  const [loading, setLoading] = useState({
    fetchData: false,
    importData: false
  })
  const [sorting, setSorting] = useState([])
  const [openDialog, setOpenDialog] = useState({
    import: false
  })

  const [pageParams, setPageParams] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    pageCount: 0,
    searchTerm: ''
  })
  const debouncedSearch = useDebounce(pageParams.searchTerm, 500)
  const [value, setValue] = useState(0)

  const handleImportFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]

      if (allowedTypes.includes(file.type)) {
        setImportFile(file)
      } else {
        alert('Hanya file Excel (.xls, .xlsx) yang diperbolehkan')
        e.target.value = ''
      }
    }
  }

  const handleImportData = async () => {
    if (!importFile) {
      notifier.show({
        message: 'Pilih file terlebih dahulu',
        severity: 'warning'
      })
      return
    }

    const outletId = localStorage.getItem('outletGuid')
    if (!outletId) {
      notifier.show({
        message: 'Outlet ID tidak ditemukan',
        severity: 'error'
      })
      return
    }

    setLoading((prev) => ({ ...prev, importData: true }))

    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('outlet_id', outletId)

      const response = await farmService.importAllFarm(formData)

      if (response.status) {
        notifier.show({
          message: 'Data berhasil diimpor!',
          severity: 'success'
        })

        setOpenDialog((prev) => ({ ...prev, import: false }))
        setImportFile(null)
        // Reload data based on current tab
        handleChangeTabs(null, value)
      }
    } catch (error) {
      console.error('Error importing data:', error)
      let errorMessage = 'Gagal mengimpor data'

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.status === 400) {
        errorMessage = 'Format file tidak valid atau data tidak sesuai'
      } else if (error.response?.status === 413) {
        errorMessage = 'Ukuran file terlalu besar'
      }

      notifier.show({
        message: 'Gagal Mengimpor Data',
        description: errorMessage,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, importData: false }))
    }
  }

  const fetchDataAyamKampung = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        outlet_id: selectedOutlet?.guid || null,
        ...(debouncedSearch && { search: debouncedSearch })
      }

      const response = await farmService.getAllFarmAyamKampung(params)
      const data = response.data || []
      const meta = response.meta

      setDataAyamKampung(data)
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
        message: 'Gagal Mengambil Data Ayam Kampung',
        description: message,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }, [farmService, pageParams.page, pageParams.pageSize, debouncedSearch])

  const fetchDataAyamPedaging = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        outlet_id: selectedOutlet?.guid || null,
        ...(debouncedSearch && { search: debouncedSearch })
      }

      const response = await farmService.getAllFarmAyamPedaging(params)
      const data = response.data || []
      const meta = response.meta

      setDataAyamPedaging(data)
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
        message: 'Gagal Mengambil Data Ayam Pedaging',
        description: message,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }, [farmService, pageParams.page, pageParams.pageSize, debouncedSearch])

  const fetchDataAyamPetelur = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        outlet_id: selectedOutlet?.guid || null,
        ...(debouncedSearch && { search: debouncedSearch })
      }

      const response = await farmService.getAllFarmAyamPetelur(params)
      const data = response.data || []
      const meta = response.meta

      setDataAyamPetelur(data)
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
        message: 'Gagal Mengambil Data Ayam Petelur',
        description: message,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }, [farmService, pageParams.page, pageParams.pageSize, debouncedSearch])

  const fetchDataLele = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        outlet_id: selectedOutlet?.guid || null,
        ...(debouncedSearch && { search: debouncedSearch })
      }

      const response = await farmService.getAllFarmLele(params)
      const data = response.data || []
      const meta = response.meta

      setDataLele(data)
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
        message: 'Gagal Mengambil Data Lele',
        description: message,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }, [farmService, pageParams.page, pageParams.pageSize, debouncedSearch])

  const fetchDataPinahan = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        outlet_id: selectedOutlet?.guid || null,
        ...(debouncedSearch && { search: debouncedSearch })
      }

      const response = await farmService.getAllFarmPinahan(params)
      const data = response.data || []
      const meta = response.meta

      setDataPinahan(data)
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
        message: 'Gagal Mengambil Data Pinahan',
        description: message,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }, [farmService, pageParams.page, pageParams.pageSize, debouncedSearch])

  const handleChangeTabs = (event, newValue) => {
    setValue(newValue)
    setPageParams((prev) => ({
      ...prev,
      page: 1,
      pageSize: 10,
      totalCount: 0,
      pageCount: 0
    }))
    switch (newValue) {
      case 0:
        fetchDataAyamKampung()
        break
      case 1:
        fetchDataAyamPedaging()
        break
      case 2:
        fetchDataAyamPetelur()
        break
      case 3:
        fetchDataLele()
        break
      case 4:
        fetchDataPinahan()
        break
      default:
        break
    }
  }

  const columnsAyamKampung = [
    columnHelper.accessor('rowIndex', {
      header: () => 'No',
      cell: (info) => <Typography variant="body1">{info.row.index + 1}</Typography>
    }),
    columnHelper.accessor('date', {
      header: () => 'Tanggal',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('ageDays', {
      header: () => 'Umur (Minggu)',
      cell: (info) => <Typography variant="body1">{Math.floor(info.getValue() / 7)}</Typography>
    }),
    columnHelper.accessor('ageDays', {
      header: () => 'Umur (Hari)',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('dead', {
      header: () => 'Populasi Mati',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('m', {
      header: () => 'Populasi Afkir',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('feedConsumption', {
      header: () => 'Konsumsi Pakan (g/ekor)',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('totalFeed', {
      header: () => 'Total Pakan (g)',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    })
  ]

  const tableAyamKampung = useReactTable({
    data: dataAyamKampung,
    columns: columnsAyamKampung,
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

  const columnsAyamPedaging = [
    columnHelper.accessor('rowIndex', {
      header: () => 'No',
      cell: (info) => <Typography variant="body1">{info.row.index + 1}</Typography>
    }),
    columnHelper.accessor('date', {
      header: () => 'Tanggal',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('ageDays', {
      header: () => 'Umur (Minggu)',
      cell: (info) => <Typography variant="body1">{Math.floor(info.getValue() / 7)}</Typography>
    }),
    columnHelper.accessor('ageDays', {
      header: () => 'Umur (Hari)',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('dead', {
      header: () => 'Populasi Mati',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('m', {
      header: () => 'Populasi Afkir',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('feedConsumption', {
      header: () => 'Konsumsi Pakan (g/ekor)',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('totalFeed', {
      header: () => 'Total Pakan (g)',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    })
  ]

  const tableAyamPedaging = useReactTable({
    data: dataAyamPedaging,
    columns: columnsAyamPedaging,
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

  const columnsAyamPetelur = [
    columnHelper.accessor('rowIndex', {
      header: () => 'No',
      cell: (info) => <Typography variant="body1">{info.row.index + 1}</Typography>
    }),
    columnHelper.accessor('date', {
      header: () => 'Tanggal',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('ageDays', {
      header: () => 'Umur (Minggu)',
      cell: (info) => <Typography variant="body1">{Math.floor(info.getValue() / 7)}</Typography>
    }),
    columnHelper.accessor('ageDays', {
      header: () => 'Umur (Hari)',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('dead', {
      header: () => 'Populasi Mati',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('m', {
      header: () => 'Populasi Afkir',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('feedConsumption', {
      header: () => 'Konsumsi Pakan (g/ekor)',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('totalFeed', {
      header: () => 'Total Pakan (g)',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    })
  ]

  const tableAyamPetelur = useReactTable({
    data: dataAyamPetelur,
    columns: columnsAyamPetelur,
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

  const columnsLele = [
    columnHelper.accessor('rowIndex', {
      header: () => 'No',
      cell: (info) => <Typography variant="body1">{info.row.index + 1}</Typography>
    }),
    columnHelper.accessor('date', {
      header: () => 'Tanggal',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('ageDays', {
      header: () => 'Umur (Minggu)',
      cell: (info) => <Typography variant="body1">{Math.floor(info.getValue() / 7)}</Typography>
    }),
    columnHelper.accessor('ageDays', {
      header: () => 'Umur (Hari)',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('dead', {
      header: () => 'Populasi Mati',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('m', {
      header: () => 'Populasi Afkir',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('feedConsumption', {
      header: () => 'Konsumsi Pakan (g/ekor)',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('totalFeed', {
      header: () => 'Total Pakan (g)',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    })
  ]

  const tableLele = useReactTable({
    data: dataLele,
    columns: columnsLele,
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

  const columnsPinahan = [
    columnHelper.accessor('rowIndex', {
      header: () => 'No',
      cell: (info) => <Typography variant="body1">{info.row.index + 1}</Typography>
    }),
    columnHelper.accessor('date', {
      header: () => 'Tanggal',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('ageDays', {
      header: () => 'Umur (Minggu)',
      cell: (info) => <Typography variant="body1">{Math.floor(info.getValue() / 7)}</Typography>
    }),
    columnHelper.accessor('ageDays', {
      header: () => 'Umur (Hari)',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('dead', {
      header: () => 'Populasi Mati',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('m', {
      header: () => 'Populasi Afkir',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('feedConsumption', {
      header: () => 'Konsumsi Pakan (g/ekor)',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('totalFeed', {
      header: () => 'Total Pakan (g)',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    })
  ]

  const tablePinahan = useReactTable({
    data: dataPinahan,
    columns: columnsPinahan,
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

  return {
    dataAyamKampung,
    dataAyamPedaging,
    dataAyamPetelur,
    dataLele,
    dataPinahan,
    importFile,
    setImportFile,
    loading,
    openDialog,
    setOpenDialog,
    pageParams,
    setPageParams,
    value,
    handleChangeTabs,
    tableAyamKampung,
    tableAyamPedaging,
    tableAyamPetelur,
    tableLele,
    tablePinahan,
    handleImportFileChange,
    handleImportData
  }
}
