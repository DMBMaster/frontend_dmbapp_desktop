import { useState, useEffect } from 'react'
import InstoreService from '@renderer/services/instoreService'
import { useDropzone } from 'react-dropzone'
import MediaService from '@renderer/services/mediaService'
import { useNotifier } from '@renderer/components/core/NotificationProvider'

export const useInstore = () => {
  const notifier = useNotifier()
  const instoreService = InstoreService()
  const mediaService = MediaService()

  // ============================
  // STATE MANAGEMENT
  // ============================

  // Form States
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [rooms, setRooms] = useState([{ roomType: '', roomNumber: '' }])
  const [roomCount, setRoomCount] = useState('')
  const [roomDetails, setRoomDetails] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [adultCount, setAdultCount] = useState('')
  const [childCount, setChildCount] = useState('')
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [identityType, setIdentityType] = useState('')
  const [identityNumber, setIdentityNumber] = useState('')
  const [email, setEmail] = useState('')
  const [discountType, setDiscountType] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // UI States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  // Calculation States
  const [subTotal, setSubTotal] = useState(0)
  const [grandTotal, setGrandTotal] = useState(0)
  const [totalDiscount, setTotalDiscount] = useState(0)
  const [roomPrice, setRoomPrice] = useState(0)
  const [nightCount, setNightCount] = useState(0)

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [senderName, setSenderName] = useState('')
  const [bankRecipient, setBankRecipient] = useState('')
  const [bankRecipientName, setBankRecipientName] = useState('')
  const [bankAccountRecipient, setBankAccountRecipient] = useState('')
  const [transferProof] = useState(null)
  const [cardType, setCardType] = useState('')
  const [approvalCode, setApprovalCode] = useState('')
  const [traceNumber, setTraceNumber] = useState('')
  const [isMonthlyTransaction, setIsMonthlyTransaction] = useState(false)
  const [attatchmentUrl, setAttachmentUrl] = useState('')
  const [uploadImage, setUploadImage] = useState(null)
  const [banks, setBanks] = useState([])
  const [tenor, setTenor] = useState('')
  const [customTenor, setCustomTenor] = useState('')
  const [trxGuid, setTrxGuid] = useState('')

  // Room & Rate Plan States
  const [roomNumbers, setRoomNumbers] = useState([])
  const [listRatePlan, setListRatePlan] = useState([])
  const [filteredRatePlans, setFilteredRatePlans] = useState([])

  // ============================
  // DATE CALCULATIONS
  // ============================

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const formatDate = (date) => {
    const d = new Date(date)
    return d.toISOString().split('T')[0]
  }

  const allowedCheckInMin = formatDate(yesterday)
  const minCheckOutDate = checkInDate
    ? formatDate(new Date(new Date(checkInDate).setDate(new Date(checkInDate).getDate() + 1)))
    : allowedCheckInMin

  // ============================
  // VALIDATION FUNCTIONS
  // ============================

  const validateForm = () => {
    let valid = true

    // Check if roomCount is set and greater than 0
    if (!roomCount || roomCount < 1) {
      valid = false
    }

    // Validate room details
    for (let i = 0; i < roomDetails.length; i++) {
      const room = roomDetails[i]
      if (!room.roomType || !room.roomNumber || !room.adultCount) {
        valid = false
        break
      }
    }

    // Validate check-in and check-out dates
    if (!checkInDate || !checkOutDate) {
      valid = false
    }

    // Ensure check-out date is after check-in date
    if (checkOutDate && checkInDate && new Date(checkOutDate) <= new Date(checkInDate)) {
      valid = false
    }

    // Validate payment method
    if (!paymentMethod) {
      valid = false
    }

    // Validate payment method specific fields
    if (paymentMethod === 'Cash') {
      if (!senderName && !guestName) {
        valid = false
      }
    } else if (paymentMethod === 'bank_transfer') {
      if (!referenceNumber || (!senderName && !guestName) || !bankRecipient || !uploadImage) {
        valid = false
      }
    } else if (paymentMethod === 'debit_credit') {
      if (!cardType || !approvalCode || !traceNumber || !referenceNumber || !uploadImage) {
        valid = false
      }
    }

    // Validate customer or guest fields
    if (!selectedCustomer) {
      if (!guestName || !guestPhone || !identityType || !identityNumber) {
        valid = false
      }
    }

    setIsValid(valid)
  }

  // ============================
  // CALCULATION FUNCTIONS
  // ============================

  const calculateSubTotal = (rooms, count) => {
    console.log(count)
    const total = rooms.reduce((acc, room) => {
      const roomPrice = room.ratePlanPrice || room.price || 0
      return acc + roomPrice
    }, 0)

    setSubTotal(total)
    calculateGrandTotal(total, discountType, discountAmount)
  }

  const calculateGrandTotal = (total, type, amount) => {
    let discountValue = 0

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setTotalDiscount(0)
      setGrandTotal(total)
      return
    }

    if (type === 'percentage') {
      discountValue = (parsedAmount / 100) * total
    } else if (type === 'nominal') {
      discountValue = parsedAmount
    }

    discountValue = discountValue > total ? total : discountValue
    const newTotal = total - discountValue

    setTotalDiscount(discountValue)
    setGrandTotal(newTotal > 0 ? newTotal : 0)
  }

  const calculateTotalCost = () => {
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate)
      const checkOut = new Date(checkOutDate)
      const diffTime = checkOut - checkIn
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setNightCount(nights)

      let totalPrice = 0
      roomDetails.forEach((room) => {
        const pricePerNight = room.ratePlanPrice || room.price || 0
        totalPrice += pricePerNight * nights
      })

      setSubTotal(totalPrice)
      calculateGrandTotal(totalPrice, discountType, discountAmount)
    }
  }

  // ============================
  // FORMAT FUNCTIONS
  // ============================

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatNominal = (value) => {
    const cleanValue = value.toString().replace(/[^0-9]/g, '')
    const numericValue = parseInt(cleanValue, 10)
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericValue)
  }

  const formatPercentage = (value) => {
    const cleanValue = value.toString().replace(/[^0-9]/g, '')
    const numericValue = Math.min(Math.max(parseInt(cleanValue, 10), 0), 100)
    return numericValue
  }

  // ============================
  // EVENT HANDLERS
  // ============================

  const handleCheckboxChange = (event) => {
    setIsMonthlyTransaction(event.target.checked)
  }

  const handleSnackbarClose = () => {
    setSnackbarOpen(false)
  }

  const handleDiscountChange = (e) => {
    setDiscountType(e.target.value)
    setDiscountAmount('')
    calculateGrandTotal(subTotal, e.target.value, discountAmount)
  }

  const handleChange = (event) => {
    let inputValue = event.target.value ? event.target.value.toString() : ''
    inputValue = inputValue.replace(/\D/g, '')

    if (inputValue === '') {
      inputValue = '0'
    }

    const numericValue = parseFloat(inputValue)

    if (discountType === 'nominal') {
      setDiscountAmount(formatNominal(numericValue))
    } else if (discountType === 'percentage') {
      setDiscountAmount(formatPercentage(numericValue))
    }

    calculateGrandTotal(subTotal, discountType, numericValue)
  }

  const handleBankSelect = (event) => {
    const selectedBankId = event.target.value
    const selectedBank = banks.find((bank) => bank.id === selectedBankId)

    if (selectedBank) {
      setBankRecipient(selectedBank.id)
      setBankRecipientName(selectedBank.name)
      setBankAccountRecipient(selectedBank.account_no)
    }
  }

  const handleRoomCountChange = (e) => {
    const count = parseInt(e.target.value, 10)
    setRoomCount(count)
    const details = Array.from({ length: count }, () => ({
      roomType: '',
      ratePlan: '',
      ratePlanPrice: 0,
      adultCount: '',
      childCount: '',
      breakfast: 'false'
    }))
    setRoomDetails(details)
    calculateSubTotal(rooms, count)
  }

  const handleRoomDetailChange = (index, field, value) => {
    const updatedRoomDetails = [...roomDetails]
    updatedRoomDetails[index][field] = value

    if (field === 'roomType') {
      fetchRoomNumbers(value, index)
      const roomTypeRatePlans = listRatePlan.filter((ratePlan) => ratePlan.roomtypeid === value)
      setFilteredRatePlans(roomTypeRatePlans)
      updatedRoomDetails[index].ratePlan = ''
      updatedRoomDetails[index].ratePlanPrice = 0

      const selectedRoomType = roomTypes.find((type) => type.guid === value)
      if (selectedRoomType) {
        updatedRoomDetails[index].price = selectedRoomType.price_walkin || selectedRoomType.price
        setRoomPrice(selectedRoomType.price_walkin || selectedRoomType.price)
      }
    }

    if (field === 'ratePlan') {
      const selectedRatePlan = listRatePlan.find((plan) => plan.id === value)

      if (selectedRatePlan) {
        const ratePlanPrice = parseFloat(
          selectedRatePlan.baseprice || selectedRatePlan.rate_price || 0
        )
        updatedRoomDetails[index].ratePlanPrice = ratePlanPrice
        updatedRoomDetails[index].price = ratePlanPrice
        calculateSubTotal(updatedRoomDetails, roomCount)
      }
    }

    setRoomDetails(updatedRoomDetails)
  }

  // ============================
  // API FUNCTIONS
  // ============================

  const fetchCustomers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        p: 1,
        ps: 10,
        outlet_id: localStorage.getItem('outletGuid')
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      const response = await instoreService.getCustomers(params)
      setCustomers(response.data || [])
    } catch (err) {
      console.log('Error fetching customers:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoomTypes = async () => {
    try {
      setLoading(true)
      const response = await instoreService.getRoomTypes()
      setRoomTypes(response.data || [])
    } catch (error) {
      console.error('Error fetching room types:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRatePlans = async () => {
    try {
      setLoading(true)
      const response = await instoreService.getRatePlansFromService({
        outlet_id: localStorage.getItem('outletGuid'),
        p: 1,
        ps: 100,
        ob: 'DESC'
      })

      const ratePlans = response.data || []
      const transformedData = ratePlans.map((plan) => ({
        id: plan.id,
        guid: plan.guid,
        name: plan.name,
        description: plan.description,
        roomtypeid: plan.product_guid,
        baseprice: plan.rate_price,
        rate_price: plan.rate_price,
        min_rate_price: plan.min_rate_price,
        product_name: plan.product_name,
        is_breakfast: plan.is_breakfast
      }))

      setListRatePlan(transformedData)
    } catch (error) {
      console.error('Error fetching rate plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBanks = async () => {
    setLoading(true)
    try {
      const response = await instoreService.getPaymentMethods()
      setBanks(response.data || [])
    } catch (err) {
      console.error('Error fetching banks:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoomNumbers = async (roomType, index) => {
    console.log(index)
    setLoading(true)
    try {
      const response = await instoreService.getRoomNumbers(roomType, checkInDate, checkOutDate)
      setRoomNumbers(response.data || [])
    } catch (error) {
      console.error('Failed to fetch room numbers:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============================
  // FORM ACTIONS
  // ============================

  const resetForm = () => {
    setSelectedCustomer(null)
    setGuestName('')
    setGuestPhone('')
    setIdentityType('')
    setIdentityNumber('')
    setPaymentMethod('')
    setSenderName('')
    setReferenceNumber('')
    setBankRecipient('')
    setUploadImage(null)
    setCardType('')
    setApprovalCode('')
    setTraceNumber('')
    setRoomCount(1)
    setRoomDetails([])
    setCheckInDate('')
    setCheckOutDate('')
    setIsValid(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    validateForm()
    if (!isValid) {
      console.log('Form validation failed!')
      return
    }

    setIsSubmitting(true)

    try {
      const items = []

      for (let i = 0; i < roomCount; i++) {
        if (!roomDetails[i]?.roomType || !roomDetails[i]?.roomNumber) {
          continue
        }

        items.push({
          product_id: roomDetails[i].roomType,
          room_id: roomDetails[i].roomNumber,
          rate_plan_id: roomDetails[i].ratePlan || '',
          qty: 1,
          note: notes || '',
          adult_qty: roomDetails[i].adultCount || '1',
          child_qty: roomDetails[i].childCount || '0',
          breakfast: roomDetails[i].breakfast || 'false'
        })
      }

      const payload = {
        outlet_id: localStorage.getItem('outletGuid'),
        type_order: 'WALKIN',
        check_in: checkInDate,
        check_out: checkOutDate,
        items,
        ...(selectedCustomer && { customer_id: selectedCustomer.id || selectedCustomer }),
        payment_method: paymentMethod,
        name: senderName || guestName || '',
        billing_name: senderName || guestName || '',
        phone: guestPhone || '',
        email: email || '',
        identity: identityType || '',
        identity_number: identityNumber || '',
        bank_name: bankRecipientName || '',
        bank_account: bankAccountRecipient || '',
        attachment: attatchmentUrl || '',
        refference_id: referenceNumber || '',
        no_appr: approvalCode || '',
        no_trace: traceNumber || '',
        ticket_status: 'CHECKIN',
        is_repeat: isMonthlyTransaction || false,
        status: paymentMethod === 'cicilan' ? 'SUBMIT' : 'PAID'
      }

      // Add discount fields if discount is applied
      if (discountType && discountAmount && !isNaN(discountAmount)) {
        payload.discount_type = discountType
        payload.discount_nominal = parseFloat(discountAmount.toString().replace(/[^0-9]/g, ''))
      }

      // Add tenor field for installment payment
      if (paymentMethod === 'cicilan') {
        payload.tenor_cicilan = tenor === 'custom' ? customTenor : tenor
      }

      console.log('Payload to be sent:', JSON.stringify(payload, null, 2))

      const response = await instoreService.createWalkInTransaction(payload)

      setTrxGuid(response.guid)
      setSnackbarMessage('Berhasil membuat transaksi baru')
      setSnackbarOpen(true)

      if (response.payments?.payment_guide) {
        const paymentUrl = response.payments.payment_guide
        window.open(paymentUrl, 'PaymentWindow', 'width=600,height=800')
      }

      setTimeout(() => {
        window.location.href = `/transaction/detail/${response.guid}`
      }, 500)
    } catch (error) {
      console.error('Error during submission:', error)
      setError('An unexpected error occurred. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================
  // FILE UPLOAD
  // ============================

  const { getRootProps, getInputProps } = useDropzone({
    accept: 'image/*',
    onDrop: async (acceptedFiles) => {
      setUploadImage(acceptedFiles[0])
      try {
        const result = await mediaService.uploadReceipt(acceptedFiles[0])
        setAttachmentUrl(result.url)
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
  })

  // ============================
  // USE EFFECTS
  // ============================

  useEffect(() => {
    validateForm()
  }, [
    selectedCustomer,
    guestName,
    guestPhone,
    identityType,
    identityNumber,
    email,
    roomDetails,
    roomCount,
    paymentMethod,
    senderName,
    referenceNumber,
    bankRecipient,
    cardType,
    approvalCode,
    traceNumber,
    uploadImage
  ])

  useEffect(() => {
    calculateTotalCost()
  }, [checkInDate, checkOutDate, discountType, discountAmount, roomDetails])

  useEffect(() => {
    fetchCustomers()
  }, [searchTerm])

  useEffect(() => {
    fetchRoomTypes()
    fetchRatePlans()
    fetchBanks()
  }, [])

  // ============================
  // RETURN HOOK VALUES
  // ============================

  return {
    // States
    customers,
    selectedCustomer,
    rooms,
    roomCount,
    roomDetails,
    roomTypes,
    adultCount,
    childCount,
    checkInDate,
    checkOutDate,
    guestName,
    guestPhone,
    identityType,
    identityNumber,
    email,
    discountType,
    discountAmount,
    notes,
    searchTerm,
    loading,
    error,
    isSubmitting,
    isValid,
    snackbarOpen,
    snackbarMessage,
    subTotal,
    grandTotal,
    totalDiscount,
    roomPrice,
    nightCount,
    paymentMethod,
    referenceNumber,
    senderName,
    bankRecipient,
    bankRecipientName,
    bankAccountRecipient,
    transferProof,
    cardType,
    approvalCode,
    traceNumber,
    isMonthlyTransaction,
    attatchmentUrl,
    uploadImage,
    banks,
    tenor,
    customTenor,
    trxGuid,
    roomNumbers,
    listRatePlan,
    filteredRatePlans,
    allowedCheckInMin,
    minCheckOutDate,

    // Setters
    setCustomers,
    setSelectedCustomer,
    setRooms,
    setRoomCount,
    setRoomDetails,
    setRoomTypes,
    setAdultCount,
    setChildCount,
    setCheckInDate,
    setCheckOutDate,
    setGuestName,
    setGuestPhone,
    setIdentityType,
    setIdentityNumber,
    setEmail,
    setDiscountType,
    setDiscountAmount,
    setNotes,
    setSearchTerm,
    setPaymentMethod,
    setReferenceNumber,
    setSenderName,
    setBankRecipient,
    setBankRecipientName,
    setBankAccountRecipient,
    setCardType,
    setApprovalCode,
    setTraceNumber,
    setIsMonthlyTransaction,
    setUploadImage,
    setTenor,
    setCustomTenor,

    // Functions
    formatCurrency,
    handleCheckboxChange,
    handleSnackbarClose,
    handleDiscountChange,
    handleChange,
    handleBankSelect,
    handleRoomCountChange,
    handleRoomDetailChange,
    resetForm,
    handleSubmit,
    getRootProps,
    getInputProps,

    // Validation
    validateForm
  }
}
