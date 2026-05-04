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

const formatNumber = (value, options = {}) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '0'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  }).format(amount)
}

const createEmptyReport = () => ({
  summary: {
    totalRevenue: 0,
    totalExpenses: 0,
    grossProfit: 0,
    profitMargin: '0.00%',
    averageTransactionValue: 0
  },
  revenueByCategory: {},
  expensesByCategory: {}
})

const generateProfitLossReport = (transactions, expenses) => {
  const revenueByCategory = {}
  let totalRevenue = 0
  let transactionCount = 0

  Object.entries(transactions || {}).forEach(([categoryName, items]) => {
    if (!Array.isArray(items)) return
    const categoryTotal = items.reduce((sum, item) => sum + Number(item?.sub_total || 0), 0)
    revenueByCategory[categoryName] = categoryTotal
    totalRevenue += categoryTotal
    transactionCount += items.length
  })

  const expensesByCategory = {}
  let totalExpenses = 0

  ;(expenses || []).forEach((expense) => {
    const categoryName = expense?.category_name || expense?.category || 'Lainnya'
    const amount = Number(expense?.total || 0)
    expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + amount
    totalExpenses += amount
  })

  const grossProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const averageTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0

  return {
    summary: {
      totalRevenue,
      totalExpenses,
      grossProfit,
      profitMargin: `${profitMargin.toFixed(2)}%`,
      averageTransactionValue
    },
    revenueByCategory,
    expensesByCategory
  }
}

export const useReportProfit = () => {
  const notifier = useNotifier()
  const permissions = usePermissions(userRole)
  const reportService = ReportService()

  const [loading, setLoading] = useState(false)
  const [hasData, setHasData] = useState(false)
  const [reportData, setReportData] = useState(createEmptyReport())
  const [pageParams, setPageParams] = useState({
    startDate: getFirstDayOfCurrentMonth(),
    endDate: getTodayDate()
  })

  const fetchData = useCallback(async () => {
    if (!permissions.read) return

    setLoading(true)
    try {
      const transactionParams = {
        start_at: pageParams.startDate,
        end_at: pageParams.endDate,
        outlet_id: localStorage.getItem('outletGuid'),
        outlet_category_id: localStorage.getItem('outletCategoryId')
      }

      const expensesParams = {
        start_date: pageParams.startDate,
        end_date: pageParams.endDate,
        outlet_id: localStorage.getItem('outletGuid')
      }

      const [transactionResponse, expensesResponse] = await Promise.all([
        reportService.getTransactionReport(transactionParams),
        reportService.getExpensesReport(expensesParams)
      ])

      const transactions =
        transactionResponse?.data && typeof transactionResponse.data === 'object'
          ? transactionResponse.data
          : {}
      const expenses = Array.isArray(expensesResponse?.data) ? expensesResponse.data : []

      const generatedReport = generateProfitLossReport(transactions, expenses)
      const hasRevenue = Object.keys(generatedReport.revenueByCategory).length > 0
      const hasExpenses = Object.keys(generatedReport.expensesByCategory).length > 0

      setReportData(generatedReport)
      setHasData(hasRevenue || hasExpenses)
    } catch (error) {
      setReportData(createEmptyReport())
      setHasData(false)
      notifier.show({
        message: 'Gagal mengambil data laporan laba rugi',
        description: error?.response?.data?.message || 'Terjadi kesalahan saat mengambil data.',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [notifier, pageParams.endDate, pageParams.startDate, permissions.read, reportService])

  useEffect(() => {
    fetchData()
  }, [])

  const exportPdf = useCallback(async () => {
    if (!hasData) return

    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()
    const outletName = localStorage.getItem('outletName') || 'Outlet'
    const summary = reportData.summary

    doc.setFontSize(18)
    doc.text('Laporan Laba Rugi', 105, 18, { align: 'center' })
    doc.setFontSize(12)
    doc.text(outletName, 105, 27, { align: 'center' })
    doc.text(`Periode: ${pageParams.startDate} s/d ${pageParams.endDate}`, 105, 35, {
      align: 'center'
    })

    doc.setFontSize(11)
    doc.text(`Total Pendapatan: Rp ${formatNumber(summary.totalRevenue)}`, 14, 48)
    doc.text(`Total Pengeluaran: Rp ${formatNumber(summary.totalExpenses)}`, 14, 56)
    doc.text(`Laba Kotor: Rp ${formatNumber(summary.grossProfit)}`, 14, 64)
    doc.text(`Margin Laba: ${summary.profitMargin}`, 14, 72)
    doc.text(
      `Nilai Transaksi Rata-rata: Rp ${formatNumber(summary.averageTransactionValue, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`,
      14,
      80
    )

    autoTable(doc, {
      head: [['Kategori Pendapatan', 'Total (Rp)']],
      body: Object.entries(reportData.revenueByCategory).map(([category, amount]) => [
        category,
        formatNumber(amount)
      ]),
      startY: 90
    })

    autoTable(doc, {
      head: [['Kategori Pengeluaran', 'Total (Rp)']],
      body: Object.entries(reportData.expensesByCategory).map(([category, amount]) => [
        category,
        formatNumber(amount)
      ]),
      startY: doc.lastAutoTable.finalY + 8
    })

    doc.save(`laporan-laba-rugi-${pageParams.startDate}-${pageParams.endDate}.pdf`)
  }, [hasData, pageParams.endDate, pageParams.startDate, reportData])

  const exportExcel = useCallback(async () => {
    if (!hasData) return

    const XLSX = await import('xlsx')
    const summary = reportData.summary

    const rows = [
      ['Laporan Laba Rugi'],
      [`Periode: ${pageParams.startDate} s/d ${pageParams.endDate}`],
      [],
      ['Ringkasan'],
      ['Total Pendapatan', summary.totalRevenue],
      ['Total Pengeluaran', summary.totalExpenses],
      ['Laba Kotor', summary.grossProfit],
      ['Margin Laba', summary.profitMargin],
      ['Nilai Transaksi Rata-rata', summary.averageTransactionValue],
      [],
      ['Pendapatan per Kategori'],
      ['Kategori', 'Total (Rp)'],
      ...Object.entries(reportData.revenueByCategory).map(([category, amount]) => [
        category,
        amount
      ]),
      [],
      ['Pengeluaran per Kategori'],
      ['Kategori', 'Total (Rp)'],
      ...Object.entries(reportData.expensesByCategory).map(([category, amount]) => [
        category,
        amount
      ])
    ]

    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'LabaRugi')
    XLSX.writeFile(wb, `laporan-laba-rugi-${pageParams.startDate}-${pageParams.endDate}.xlsx`)
  }, [hasData, pageParams.endDate, pageParams.startDate, reportData])

  return {
    loading,
    hasData,
    reportData,
    pageParams,
    setPageParams,
    fetchData,
    exportPdf,
    exportExcel,
    formatNumber,
    permissions,
    title: 'Laporan Laba Rugi',
    subtitle: 'Ringkasan profit dan loss',
    breadcrumbs: [{ to: '/', title: 'Home' }, { title: 'Laporan' }, { title: 'Laporan Laba Rugi' }],
    emptyLabel: 'Belum ada data laba rugi pada periode tersebut'
  }
}
