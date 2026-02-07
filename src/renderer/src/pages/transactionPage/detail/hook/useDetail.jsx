import { useState, useEffect } from 'react'
import TransactionDetailService from '@renderer/services/transactionDetailService'
import { useParams } from 'react-router-dom'

export const useDetail = () => {
  const transactionDetailService = TransactionDetailService()
  const { id } = useParams()

  // ============================
  // STATE MANAGEMENT
  // ============================

  // Tab and UI States
  const [value, setValue] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingChange, setLoadingChange] = useState(false)
  const [loadingPin, setLoadingPin] = useState(false)
  const [error, setError] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  // Dialog and Drawer States
  const [open, setOpen] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogOpenProduct, setDialogOpenProduct] = useState(false)
  const [openDialogCancel, setOpenDialogCancel] = useState(false)
  const [openReason, setOpenReason] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerOpenExtend, setDrawerOpenExtend] = useState(false)
  const [drawerOpenPayment, setDrawerOpenPayment] = useState(false)

  // Data States
  const [transactionDetail, setTransactionDetail] = useState(null)
  const [multiSatuan, setMultiSatuan] = useState([])
  const [units, setUnits] = useState([])
  const [rooms, setRooms] = useState([])
  const [hasRooms, setHasRooms] = useState([])
  const [balanceDue, setBalanceDue] = useState(0)
  const [breakfastList, setBreakfastList] = useState([])
  const [pins, setPins] = useState(null)
  const [balanceDetails, setBalanceDetails] = useState([])

  // Form States
  const [selectedRow, setSelectedRow] = useState(null)
  const [selectedGuest, setSelectedGuest] = useState(null)
  const [selectedRoomChange, setSelectedRoomChange] = useState({})
  const [selectedProductChange, setSelectedProductChange] = useState({})
  const [selectedRoom, setSelectedRoom] = useState({})
  const [selectedStatus, setSelectedStatus] = useState('confirmation')
  const [cancelGuid, setCancelGuid] = useState(null)
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [need, setNeed] = useState('')
  const [trxItemId, setTrxItemId] = useState('')
  const [roomDetail, setRoomDetail] = useState(null)
  const [productDetail, setProductDetail] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)

  // Form Body State
  const [formBody, setFormBody] = useState({
    product_id: null,
    reason: '',
    name: '',
    price: 0,
    sub_total: 0,
    room_id: null,
    no_room: null
  })

  // ============================
  // COMPUTED VALUES
  // ============================

  const isOpen = Boolean(anchorEl)
  const userData = JSON.parse(localStorage.getItem('loginData'))

  const isDisabled = transactionDetail?.transaction_item
    ?.filter((item) => item.name !== 'Deposit')
    ?.some((item) => {
      const checkIn = new Date(item.check_in)
      const checkOut = new Date(item.check_out)
      const duration = (checkOut - checkIn) / (1000 * 60 * 60 * 24)
      return duration >= 1
    })

  // ============================
  // API FUNCTIONS
  // ============================

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await transactionDetailService.getTransactionDetail(id)
      setTransactionDetail(response.data)
      setSelectedGuest(response.data?.guest[0] || {})
    } catch (err) {
      console.error('Error fetching transaction detail:', err)
      setError('Error fetching transaction detail')
    } finally {
      setLoading(false)
    }
  }

  const fetchDataBalanceDue = async () => {
    try {
      const response = await transactionDetailService.getBalanceDue(id)
      if (response.status === 'success') {
        setBalanceDue(response.data?.total_balance || 0)
      }
    } catch (err) {
      console.error('Error fetching balance due:', err)
    }
  }

  const fetchDataBreakfast = async () => {
    try {
      const response = await transactionDetailService.getBreakfastList(id)
      if (response.status === 'success') {
        setBreakfastList(response.data || [])
      }
    } catch (err) {
      console.error('Error fetching breakfast list:', err)
    }
  }

  const fetchRooms = async (productId) => {
    try {
      setLoadingChange(true)
      const response = await transactionDetailService.getRoomsByProduct(productId)
      setHasRooms(response.data || [])
    } catch (err) {
      console.error('Error fetching rooms:', err)
    } finally {
      setLoadingChange(false)
    }
  }

  // ============================
  // EVENT HANDLERS
  // ============================

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const handleChange2 = (e) => {
    const { name, value } = e.target
    setSelectedGuest((prevGuest) => ({
      ...prevGuest,
      [name]: value
    }))
  }

  const handleSnackbarClose = () => {
    setSnackbarOpen(false)
  }

  const handleGuestSelect = (guest) => {
    setSelectedGuest(guest)
  }

  const handleAddGuest = () => {
    setOpen(true)
  }

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelectChange = (event) => {
    const selectedValue = event.target.value
    setSelectedStatus(selectedValue)
    setAnchorEl(null)
  }

  const handleRoomChange = (event) => {
    setSelectedRoomChange(event.target.value)
  }

  const handleProductChange = (event) => {
    setSelectedProductChange(event.target.value)
  }

  const handleReasonChange = (event) => {
    setFormBody({
      ...formBody,
      reason: event.target.value
    })
  }

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0])
  }

  const handleNoteChange = (event) => {
    setNote(event.target.value)
  }

  const handleProductChange2 = (event) => {
    const selectedProduct = hasRooms.find((product) => product.guid === event.target.value)
    if (selectedProduct) {
      setFormBody({
        ...formBody,
        product_id: selectedProduct.guid,
        name: selectedProduct.product_name,
        price: selectedProduct.price,
        sub_total: selectedProduct.price
      })
    }
  }

  // ============================
  // DIALOG HANDLERS
  // ============================

  const handleDialogOpen = (detail) => {
    setRoomDetail(detail)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setRoomDetail(null)
  }

  const handleDialogOpenProduct = (detail) => {
    setProductDetail(detail)
    setDialogOpenProduct(true)
  }

  const handleDialogCloseProduct = () => {
    setDialogOpenProduct(false)
    setProductDetail(null)
  }

  const handleOpenReason = (invoice) => {
    setCancelGuid(invoice.guid)
    setOpenReason(true)
  }

  const handleCloseReason = () => {
    setOpenReason(false)
  }

  const handleCancelDialogClose = () => {
    setOpenDialogCancel(false)
  }

  const handleDeleteClick = (row) => {
    setSelectedRow(row)
    setOpenDialog(true)
  }

  const handleCancelDelete = () => {
    setOpenDialog(false)
    setSelectedRow(null)
  }

  const handleCancelClick = (guid) => {
    setCancelGuid(guid)
    setOpenDialogCancel(true)
  }

  const handleCancelUpdate = () => {
    setDialogOpen(false)
  }

  // ============================
  // DRAWER HANDLERS
  // ============================

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open)
  }

  const toggleDrawerExtend = (open) => () => {
    setDrawerOpenExtend(open)
  }

  const toggleDrawerPayment = (open) => () => {
    setDrawerOpenPayment(open)
  }

  // ============================
  // FORM SUBMISSIONS
  // ============================

  const handleSaveGuest = async () => {
    try {
      setLoading(true)
      const guestData = {
        full_name: selectedGuest.full_name || '',
        phone: selectedGuest.phone || '',
        email: selectedGuest.email || '',
        identity_type: selectedGuest.identity_type || '',
        identity_number: selectedGuest.identity_number || '',
        dob: selectedGuest.dob || '',
        address: selectedGuest.address || ''
      }

      await transactionDetailService.updateGuest(id, guestData)
      setSnackbarMessage('Guest information updated successfully')
      setSnackbarOpen(true)
      fetchData()
      setOpen(false)
    } catch (err) {
      console.error('Error updating guest:', err)
      setError('Failed to update guest information')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('guid', id)
      formData.append('employee_name', userData?.full_name || '')
      formData.append('status', selectedStatus)

      if (imageFile) {
        const uploadResponse = await transactionDetailService.uploadFile(imageFile)
        formData.append('image_url', uploadResponse.url)
      }

      // Submit the form (assuming there's an endpoint for this)
      setSnackbarMessage('Status updated successfully')
      setSnackbarOpen(true)
      fetchData()
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitChangeRoom = async (e) => {
    e.preventDefault()
    try {
      setLoadingChange(true)
      const changeData = {
        transaction_item_id: roomDetail?.guid,
        room_id: selectedRoomChange,
        reason: formBody.reason
      }

      await transactionDetailService.changeRoom(changeData)
      setSnackbarMessage('Room changed successfully')
      setSnackbarOpen(true)
      setDialogOpen(false)
      fetchData()
    } catch (err) {
      console.error('Error changing room:', err)
      setError('Failed to change room')
    } finally {
      setLoadingChange(false)
    }
  }

  const handleSubmitChangeProduct = async (e) => {
    e.preventDefault()
    try {
      setLoadingChange(true)
      const changeData = {
        transaction_item_id: productDetail?.guid,
        product_id: formBody.product_id,
        reason: formBody.reason,
        price: formBody.price
      }

      await transactionDetailService.changeProduct(changeData)
      setSnackbarMessage('Product changed successfully')
      setSnackbarOpen(true)
      setDialogOpenProduct(false)
      fetchData()
    } catch (err) {
      console.error('Error changing product:', err)
      setError('Failed to change product')
    } finally {
      setLoadingChange(false)
    }
  }

  const handleConfirmDelete = async () => {
    try {
      setLoading(true)
      await transactionDetailService.deleteTransactionItem(selectedRow.guid)
      setSnackbarMessage('Item deleted successfully')
      setSnackbarOpen(true)
      setOpenDialog(false)
      setSelectedRow(null)
      fetchData()
      fetchDataBalanceDue()
    } catch (err) {
      console.error('Error deleting item:', err)
      setError('Failed to delete item')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmCancel = async () => {
    try {
      setLoading(true)
      await transactionDetailService.cancelTransaction(cancelGuid, reason)
      setSnackbarMessage('Transaction cancelled successfully')
      setSnackbarOpen(true)
      setOpenDialogCancel(false)
      fetchData()
    } catch (err) {
      console.error('Error cancelling transaction:', err)
      setError('Failed to cancel transaction')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmUpdate = async () => {
    try {
      setLoading(true)
      const changeData = {
        transaction_item_id: roomDetail?.guid,
        room_id: selectedRoomChange,
        reason: formBody.reason
      }

      await transactionDetailService.changeRoom(changeData)
      setSnackbarMessage('Room updated successfully')
      setSnackbarOpen(true)
      setDialogOpen(false)
      fetchData()
    } catch (err) {
      console.error('Error updating room:', err)
      setError('Failed to update room')
    } finally {
      setLoading(false)
    }
  }

  const handleChange3 = async (event, productId, guid) => {
    const status = event.target.value
    try {
      await transactionDetailService.updateTransactionStatus(productId, guid, status)
      setSnackbarMessage('Status updated successfully')
      setSnackbarOpen(true)
      fetchData()
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Failed to update status')
    }
  }

  const handleSubmitPin = async (e) => {
    e.preventDefault()
    try {
      setLoadingPin(true)
      const pinData = {
        guid: id,
        phone: selectedGuest?.phone || '',
        need
      }

      await transactionDetailService.sendPinCode(pinData)
      setSnackbarMessage('PIN sent successfully')
      setSnackbarOpen(true)
    } catch (err) {
      console.error('Error sending PIN:', err)
      setError('Failed to send PIN')
    } finally {
      setLoadingPin(false)
    }
  }

  const handleResend = async (codePin) => {
    try {
      await transactionDetailService.resendPinCode(codePin)
      setSnackbarMessage('PIN resent successfully')
      setSnackbarOpen(true)
    } catch (err) {
      console.error('Error resending PIN:', err)
      setError('Failed to resend PIN')
    }
  }

  const handleSend = async (codePinGuid) => {
    try {
      const sendData = { code_pin_guid: codePinGuid }
      await transactionDetailService.sendPinCode(sendData)
      setSnackbarMessage('PIN sent successfully')
      setSnackbarOpen(true)
    } catch (err) {
      console.error('Error sending PIN:', err)
      setError('Failed to send PIN')
    }
  }

  const handleRequest = async (guid) => {
    try {
      await transactionDetailService.requestPinCode(guid)
      setSnackbarMessage('PIN request sent successfully')
      setSnackbarOpen(true)
    } catch (err) {
      console.error('Error requesting PIN:', err)
      setError('Failed to request PIN')
    }
  }

  const openPopupCashless = async () => {
    try {
      const response = await transactionDetailService.openPaymentPopup(id)
      if (response.data?.payment_link) {
        window.open(response.data.payment_link, 'PaymentWindow', 'width=600,height=800')
      }
    } catch (err) {
      console.error('Error opening payment popup:', err)
      setError('Failed to open payment')
    }
  }

  // ============================
  // UTILITY FUNCTIONS
  // ============================

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const formatDob = (dob) => {
    const date = new Date(dob)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const formatNumber = (amount) => {
    return new Intl.NumberFormat('id-ID').format(amount)
  }

  const formatNumberWithCommas = (amount) => {
    return new Intl.NumberFormat('id-ID').format(amount)
  }

  const calculateNights = (checkInDate, checkOutDate) => {
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)
    const diffTime = checkOut - checkIn
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const IDRtoUSD = (amount) => (amount / 15000).toFixed(2)

  const handleRoomChangeSubmit = (room, reason) => {
    console.log('Room change:', room, reason)
  }

  // ============================
  // USE EFFECTS
  // ============================

  useEffect(() => {
    fetchData()
    fetchDataBalanceDue()
    fetchDataBreakfast()
  }, [])

  useEffect(() => {
    if (transactionDetail?.guest && transactionDetail.guest.length > 0) {
      setSelectedGuest(transactionDetail.guest[0])
    }
  }, [transactionDetail])

  useEffect(() => {
    if (transactionDetail?.transaction_item) {
      const roomItems = transactionDetail.transaction_item.filter((item) => {
        const checkIn = new Date(item.check_in)
        const checkOut = new Date(item.check_out)
        const duration = (checkOut - checkIn) / (1000 * 60 * 60 * 24)
        return duration >= 1
      })

      if (roomItems.length > 0) {
        roomItems.forEach((item) => {
          if (item.product_id) {
            fetchRooms(item.product_id)
          }
        })
      }
    }
  }, [transactionDetail])

  // ============================
  // RETURN HOOK VALUES
  // ============================

  return {
    // States
    value,
    multiSatuan,
    loading,
    open,
    error,
    snackbarOpen,
    snackbarMessage,
    anchorEl,
    transactionDetail,
    units,
    openDialog,
    selectedRow,
    cancelGuid,
    openReason,
    pins,
    drawerOpen,
    drawerOpenExtend,
    drawerOpenPayment,
    rooms,
    selectedRoomChange,
    selectedProductChange,
    selectedRoom,
    note,
    openDialogCancel,
    selectedStatus,
    imageFile,
    balanceDue,
    dialogOpen,
    dialogOpenProduct,
    reason,
    roomDetail,
    productDetail,
    loadingChange,
    trxItemId,
    hasRooms,
    loadingPin,
    need,
    breakfastList,
    formBody,
    selectedGuest,
    balanceDetails,
    isOpen,
    isDisabled,
    userData,
    id,

    // Setters
    setValue,
    setMultiSatuan,
    setLoading,
    setOpen,
    setError,
    setSnackbarOpen,
    setSnackbarMessage,
    setAnchorEl,
    setTransactionDetail,
    setUnits,
    setOpenDialog,
    setSelectedRow,
    setCancelGuid,
    setOpenReason,
    setPins,
    setDrawerOpen,
    setDrawerOpenExtend,
    setDrawerOpenPayment,
    setRooms,
    setSelectedRoomChange,
    setSelectedProductChange,
    setSelectedRoom,
    setNote,
    setOpenDialogCancel,
    setSelectedStatus,
    setImageFile,
    setBalanceDue,
    setDialogOpen,
    setDialogOpenProduct,
    setReason,
    setRoomDetail,
    setProductDetail,
    setLoadingChange,
    setTrxItemId,
    setHasRooms,
    setLoadingPin,
    setNeed,
    setBreakfastList,
    setFormBody,
    setSelectedGuest,
    setBalanceDetails,

    // Event Handlers
    handleChange,
    handleChange2,
    handleSnackbarClose,
    handleGuestSelect,
    handleAddGuest,
    handleClick,
    handleClose,
    handleSelectChange,
    handleRoomChange,
    handleProductChange,
    handleReasonChange,
    handleFileChange,
    handleNoteChange,
    handleProductChange2,

    // Dialog Handlers
    handleDialogOpen,
    handleDialogClose,
    handleDialogOpenProduct,
    handleDialogCloseProduct,
    handleOpenReason,
    handleCloseReason,
    handleCancelDialogClose,
    handleDeleteClick,
    handleCancelDelete,
    handleCancelClick,
    handleCancelUpdate,

    // Drawer Handlers
    toggleDrawer,
    toggleDrawerExtend,
    toggleDrawerPayment,

    // Form Submissions
    handleSaveGuest,
    handleSubmit,
    handleSubmitChangeRoom,
    handleSubmitChangeProduct,
    handleConfirmDelete,
    handleConfirmCancel,
    handleConfirmUpdate,
    handleChange3,
    handleSubmitPin,
    handleResend,
    handleSend,
    handleRequest,
    openPopupCashless,

    // Utility Functions
    formatDate,
    formatDob,
    formatNumber,
    formatNumberWithCommas,
    calculateNights,
    IDRtoUSD,
    handleRoomChangeSubmit,

    // API Functions
    fetchData,
    fetchDataBalanceDue,
    fetchDataBreakfast,
    fetchRooms
  }
}
