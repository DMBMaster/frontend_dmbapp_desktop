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

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('id-ID')
}

export const useReportDeliveryOrder = () => {
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

      const response = await reportService.getDeliveryOrderReport(params)
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
        message: 'Gagal mengambil data laporan surat jalan',
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
      id: 'do_number',
      label: 'No Surat Jalan',
      render: (row) => row.delivery_order_no || row.do_number || row.transaction_no || '-'
    },
    {
      id: 'customer',
      label: 'Pelanggan',
      render: (row) => row.reservation_name || row.customer_name || row.name || '-'
    },
    {
      id: 'date',
      label: 'Tanggal',
      render: (row) => formatDateTime(row.created_at || row.createdAt || row.date)
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => row.status || '-'
    },
    {
      id: 'total',
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
    title: 'Laporan Surat Jalan',
    subtitle: 'Ringkasan dokumen delivery order',
    breadcrumbs: [{ to: '/', title: 'Home' }, { title: 'Laporan' }, { title: 'Surat Jalan' }],
    searchPlaceholder: 'Cari no surat jalan / pelanggan',
    emptyLabel: 'Belum ada data laporan surat jalan'
  }
}
