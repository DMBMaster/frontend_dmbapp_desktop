import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
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
import { UseStockMovement } from './hook/useStockRotation'
import { formatRupiah } from '@renderer/utils/myFunctions'
import { useNavigate } from 'react-router-dom'

export const StockMovementPage = () => {
  const navigate = useNavigate()
  const isOnline = useNetworkStore((state) => state.isOnline)

  const {
    data,
    loading,
    pageParams,
    setPageParams,
    table,
    permissions,
    openDialog,
    handleConfirmDelete,
    setOpenDialog,
    openRows
  } = UseStockMovement({})
  const { page, pageSize, totalCount, pageCount, searchTerm } = pageParams
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
        title="Pemindahan Stok"
        items={[{ to: '/', title: 'Home' }, { title: 'Supplier' }, { title: 'Pemindahan Stok' }]}
      />

      <Stack direction="row" spacing={2} mb={3} justifyContent="space-between" alignItems="center">
        <Box />
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            startIcon={<IconPlus size={20} />}
            disableElevation
            color="primary"
            onClick={() => navigate('create')}
          >
            Buat Pemindahan Baru
          </Button>
        </Box>
      </Stack>

      <Grid size={{ xs: 12 }}>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <TextField
              variant="outlined"
              label="Search"
              value={searchTerm}
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
                  table.getRowModel().rows.map((row) => {
                    const subItem = row.original
                    // Gunakan guid sebagai key collapse, konsisten dengan hook
                    const rowId = subItem.guid ?? row.id
                    const isOpen = !!openRows[rowId]

                    return (
                      <React.Fragment key={row.id}>
                        {/* Baris utama */}
                        <TableRow hover>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>

                        {/* Baris collapse — detail items */}
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            sx={{
                              paddingBottom: 0,
                              paddingTop: 0,
                              border: isOpen ? undefined : 'none'
                            }}
                          >
                            <Collapse in={isOpen} timeout="auto" unmountOnExit>
                              <Box margin={1}>
                                <Typography
                                  gutterBottom
                                  variant="h6"
                                  sx={{
                                    mt: 1,
                                    mb: 1,
                                    backgroundColor: (theme) => theme.palette.grey[100],
                                    p: '5px 15px',
                                    borderRadius: 1
                                  }}
                                >
                                  Detail Item
                                </Typography>

                                <Table size="small" aria-label="items">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>
                                        <Typography variant="h6">Nama</Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="h6">Qty</Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="h6">Satuan</Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="h6">Harga</Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="h6">Status</Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="h6">Catatan</Typography>
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {subItem.items && subItem.items.length > 0 ? (
                                      subItem.items.map((item) => (
                                        <TableRow key={item.guid}>
                                          <TableCell>
                                            <Typography color="textSecondary" fontWeight="400">
                                              {item.product?.product_name ?? '-'}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography color="textSecondary" fontWeight="400">
                                              {item.qty}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography color="textSecondary" fontWeight="400">
                                              {item.product?.satuan?.name}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography color="textSecondary" fontWeight="400">
                                              {formatRupiah(item.price)}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography color="textSecondary" fontWeight="400">
                                              {item.type === 'OUT' ? 'Keluar' : 'Masuk'}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography color="textSecondary" fontWeight="400">
                                              {item.notes}
                                            </Typography>
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    ) : (
                                      <TableRow>
                                        <TableCell colSpan={4} align="center">
                                          <Typography variant="body2" color="textSecondary">
                                            Tidak ada item
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      <Typography color="textPrimary">Tidak ada data</Typography>
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
        onClose={() => {
          setOpenDialog((prev) => ({ ...prev, delete: false }))
        }}
      >
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <DialogContentText>Apakah Anda yakin ingin menghapus item ini?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenDialog((prev) => ({ ...prev, delete: false }))
            }}
            color="primary"
          >
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
