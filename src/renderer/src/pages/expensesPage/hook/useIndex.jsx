import EmployeeService from '@renderer/services/employeeService'
import ExpensesCategoryService from '@renderer/services/expensesCategoryService'
import ExpensesService from '@renderer/services/expensesService'
import { useNetworkStore } from '@renderer/store/networkStore'
import { useCallback, useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { formatDate, formatDateTime, formatRupiah } from '@renderer/utils/myFunctions'
import MediaService from '@renderer/services/mediaService'
import { useNotifier } from '@renderer/components/core/NotificationProvider'

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
      return categoryName
  }
}

export const UseIndex = () => {
  const notifier = useNotifier()
  const expensesService = ExpensesService()
  const expensesCategoryService = ExpensesCategoryService()
  const employeeService = EmployeeService()
  const mediaService = MediaService()

  const isOnline = useNetworkStore((state) => state.isOnline)

  const [data, setData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [employeeData, setEmployeeData] = useState([])

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [loading, setLoading] = useState({
    fetchData: false,
    fetchCategoryData: false,
    fetchEmployeeData: false,
    submit: false
  })

  const [openModal, setOpenModal] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const initialFormData = {
    outlet_id: localStorage.getItem('outletGuid') || '',
    employee_id: '',
    category_name: '',
    description: '',
    nominal: '',
    receipt: null,
    date: today
  }
  const [formData, setFormData] = useState(initialFormData)
  const [previewImage, setPreviewImage] = useState(null)

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  })

  const [pendingCount, setPendingCount] = useState(0)

  const fetchData = async (params) => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const queryParams = {
        outlet_id: params?.outletId || localStorage.getItem('outletGuid'),
        start_date: params?.startDate,
        end_date: params?.endDate,
        category_id: params?.categoryId,
        employee_id: params?.employeeId
      }
      const response = await expensesService.getExpenses(queryParams)
      setData(response.data || [])
    } catch (error) {
      console.log(error)
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }

  const exportToPDF = () => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diekspor!')
      return
    }

    const doc = new jsPDF()

    doc.setFont('helvetica')

    const outletName = localStorage.getItem('outletName') || 'Semua Outlet'

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Laporan Pengeluaran', 105, 20, { align: 'center' })

    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text(`${outletName}`, 105, 30, { align: 'center' })

    doc.setFontSize(12)
    const periodText =
      startDate && endDate
        ? `Periode: ${formatDate(startDate)} - ${formatDate(endDate)}`
        : `Tanggal: ${formatDate(new Date())}`
    doc.text(periodText, 105, 40, { align: 'center' })

    doc.setFontSize(10)
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 55)

    const tableHeaders = [
      ['No', 'Tanggal', 'Outlet', 'Kategori', 'Rincian', 'Nominal (Rp)', 'Status']
    ]

    const tableData = data.map((item, index) => [
      index + 1,
      formatDate(item.date),
      item.outlet_detail?.outlet?.outlet_name || '-',
      getCategoryName(item.category_name),
      item.description || '-',
      formatRupiah(item.nominal),
      item.status === 1 ? 'Pending' : item.status === 2 ? 'Approved' : 'Ditolak'
    ])

    const grandTotal = data.reduce((sum, item) => sum + parseInt(item.nominal), 0)

    try {
      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 65,
        styles: {
          fontSize: 9,
          cellPadding: 4,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: {
          fillColor: [203, 17, 14],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 48 },
          5: { halign: 'right', cellWidth: 25 },
          6: { halign: 'center', cellWidth: 22 }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: function () {
          const pageHeight = doc.internal.pageSize.height
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.text('Laporan ini dibuat secara otomatis oleh sistem', 105, pageHeight - 10, {
            align: 'center'
          })
        }
      })

      const finalY = doc.lastAutoTable?.finalY || 100
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`Total Pengeluaran: Rp ${formatRupiah(grandTotal)}`, 174, finalY + 15, {
        align: 'right'
      })
    } catch (error) {
      console.error('Error creating table:', error)

      let yPosition = 65

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('No', 20, yPosition)
      doc.text('Tanggal', 30, yPosition)
      doc.text('Outlet', 50, yPosition)
      doc.text('Kategori', 80, yPosition)
      doc.text('Rincian', 110, yPosition)
      doc.text('Nominal', 160, yPosition)
      doc.text('Status', 180, yPosition)
      yPosition += 10

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      data.forEach((item, index) => {
        doc.text((index + 1).toString(), 20, yPosition)
        doc.text(formatDate(item.date), 30, yPosition)
        doc.text(item.outlet_detail?.outlet?.outlet_name || '-', 50, yPosition)
        doc.text(getCategoryName(item.category_name), 80, yPosition)
        doc.text(item.description || '-', 110, yPosition)
        doc.text(formatRupiah(item.nominal), 160, yPosition)
        doc.text(
          item.status === 1 ? 'Pending' : item.status === 2 ? 'Approved' : 'Ditolak',
          180,
          yPosition
        )
        yPosition += 8
      })

      yPosition += 10
      doc.setFont('helvetica', 'bold')
      doc.text(`Total Pengeluaran: Rp ${formatRupiah(grandTotal)}`, 174, yPosition, {
        align: 'right'
      })
    }

    const outletNameForFile = outletName.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `Laporan_Pengeluaran_${outletNameForFile}_${
      startDate || formatDate(new Date())
    }_${endDate || formatDate(new Date())}.pdf`
    doc.save(filename)
  }

  const exportToExcel = () => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diekspor!')
      return
    }

    const outletName = localStorage.getItem('outletName') || 'Semua Outlet'

    const wsData = [
      ['Laporan Riwayat Pengeluaran'],
      [outletName],
      [
        startDate && endDate
          ? `Periode: ${formatDate(startDate)} - ${formatDate(endDate)}`
          : `Tanggal: ${formatDate(new Date())}`
      ],
      [`Dicetak pada: ${new Date().toLocaleString('id-ID')}`],
      [],
      [
        'No',
        'Waktu Input',
        'Outlet',
        'Tanggal',
        'Dibuat Oleh',
        'Kategori',
        'Rincian',
        'Nominal (Rp)',
        'Status'
      ],
      ...data.map((item, index) => [
        index + 1,
        formatDateTime(item.created_at),
        item.outlet_detail?.outlet?.outlet_name || '-',
        formatDate(item.date),
        item.user_full_name || '-',
        getCategoryName(item.category_name),
        item.description || '-',
        item.nominal,
        item.status === 1 ? 'Pending' : item.status === 2 ? 'Approved' : 'Ditolak'
      ]),
      [],
      [
        'Total Pengeluaran',
        '',
        '',
        '',
        '',
        '',
        '',
        data.reduce((sum, item) => sum + parseInt(item.nominal), 0),
        ''
      ]
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    if (!ws['!merges']) ws['!merges'] = []
    ws['!merges'].push(
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } },
      { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 6 } }
    )

    ws['!cols'] = [
      { wch: 5 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
      { wch: 40 },
      { wch: 15 },
      { wch: 15 }
    ]

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let R = 6; R <= range.e.r; R++) {
      const nominalCell = XLSX.utils.encode_cell({ r: R, c: 7 })
      if (ws[nominalCell]) {
        ws[nominalCell].t = 'n'
        ws[nominalCell].z = '#,##0'
      }
    }

    const totalCell = XLSX.utils.encode_cell({ r: wsData.length - 1, c: 7 })
    ws[totalCell].t = 'n'
    ws[totalCell].z = '#,##0'

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Pengeluaran')

    const outletNameForFile = outletName.replace(/[^a-zA-Z0-9]/g, '_')
    const fileName = `Laporan_Pengeluaran_${outletNameForFile}_${
      startDate || formatDate(new Date())
    }_${endDate || formatDate(new Date())}.xlsx`

    XLSX.writeFile(wb, fileName)
  }

  const fetchCategoryData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchCategoryData: true }))
    try {
      const response = await expensesCategoryService.getExpensesCategories()
      setCategoryData(response.data || [])
    } catch (error) {
      console.log(error)
    } finally {
      setLoading((prev) => ({ ...prev, fetchCategoryData: false }))
    }
  }, [expensesCategoryService])

  const fetchEmployeeData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchEmployeeData: true }))
    try {
      const params = {
        outlet_id: localStorage.getItem('outletGuid')
      }
      const response = await employeeService.getEmployees(params)
      setEmployeeData(response.data || [])
    } catch (error) {
      console.log(error)
    } finally {
      setLoading((prev) => ({ ...prev, fetchEmployeeData: false }))
    }
  }, [employeeService])

  const fetchPendingCount = useCallback(async () => {
    const count = await expensesService.getPendingCount()
    setPendingCount(count)
  }, [expensesService])

  const handleOpenModal = () => {
    setOpenModal(true)
  }

  const handleCloseModal = () => {
    setOpenModal(false)
    resetForm()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, receipt: file }))

    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewImage(null)
    }
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, receipt: null }))
    setPreviewImage(null)
  }

  const formatNominal = (value) => {
    const numericValue = value.replace(/[^\d]/g, '')
    if (!numericValue) return ''
    return new Intl.NumberFormat('id-ID').format(parseInt(numericValue))
  }

  const handleNominalChange = (e) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '')
    setFormData((prev) => ({ ...prev, nominal: rawValue }))
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setPreviewImage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.category_name) {
      setSnackbar({ open: true, message: 'Kategori wajib dipilih', severity: 'error' })
      return
    }

    if (!formData.nominal || parseInt(formData.nominal) <= 0) {
      setSnackbar({
        open: true,
        message: 'Nominal wajib diisi dan harus lebih dari 0',
        severity: 'error'
      })
      return
    }

    if (!formData.description.trim()) {
      setSnackbar({ open: true, message: 'Rincian/Deskripsi wajib diisi', severity: 'error' })
      return
    }

    setLoading((prev) => ({ ...prev, submit: true }))

    try {
      let uploadedReceiptUrl = ''

      if (formData.receipt) {
        try {
          const result = await mediaService.uploadReceipt(formData.receipt)
          uploadedReceiptUrl = result.url
          notifier.show({
            message: 'File uploaded successfully',
            description: 'Receipt uploaded successfully',
            severity: 'success'
          })
        } catch (error) {
          notifier.show({
            message: 'Error uploading file',
            description: `There was an error uploading the receipt. ${error.message}`,
            severity: 'error'
          })
        }
      }

      const payload = {
        outlet_id: formData.outlet_id,
        employee_id: formData.employee_id || undefined,
        category_name: formData.category_name,
        description: formData.description,
        nominal: formData.nominal,
        receipt: uploadedReceiptUrl,
        date: formData.date
      }

      const response = await expensesService.createExpenses(payload)

      if (response.offline || response.pending) {
        setSnackbar({
          open: true,
          message: '📴 Pengeluaran disimpan offline. Akan disinkronkan saat online.',
          severity: 'warning'
        })
        await fetchPendingCount()
      } else {
        setSnackbar({
          open: true,
          message: '✅ Pengeluaran berhasil disimpan!',
          severity: 'success'
        })
      }

      setTimeout(() => {
        handleCloseModal()
        fetchData()
      }, 1000)
    } catch (error) {
      console.error('Error creating expense:', error)
      setSnackbar({
        open: true,
        message: 'Gagal menyimpan pengeluaran. Silakan coba lagi.',
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }))
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  const syncPendingExpenses = useCallback(async () => {
    if (!isOnline) {
      setSnackbar({
        open: true,
        message: '📴 Tidak dapat sync, Anda sedang offline',
        severity: 'warning'
      })
      return
    }

    const result = await useNetworkStore.getState().syncAllPending()
    const expensesResult = result.find((r) => r.service === 'expenses')

    if (expensesResult && expensesResult.synced > 0) {
      setSnackbar({
        open: true,
        message: `✅ ${expensesResult.synced} pengeluaran berhasil disinkronkan!`,
        severity: 'success'
      })
      fetchData()
    }
    await fetchPendingCount()
  }, [isOnline, fetchPendingCount])

  useEffect(() => {
    fetchData()
    fetchCategoryData()
    fetchEmployeeData()
    fetchPendingCount()
  }, [])

  useEffect(() => {
    const unsubscribe = useNetworkStore.subscribe((state, prevState) => {
      const expensesResult = state.lastSyncResult.find((r) => r.service === 'expenses')
      const prevExpensesResult = prevState.lastSyncResult.find((r) => r.service === 'expenses')

      if (expensesResult && expensesResult.synced > 0 && expensesResult !== prevExpensesResult) {
        setSnackbar({
          open: true,
          message: `✅ ${expensesResult.synced} pengeluaran berhasil disinkronkan!`,
          severity: 'success'
        })

        fetchData()
        fetchPendingCount()
      }
    })

    return () => unsubscribe()
  }, [])

  return {
    data,
    categoryData,
    employeeData,
    loading,
    fetchData,
    exportToPDF,
    exportToExcel,

    startDate,
    setStartDate,
    endDate,
    setEndDate,

    openModal,
    handleOpenModal,
    handleCloseModal,

    formData,
    previewImage,
    handleChange,
    handleSelectChange,
    handleNominalChange,
    handleFileChange,
    handleRemoveImage,
    handleSubmit,
    formatNominal,

    snackbar,
    handleCloseSnackbar,

    isOnline,
    pendingCount,
    syncPendingExpenses
  }
}
