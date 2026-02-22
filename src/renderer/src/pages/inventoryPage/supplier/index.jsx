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
  Grid,
  IconButton,
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
import { UseSupplier } from './hook/useSupplier'

export const SupplierPage = () => {
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
    handleClose,
    isEditing,
    supplierData,
    handleChange,
    handleSubmit,
    setOpenDialog
  } = UseSupplier({})
  const { page, pageSize, pageCount, totalCount } = pageParams
  const columns = table.getAllColumns()

  return permissions.read ? (
    <Box>
      {/* Network Status Indicator */}
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          📴 Anda sedang offline. Data ditampilkan dari cache.
        </Alert>
      )}

      <Breadcrumb
        title="Daftar Supplier"
        items={[{ to: '/', title: 'Home' }, { title: 'Supplier' }, { title: 'Daftar Supplier' }]}
      />

      <Stack direction="row" spacing={2} mb={3} justifyContent="space-between" alignItems="center">
        <Box />
        {permissions.create && (
          <Button
            variant="contained"
            startIcon={<IconPlus size={20} />}
            onClick={() => setOpenDialog((prev) => ({ ...prev, form: true }))}
          >
            Tambah Data
          </Button>
        )}
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
                      <Typography color="textPrimary">Tidak ada data supplier</Typography>
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

      <Dialog open={openDialog.form} onClose={handleClose}>
        <DialogTitle mt={2} mb={2}>
          {isEditing ? 'Edit' : 'Tambah'} Data Supplier
        </DialogTitle>
        <DialogContent>
          <Box component="form" noValidate autoComplete="off">
            <Grid container spacing={2}>
              {/* Nama Lengkap Karyawan */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Nama"
                  name="name"
                  value={supplierData.name}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>

              {/* E-mail Karyawan */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Nomor HP"
                  name="phone"
                  value={supplierData.phone}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  variant="outlined"
                />
              </Grid>

              {/* Jenis Kelamin */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Alamat"
                  name="address"
                  value={supplierData.address}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                ></TextField>
              </Grid>

              {/* Posisi */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  type="number"
                  label="Nomor Rekening"
                  name="no_rekening"
                  value={supplierData.no_rekening}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
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

      <Dialog open={openDialog.delete} onClose={handleCancelDelete}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <DialogContentText>Apakah Anda yakin ingin menghapus item ini?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Batal
          </Button>
          <Button onClick={handleConfirmDelete} color="secondary" disabled={loading.handleDelete}>
            Hapus
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
