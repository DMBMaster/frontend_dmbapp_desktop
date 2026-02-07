import { Chip } from '@mui/material'
import ExpensesService from '@renderer/services/expensesService'
import { userData } from '@renderer/utils/config'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export const UseIndex = () => {
  const { id } = useParams()
  const expensesService = ExpensesService()

  const [detailData, setDetailData] = useState()
  const [loading, setLoading] = useState({
    fetchDetail: false
  })

  // Image modal states
  const [selectedImage, setSelectedImage] = useState('')
  const [openImageModal, setOpenImageModal] = useState(false)

  // Snackbar states
  const [snackbarSuccessOpen, setSnackbarSuccessOpen] = useState(false)
  const [snackbarSuccessMessage, setSnackbarSuccessMessage] = useState('')
  const [snackbarErrorOpen, setSnackbarErrorOpen] = useState(false)
  const [snackbarErrorMessage, setSnackbarErrorMessage] = useState('')

  // Approval dialog states
  const [openApproveDialog, setOpenApproveDialog] = useState(false)
  const [openRejectDialog, setOpenRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const fetchDetail = async () => {
    if (!id) return

    setLoading((prev) => ({ ...prev, fetchDetail: true }))
    try {
      const response = await expensesService.getExpensesDetail(id)
      setDetailData(response.data)
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading((prev) => ({ ...prev, fetchDetail: false }))
    }
  }

  useEffect(() => {
    if (!id) return

    fetchDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const getStatusColor = (action) => {
    switch (action.toLowerCase()) {
      case 'approved':
        return 'success.main'
      case 'revision':
        return 'warning.main'
      case 'rejected':
        return 'error.main'
      default:
        return 'primary.main'
    }
  }

  const getStatusExpenses = (status) => {
    switch (status) {
      case 1:
        return <Chip size="medium" color="warning" label="Pending" sx={{ fontWeight: 600 }} />
      case 2:
        return <Chip size="medium" color="success" label="Approved" sx={{ fontWeight: 600 }} />
      case 3:
        return <Chip size="medium" color="error" label="Ditolak" sx={{ fontWeight: 600 }} />
      default:
        return (
          <Chip
            size="medium"
            color="default"
            label="Status Tidak Diketahui"
            sx={{ fontWeight: 600 }}
          />
        )
    }
  }

  // Fungsi untuk mengecek apakah user dapat melakukan approval
  const canUserApprove = (userApproval, allApprovals) => {
    if (!userApproval || userApproval.status !== 'PENDING') {
      return { canApprove: false, reason: '' }
    }

    const userLevel = userApproval.level

    // Cek apakah ada level yang lebih rendah yang belum di-approve
    const lowerLevels = allApprovals.filter((approval) => approval.level < userLevel)
    const unapprovedLowerLevels = lowerLevels.filter((approval) => approval.status !== 'APPROVED')

    if (unapprovedLowerLevels.length > 0) {
      return {
        canApprove: false,
        reason: `Menunggu approval dari level ${unapprovedLowerLevels[0].level} terlebih dahulu`
      }
    }

    return { canApprove: true, reason: '' }
  }

  // Image click handler
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl)
    setOpenImageModal(true)
  }

  const handleCloseImageModal = () => {
    setOpenImageModal(false)
    setSelectedImage('')
  }

  // Approval handlers
  const handleConfirmApprove = async () => {
    try {
      const payload = {
        approval_id: detailData?.approvals?.find((a) => a.user_id === userData?.user_id)?.id,
        action: 'APPROVED',
        notes: ''
      }

      await expensesService.updateApproval(detailData.guid, payload)

      setSnackbarSuccessMessage('Pengeluaran berhasil disetujui')
      setSnackbarSuccessOpen(true)
      setOpenApproveDialog(false)

      // Refresh data
      await fetchDetail()
    } catch (error) {
      console.error('Error approving expense:', error)
      setSnackbarErrorMessage('Gagal menyetujui pengeluaran')
      setSnackbarErrorOpen(true)
    }
  }

  const handleConfirmReject = async () => {
    try {
      const payload = {
        approval_id: detailData?.approvals?.find((a) => a.user_id === userData?.user_id)?.id,
        action: 'REJECTED',
        notes: rejectReason
      }

      await expensesService.updateApproval(detailData.guid, payload)

      setSnackbarSuccessMessage('Pengeluaran berhasil ditolak')
      setSnackbarSuccessOpen(true)
      setOpenRejectDialog(false)
      setRejectReason('')

      // Refresh data
      await fetchDetail()
    } catch (error) {
      console.error('Error rejecting expense:', error)
      setSnackbarErrorMessage('Gagal menolak pengeluaran')
      setSnackbarErrorOpen(true)
    }
  }

  return {
    detailData,
    userData,
    loading,
    selectedImage,
    openImageModal,
    handleImageClick,
    handleCloseImageModal,
    getStatusColor,
    getStatusExpenses,
    canUserApprove,
    openApproveDialog,
    setOpenApproveDialog,
    openRejectDialog,
    setOpenRejectDialog,
    rejectReason,
    setRejectReason,
    handleConfirmApprove,
    handleConfirmReject,
    snackbarSuccessOpen,
    setSnackbarSuccessOpen,
    snackbarSuccessMessage,
    snackbarErrorOpen,
    setSnackbarErrorOpen,
    snackbarErrorMessage
  }
}
