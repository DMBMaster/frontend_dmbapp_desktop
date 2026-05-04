import { useCallback, useEffect, useState } from 'react'
import { useNotifier } from '@renderer/components/core/NotificationProvider'
import { usePermissions } from '@renderer/store/usePermission'
import ReportService from '@renderer/services/reportService'
import { userRole } from '@renderer/utils/config'

const getFirstDayDateTime = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00`
}

const getTodayDateTime = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}T23:59`
}

const formatDateTimeForApi = (value) => {
  if (!value) return ''
  const date = value.includes('T') ? new Date(`${value}:00`) : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

const formatCurrency = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? `Rp ${new Intl.NumberFormat('id-ID').format(amount)}` : 'Rp 0'
}

export const useReportCategory = () => {
  const notifier = useNotifier()
  const permissions = usePermissions(userRole)
  const reportService = ReportService()

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [summaryData, setSummaryData] = useState([])
  const [detailSections, setDetailSections] = useState([])
  const [pageParams, setPageParams] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    pageCount: 1,
    searchTerm: '',
    startDate: getFirstDayDateTime(),
    endDate: getTodayDateTime()
  })

  const fetchData = useCallback(async () => {
    if (!permissions.read) return

    setLoading(true)
    try {
      const params = {
        start_at: formatDateTimeForApi(pageParams.startDate),
        end_at: formatDateTimeForApi(pageParams.endDate),
        outlet_id: localStorage.getItem('outletGuid'),
        outlet_category_id: localStorage.getItem('outletCategoryId')
      }

      if (status) {
        params.status = status
      }

      const response = await reportService.getCategoryReport(params)
      const summaryList = Array.isArray(response?.summary) ? response.summary : []
      const groupedDetails =
        response?.data && typeof response.data === 'object' ? response.data : {}

      const details = Object.entries(groupedDetails).map(([categoryName, items]) => {
        const rows = Array.isArray(items) ? items : []
        const totalQty = rows.reduce((acc, row) => acc + Number(row.qty || 0), 0)
        const totalSubTotal = rows.reduce((acc, row) => acc + Number(row.sub_total || 0), 0)

        return {
          categoryName,
          rows,
          totalQty,
          totalSubTotal
        }
      })

      setSummaryData(summaryList)
      setDetailSections(details)
      setPageParams((prev) => ({
        ...prev,
        totalCount: summaryList.length,
        pageCount: 1,
        page: 1
      }))
    } catch (error) {
      notifier.show({
        message: 'Gagal mengambil data laporan kategori',
        description: error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data.',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [notifier, pageParams.endDate, pageParams.startDate, permissions.read, reportService, status])

  useEffect(() => {
    fetchData()
  }, [])

  const columns = [
    {
      id: 'kategori',
      label: 'Kategori',
      render: (row) => row.kategori || row.category_name || '-'
    },
    {
      id: 'total_qty',
      label: 'Total Qty',
      align: 'right',
      render: (row) => Number(row.total_qty || 0)
    },
    {
      id: 'total_sub_total',
      label: 'Total Sub Total',
      align: 'right',
      render: (row) => formatCurrency(row.total_sub_total)
    },
    {
      id: 'total_paid',
      label: 'Total Paid',
      align: 'right',
      render: (row) => formatCurrency(row.total_paid)
    }
  ]

  return {
    data: summaryData,
    summaryData,
    detailSections,
    loading,
    permissions,
    pageParams,
    setPageParams,
    fetchData,
    columns,
    status,
    setStatus,
    title: 'Laporan per Kategori',
    subtitle: 'Ringkasan transaksi berdasarkan kategori',
    breadcrumbs: [
      { to: '/', title: 'Home' },
      { title: 'Laporan' },
      { title: 'Laporan per Kategori' }
    ],
    showSearch: false,
    dateInputType: 'datetime-local',
    statusOptions: [
      { value: 'PAID', label: 'Paid' },
      { value: 'WAITING_PAYMENT', label: 'Waiting Payment' },
      { value: 'CANCELLED', label: 'Cancelled' }
    ],
    emptyLabel: 'Belum ada data laporan kategori'
  }
}
