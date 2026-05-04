import { useCallback, useEffect, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { useNotifier } from '@renderer/components/core/NotificationProvider'
import { usePermissions } from '@renderer/store/usePermission'
import ReportService from '@renderer/services/reportService'
import { userRole } from '@renderer/utils/config'

const getFirstDayOfCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

const getTodayDate = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${d}/${m}/${y} ${hh}:${mm}:${ss}`
}

const getDateFromValue = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value.date) return value.date
  return ''
}

export const useReportPresensi = () => {
  const notifier = useNotifier()
  const permissions = usePermissions(userRole)
  const reportService = ReportService()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pageParams, setPageParams] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    pageCount: 1,
    searchTerm: '',
    startDate: getFirstDayOfCurrentMonth(),
    endDate: getTodayDate()
  })

  const debouncedSearch = useDebounce(pageParams.searchTerm, 400)

  const fetchData = useCallback(async () => {
    if (!permissions.read) return

    setLoading(true)
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        start_at: pageParams.startDate,
        end_at: pageParams.endDate,
        outlet_id: localStorage.getItem('outletGuid')
      }

      if (debouncedSearch?.trim()) {
        params.search = debouncedSearch.trim()
      }

      const response = await reportService.getPresensiReport(params)
      const list = Array.isArray(response?.data) ? response.data : []
      const meta = response?.meta || {}

      setData(list)
      setPageParams((prev) => ({
        ...prev,
        totalCount: Number(meta.totalCount ?? meta.total ?? list.length),
        pageCount: Number(meta.pageCount ?? meta.lastPage ?? 1) || 1
      }))
    } catch (error) {
      notifier.show({
        message: 'Gagal mengambil data laporan presensi',
        description: error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data.',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [
    debouncedSearch,
    notifier,
    pageParams.endDate,
    pageParams.page,
    pageParams.pageSize,
    pageParams.startDate,
    permissions.read,
    reportService
  ])

  useEffect(() => {
    fetchData()
  }, [])

  const columns = [
    {
      id: 'attendance_date',
      label: 'Tanggal',
      render: (row) => formatDate(row.date || row.attendance_date || row.created_at)
    },
    {
      id: 'employee_name',
      label: 'Nama',
      render: (row) => row.employee_name || row.user_full_name || row.name || '-'
    },
    {
      id: 'code',
      label: 'Kode',
      render: (row) => row.employee_code || row.code || row.type || '-'
    },
    {
      id: 'checkin',
      label: 'Presensi Masuk',
      render: (row) => {
        const dt = formatDateTime(
          getDateFromValue(row.absensi_masuk?.jam) ||
            row.absensi_masuk?.jam?.date ||
            row.check_in ||
            row.clock_in ||
            row.start_at
        )
        const loc =
          row.absensi_masuk?.lokasi?.alamat ||
          row.check_in_location ||
          row.clock_in_location ||
          row.location_in ||
          ''
        return { dt, loc }
      }
    },
    {
      id: 'checkout',
      label: 'Presensi Pulang',
      render: (row) => {
        const dt = formatDateTime(
          getDateFromValue(row.absensi_pulang?.jam) ||
            row.absensi_pulang?.jam?.date ||
            row.check_out ||
            row.clock_out ||
            row.end_at
        )
        const loc =
          row.absensi_pulang?.lokasi?.alamat ||
          row.check_out_location ||
          row.clock_out_location ||
          row.location_out ||
          ''
        return { dt, loc }
      }
    }
  ]

  return {
    data,
    loading,
    permissions,
    pageParams,
    setPageParams,
    fetchData,
    columns,
    title: 'Laporan Presensi',
    subtitle: 'Data kehadiran karyawan',
    breadcrumbs: [{ to: '/', title: 'Home' }, { title: 'Laporan' }, { title: 'Presensi' }],
    showSearch: true,
    searchPlaceholder: 'Cari nama karyawan',
    emptyLabel: 'Belum ada data presensi'
  }
}
