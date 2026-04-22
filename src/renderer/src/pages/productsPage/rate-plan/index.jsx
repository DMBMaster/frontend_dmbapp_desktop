import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconPlus
} from '@tabler/icons-react'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { flexRender } from '@tanstack/react-table'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { useNetworkStore } from '@renderer/store/networkStore'
import React from 'react'
import { UseRatePlan } from './hook/useRatePlan'
import CustomSwitch from '@renderer/components/ui/forms/theme-elements/CustomSwitch'

export const RatePlanPage = () => {
  const isOnline = useNetworkStore((state) => state.isOnline)

  const {
    data,
    loading,
    pageParams,
    setPageParams,
    table,
    permissions,
    openDialog,
    handleCancelDelete,
    handleConfirmDelete,
    setSelectedRow,
    setOpenDialog,
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    resetForm,
    products,
    cancelPolicies
  } = UseRatePlan({})

  const { page, pageSize, pageCount, totalCount } = pageParams
  const columns = table.getAllColumns()

  return permissions.read ? (
    <Box>
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          📴 Anda sedang offline. Data ditampilkan dari cache.
        </Alert>
      )}

      <Breadcrumb
        title="Rate Plan"
        items={[{ to: '/', title: 'Home' }, { title: 'Produk' }, { title: 'Rate Plan' }]}
      />

      <Stack direction="row" spacing={2} mb={3} justifyContent="space-between" alignItems="center">
        <Box />
        {/* {permissions.create && ( */}
        <Button
          variant="contained"
          startIcon={<IconPlus size={20} />}
          onClick={() => {
            resetForm()
            setOpenDialog((prev) => ({ ...prev, update: false, add: true }))
          }}
        >
          Tambah Data
        </Button>
        {/* )} */}
      </Stack>

      <Grid size={{ xs: 12 }}>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <TextField
              variant="outlined"
              label="Search"
              value={pageParams.searchTerm}
              onChange={(e) => setPageParams((prev) => ({ ...prev, searchTerm: e.target.value }))}
              fullWidth
              sx={{ mb: 2, mr: 2 }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableCell key={header.id}>
                        <Box
                          onClick={header.column.getToggleSortingHandler()}
                          sx={{
                            cursor: header.column.getCanSort() ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            '&:hover': {
                              color: header.column.getCanSort() ? 'primary.main' : 'inherit'
                            }
                          }}
                        >
                          <Typography variant="h6" mb={1}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </Typography>
                          {header.column.getCanSort() && (
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <ExpandLessIcon
                                sx={{
                                  fontSize: 18,
                                  opacity: header.column.getIsSorted() === 'asc' ? 1 : 0.3,
                                  mb: -0.5
                                }}
                              />
                              <ExpandMoreIcon
                                sx={{
                                  fontSize: 18,
                                  opacity: header.column.getIsSorted() === 'desc' ? 1 : 0.3,
                                  mt: -0.5
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableHead>

              <TableBody>
                {loading.fetchData ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      <CircularProgress />
                      <Typography>Loading...</Typography>
                    </TableCell>
                  </TableRow>
                ) : data.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <React.Fragment key={row.id}>
                      <TableRow hover>
                        {row.getVisibleCells().map((cell, index) => (
                          <TableCell key={index}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      <Typography color="textPrimary">Tidak ada data rate plan</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider />

          <Stack
            gap={1}
            p={3}
            alignItems="center"
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
          >
            <Typography variant="body1" color="textPrimary">
              {totalCount} Rows
            </Typography>

            <Stack direction="row" alignItems="center" gap={1}>
              <IconButton
                size="small"
                onClick={() => setPageParams((prev) => ({ ...prev, page: 1 }))}
                disabled={page === 1}
              >
                <IconChevronsLeft />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setPageParams((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={page === 1}
              >
                <IconChevronLeft />
              </IconButton>
              <Typography variant="body1" color="textPrimary">
                Page {page} of {pageCount || 1}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setPageParams((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={page >= pageCount}
              >
                <IconChevronRight />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setPageParams((prev) => ({ ...prev, page: pageCount }))}
                disabled={page >= pageCount}
              >
                <IconChevronsRight />
              </IconButton>
            </Stack>

            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="body1" color="textPrimary">
                Rows per page:
              </Typography>
              <Select
                value={pageSize}
                onChange={(e) =>
                  setPageParams((prev) => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))
                }
              >
                {[10, 15, 20, 25].map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>
        </Box>
      </Grid>

      {/* Delete Dialog */}
      <Dialog open={openDialog.delete} onClose={handleCancelDelete}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <DialogContentText>Apakah Anda yakin ingin menghapus rate plan ini?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Batal
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Hapus
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / Edit Dialog */}
      <Dialog
        open={openDialog.update || openDialog.add}
        onClose={() => {
          setSelectedRow(null)
          setOpenDialog((prev) => ({ ...prev, update: false, add: false }))
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{openDialog.update ? 'Edit Rate Plan' : 'Tambah Rate Plan'}</DialogTitle>
        <DialogContent>
          <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Produk */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Product / Room Type"
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  select
                >
                  <MenuItem value="">-- Pilih Produk --</MenuItem>
                  {products.map((p) => (
                    <MenuItem key={p.guid} value={p.guid}>
                      {p.product_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Nama Rate Plan */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Nama Rate Plan"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  required
                />
              </Grid>

              {/* Deskripsi */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Deskripsi"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={3}
                />
              </Grid>

              {/* Harga */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Harga"
                  name="rate_price"
                  value={formData.rate_price}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                  }}
                />
              </Grid>

              {/* Min Harga */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Min Harga"
                  name="min_rate_price"
                  value={formData.min_rate_price}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                  }}
                />
              </Grid>

              {/* Deposit */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Deposit"
                  name="deposit_amount"
                  value={formData.deposit_amount}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                  }}
                />
              </Grid>

              {/* Min Malam */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Min Malam"
                  name="min_nights"
                  value={formData.min_nights}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  type="number"
                />
              </Grid>

              {/* Max Malam */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Max Malam"
                  name="max_nigths"
                  value={formData.max_nigths}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  type="number"
                />
              </Grid>

              {/* Standar Tamu */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Standar Tamu"
                  name="standart_guest_price"
                  value={formData.standart_guest_price}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  type="number"
                />
              </Grid>

              {/* Max Tamu */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Max Tamu"
                  name="max_guest_allowed"
                  value={formData.max_guest_allowed}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  type="number"
                />
              </Grid>

              {/* Ekstra Dewasa Diizinkan */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Ekstra Dewasa Diizinkan"
                  name="extra_adult_allowed"
                  value={formData.extra_adult_allowed}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  type="number"
                />
              </Grid>

              {/* Biaya Ekstra Dewasa */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Biaya Ekstra Dewasa"
                  name="extra_adult_charge"
                  value={formData.extra_adult_charge}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                  }}
                />
              </Grid>

              {/* Ekstra Anak Diizinkan */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Ekstra Anak Diizinkan"
                  name="extra_children_allow"
                  value={formData.extra_children_allow}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  type="number"
                />
              </Grid>

              {/* Biaya Ekstra Anak */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  label="Biaya Ekstra Anak"
                  name="extra_child_charge"
                  value={formData.extra_child_charge}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                  }}
                />
              </Grid>

              {/* Kebijakan Pembatalan (tampil jika ada data) */}
              {cancelPolicies.length > 0 && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Kebijakan Pembatalan"
                    name="cancel_policy_id"
                    value={formData.cancel_policy_id}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    select
                  >
                    <MenuItem value="">-- Pilih Kebijakan --</MenuItem>
                    {cancelPolicies.map((cp) => (
                      <MenuItem key={cp.id || cp.guid} value={cp.id || cp.guid}>
                        {cp.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}

              {/* Toggle Sarapan */}
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControlLabel
                  control={
                    <CustomSwitch
                      checked={formData.is_breakfast}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, is_breakfast: e.target.checked }))
                      }
                    />
                  }
                  label="Sarapan"
                />
              </Grid>

              {/* Toggle Tampilkan di Booking */}
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControlLabel
                  control={
                    <CustomSwitch
                      checked={formData.show_booking}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, show_booking: e.target.checked }))
                      }
                    />
                  }
                  label="Tampilkan di Booking"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setSelectedRow(null)
              setOpenDialog((prev) => ({ ...prev, update: false, add: false }))
            }}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading.handleSubmit}
          >
            {loading.handleSubmit ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  ) : (
    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
      <Typography variant="h6" color="textPrimary">
        Anda tidak memiliki izin untuk melihat halaman ini.
      </Typography>
    </Box>
  )
}
