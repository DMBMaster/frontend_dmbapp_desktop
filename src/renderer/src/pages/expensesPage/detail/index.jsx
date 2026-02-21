import { Cancel, Close, PictureAsPdf } from '@mui/icons-material'
import {
  Alert,
  Avatar,
  Button,
  Card,
  CardMedia,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import Box from '@mui/material/Box'
import BlankCard from '@renderer/components/ui/BlankCard'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { formatDate, formatDateTime, formatRupiah, getImgUrl } from '@renderer/utils/myFunctions'
import { CheckCircle, Lock, ZoomIn } from 'lucide-react'
import { UseIndex } from './hook/useIndex'

export const DetailExpensesPage = () => {
  const {
    detailData,
    userData,
    getStatusColor,
    getStatusExpenses,
    canUserApprove,
    selectedImage,
    openImageModal,
    handleImageClick,
    handleCloseImageModal,
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
    snackbarErrorMessage,
    loading,
    handleReceiptFileChange,
    getNormalizedReceipt,
    isImageReceipt,
    handleReceiptUpload,
    newReceiptFile
  } = UseIndex()

  if (loading.fetchDetail) {
    return <div>Loading...</div>
  }

  return (
    <Box>
      <Breadcrumb
        showBackButton={true}
        title="Detail Pengeluaran"
        items={[
          {
            to: '/',
            title: 'Home'
          },
          {
            title: 'Pengeluaran Details'
          }
        ]}
      />

      <BlankCard>
        <Box p={3}>
          {/* Header Section */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
            mb={3}
          >
            <Box>
              <Typography variant="h4" fontWeight={600}>
                {detailData?.category_name}
              </Typography>
              <Stack direction="row" spacing={1} mt={1} alignItems="center">
                <Chip
                  size="small"
                  color="secondary"
                  variant="outlined"
                  label={`Dibuat:  ${formatDateTime(detailData?.created_at || '')}`}
                />
                <Chip
                  size="small"
                  color="secondary"
                  variant="outlined"
                  label={`Diupdate: ${formatDateTime(detailData?.updated_at || '')}`}
                />
              </Stack>
            </Box>

            <Box>{getStatusExpenses(detailData?.status || 0)}</Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {detailData &&
            detailData?.approvals?.map((approval) => {
              // Cek apakah ini approval untuk user saat ini
              if (approval.approverId === userData.user.uid) {
                // Jika status PENDING, cek apakah bisa approve
                if (approval.status === 'PENDING') {
                  const { canApprove, reason } = canUserApprove(
                    approval,
                    detailData?.approvals || []
                  )

                  return (
                    <Box key={approval.id} mb={3}>
                      {!canApprove && (
                        <Box mb={2} p={2} bgcolor="#fff3cd" borderRadius={1}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Lock color="warning" />
                            <Typography variant="body2" color="text.secondary">
                              {reason}
                            </Typography>
                          </Stack>
                        </Box>
                      )}

                      <Stack direction="row" spacing={2}>
                        <Tooltip
                          title={!canApprove ? reason : `Approve Level ${approval.level}`}
                          arrow
                        >
                          <span style={{ width: '70%' }}>
                            <Button
                              variant="contained"
                              onClick={() => setOpenApproveDialog(true)}
                              sx={{ width: '100%' }}
                              color="success"
                              disabled={!canApprove}
                              startIcon={!canApprove ? <Lock /> : null}
                            >
                              {canApprove
                                ? `Approve (Level ${approval.level})`
                                : `Menunggu Level Sebelumnya`}
                            </Button>
                          </span>
                        </Tooltip>

                        <Tooltip
                          title={!canApprove ? reason : `Tolak Level ${approval.level}`}
                          arrow
                        >
                          <span style={{ width: '30%' }}>
                            <Button
                              variant="outlined"
                              sx={{ width: '100%' }}
                              color="error"
                              onClick={() => setOpenRejectDialog(true)}
                              disabled={!canApprove}
                              startIcon={!canApprove ? <Lock /> : null}
                            >
                              Tolak
                            </Button>
                          </span>
                        </Tooltip>
                      </Stack>
                    </Box>
                  )
                }
                // Jika status APPROVED, tampilkan indikator sudah di-approve
                else if (approval.status === 'APPROVED') {
                  return (
                    <Box key={approval.id} mb={3} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckCircle color="success" />
                        <Typography variant="body1" color="text.secondary">
                          Anda sudah menyetujui pengeluaran ini (Level {approval.level})
                        </Typography>
                      </Stack>
                    </Box>
                  )
                }
                // Jika status REJECTED, tampilkan indikator ditolak
                else if (approval.status === 'REJECTED') {
                  return (
                    <Box key={approval.id} mb={3} p={2} bgcolor="#fff5f5" borderRadius={1}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Cancel color="error" />
                        <Typography variant="body1" color="text.secondary">
                          Anda sudah menolak pengeluaran ini (Level {approval.level})
                        </Typography>
                        {approval.reason && (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            Alasan: {approval.reason}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  )
                }
              }
              return null
            })}

          {/* Main Content */}
          <Grid container spacing={3}>
            {/* Informasi Utama */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight={600} mb={3}>
                  Informasi Pengeluaran
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Tanggal Transaksi
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {detailData?.created_at && formatDate(detailData?.created_at || '')}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Nominal
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatRupiah(detailData?.nominal)}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Kategori
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {detailData?.category_name}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Deskripsi
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {detailData?.description || '-'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Dibuat Oleh
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {detailData?.user_full_name}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Informasi Tambahan */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight={600} mb={3}>
                  Informasi Tambahan
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      ID Transaksi
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {detailData?.guid}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Outlet
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {detailData?.outlet_detail?.outlet?.outlet_name || '-'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      ID Pengeluaran
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {detailData?.reference_number || '-'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="textSecondary" mb={1}>
                      Bukti Pembayaran
                    </Typography>
                    {detailData?.receipt && detailData?.receipt !== '-' ? (
                      (() => {
                        const normalized = getNormalizedReceipt()
                        if (isImageReceipt()) {
                          return (
                            <Card
                              sx={{
                                maxWidth: 300,
                                cursor: 'pointer',
                                position: 'relative',
                                '&:hover': {
                                  boxShadow: 3
                                },
                                '&:hover .zoom-overlay': {
                                  opacity: 1
                                }
                              }}
                              onClick={() => handleImageClick(getImgUrl(normalized))}
                            >
                              <CardMedia
                                component="img"
                                height={200}
                                image={getImgUrl(normalized)}
                                alt="Bukti pembayaran"
                                sx={{ objectFit: 'cover' }}
                              />
                              <Box
                                className="zoom-overlay"
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: 0,
                                  transition: 'opacity 0.3s ease'
                                }}
                              >
                                <ZoomIn sx={{ color: 'white', fontSize: 40 }} />
                              </Box>
                            </Card>
                          )
                        }

                        // Non-image file: show download / open button with icon and filename
                        const filename = normalized ? normalized.split('/').pop() : 'file'
                        return (
                          <Box display="flex" flexDirection="column" gap={1}>
                            <Button
                              variant="outlined"
                              startIcon={<PictureAsPdf />}
                              href={getImgUrl(normalized)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {filename}
                            </Button>
                          </Box>
                        )
                      })()
                    ) : (
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Typography variant="body2">Tidak ada bukti</Typography>
                        <TextField
                          onChange={handleReceiptFileChange}
                          type="file"
                          id="detail-receipt-upload"
                          fullWidth
                          size="small"
                          accept="image/*"
                          variant="outlined"
                        />
                        <Box display="flex" gap={1} alignItems="center">
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleReceiptUpload}
                            disabled={!newReceiptFile || loading.uploading}
                          >
                            {loading.uploading ? 'Uploading...' : 'Upload Bukti'}
                          </Button>
                          {newReceiptFile && (
                            <Typography variant="body2">{newReceiptFile.name}</Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Approval History */}
            {detailData?.approvals && detailData?.approvals?.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} mb={3}>
                    Riwayat Approval
                  </Typography>

                  <List>
                    {detailData?.approvals &&
                      detailData?.approvals
                        .sort((a, b) => a.level - b.level) // Urutkan berdasarkan level
                        .map((history, index) => {
                          return (
                            <ListItem
                              key={history.id}
                              divider={index < (detailData?.approvals?.length || 0) - 1}
                            >
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: getStatusColor(history.status) }}>
                                  {history.level}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={`${
                                  history.approverName || 'Unknown User'
                                } - Level ${history.level}`}
                                secondary={
                                  <>
                                    <Typography
                                      component="span"
                                      variant="body2"
                                      color="text.primary"
                                    >
                                      Status: {history.status}
                                    </Typography>
                                    <br />
                                    {history.reason && (
                                      <>
                                        Alasan: {history.reason}
                                        <br />
                                      </>
                                    )}
                                    <small>
                                      {history.approvedAt
                                        ? formatDate(history.approvedAt || '')
                                        : formatDate(history.createdAt || '')}
                                    </small>
                                  </>
                                }
                              />
                            </ListItem>
                          )
                        })}
                  </List>
                </Paper>
              </Grid>
            )}
          </Grid>

          {/* Modal Zoom Gambar */}
          <Dialog
            open={openImageModal}
            onClose={handleCloseImageModal}
            maxWidth="lg"
            fullWidth
            PaperProps={{
              sx: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                boxShadow: 'none'
              }
            }}
          >
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'white',
                pb: 1
              }}
            >
              <Typography variant="h6">Bukti Pembayaran</Typography>
              <IconButton onClick={handleCloseImageModal} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                p: 2,
                minHeight: '60vh'
              }}
            >
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Bukti pembayaran zoom"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    objectFit: 'contain',
                    borderRadius: 8
                  }}
                />
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={openApproveDialog} onClose={() => setOpenApproveDialog(false)}>
            <DialogTitle>Approve Pembayaran</DialogTitle>
            <DialogContent>Apakah Anda ingin menyetujui pembayaran ini?</DialogContent>
            <DialogActions>
              <Button variant="outlined" onClick={() => setOpenApproveDialog(false)}>
                Cancel
              </Button>
              <Button color="success" variant="contained" onClick={handleConfirmApprove}>
                Ya Setuju
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)}>
            <DialogTitle>Tolak Pembayaran</DialogTitle>
            <DialogContent>
              <Typography gutterBottom>Apakah Anda ingin menolak pembayaran ini?</Typography>
              <TextField
                autoFocus
                margin="dense"
                id="reject-reason"
                label="Alasan Penolakan"
                type="text"
                fullWidth
                variant="outlined"
                multiline
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </DialogContent>
            <DialogActions>
              <Button
                variant="contained"
                onClick={() => {
                  setOpenRejectDialog(false)
                  setRejectReason('')
                }}
              >
                Cancel
              </Button>
              <Button
                color="error"
                variant="outlined"
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim()}
              >
                Ya Tolak
              </Button>
            </DialogActions>
          </Dialog>
          <Snackbar
            open={snackbarSuccessOpen}
            sx={{ zIndex: '9999 !important' }}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            autoHideDuration={4000}
            onClose={() => setSnackbarSuccessOpen(false)}
          >
            <Alert onClose={() => setSnackbarSuccessOpen(false)} severity="success">
              {snackbarSuccessMessage}
            </Alert>
          </Snackbar>

          <Snackbar
            open={snackbarErrorOpen}
            sx={{ zIndex: '9999 !important' }}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            autoHideDuration={4000}
            onClose={() => setSnackbarErrorOpen(false)}
          >
            <Alert onClose={() => setSnackbarErrorOpen(false)} severity="error">
              {snackbarErrorMessage}
            </Alert>
          </Snackbar>
        </Box>
      </BlankCard>
    </Box>
  )
}
