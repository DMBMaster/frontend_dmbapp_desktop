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
  return Number.isFinite(amount) ? new Intl.NumberFormat('id-ID').format(Math.floor(amount)) : '0'
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('id-ID')
}

export const useReportCommission = () => {
  const notifier = useNotifier()
  const permissions = usePermissions(userRole)
  const reportService = ReportService()

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pageParams, setPageParams] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    pageCount: 1,
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

      const response = await reportService.getCommissionReport(params)
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
        message: 'Gagal mengambil data laporan komisi',
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

  const totalAmount = data.reduce((sum, row) => sum + Number(row.amount || 0), 0)

  const columns = [
    {
      id: 'employee',
      label: 'Karyawan',
      render: (row) => row.employee_detail?.employee_name || '-'
    },
    {
      id: 'amount',
      label: 'Total',
      align: 'right',
      render: (row) => formatNumber(row.amount)
    },
    {
      id: 'transaction_no',
      label: 'ID Transaksi',
      render: (row) => row.transaction?.transaction_no || '-'
    },
    {
      id: 'products',
      label: 'Produk',
      render: (row) => {
        const products = row.group_commission?.group_commission_product || []
        if (!Array.isArray(products) || products.length === 0) return '-'
        return products
          .map((item) => item?.product_detail?.name)
          .filter(Boolean)
          .join(', ')
      }
    },
    {
      id: 'created_at',
      label: 'Waktu',
      render: (row) => formatDateTime(row.created_at)
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
    totalAmount,
    formatNumber,
    title: 'Laporan Komisi',
    subtitle: 'Ringkasan komisi transaksi',
    breadcrumbs: [{ to: '/', title: 'Home' }, { title: 'Laporan' }, { title: 'Laporan Komisi' }],
    emptyLabel: 'Belum ada data komisi'
  }
}
