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

const formatNumber = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? new Intl.NumberFormat('id-ID').format(amount) : '0'
}

export const useReportExpenses = () => {
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
        start_date: pageParams.startDate,
        end_date: pageParams.endDate,
        outlet_id: localStorage.getItem('outletGuid')
      }

      const response = await reportService.getExpensesReport(params)
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
        message: 'Gagal mengambil data laporan pengeluaran',
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
      id: 'category_name',
      label: 'Kategori',
      render: (row) => row.category_name || row.category || '-'
    },
    {
      id: 'total',
      label: 'Total (Rp)',
      align: 'right',
      render: (row) => formatNumber(row.total)
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
    title: 'Laporan Pengeluaran',
    subtitle: 'Ringkasan pengeluaran per kategori',
    breadcrumbs: [
      { to: '/', title: 'Home' },
      { title: 'Laporan' },
      { title: 'Laporan Pengeluaran' }
    ],
    showSearch: false,
    emptyLabel: 'Belum ada data laporan pengeluaran'
  }
}
