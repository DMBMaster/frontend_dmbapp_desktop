import { Chip } from '@mui/material'
import { useNotifier } from '@renderer/components/core/NotificationProvider'
import ExpensesService from '@renderer/services/expensesService'
import MediaService from '@renderer/services/mediaService'
import { userData } from '@renderer/utils/config'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export const UseIndex = () => {
  const notifier = useNotifier()
  const { id } = useParams()
  const expensesService = ExpensesService()
  const mediaService = MediaService()

  const [detailData, setDetailData] = useState()
  const [loading, setLoading] = useState({
    fetchDetail: false,
    uploading: false
  })

  // Image modal states
  const [selectedImage, setSelectedImage] = useState('')
  const [openImageModal, setOpenImageModal] = useState(false)

  // Approval dialog states
  const [openApproveDialog, setOpenApproveDialog] = useState(false)
  const [openRejectDialog, setOpenRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const [newReceiptFile, setNewReceiptFile] = useState(null)

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

  const getNormalizedReceipt = () =>
    detailData?.receipt ? detailData.receipt.replace('/file/', '/') : detailData?.receipt

  const isImageReceipt = () => {
    const path = getNormalizedReceipt() || ''
    // strip query params
    const clean = path.split('?')[0]
    return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(clean)
  }

  const handleReceiptFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    setNewReceiptFile(file || null)
  }

  const handleReceiptUpload = async () => {
    if (!newReceiptFile) {
      notifier.show({
        message: 'Pilih file terlebih dahulu',
        description: 'Silakan pilih file terlebih dahulu sebelum mengunggah',
        severity: 'error'
      })
      return
    }

    setLoading((prev) => ({ ...prev, uploading: true }))
    try {
      // Upload file to media service
      const formData = new FormData()
      formData.append('files', newReceiptFile)

      const result = await mediaService.uploadReceipt(newReceiptFile)
      const uploadedReceiptUrl = result.url
      notifier.show({
        message: 'File uploaded successfully',
        description: 'Image uploaded successfully',
        severity: 'success'
      })

      if (!uploadedReceiptUrl) {
        notifier.show({
          message: 'Gagal Mengunggah Bukti Pengeluaran',
          description: 'Tidak mendapatkan URL hasil upload',
          severity: 'error'
        })
        throw new Error('Tidak mendapatkan URL hasil upload')
      }

      const payload = { receipt: uploadedReceiptUrl }

      await expensesService.updateExpenses(id, payload)
      notifier.show({
        message: 'Bukti Pengeluaran Berhasil Diunggah',
        description: 'Bukti pengeluaran berhasil diunggah',
        severity: 'success'
      })
      setNewReceiptFile(null)
      await fetchDetail()
    } catch (err) {
      console.error('Error uploading receipt', err)
      notifier.show({
        message: 'Gagal Mengunggah Bukti Pengeluaran',
        description: err.response?.data?.message || err.message || 'Upload gagal',
        severity: 'error'
      })
      notifier.show({
        message: 'Gagal Mengunggah Bukti Pengeluaran',
        description: err.response?.data?.message || err.message || 'Upload gagal',
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, uploading: false }))
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

      setOpenApproveDialog(false)
      notifier.show({
        message: 'Pengeluaran Berhasil Disetujui',
        description: 'Pengeluaran berhasil disetujui',
        severity: 'success'
      })

      // Refresh data
      await fetchDetail()
    } catch (error) {
      console.error('Error approving expense:', error)
      notifier.show({
        message: 'Gagal Menyetujui Pengeluaran',
        description:
          error.response?.data?.message ||
          error.message ||
          'Terjadi kesalahan saat menyetujui pengeluaran',
        severity: 'error'
      })
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

      notifier.show({
        message: 'Pengeluaran Berhasil Ditolak',
        description: 'Pengeluaran berhasil ditolak',
        severity: 'success'
      })
      setOpenRejectDialog(false)
      setRejectReason('')

      // Refresh data
      await fetchDetail()
    } catch (error) {
      console.error('Error rejecting expense:', error)
      notifier.show({
        message: 'Gagal Menolak Pengeluaran',
        description:
          error.response?.data?.message ||
          error.message ||
          'Terjadi kesalahan saat menolak pengeluaran',
        severity: 'error'
      })
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
    handleReceiptFileChange,
    getNormalizedReceipt,
    isImageReceipt,
    handleReceiptUpload,
    newReceiptFile
  }
}
