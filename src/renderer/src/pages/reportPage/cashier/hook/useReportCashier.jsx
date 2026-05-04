import { useCallback, useEffect, useState } from 'react'
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

const formatCurrency = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? new Intl.NumberFormat('id-ID').format(amount) : '0'
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('id-ID')
}

const getNonCashTotal = (detail = []) => {
  if (!Array.isArray(detail)) return 0
  return detail
    .filter((item) => item?.paid_by && item.paid_by !== 'cash')
    .reduce((sum, item) => sum + Number(item.total || 0), 0)
}

export const useReportCashier = () => {
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

  const fetchData = useCallback(async () => {
    if (!permissions.read) return

    setLoading(true)
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        start_at: pageParams.startDate,
        end_at: pageParams.endDate,
        ob: 'created_at',
        d: 'DESC',
        outlet_id: localStorage.getItem('outletGuid')
      }

      const response = await reportService.getCashierReport(params)
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
        message: 'Gagal mengambil data laporan kasir',
        description: error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data.',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [
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
      id: 'open_time',
      label: 'Waktu Buka / Tutup',
      render: (row) =>
        `Buka: ${formatDateTime(row.open_time)} | Tutup: ${formatDateTime(row.closed_time)}`
    },
    {
      id: 'cashier',
      label: 'Kasir',
      render: (row) => row?.user_detail?.data?.full_name || row?.cashier || '-'
    },
    {
      id: 'outlet',
      label: 'Outlet',
      render: (row) => row?.outlet_detail?.outlet?.outlet_name || '-'
    },
    {
      id: 'cash_first',
      label: 'Modal Awal',
      align: 'right',
      render: (row) => formatCurrency(row.cash_first)
    },
    {
      id: 'cash_end',
      label: 'Saldo Akhir Tunai',
      align: 'right',
      render: (row) => formatCurrency(row.cash_end)
    },
    {
      id: 'cash_in',
      label: 'Total Tunai Aktual',
      align: 'right',
      render: (row) => formatCurrency(row.cash_in)
    },
    {
      id: 'non_cash',
      label: 'Total Non Tunai',
      align: 'right',
      render: (row) => formatCurrency(getNonCashTotal(row.detail))
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
    title: 'Laporan Kasir',
    subtitle: 'Rekap sesi kasir per outlet',
    breadcrumbs: [{ to: '/', title: 'Home' }, { title: 'Laporan' }, { title: 'Laporan Kasir' }],
    emptyLabel: 'Belum ada data laporan kasir'
  }
}
