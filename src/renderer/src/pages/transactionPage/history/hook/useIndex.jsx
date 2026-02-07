import { useNetworkStore } from '@renderer/store/networkStore'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { formatDate, formatDateTime, formatRupiah } from '@renderer/utils/myFunctions'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import debounce from 'lodash/debounce'
import ProductService from '@renderer/services/productService'
import ProductCategoryService from '@renderer/services/productCategoryService'
import TransactionService from '@renderer/services/transactionService'

export const UseIndex = () => {
  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'SUBMIT', label: 'BELUM BAYAR' },
    { value: 'WAITING_PAYMENT', label: 'BELUM BAYAR' },
    { value: 'PENDING', label: 'MENUNGGU' },
    { value: 'PAID', label: 'SUDAH BAYAR' },
    { value: 'INPROGRESS', label: 'SEDANG DIPROSES' },
    { value: 'SUCCESS', label: 'BERHASIL' },
    { value: 'EXPIRED', label: 'BATAL' },
    { value: 'FAILED', label: 'GAGAL' },
    { value: 'PRE_REFUND', label: 'PROSES REFUND' },
    { value: 'REFUND', label: 'REFUNDED' }
  ]

  // ================================
  // UTILITY FUNCTIONS
  // ================================
  const getStatusLabel = (status) => {
    switch (status) {
      case 'PAID':
        return 'Lunas'
      case 'SUCCESS':
        return 'Berhasil'
      case 'EXPIRED':
        return 'Batal'
      case 'CANCEL':
        return 'Batal'
      case 'SUBMIT':
        return 'Belum Bayar'
      case 'WAITING_PAYMENT':
        return 'Menunggu Pembayaran'
      case 'PENDING':
        return 'Menunggu'
      case 'INPROGRESS':
        return 'Sedang Diproses'
      case 'FAILED':
        return 'Gagal'
      case 'PRE_REFUND':
        return 'Proses Refund'
      case 'REFUND':
        return 'Refunded'
      default:
        return status
    }
  }

  const formatDateString = (datetime) => {
    if (!datetime) return '-'
    const date = new Date(datetime)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatNumber = (amount) => {
    if (!amount) return '0'
    return new Intl.NumberFormat('id-ID').format(Number(amount))
  }

  const outlets = localStorage.getItem('outlets')
  const outletsData = outlets ? JSON.parse(outlets) : []
  const selectedOutlet =
    outletsData.find((o) => o.guid === localStorage.getItem('outletGuid')) || null

  // Service
  const transactionService = TransactionService()
  const productService = ProductService()
  const productCategoryService = ProductCategoryService()

  // Network status
  const isOnline = useNetworkStore((state) => state.isOnline)

  // ================================
  // STATE
  // ================================
  // Data
  const [data, setData] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  // Filter states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('')
  const [productId, setProductId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCount, setPageCount] = useState(0)

  // Row expansion
  const [openRows, setOpenRows] = useState([])
  // Loading states
  const [loading, setLoading] = useState(false)
  const [loadingTrx, setLoadingTrx] = useState(true)
  const [loadingProduct, setLoadingProduct] = useState(false)

  // Delete dialog
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  })

  // Permissions (can be fetched from API later)
  const permissions = {
    read: true,
    create: true,
    update: true,
    delete: true
  }

  // ================================
  // FETCH DATA
  // ================================
  const fetchData = useCallback(
    async (params) => {
      setLoadingTrx(true)
      try {
        const queryParams = {
          outlet_id: params?.outletId || localStorage.getItem('outletGuid'),
          start_date: params?.startDate || startDate,
          end_date: params?.endDate || endDate,
          p: page,
          ps: pageSize
        }

        // Add optional parameters only if they have values
        const statusValue = params?.status || status
        if (statusValue) {
          queryParams.status = statusValue
        }

        const productIdValue = params?.productId || productId
        if (productIdValue) {
          queryParams.product_id = productIdValue
        }

        const categoryIdValue = params?.categoryId || categoryId
        if (categoryIdValue) {
          queryParams.category_id = categoryIdValue
        }

        const searchValue = params?.search || searchTerm
        if (searchValue) {
          queryParams.search = searchValue
        }

        const response = await transactionService.getTransactions(queryParams)
        const transactions = response.data || []

        setData(transactions)
        setTotalCount(transactions.length)
        setPageCount(Math.ceil(transactions.length / pageSize))
        setOpenRows(new Array(transactions.length).fill(false))
      } catch (error) {
        console.error('Error fetching transactions:', error)
        setSnackbar({
          open: true,
          message: 'Gagal mengambil data transaksi',
          severity: 'error'
        })
      } finally {
        setLoadingTrx(false)
      }
    },
    [
      startDate,
      endDate,
      status,
      productId,
      categoryId,
      searchTerm,
      page,
      pageSize,
      transactionService
    ]
  )

  const fetchProducts = useCallback(
    async (search) => {
      setLoadingProduct(true)
      try {
        const params = {
          outletId: localStorage.getItem('outletGuid'),
          search: search || '',
          p: 1,
          ps: 10,
          ob: 'id',
          d: 'desc'
        }
        const response = await productService.getProducts(params)
        setProducts(response.data || [])
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoadingProduct(false)
      }
    },
    [productService]
  )

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const outlet_id = localStorage.getItem('outletGuid')
      const response = await productCategoryService.getCategoriesByOutlet(outlet_id)
      setCategories(response.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }, [productCategoryService])

  // ================================
  // HANDLERS
  // ================================
  const handleRowToggle = (index) => {
    setOpenRows((prev) => {
      const newOpenRows = [...prev]
      newOpenRows[index] = !newOpenRows[index]
      return newOpenRows
    })
  }

  const handleDeleteClick = (row) => {
    setSelectedRow(row)
    setOpenDialog(true)
  }

  const handleCancelDelete = () => {
    setOpenDialog(false)
    setSelectedRow(null)
  }

  const handleConfirmDelete = async () => {
    if (!selectedRow) return

    try {
      const response = await transactionService.deleteTransaction(selectedRow.guid)

      if (response.offline) {
        setSnackbar({
          open: true,
          message: '📴 Transaksi akan dihapus saat online',
          severity: 'warning'
        })
      } else {
        setSnackbar({
          open: true,
          message: '✅ Transaksi berhasil dihapus',
          severity: 'success'
        })
      }

      handleCancelDelete()
      fetchData()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      setSnackbar({
        open: true,
        message: 'Gagal menghapus transaksi',
        severity: 'error'
      })
    }
  }

  // Debounced search for products
  const handleInputChange = useMemo(
    () =>
      debounce((_event, value) => {
        fetchProducts(value)
      }, 300),
    [fetchProducts]
  )

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  // ================================
  // FILTERED DATA (client-side filter for search)
  // ================================
  const filteredData = useMemo(() => {
    if (!searchTerm) return data

    const outletCategoryId = localStorage.getItem('outletCategoryId')

    if (outletCategoryId === '1') {
      // Hotel category
      return data.filter((item) => {
        const accountName = item.transaction_item?.[0]?.account_name || ''
        const reservationName = item.reservation_name || ''
        const combinedName = accountName || reservationName
        return combinedName.toLowerCase().includes(searchTerm.toLowerCase())
      })
    } else {
      // Other categories
      return data.filter((item) => {
        const transactionNo = item.transaction_no || ''
        const reservationName = item.reservation_name || ''
        const bookingId = item.booking_id || ''
        return (
          transactionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reservationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bookingId.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }
  }, [data, searchTerm])

  // ================================
  // EXPORT TO PDF
  // ================================
  const exportToPDF = () => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diekspor!')
      return
    }

    const doc = new jsPDF()
    doc.setFont('helvetica')

    const outletName = localStorage.getItem('outletName') || 'Semua Outlet'

    // Header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Laporan Riwayat Transaksi', 105, 20, { align: 'center' })

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

    // Table
    const tableHeaders = [['No', 'ID Transaksi', 'Tanggal', 'Pelanggan', 'Grand Total', 'Status']]

    const tableData = data.map((item, index) => [
      index + 1,
      item.transaction_no || '-',
      formatDateTime(item.created_at),
      item.reservation_name || '-',
      formatRupiah(item.grand_total),
      getStatusLabel(item.status)
    ])

    const grandTotal = data.reduce((sum, item) => sum + item.grand_total, 0)

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
          1: { cellWidth: 35 },
          2: { cellWidth: 30 },
          3: { cellWidth: 40 },
          4: { halign: 'right', cellWidth: 30 },
          5: { halign: 'center', cellWidth: 25 }
        },
        margin: { left: 14, right: 14 }
      })

      const finalY = doc.lastAutoTable?.finalY || 100
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`Total: Rp ${formatRupiah(grandTotal)}`, 174, finalY + 15, { align: 'right' })
    } catch (error) {
      console.error('Error creating PDF:', error)
    }

    const outletNameForFile = outletName.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `Laporan_Transaksi_${outletNameForFile}_${startDate || formatDate(new Date())}_${endDate || formatDate(new Date())}.pdf`
    doc.save(filename)
  }

  // ================================
  // EXPORT TO EXCEL
  // ================================
  const exportToExcel = () => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diekspor!')
      return
    }

    const outletName = localStorage.getItem('outletName') || 'Semua Outlet'

    const wsData = [
      ['Laporan Riwayat Transaksi'],
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
        'ID Transaksi',
        'Kode Pesanan',
        'Tanggal',
        'Pelanggan',
        'Sub Total',
        'Diskon',
        'Grand Total',
        'Status',
        'Catatan'
      ],
      ...data.map((item, index) => [
        index + 1,
        item.transaction_no || '-',
        item.booking_id || item.refference_id || '-',
        formatDateTime(item.created_at),
        item.reservation_name || '-',
        item.sub_total,
        item.discount_nominal || 0,
        item.grand_total,
        getStatusLabel(item.status),
        item.notes || '-'
      ]),
      [],
      [
        'Total',
        '',
        '',
        '',
        '',
        '',
        '',
        data.reduce((sum, item) => sum + item.grand_total, 0),
        '',
        ''
      ]
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    if (!ws['!merges']) ws['!merges'] = []
    ws['!merges'].push(
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 9 } }
    )

    ws['!cols'] = [
      { wch: 5 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 }
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Transaksi')

    const outletNameForFile = outletName.replace(/[^a-zA-Z0-9]/g, '_')
    const fileName = `Laporan_Transaksi_${outletNameForFile}_${startDate || formatDate(new Date())}_${endDate || formatDate(new Date())}.xlsx`

    XLSX.writeFile(wb, fileName)
  }

  // ================================
  // EFFECTS
  // ================================
  useEffect(() => {
    fetchData()
    fetchProducts()
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, productId, categoryId])

  return {
    // Data
    data: filteredData,
    products,
    categories,
    outletsData,
    selectedOutlet,
    loading,
    loadingTrx,
    loadingProduct,

    // Pagination
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    pageCount,

    // Filters
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    status,
    setStatus,
    productId,
    setProductId,
    categoryId,
    setCategoryId,
    searchTerm,
    setSearchTerm,
    statusOptions,

    // Row expansion
    openRows,
    handleRowToggle,

    // Delete
    openDialog,
    selectedRow,
    handleDeleteClick,
    handleCancelDelete,
    handleConfirmDelete,

    // Handlers
    fetchData,
    fetchProducts,
    handleInputChange,

    // Snackbar
    snackbar,
    handleCloseSnackbar,

    // Permissions
    permissions,

    // Export
    exportToPDF,
    exportToExcel,

    // Network
    isOnline,

    // Utils
    getStatusLabel,
    formatDateString,
    formatNumber
  }
}
