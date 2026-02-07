import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
// Services
import CartService from '@renderer/services/cartService'
import ProductService from '@renderer/services/productService'
import { useNetworkStore } from '@renderer/store/networkStore'
import { formatRupiah, parseCurrencyToNumber } from '@renderer/utils/myFunctions'
import { useNotifier } from '@renderer/components/core/NotificationProvider'

export const useCreateTransaction = () => {
  const navigate = useNavigate()
  const notifier = useNotifier()

  // Services
  const cartService = CartService()
  const productService = ProductService()

  // Network status
  const isOnline = useNetworkStore((state) => state.isOnline)

  // ================================
  // STATE MANAGEMENT
  // ================================

  // Loading states
  const [loading, setLoading] = useState(false)

  // Master data
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [bankOptions, setBankOptions] = useState([])
  const [rooms, setRooms] = useState([])
  const [productSatuanList, setProductSatuanList] = useState([])
  // Cart data
  const [cartItems, setCartItems] = useState([])
  const [subTotal, setSubTotal] = useState(0)
  const [grandTotal, setGrandTotal] = useState(0)
  const [finalGrandTotal, setFinalGrandTotal] = useState(0)

  // Customer selection
  const [customer, setCustomer] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [searchTermCustomer, setSearchTermCustomer] = useState('')

  // Product selection
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchTermProduct, setSearchTermProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState(0)
  const [selectedSatuanId, setSelectedSatuanId] = useState(null)
  const [isSatuanReadonly, setIsSatuanReadonly] = useState(false)
  const [satuanName, setSatuanName] = useState('')

  // Room selection (for hotel/kos)
  const [selectedRoomId, setSelectedRoomId] = useState(null)

  // Employee selection
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [commissionActive, setCommissionActive] = useState(false)

  // Discount
  const [discountType, setDiscountType] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [status, setStatus] = useState('SUBMIT')
  const [amountPaid, setAmountPaid] = useState('')
  const [change, setChange] = useState(0)

  // Bank Transfer fields
  const [referenceNumber, setReferenceNumber] = useState('')
  const [senderName, setSenderName] = useState('')
  const [bankRecipient, setBankRecipient] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [uploadImage, setUploadImage] = useState(null)

  // Debit/Credit fields
  const [cardType, setCardType] = useState('')
  const [approvalCode, setApprovalCode] = useState('')
  const [traceNumber, setTraceNumber] = useState('')

  // Notes
  const [notes, setNotes] = useState('')
  const [notesInternal, setNotesInternal] = useState('')

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    item: null
  })

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const formatNominal = (value) => {
    const cleanValue = value.replace(/[^0-9]/g, '')
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(cleanValue))
  }

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  // ================================
  // DATA FETCHING
  // ================================

  const fetchCart = useCallback(async () => {
    setLoading((prev) => ({ ...prev, cart: true }))
    try {
      const result = await cartService.getCart()
      if (result) {
        setCartItems(result.items)
        setSubTotal(result.sub_total)
        setGrandTotal(result.grand_total)
      } else {
        setCartItems([])
        setSubTotal(0)
        setGrandTotal(0)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading((prev) => ({ ...prev, cart: false }))
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading((prev) => ({ ...prev, products: true }))
    try {
      const params = {
        p: 1,
        ps: 20,
        outletId: localStorage.getItem('outletGuid') || '',
        ...(searchTermProduct && { search: searchTermProduct })
      }
      const response = await productService.getProducts(params)
      setProducts(response.data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading((prev) => ({ ...prev, products: false }))
    }
  }, [searchTermProduct])

  const fetchCustomers = useCallback(async () => {
    setLoading((prev) => ({ ...prev, customers: true }))
    try {
      const params = {
        p: 1,
        ps: 20,
        ...(searchTermCustomer && { search: searchTermCustomer })
      }
      const response = await cartService.getCustomers(params)
      setCustomers(response.data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading((prev) => ({ ...prev, customers: false }))
    }
  }, [searchTermCustomer])

  const fetchEmployees = useCallback(async () => {
    setLoading((prev) => ({ ...prev, employees: true }))
    try {
      const response = await cartService.getEmployees()
      setEmployees(response.data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading((prev) => ({ ...prev, employees: false }))
    }
  }, [])

  const fetchBankOptions = useCallback(async () => {
    setLoading((prev) => ({ ...prev, banks: true }))
    try {
      const response = await cartService.getBankOptions()
      setBankOptions(response.data || [])
    } catch (error) {
      console.error('Error fetching bank options:', error)
    } finally {
      setLoading((prev) => ({ ...prev, banks: false }))
    }
  }, [])

  const fetchRooms = useCallback(async () => {
    setLoading((prev) => ({ ...prev, rooms: true }))
    try {
      const response = await cartService.getRooms()
      setRooms(response.data || [])
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading((prev) => ({ ...prev, rooms: false }))
    }
  }, [])

  const fetchCommissionStatus = useCallback(async () => {
    try {
      const isActive = await cartService.getCommissionStatus()
      setCommissionActive(isActive)
    } catch (error) {
      console.error('Error checking commission status:', error)
    }
  }, [])

  // ================================
  // PRODUCT HANDLERS
  // ================================

  const handleProductChange = (_event, newValue) => {
    setSelectedProduct(newValue)

    if (newValue) {
      setPrice(newValue.price_walkin || newValue.price)

      // Handle product satuan
      if (newValue.product_satuan && newValue.product_satuan.length > 0) {
        // Filter out deleted items
        const filteredSatuan = newValue.product_satuan.filter((item) => !item.deleted_at)

        // Add default satuan
        const defaultSatuan = {
          id: 999,
          satuan: {
            id: 999,
            name: newValue.satuan_detail?.name || ''
          }
        }
        filteredSatuan.push(defaultSatuan)

        setProductSatuanList(filteredSatuan)
        setSelectedSatuanId(999)
        setIsSatuanReadonly(false)
      } else {
        setSatuanName(newValue.satuan_detail?.name || '')
        setIsSatuanReadonly(true)
        setProductSatuanList([])
      }
    } else {
      // Reset all product-related fields
      setPrice(0)
      setSatuanName('')
      setIsSatuanReadonly(false)
      setProductSatuanList([])
      setSelectedSatuanId(null)
    }
  }

  const handleSatuanChange = (_event, newValue) => {
    if (newValue) {
      setSatuanName(newValue.satuan?.name || '')
      setSelectedSatuanId(newValue.id)
    } else {
      setSatuanName('')
      setSelectedSatuanId(null)
    }
  }

  // ================================
  // CART HANDLERS
  // ================================

  const handleAddToCart = async () => {
    if (!selectedProduct) {
      notifier.show({
        message: 'Terjadi Kesalahan',
        description: `Pilih produk terlebih dahulu`,
        severity: 'warning'
      })
      return
    }

    if (quantity <= 0) {
      notifier.show({
        message: 'Terjadi Kesalahan',
        description: `Jumlah harus lebih dari 0`,
        severity: 'warning'
      })
      return
    }

    setLoading((prev) => ({ ...prev, addToCart: true }))
    try {
      const payload = {
        product_id: selectedProduct.guid,
        check_in: getTodayDate(),
        check_out: getTomorrowDate(),
        qty: quantity,
        note: '',
        ...(customer?.id && { customer_id: customer.id }),
        ...(selectedRoomId && { no_room: [selectedRoomId] }),
        product_satuan_id: selectedSatuanId === 999 ? null : selectedSatuanId
      }

      // Build product info for offline display
      const productInfo = {
        name: selectedProduct.name || selectedProduct.product_name || 'Produk',
        price: price || selectedProduct.price_walkin || selectedProduct.price || 0,
        satuan_name: satuanName || selectedProduct.satuan_detail?.name || '',
        satuan_id: selectedSatuanId === 999 ? null : selectedSatuanId,
        customer_name: customer?.full_name || customerName || '-'
      }

      const response = await cartService.addToCart(payload, productInfo)
      console.log(response.offline)

      // Refresh cart (works for both online and offline)
      await fetchCart()

      // Reset product selection
      setSelectedProduct(null)
      setQuantity(1)
      setPrice(0)
      setSelectedSatuanId(null)
      setSelectedRoomId(null)

      if (response.offline) {
        notifier.show({
          message: 'Tersimpan Offline',
          description: `Produk ditambahkan ke keranjang lokal. Akan disinkronisasi saat online.`,
          severity: 'success'
        })
      } else {
        notifier.show({
          message: 'Sukses',
          description: `Produk berhasil ditambahkan ke keranjang`,
          severity: 'success'
        })
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      notifier.show({
        message: 'Terjadi Kesalahan',
        description: `${error?.response?.data?.message || 'Gagal menambahkan produk ke keranjang'}`,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, addToCart: false }))
    }
  }

  const handleDeleteClick = (item) => {
    setDeleteDialog({ open: true, item })
  }

  const handleConfirmDelete = async () => {
    if (!deleteDialog.item) return

    setLoading((prev) => ({ ...prev, deleteItem: true }))
    try {
      const result = await cartService.removeCartItem(deleteDialog.item.cart_items_id)
      await fetchCart()

      if (result.offline && result.status === 'error') {
        notifier.show({
          message: 'Tidak Tersedia',
          description: result.message || 'Hapus item server tidak tersedia saat offline.',
          severity: 'warning'
        })
      } else {
        notifier.show({
          message: 'Sukses',
          description: `Item berhasil dihapus dari keranjang`,
          severity: 'success'
        })
      }
    } catch (error) {
      console.error('Error deleting cart item:', error)
      notifier.show({
        message: 'Terjadi Kesalahan',
        description: `${error?.response?.data?.message || 'Gagal menghapus item dari keranjang'}`,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, deleteItem: false }))
      setDeleteDialog({ open: false, item: null })
    }
  }

  const handleCancelDelete = () => {
    setDeleteDialog({ open: false, item: null })
  }

  // ================================
  // PAYMENT HANDLERS
  // ================================

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value)
  }

  const handleStatusChange = (event) => {
    setStatus(event.target.value)
  }

  const handleAmountPaidChange = (event) => {
    const inputValue = event.target.value
    const formattedValue = formatNominal(inputValue)
    const paidAmount = parseCurrencyToNumber(formattedValue)
    const changeAmount = paidAmount - finalGrandTotal

    setAmountPaid(formattedValue)
    setChange(changeAmount)
  }

  const handleDiscountTypeChange = (event) => {
    setDiscountType(event.target.value)
    setDiscountAmount('')
  }

  const handleDiscountAmountChange = (event) => {
    const value = event.target.value

    if (isNaN(Number(value)) && value !== '') return

    if (discountType === 'percentage') {
      const numValue = parseFloat(value)
      if (numValue > 100) {
        setDiscountAmount('100')
      } else {
        setDiscountAmount(value)
      }
    } else {
      setDiscountAmount(value)
    }
  }

  // ================================
  // FILE UPLOAD (DROPZONE)
  // ================================

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]
      setUploadImage(file)

      try {
        const result = await cartService.uploadReceipt(file)
        setAttachmentUrl(result.url)
        notifier.show({
          message: 'Sukses',
          description: 'Bukti berhasil diupload',
          severity: 'success'
        })
      } catch (error) {
        console.error('Error uploading file:', error)
        notifier.show({
          message: 'Terjadi Kesalahan',
          description: 'Gagal mengupload bukti transfer',
          severity: 'error'
        })
      }
    }
  })

  // ================================
  // CHECKOUT
  // ================================

  const validateCheckout = () => {
    if (cartItems.length === 0) {
      notifier.show({
        message: 'Terjadi Kesalahan',
        description: `Keranjang masih kosong`,
        severity: 'warning'
      })
      return false
    }

    if (paymentMethod === 'Cash' && status === 'PAID') {
      if (!amountPaid || parseCurrencyToNumber(amountPaid) <= 0) {
        notifier.show({
          message: 'Terjadi Kesalahan',
          description: `Jumlah bayar harus lebih dari 0`,
          severity: 'warning'
        })
        return false
      }
    }

    if (paymentMethod === 'bank_transfer' && status === 'PAID') {
      if (!referenceNumber || !senderName || !bankRecipient) {
        notifier.show({
          message: 'Terjadi Kesalahan',
          description: `Lengkapi data transfer bank`,
          severity: 'warning'
        })
        return false
      }
    }

    if (paymentMethod === 'debit_credit' && status === 'PAID') {
      if (!cardType || !approvalCode || !traceNumber || !referenceNumber) {
        notifier.show({
          message: 'Terjadi Kesalahan',
          description: `Lengkapi data kartu debit/kredit`,
          severity: 'warning'
        })
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateCheckout()) return

    setLoading((prev) => ({ ...prev, submit: true }))
    try {
      const payload = {
        type: 'WALK IN',
        payment_method: status === 'SUBMIT' ? 'cashless' : paymentMethod,
        name: senderName || customer?.full_name || customerName || '-',
        billing_name: senderName || customer?.full_name || customerName || '-',
        bank_name: paymentMethod === 'bank_transfer' ? bankRecipient : '',
        attachment: attachmentUrl ? uploadImage?.name || '' : '',
        refference_id: referenceNumber || '',
        no_appr: approvalCode || '',
        no_trace: traceNumber || '',
        notes: notes || '',
        notes_internal: notesInternal || '',
        status: status,
        is_repeat: false
      }

      // Add employee IDs if selected
      if (selectedEmployees.length > 0) {
        payload.employee_id = selectedEmployees.map((emp) => emp.guid)
      }

      // Add discount if applied
      if (discountType && discountAmount) {
        payload.discount_type = discountType
        payload.discount_nominal = parseFloat(discountAmount) || 0
      }

      await cartService.checkout(payload)
      notifier.show({
        message: !isOnline ? 'Tersimpan Offline' : 'Sukses',
        description: !isOnline
          ? 'Transaksi tersimpan offline. Akan disinkronisasi saat online.'
          : 'Transaksi berhasil dibuat',
        severity: 'success'
      })

      // Navigate to history after success
      setTimeout(() => {
        navigate('/transaction/history')
      }, 1000)
    } catch (error) {
      console.error('Error submitting transaction:', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal membuat transaksi'
      notifier.show({
        message: 'Terjadi Kesalahan',
        description: errorMessage,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }))
    }
  }

  // ================================
  // EFFECTS
  // ================================

  // Calculate final grand total with discount
  useEffect(() => {
    if (!grandTotal || !discountType || !discountAmount) {
      setFinalGrandTotal(grandTotal)
      return
    }

    let updatedGrandTotal = grandTotal
    const discountValue = parseFloat(discountAmount)

    if (discountType === 'percentage' && discountValue >= 0 && discountValue <= 100) {
      updatedGrandTotal = grandTotal - grandTotal * (discountValue / 100)
    } else if (discountType === 'nominal' && discountValue >= 0 && discountValue <= grandTotal) {
      updatedGrandTotal = grandTotal - discountValue
    }

    setFinalGrandTotal(updatedGrandTotal)
  }, [grandTotal, discountType, discountAmount])

  // Fetch products when search term changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProducts()
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchTermProduct])

  // Fetch customers when search term changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCustomers()
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchTermCustomer])

  // Initial data fetch
  useEffect(() => {
    fetchCart()
    fetchEmployees()
    fetchBankOptions()
    fetchRooms()
    fetchCommissionStatus()
  }, [])

  // ================================
  // RETURN VALUES
  // ================================

  return {
    // Network status
    isOnline,

    // Loading states
    loading,

    // Master data
    products,
    customers,
    employees,
    bankOptions,
    rooms,
    productSatuanList,

    // Cart
    cartItems,
    subTotal,
    grandTotal,
    finalGrandTotal,
    fetchCart,

    // Customer
    customer,
    setCustomer,
    customerName,
    setCustomerName,
    searchTermCustomer,
    setSearchTermCustomer,

    // Product selection
    selectedProduct,
    searchTermProduct,
    setSearchTermProduct,
    quantity,
    setQuantity,
    price,
    satuanName,
    selectedSatuanId,
    isSatuanReadonly,
    handleProductChange,
    handleSatuanChange,

    // Room
    selectedRoomId,
    setSelectedRoomId,

    // Employee
    selectedEmployees,
    setSelectedEmployees,
    commissionActive,

    // Discount
    discountType,
    discountAmount,
    handleDiscountTypeChange,
    handleDiscountAmountChange,

    // Payment
    paymentMethod,
    status,
    amountPaid,
    change,
    handlePaymentMethodChange,
    handleStatusChange,
    handleAmountPaidChange,

    // Bank Transfer
    referenceNumber,
    setReferenceNumber,
    senderName,
    setSenderName,
    bankRecipient,
    setBankRecipient,
    uploadImage,
    getRootProps,
    getInputProps,

    // Debit/Credit
    cardType,
    setCardType,
    approvalCode,
    setApprovalCode,
    traceNumber,
    setTraceNumber,

    // Notes
    notes,
    setNotes,
    notesInternal,
    setNotesInternal,

    // Cart actions
    handleAddToCart,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    deleteDialog,

    // Checkout
    handleSubmit,

    // Pagination
    page,
    setPage,
    pageSize,
    setPageSize,

    // Utilities
    formatNominal,
    formatRupiah
  }
}
