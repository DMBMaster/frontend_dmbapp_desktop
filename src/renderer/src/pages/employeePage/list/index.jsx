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
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
import AttachFileIcon from '@mui/icons-material/AttachFile'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { flexRender } from '@tanstack/react-table'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import React from 'react'
import { useNetworkStore } from '@renderer/store/networkStore'
import { UseListEmployee } from './hook/useListEmployee'
import CustomSelect from '@renderer/components/ui/form/theme-elements/CustomSelect'
import CustomFormLabel from '@renderer/components/ui/forms/theme-elements/CustomFormLabel'
import { listOutlets } from '@renderer/utils/config'

export const ListEmployeePage = () => {
  const isOnline = useNetworkStore((state) => state.isOnline)

  const {
    data,
    loading,
    pageParams,
    setPageParams,
    table,
    permissions,
    setOpenDialog,
    openDialog,
    handleCancelDelete,
    handleConfirmDelete,
    selectedShift,
    setSelectedShift,
    handleResetConfirm,
    files,
    handleFileChange2,
    handleSubmitImportEmployee,
    shifts,
    selectedEmployeeForUpdate,
    selectedNewOutlet,
    setSelectedNewOutlet,
    handleUpdateOutletEmployee,
    handleConfirmShift,
    employeeData,
    handleChange,
    handleFileChange,
    handleSubmitEmployee
  } = UseListEmployee()
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
        title="Daftar Karyawan"
        items={[{ to: '/', title: 'Home' }, { title: 'Karyawan' }, { title: 'Daftar Karyawan' }]}
      />

      <Stack direction="row" spacing={2} mb={3} justifyContent="space-between" alignItems="center">
        <Box />
        {permissions.create && (
          <Button
            variant="contained"
            startIcon={<IconPlus size={20} />}
            disableElevation
            color="primary"
            onClick={() => setOpenDialog((prev) => ({ ...prev, addData: true }))}
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
                      <Typography color="textPrimary">Tidak ada data produk</Typography>
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

      <Dialog open={openDialog.delete} onClose={handleCancelDelete}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <DialogContentText>Apakah Anda yakin ingin menghapus item ini?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Batal
          </Button>
          <Button onClick={handleConfirmDelete} color="secondary">
            Hapus
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog.import}
        onClose={() => setOpenDialog((prev) => ({ ...prev, import: false }))}
      >
        <DialogTitle>Import Excel Template</DialogTitle>
        <DialogContent>
          <input type="file" onChange={handleFileChange2} style={{ marginBottom: '16px' }} />
          {files.length > 0 && (
            <List>
              {files.map((file, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <AttachFileIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={`Size: ${(file.size / 1024).toFixed(2)} KB`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDialog((prev) => ({ ...prev, import: false }))}
            color="secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitImportEmployee}
            color="primary"
            disabled={loading.handleSubmitImportEmployee}
          >
            {loading.handleSubmitImportEmployee ? 'Loading...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog.resetPin}
        onClose={() => setOpenDialog((prev) => ({ ...prev, resetPin: false }))}
      >
        <DialogTitle>Confirm Reset Pin</DialogTitle>
        <DialogContent>
          Apakah Anda yakin ingin menyetel ulang PIN untuk akun ini? Tindakan ini tidak dapat
          dibatalkan.
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDialog((prev) => ({ ...prev, resetPin: false }))}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleResetConfirm('pin')}
            color="warning"
            disabled={loading.handleResetConfirm}
          >
            {loading.handleResetConfirm ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog.resetPassword}
        onClose={() => setOpenDialog((prev) => ({ ...prev, resetPassword: false }))}
      >
        <DialogTitle>Confirm Reset Password</DialogTitle>
        <DialogContent>
          Apakah Anda yakin ingin menyetel ulang password untuk akun ini? Tindakan ini tidak dapat
          dibatalkan.
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDialog((prev) => ({ ...prev, resetPassword: false }))}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleResetConfirm('password')}
            color="warning"
            disabled={loading.handleResetConfirm}
          >
            {loading.handleResetConfirm ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog.shift}
        onClose={() => setOpenDialog((prev) => ({ ...prev, shift: false }))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Pilih Shift</DialogTitle>
        <DialogContent>
          {/* Shift Select Dropdown */}
          <FormControl fullWidth variant="outlined" margin="normal">
            <InputLabel id="shift-select-label">Pilih Shift</InputLabel>
            <CustomSelect
              labelId="shift-select-label"
              id="shift-select"
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              label="Select Shift"
              disabled={loading.fetchShifts}
            >
              {shifts && shifts.length === 0 ? (
                <MenuItem value="">
                  <em>No shifts available</em>
                </MenuItem>
              ) : (
                shifts &&
                shifts.map((shift) => (
                  <MenuItem key={shift.id} value={shift.id}>
                    {shift.name}
                  </MenuItem>
                ))
              )}
            </CustomSelect>
            {selectedShift === '' && (
              <FormHelperText error>Select a shift before confirming.</FormHelperText>
            )}
          </FormControl>

          {loading.fetchShifts && <CircularProgress size={24} />}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setOpenDialog((prev) => ({ ...prev, shift: false }))}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmShift}
            color="warning"
            disabled={loading.handleConfirmShift || !selectedShift} // Disable if loading or no shift selected
          >
            {loading.handleConfirmShift ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog.updateOutlet}
        onClose={() => setOpenDialog((prev) => ({ ...prev, updateOutlet: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Outlet Karyawan</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Info Karyawan */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Nama Karyawan
              </Typography>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {selectedEmployeeForUpdate?.employee_name}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Outlet Saat Ini
              </Typography>
              <Typography variant="body1">
                {selectedEmployeeForUpdate?.outlet?.name || 'Tidak ada outlet'}
              </Typography>
            </Box>

            {/* Select Outlet Baru */}
            <CustomFormLabel htmlFor="outlet-select">Pilih Outlet Baru</CustomFormLabel>
            <CustomSelect
              id="outlet-select"
              value={selectedNewOutlet}
              onChange={(e) => {
                setSelectedNewOutlet(e.target.value)
              }}
              fullWidth
              displayEmpty
              disabled={loading.handleUpdateOutletEmployee}
            >
              <MenuItem value="" disabled>
                <em>Pilih Outlet</em>
              </MenuItem>
              {listOutlets &&
                listOutlets?.map((outlet) => (
                  <MenuItem key={outlet?.guid} value={outlet?.guid}>
                    {outlet?.name}
                  </MenuItem>
                ))}
            </CustomSelect>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDialog((prev) => ({ ...prev, updateOutlet: false }))}
            disabled={loading.handleUpdateOutletEmployee}
          >
            Batal
          </Button>
          <Button
            onClick={handleUpdateOutletEmployee}
            variant="contained"
            color="primary"
            disabled={loading.handleUpdateOutletEmployee || !selectedNewOutlet}
          >
            {loading.handleUpdateOutletEmployee ? 'Processing...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog.addData}
        onClose={() => setOpenDialog((prev) => ({ ...prev, addData: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box component="form" noValidate autoComplete="off">
            <Grid container spacing={2}>
              {/* Nama Lengkap Karyawan */}
              <Grid item size={{ xs: 12 }}>
                <TextField
                  label="Nama Lengkap Karyawan"
                  name="name"
                  value={employeeData.name}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>

              {/* E-mail Karyawan */}
              <Grid item size={{ xs: 12 }}>
                <TextField
                  label="E-mail Karyawan"
                  name="email"
                  value={employeeData.email}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>

              {/* Jenis Kelamin */}
              <Grid item size={{ xs: 12 }}>
                <TextField
                  label="Jenis Kelamin"
                  name="gender"
                  value={employeeData.gender}
                  onChange={handleChange}
                  select
                  fullWidth
                  variant="outlined"
                >
                  <MenuItem value="L">Laki-laki</MenuItem>
                  <MenuItem value="P">Perempuan</MenuItem>
                </TextField>
              </Grid>

              {/* Alamat Karyawan */}
              <Grid item size={{ xs: 12 }}>
                <TextField
                  label="Alamat Karyawan"
                  name="address"
                  value={employeeData.address}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                />
              </Grid>

              {/* Posisi */}
              <Grid item size={{ xs: 12 }}>
                <TextField
                  label="Posisi"
                  name="position"
                  value={employeeData.position}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>

              {/* Foto */}
              <Grid item size={{ xs: 12 }}>
                <CustomFormLabel htmlFor="upload-text">Foto</CustomFormLabel>
                <TextField
                  onChange={handleFileChange}
                  type="file"
                  autoFocus
                  id="upload-text"
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog((prev) => ({ ...prev, addData: false }))}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitEmployee}
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading.addData}
          >
            {loading.addData ? 'Submitting...' : 'Submit'}
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
