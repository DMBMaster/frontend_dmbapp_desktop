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
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { useNetworkStore } from '@renderer/store/networkStore'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconPlus
} from '@tabler/icons-react'
import { UseShift } from './hook/useShift'
import { flexRender } from '@tanstack/react-table'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import React from 'react'
import { useNavigate } from 'react-router-dom'

export const ShiftEmployeePage = () => {
  const navigate = useNavigate()
  const isOnline = useNetworkStore((state) => state.isOnline)
  const {
    data,
    loading,
    pageParams,
    setPageParams,
    table,
    setOpenDialog,
    openDialog,
    handleConfirmDelete,
    shiftData,
    handleChange,
    handleSubmitShift
  } = UseShift()
  const { page, pageSize, pageCount, totalCount } = pageParams
  const columns = table.getAllColumns()

  return (
    <Box>
      {/* Network Status Indicator */}
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          📴 Anda sedang offline. Data ditampilkan dari cache.
        </Alert>
      )}

      <Breadcrumb
        title="Daftar Shift"
        items={[{ to: '/', title: 'Home' }, { title: 'Shift' }, { title: 'Daftar Shift' }]}
      />

      <Stack direction="row" spacing={2} mb={3} justifyContent="space-between" alignItems="center">
        <Box />
        <Box display="flex" justifyContent="flex-end" mb={2}>
          {/* {permissions.create && ( */}
          <Button
            variant="contained"
            disableElevation
            startIcon={<IconPlus size={20} />}
            color="primary"
            onClick={() => setOpenDialog((prev) => ({ ...prev, addData: true }))}
          >
            Tambah Data
          </Button>
          <Button
            style={{ marginLeft: 10 }}
            variant="contained"
            disableElevation
            color="secondary"
            onClick={() => navigate('/employee/shift/calendar')}
          >
            Lihat Kalender
          </Button>
          {/* )} */}
        </Box>
      </Stack>

      <Grid size={{ xs: 12 }}>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <TextField
              variant="outlined"
              label="Search"
              //   value={pageParams.searchTerm}
              //   onChange={(e) => setPageParams((prev) => ({ ...prev, searchTerm: e.target.value }))}
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

      <Dialog
        open={openDialog.delete}
        onClose={() => setOpenDialog((prev) => ({ ...prev, delete: false }))}
      >
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <DialogContentText>Apakah Anda yakin ingin menghapus item ini?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDialog((prev) => ({ ...prev, delete: false }))}
            color="primary"
          >
            Batal
          </Button>
          <Button onClick={handleConfirmDelete} color="secondary">
            Hapus
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog.addData}
        onClose={() => setOpenDialog((prev) => ({ ...prev, addData: false }))}
        fullWidth
        maxWidth="sm"
      >
        <DialogContent>
          <Box component="form" noValidate autoComplete="off">
            <Grid container spacing={2}>
              {/* Nama Lengkap Karyawan */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Nama"
                  name="name"
                  value={shiftData.name}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>

              {/* E-mail Karyawan */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  // label="Clock In"
                  name="clock_in"
                  value={shiftData.clock_in}
                  onChange={handleChange}
                  fullWidth
                  type="time"
                  variant="outlined"
                />
              </Grid>

              {/* Alamat Karyawan */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  // label="Clock Out"
                  name="clock_out"
                  value={shiftData.clock_out}
                  onChange={handleChange}
                  fullWidth
                  type="time"
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
            onClick={handleSubmitShift}
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
  )
}
