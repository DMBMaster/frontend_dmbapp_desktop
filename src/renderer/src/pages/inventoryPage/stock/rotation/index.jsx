import {
  Alert,
  Autocomplete,
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
  FormLabel,
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
import { UseStockRotation } from './hook/useStockRotation'

export const StockRotationPage = () => {
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
    setOpenDialog,
    fetchData,
    products,
    categories,
    exportData
  } = UseStockRotation({})
  const {
    page,
    pageSize,
    totalCount,
    pageCount,
    searchTerm,
    startDate,
    endDate,
    categoryId,
    productId
  } = pageParams
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
        title="Perputaran Stok"
        items={[{ to: '/', title: 'Home' }, { title: 'Supplier' }, { title: 'Perputaran Stok' }]}
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
            <Grid container spacing={3}>
              <Grid size={{ xs: 3 }}>
                <FormControl fullWidth variant="outlined">
                  <FormLabel htmlFor="start-date">Tanggal Mulai</FormLabel>
                  <TextField
                    id="start-date"
                    type="date"
                    variant="outlined"
                    value={startDate}
                    onChange={(e) =>
                      setPageParams((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 3 }}>
                <FormControl fullWidth variant="outlined">
                  <FormLabel htmlFor="end-date">Tanggal Akhir</FormLabel>
                  <TextField
                    id="end-date"
                    type="date"
                    variant="outlined"
                    value={endDate}
                    onChange={(e) =>
                      setPageParams((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 3 }} display="flex" alignItems="center">
                {/* Center the button vertically */}
                <Button
                  variant="contained"
                  onClick={fetchData}
                  disabled={!startDate || !endDate || loading.fetchData}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Fetch Data
                </Button>
              </Grid>
              <Grid size={{ xs: 3 }} display="flex" alignItems="center">
                <Button
                  variant="contained"
                  onClick={exportData}
                  disabled={!startDate || !endDate || loading.exportData}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Export Data
                </Button>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  variant="outlined"
                  label="Search"
                  value={searchTerm}
                  onChange={(e) =>
                    setPageParams((prev) => ({ ...prev, searchTerm: e.target.value }))
                  }
                  fullWidth
                  sx={{ mb: 2, mr: 2 }}
                />
              </Grid>
              <Grid size={{ xs: 4 }} pl={0.5} pr={0.7}>
                <Autocomplete
                  loading={loading.fetchProducts}
                  value={
                    (products && products.find((product) => product.guid === productId)) || null
                  }
                  onChange={(event, newValue) => {
                    setPageParams((prev) => ({
                      ...prev,
                      productId: newValue ? newValue.guid : ''
                    }))
                  }}
                  options={products && products}
                  getOptionLabel={(option) => option.name || ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Pilih Produk"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loading.fetchProducts ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 4 }} pl={1.2}>
                <Autocomplete
                  value={categories.find((category) => category.guid === categoryId) || null}
                  onChange={(event, newValue) => {
                    setPageParams((prev) => ({
                      ...prev,
                      categoryId: newValue ? newValue.guid : ''
                    }))
                  }}
                  options={categories}
                  getOptionLabel={(option) => option.category_name || ''}
                  isOptionEqualToValue={(option, value) => option.guid === value.guid}
                  loading={loading.fetchDataCategory}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Pilih Kategori"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loading.fetchDataCategory ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
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
