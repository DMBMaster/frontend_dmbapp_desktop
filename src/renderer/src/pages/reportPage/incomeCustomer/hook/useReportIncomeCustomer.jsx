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

const formatCurrency = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? `Rp ${new Intl.NumberFormat('id-ID').format(amount)}` : 'Rp 0'
}

export const useReportIncomeCustomer = () => {
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
        start_date: pageParams.startDate,
        end_date: pageParams.endDate,
        outlet_id: localStorage.getItem('outletGuid')
      }

      if (debouncedSearch?.trim()) {
        params.search = debouncedSearch.trim()
      }

      const response = await reportService.getIncomeCustomerReport(params)
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
        message: 'Gagal mengambil data pendapatan pelanggan',
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
      id: 'customer',
      label: 'Pelanggan',
      render: (row) => row.customer_name || row.reservation_name || row.name || '-'
    },
    {
      id: 'trx_count',
      label: 'Jumlah Transaksi',
      align: 'right',
      render: (row) => row.total_transaction || row.transaction_count || row.total_invoice || 0
    },
    {
      id: 'grand_total',
      label: 'Total Pendapatan',
      align: 'right',
      render: (row) => formatCurrency(row.grand_total || row.total_bill || row.total)
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
    title: 'Pendapatan per Pelanggan',
    subtitle: 'Ringkasan pendapatan berdasarkan pelanggan',
    breadcrumbs: [
      { to: '/', title: 'Home' },
      { title: 'Laporan' },
      { title: 'Pendapatan per Pelanggan' }
    ],
    searchPlaceholder: 'Cari nama pelanggan',
    emptyLabel: 'Belum ada data pendapatan pelanggan'
  }
}
