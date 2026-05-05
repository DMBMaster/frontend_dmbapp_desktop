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

const formatDateForDisplay = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

const sanitizeFileName = (value) => (value || '').replace(/[^a-zA-Z0-9_-]/g, '_')

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
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
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
    if (!hasData) {
      notifier.show({
        message: 'Tidak ada data untuk diexport',
        description: 'Silakan fetch data terlebih dahulu.',
        severity: 'warning'
      })
      return
    }

    setExportingPdf(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()
      const outletName = localStorage.getItem('outletName') || 'Outlet Tidak Diketahui'
      const summary = reportData.summary

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('Laporan Laba Rugi', 105, 20, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(14)
      doc.text(outletName, 105, 30, { align: 'center' })

      doc.setFontSize(12)
      doc.text(
        `Periode: ${formatDateForDisplay(pageParams.startDate)} - ${formatDateForDisplay(pageParams.endDate)}`,
        105,
        40,
        { align: 'center' }
      )

      doc.setFontSize(10)
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 55)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('Ringkasan', 14, 70)

      doc.setFont('helvetica', 'normal')
      doc.text(`Total Pendapatan: Rp ${formatNumber(summary.totalRevenue)}`, 14, 80)
      doc.text(`Total Pengeluaran: Rp ${formatNumber(summary.totalExpenses)}`, 14, 90)
      doc.text(`Laba Kotor: Rp ${formatNumber(summary.grossProfit)}`, 14, 100)
      doc.text(`Margin Laba: ${summary.profitMargin || '0.00%'}`, 14, 110)
      doc.text(
        `Nilai Transaksi Rata-rata: Rp ${formatNumber(summary.averageTransactionValue, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`,
        14,
        120
      )

      autoTable(doc, {
        head: [['No', 'Kategori', 'Total (Rp)']],
        body: Object.entries(reportData.revenueByCategory || {}).map(
          ([category, amount], index) => [index + 1, category, formatNumber(amount)]
        ),
        startY: 135,
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [203, 17, 14], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 18 },
          1: { halign: 'left' },
          2: { halign: 'right', cellWidth: 42 }
        },
        margin: { left: 14, right: 14 }
      })

      const expenseStartY = (doc.lastAutoTable?.finalY || 140) + 12
      doc.setFont('helvetica', 'bold')
      doc.text('Pengeluaran per Kategori', 14, expenseStartY)

      autoTable(doc, {
        head: [['No', 'Kategori', 'Total (Rp)']],
        body: Object.entries(reportData.expensesByCategory || {}).map(
          ([category, amount], index) => [index + 1, category, formatNumber(amount)]
        ),
        startY: expenseStartY + 5,
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [203, 17, 14], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 18 },
          1: { halign: 'left' },
          2: { halign: 'right', cellWidth: 42 }
        },
        margin: { left: 14, right: 14 }
      })

      const outletNameForFile = sanitizeFileName(outletName)
      doc.save(
        `Laporan_Laba_Rugi_${outletNameForFile}_${pageParams.startDate}_${pageParams.endDate}.pdf`
      )
    } catch (error) {
      notifier.show({
        message: 'Gagal export PDF',
        description: error?.message || 'Terjadi kesalahan saat membuat file PDF.',
        severity: 'error'
      })
    } finally {
      setExportingPdf(false)
    }
  }, [hasData, notifier, pageParams.endDate, pageParams.startDate, reportData])

  const exportExcel = useCallback(async () => {
    if (!hasData) {
      notifier.show({
        message: 'Tidak ada data untuk diexport',
        description: 'Silakan fetch data terlebih dahulu.',
        severity: 'warning'
      })
      return
    }

    setExportingExcel(true)
    try {
      const XLSX = await import('xlsx')
      const outletName = localStorage.getItem('outletName') || 'Outlet Tidak Diketahui'
      const summary = reportData.summary

      const rows = [
        ['Laporan Laba Rugi'],
        [outletName],
        [
          `Periode: ${formatDateForDisplay(pageParams.startDate)} - ${formatDateForDisplay(pageParams.endDate)}`
        ],
        [`Dicetak pada: ${new Date().toLocaleString('id-ID')}`],
        [],
        ['Ringkasan'],
        ['Total Pendapatan', formatNumber(summary.totalRevenue)],
        ['Total Pengeluaran', formatNumber(summary.totalExpenses)],
        ['Laba Kotor', formatNumber(summary.grossProfit)],
        ['Margin Laba', summary.profitMargin || '0.00%'],
        [
          'Nilai Transaksi Rata-rata',
          formatNumber(summary.averageTransactionValue, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
        ],
        [],
        ['Pendapatan per Kategori'],
        ['No', 'Kategori', 'Total (Rp)'],
        ...Object.entries(reportData.revenueByCategory || {}).map(([category, amount], index) => [
          index + 1,
          category,
          formatNumber(amount)
        ]),
        [],
        ['Pengeluaran per Kategori'],
        ['No', 'Kategori', 'Total (Rp)'],
        ...Object.entries(reportData.expensesByCategory || {}).map(([category, amount], index) => [
          index + 1,
          category,
          formatNumber(amount)
        ])
      ]

      const ws = XLSX.utils.aoa_to_sheet(rows)
      ws['!cols'] = [{ wch: 8 }, { wch: 36 }, { wch: 18 }]
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Laba Rugi')
      const outletNameForFile = sanitizeFileName(outletName)
      XLSX.writeFile(
        wb,
        `Laporan_Laba_Rugi_${outletNameForFile}_${pageParams.startDate}_${pageParams.endDate}.xlsx`
      )
    } catch (error) {
      notifier.show({
        message: 'Gagal export Excel',
        description: error?.message || 'Terjadi kesalahan saat membuat file Excel.',
        severity: 'error'
      })
    } finally {
      setExportingExcel(false)
    }
  }, [hasData, notifier, pageParams.endDate, pageParams.startDate, reportData])

  return {
    loading,
    hasData,
    exportingPdf,
    exportingExcel,
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
