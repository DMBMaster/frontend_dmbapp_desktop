import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import CustomFormLabel from '@renderer/components/ui/forms/theme-elements/CustomFormLabel'
import CustomTextField from '@renderer/components/ui/forms/theme-elements/CustomTextField'
import { useNetworkStore } from '@renderer/store/networkStore'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { UseCreateStockOpname } from './hook/useCreateStockOpname'

export const CreateStockOpnamePage = () => {
  const navigate = useNavigate()
  const isOnline = useNetworkStore((state) => state.isOnline)

  const {
    formData,
    products,
    uploadImage,
    loading,
    handleChange,
    handleOrderChange,
    handleSelectProduct,
    handleSelectUnit,
    handleAddItem,
    handleDeleteItem,
    handleSubmit,
    getRootProps,
    getInputProps
  } = UseCreateStockOpname()

  return (
    <Box>
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          📴 Anda sedang offline. Create stok opname membutuhkan koneksi internet.
        </Alert>
      )}

      <Breadcrumb
        showBackButton={true}
        title="Buat Stok Opname"
        items={[{ to: '/', title: 'Home' }, { title: 'inventory' }, { title: 'Buat Stok Opname' }]}
      />

      <Grid size={{ xs: 12 }}>
        <Box>
          <form onSubmit={handleSubmit}>
            <Box bgcolor={'white'} p={3}>
              <Stack
                direction="row"
                spacing={{ xs: 1, sm: 2, md: 4 }}
                justifyContent="flex-end"
                mb={3}
              >
                <Box display="flex" gap={1}>
                  <Button variant="outlined" color="error" onClick={() => navigate(-1)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={
                      loading.submitData ||
                      !isOnline ||
                      !formData.date ||
                      !formData.nomor ||
                      !formData.items.length ||
                      formData.items.some((item) => !item.product_id || item.actual === '')
                    }
                  >
                    {loading.submitData ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </Box>
              </Stack>

              <Divider />

              <Grid container spacing={3} mb={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box textAlign="left">
                    <CustomFormLabel htmlFor="nomor" color="textSecondary">
                      Nomor Stok Opname
                    </CustomFormLabel>
                    <CustomTextField
                      id="nomor"
                      name="nomor"
                      value={formData.nomor}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 3 }}>
                  <Box>
                    <CustomFormLabel htmlFor="date" color="textSecondary">
                      Tanggal
                    </CustomFormLabel>
                    <CustomTextField
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Box>
                </Grid>
              </Grid>

              <Divider />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                mt={2}
              >
                <Typography variant="h6" color="textSecondary">
                  Produk :
                </Typography>
                <Button
                  onClick={handleAddItem}
                  variant="contained"
                  color="primary"
                  startIcon={<IconPlus width={18} />}
                  disabled={loading.fetchProducts}
                >
                  Tambah Item
                </Button>
              </Stack>

              <Paper variant="outlined">
                <TableContainer sx={{ whiteSpace: { xs: 'nowrap', md: 'unset' } }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant="h6" fontSize="14px">
                            Item
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="h6" fontSize="14px">
                            Satuan
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="h6" fontSize="14px">
                            Stok Sistem
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="h6" fontSize="14px">
                            Stok Aktual
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="h6" fontSize="14px">
                            Selisih
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="h6" fontSize="14px">
                            Aksi
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading.fetchProducts ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            <CircularProgress size={24} />
                          </TableCell>
                        </TableRow>
                      ) : formData.items.length > 0 ? (
                        formData.items.map((item, index) => {
                          const selectedProduct =
                            products.find((product) => product.guid === item.product_id) || null

                          return (
                            <TableRow key={`${item.product_id || 'item'}-${index}`}>
                              <TableCell colSpan={3}>
                                <Autocomplete
                                  sx={{ width: '250px' }}
                                  options={products.filter(
                                    (product) =>
                                      !formData.items.some(
                                        (currentItem, currentIndex) =>
                                          currentItem.product_id === product.guid &&
                                          currentIndex !== index
                                      )
                                  )}
                                  getOptionLabel={(option) => option?.name || ''}
                                  value={selectedProduct}
                                  onChange={(_, newValue) => handleSelectProduct(index, newValue)}
                                  renderInput={(params) => (
                                    <CustomTextField
                                      {...params}
                                      placeholder="Pilih Item"
                                      fullWidth
                                    />
                                  )}
                                />
                              </TableCell>

                              <TableCell>
                                {item.product_satuan?.length > 0 ? (
                                  <Autocomplete
                                    sx={{ width: '180px' }}
                                    options={item.product_satuan}
                                    getOptionLabel={(option) => option?.satuan?.name || ''}
                                    value={
                                      item.product_satuan.find(
                                        (unit) => unit.guid === item.product_satuan_id
                                      ) || null
                                    }
                                    onChange={(_, newValue) => handleSelectUnit(index, newValue)}
                                    renderInput={(params) => (
                                      <CustomTextField
                                        {...params}
                                        placeholder="Pilih Satuan"
                                        fullWidth
                                      />
                                    )}
                                  />
                                ) : (
                                  <CustomTextField value={item.satuan} disabled fullWidth />
                                )}
                              </TableCell>

                              <TableCell>
                                <CustomTextField value={item.stock} disabled fullWidth />
                              </TableCell>

                              <TableCell>
                                <CustomTextField
                                  type="number"
                                  value={item.actual}
                                  placeholder="Stok Aktual"
                                  onChange={(event) => {
                                    const { value } = event.target
                                    if (value === '' || Number(value) >= 0) {
                                      handleOrderChange(index, 'actual', value)
                                    }
                                  }}
                                  inputProps={{ min: 0 }}
                                  fullWidth
                                />
                              </TableCell>

                              <TableCell>
                                <CustomTextField value={item.selisih} disabled fullWidth />
                              </TableCell>

                              <TableCell>
                                {index !== 0 && (
                                  <Tooltip title="Delete Item">
                                    <IconButton onClick={() => handleDeleteItem(index)} color="error">
                                      <IconTrash width={22} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            <Typography variant="body2">
                              No orders available. Please add an order.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Box mb={2} mt={3}>
                <Grid container spacing={2} justifyContent="space-between">
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box>
                      <FormControl fullWidth margin="normal">
                        <Box
                          mt={0}
                          fontSize="12px"
                          sx={{
                            backgroundColor: 'primary.light',
                            color: 'primary.main',
                            padding: '30px',
                            textAlign: 'center',
                            border: '1px dashed',
                            display: 'block',
                            borderColor: 'primary.main'
                          }}
                          {...getRootProps({ className: 'dropzone' })}
                        >
                          <input {...getInputProps()} />
                          <p>Drag n drop file lampiran, atau klik untuk pilih file</p>
                        </Box>
                      </FormControl>

                      {uploadImage && (
                        <Box mt={2} textAlign="center">
                          <p>File: {uploadImage.name}</p>
                          <img
                            src={URL.createObjectURL(uploadImage)}
                            alt="Uploaded preview"
                            style={{ width: '100%', maxWidth: '300px', height: 'auto' }}
                          />
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <CustomTextField
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      label="Catatan"
                      variant="outlined"
                      size="small"
                      rows={4}
                      multiline
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </form>
        </Box>
      </Grid>
    </Box>
  )
}