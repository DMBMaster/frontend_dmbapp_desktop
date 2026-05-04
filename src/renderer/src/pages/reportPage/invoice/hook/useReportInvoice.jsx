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

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('id-ID')
}

const formatCurrency = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? `Rp ${new Intl.NumberFormat('id-ID').format(amount)}` : 'Rp 0'
}

export const useReportInvoice = () => {
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

      const response = await reportService.getInvoiceReport(params)
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
        message: 'Gagal mengambil data laporan faktur',
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
      id: 'transaction_no',
      label: 'No Invoice',
      render: (row) => row.transaction_no || row.invoice_no || row.no_invoice || '-'
    },
    {
      id: 'reservation_name',
      label: 'Pelanggan',
      render: (row) => row.reservation_name || row.customer_name || row.name || '-'
    },
    {
      id: 'created_at',
      label: 'Tanggal',
      render: (row) => formatDateTime(row.created_at || row.createdAt || row.date)
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => row.status || '-'
    },
    {
      id: 'grand_total',
      label: 'Total',
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
    title: 'Laporan Faktur',
    subtitle: 'Ringkasan total tagihan per invoice',
    breadcrumbs: [{ to: '/', title: 'Home' }, { title: 'Laporan' }, { title: 'Faktur' }],
    searchPlaceholder: 'Cari invoice / pelanggan',
    emptyLabel: 'Belum ada data laporan faktur'
  }
}
