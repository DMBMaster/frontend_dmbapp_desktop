import { useCallback, useEffect, useState } from 'react'
import { useNotifier } from '@renderer/components/core/NotificationProvider'
import { usePermissions } from '@renderer/store/usePermission'
import ReportService from '@renderer/services/reportService'
import { userRole } from '@renderer/utils/config'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

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

const getCategoryName = (categoryName) => {
  switch (categoryName) {
    case 'raw_material':
      return 'Beli Bahan Baku'
    case 'staff_lunch_costs':
      return 'Uang Makan Karyawan'
    case 'credit_and_data':
      return 'Pulsa/Internet'
    case 'utility':
      return 'Utilitas (Listrik, Air, Gas)'
    case 'staff_salary':
      return 'Gaji Staf'
    case 'rent':
      return 'Sewa'
    case 'cash_receipt':
      return 'Kas Bon'
    case 'debt':
      return 'Utang'
    case 'etc':
      return 'Lainnya'
    default:
      return categoryName || '-'
  }
}

export const useReportExpenses = () => {
  const notifier = useNotifier()
  const permissions = usePermissions(userRole)
  const reportService = ReportService()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
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

  const exportPdf = useCallback(() => {
    if (!data.length) {
      notifier.show({
        message: 'Tidak ada data untuk diexport',
        description: 'Silakan fetch data terlebih dahulu.',
        severity: 'warning'
      })
      return
    }

    setExportingPdf(true)
    try {
      const doc = new jsPDF()
      const outletName = localStorage.getItem('outletName') || 'Outlet'
      const periodText = `Periode: ${formatDateForDisplay(pageParams.startDate)} - ${formatDateForDisplay(pageParams.endDate)}`
      const grandTotal = data.reduce((sum, item) => sum + Number(item?.total || 0), 0)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text('Laporan Kategori Pengeluaran', 105, 18, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text(outletName, 105, 26, { align: 'center' })
      doc.text(periodText, 105, 34, { align: 'center' })
      doc.setFontSize(10)
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 44)

      autoTable(doc, {
        head: [['No', 'Kategori', 'Total (Rp)']],
        body: data.map((item, index) => [
          index + 1,
          getCategoryName(item?.category_name || item?.category),
          formatNumber(item?.total)
        ]),
        startY: 50,
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [203, 17, 14], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 18 },
          1: { halign: 'left' },
          2: { halign: 'right', cellWidth: 42 }
        },
        margin: { left: 14, right: 14 }
      })

      const finalY = doc.lastAutoTable?.finalY || 60
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(`Total Keseluruhan: Rp ${formatNumber(grandTotal)}`, 196, finalY + 10, {
        align: 'right'
      })

      const outletNameForFile = sanitizeFileName(outletName)
      doc.save(
        `Laporan_Kategori_${outletNameForFile}_${pageParams.startDate}_${pageParams.endDate}.pdf`
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
  }, [data, notifier, pageParams.endDate, pageParams.startDate])

  const exportExcel = useCallback(() => {
    if (!data.length) {
      notifier.show({
        message: 'Tidak ada data untuk diexport',
        description: 'Silakan fetch data terlebih dahulu.',
        severity: 'warning'
      })
      return
    }

    setExportingExcel(true)
    try {
      const outletName = localStorage.getItem('outletName') || 'Outlet'
      const grandTotal = data.reduce((sum, item) => sum + Number(item?.total || 0), 0)

      const rows = [
        ['Laporan Kategori Pengeluaran'],
        [outletName],
        [
          `Periode: ${formatDateForDisplay(pageParams.startDate)} - ${formatDateForDisplay(pageParams.endDate)}`
        ],
        [`Dicetak pada: ${new Date().toLocaleString('id-ID')}`],
        [],
        ['No', 'Kategori', 'Total (Rp)'],
        ...data.map((item, index) => [
          index + 1,
          getCategoryName(item?.category_name || item?.category),
          Number(item?.total || 0)
        ]),
        [],
        ['Total Keseluruhan', '', grandTotal]
      ]

      const ws = XLSX.utils.aoa_to_sheet(rows)
      ws['!cols'] = [{ wch: 8 }, { wch: 38 }, { wch: 18 }]
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
        { s: { r: rows.length - 1, c: 0 }, e: { r: rows.length - 1, c: 1 } }
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Pengeluaran')
      const outletNameForFile = sanitizeFileName(outletName)
      XLSX.writeFile(
        wb,
        `Laporan_Kategori_${outletNameForFile}_${pageParams.startDate}_${pageParams.endDate}.xlsx`
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
  }, [data, notifier, pageParams.endDate, pageParams.startDate])

  const columns = [
    {
      id: 'category_name',
      label: 'Kategori',
      render: (row) => getCategoryName(row.category_name || row.category)
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
    exportingPdf,
    exportingExcel,
    permissions,
    pageParams,
    setPageParams,
    fetchData,
    exportPdf,
    exportExcel,
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
