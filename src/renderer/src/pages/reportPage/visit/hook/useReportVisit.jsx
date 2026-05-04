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

const formatNumber = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? new Intl.NumberFormat('id-ID').format(amount) : '0'
}

export const useReportVisit = () => {
  const notifier = useNotifier()
  const permissions = usePermissions(userRole)
  const reportService = ReportService()

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pageParams, setPageParams] = useState({
    startDate: getTodayDate(),
    endDate: getTodayDate()
  })

  const fetchData = useCallback(async () => {
    if (!permissions.read) return

    setLoading(true)
    try {
      const params = {
        start_date: pageParams.startDate,
        end_date: pageParams.endDate,
        outlet_id: localStorage.getItem('outletGuid')
      }

      const response = await reportService.getVisitSalesReport(params)
      const list = Array.isArray(response?.data) ? response.data : []
      setData(list)
    } catch (error) {
      notifier.show({
        message: 'Gagal mengambil data laporan kunjungan sales',
        description: error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data.',
        severity: 'error'
      })
      setData([])
    } finally {
      setLoading(false)
    }
  }, [notifier, pageParams.endDate, pageParams.startDate, permissions.read, reportService])

  useEffect(() => {
    fetchData()
  }, [])

  const totalVisit = data.reduce((sum, row) => sum + Number(row.total_visit || 0), 0)

  const columns = [
    {
      id: 'employee',
      label: 'Nama Karyawan',
      render: (row) => row.user_detail?.name || row.employee_name || '-'
    },
    {
      id: 'total_visit',
      label: 'Total',
      align: 'right',
      render: (row) => formatNumber(row.total_visit)
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
    totalVisit,
    formatNumber,
    title: 'Laporan Kunjungan Sales',
    subtitle: 'Ringkasan kunjungan sales per karyawan',
    breadcrumbs: [
      { to: '/', title: 'Home' },
      { title: 'Laporan' },
      { title: 'Laporan Kunjungan Sales' }
    ],
    emptyLabel: 'Belum ada data kunjungan sales'
  }
}
