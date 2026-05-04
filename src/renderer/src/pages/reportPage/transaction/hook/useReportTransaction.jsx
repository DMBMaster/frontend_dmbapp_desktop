import { useCallback, useEffect, useState } from 'react'
import { useNotifier } from '@renderer/components/core/NotificationProvider'
import { usePermissions } from '@renderer/store/usePermission'
import ReportService from '@renderer/services/reportService'
import { userRole } from '@renderer/utils/config'

const getTodayDate = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`
}

const formatDateForApi = (value) => {
  if (!value) return ''
  const date = value.includes('T') ? new Date(`${value}:00`) : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const useReportTransaction = () => {
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
    startDate: getTodayDate(),
    endDate: getTodayDate()
  })

  const fetchData = useCallback(async () => {
    if (!permissions.read) return

    setLoading(true)
    try {
      const params = {
        start_at: formatDateForApi(pageParams.startDate),
        end_at: formatDateForApi(pageParams.endDate),
        outlet_id: localStorage.getItem('outletGuid'),
        outlet_category_id: localStorage.getItem('outletCategoryId')
      }

      if (status) {
        params.status = status
      }

      const response = await reportService.getTransactionReport(params)
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
        message: 'Gagal mengambil data laporan transaksi',
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
      label: 'Qty',
      align: 'right',
      render: (row) => Number(row.total_qty || 0)
    },
    {
      id: 'total_sub_total',
      label: 'Total Rupiah',
      align: 'right',
      render: (row) => new Intl.NumberFormat('id-ID').format(Number(row.total_sub_total || 0))
    },
    {
      id: 'total_submit',
      label: 'Belum Lunas',
      align: 'right',
      render: (row) => new Intl.NumberFormat('id-ID').format(Number(row.total_submit || 0))
    },
    {
      id: 'total_paid',
      label: 'Lunas',
      align: 'right',
      render: (row) => new Intl.NumberFormat('id-ID').format(Number(row.total_paid || 0))
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
    title: 'Laporan Transaksi',
    subtitle: 'Ringkasan transaksi berdasarkan grouping',
    breadcrumbs: [{ to: '/', title: 'Home' }, { title: 'Laporan' }, { title: 'Laporan Transaksi' }],
    showSearch: false,
    dateInputType: 'date',
    statusOptions: [
      { value: 'PAID', label: 'Paid' },
      { value: 'WAITING_PAYMENT', label: 'Waiting Payment' },
      { value: 'CANCELLED', label: 'Cancelled' }
    ],
    emptyLabel: 'Belum ada data laporan transaksi'
  }
}
