import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Divider,
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
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { useNetworkStore } from '@renderer/store/networkStore'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { UseCreatePurchaseRequest } from './hook/useCreatePurchaseRequest'
import CustomFormLabel from '@renderer/components/ui/forms/theme-elements/CustomFormLabel'
import CustomTextField from '@renderer/components/ui/forms/theme-elements/CustomTextField'
import { formatRupiah } from '@renderer/utils/myFunctions'

export const CreatePurchaseRequestPage = () => {
  const navigate = useNavigate()
  const isOnline = useNetworkStore((state) => state.isOnline)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const {
    formData,
    handleChange,
    handleAddItem,
    products,
    handleOrderChange,
    units,
    handleDeleteItem,
    loading,
    handleSubmit
  } = UseCreatePurchaseRequest()

  return (
    <Box>
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          📴 Anda sedang offline. Data ditampilkan dari cache.
        </Alert>
      )}

      <Breadcrumb
        showBackButton={true}
        title="Buat Permintaan Pembelian"
        items={[
          { to: '/', title: 'Home' },
          { title: 'inventory' },
          { title: 'Buat Permintaan Pembelian' }
        ]}
      />

      <Stack direction="row" spacing={2} mb={3} justifyContent="space-between" alignItems="center">
        <Box />
      </Stack>

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
                      !formData.items.length ||
                      formData.items.some((order) => !order.product_id || !order.qty) ||
                      !formData.date ||
                      !formData.nomor
                    }
                  >
                    Buat Permintaan
                  </Button>
                </Box>
              </Stack>
              <Divider></Divider>
              <Grid container spacing={3} mb={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box textAlign="left">
                    <CustomFormLabel htmlFor="demo-simple-select" color="textSecondary">
                      Nomor Permintaan Pembelian
                    </CustomFormLabel>
                    <CustomTextField
                      xs={{ width: '45%' }}
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
                    <CustomFormLabel htmlFor="demo-simple-select" color="textSecondary">
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
              <Divider></Divider>
              {/* Orders Table */}
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
                  Permintaan
                  Pembelian
                  onClick={handleAddItem}
                  variant="contained"
                  color="primary"
                  startIcon={<IconPlus width={18} />}
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
                        <TableCell colSpan={1}>
                          <Typography variant="h6" fontSize="14px">
                            Qty
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={1}>
                          <Typography variant="h6" fontSize="14px">
                            Units
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={1}>
                          <Typography variant="h6" fontSize="14px">
                            Catatan
                          </Typography>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <Typography variant="h6" fontSize="14px">
                            Aksi
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.length > 0 ? (
                        formData.items.map((order, index) => (
                          <TableRow key={index}>
                            <TableCell colSpan={3}>
                              <Autocomplete
                                sx={{ width: '250px' }}
                                options={products.filter(
                                  (transaction) =>
                                    !formData.items.some(
                                      (o, i) =>
                                        o.product_id === transaction.product_id && i !== index
                                    )
                                )}
                                getOptionLabel={(option) =>
                                  option.name + ' Stok : ' + formatRupiah(option.stock) || ''
                                }
                                value={products.name}
                                onChange={(event, newValue) => {
                                  console.log(newValue, 'isi valueees')
                                  handleOrderChange(
                                    index,
                                    'product_id',
                                    newValue ? newValue.guid : ''
                                  )
                                  handleOrderChange(index, 'qty', 1)
                                  handleOrderChange(
                                    index,
                                    'satuan',
                                    newValue ? (newValue.satuan ?? '') : ''
                                  )
                                }}
                                renderInput={(params) => (
                                  <CustomTextField {...params} placeholder="Pilih Item" fullWidth />
                                )}
                              />
                            </TableCell>
                            {/* <TableCell colSpan={1}>
                                            <CustomTextField
                                                type="number"
                                                value={order.unitPrice}
                                                placeholder="Unit Price"
                                                onChange={(e) =>
                                                    handleOrderChange(index, "unitPrice", e.target.value)
                                                }
                                                fullWidth
                                            />
                                        </TableCell> */}
                            <TableCell colSpan={1} style={{ padding: isMobile ? '0px' : '16px' }}>
                              <CustomTextField
                                type="number"
                                value={order.qty}
                                placeholder="Qty"
                                onChange={(e) => handleOrderChange(index, 'qty', e.target.value)}
                                fullWidth={isMobile}
                                style={{
                                  width: isMobile ? '100%' : 'auto'
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Autocomplete
                                loading={loading.fetchSatuan}
                                sx={{ width: '250px' }}
                                options={units.filter(
                                  (item) =>
                                    !formData.items.some(
                                      (o, i) => o.satuan === item.satuan && i !== index
                                    )
                                )}
                                getOptionLabel={(option) => option.name || ''}
                                value={
                                  units.find((t) => t.name === formData.items[index]?.satuan) ||
                                  formData.items[index].satuan
                                }
                                onChange={(event, newValue) => {
                                  handleOrderChange(index, 'satuan', newValue.name)
                                }}
                                renderInput={(params) => (
                                  <CustomTextField {...params} placeholder="Pilih Unit" fullWidth />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <CustomTextField
                                name="notes"
                                value={order.notes}
                                onChange={(e) => handleOrderChange(index, 'notes', e.target.value)}
                                label=""
                                variant="outlined"
                                size="small"
                                rows={1}
                                multiline
                                fullWidth
                              />
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell>
                              {/* <Tooltip title="Add Item">
                                                <IconButton onClick={handleAddItem} color="primary">
                                                    <IconSquareRoundedPlus width={22} />
                                                </IconButton>
                                            </Tooltip> */}
                              {index !== 0 && (
                                <Tooltip title="Delete Item">
                                  <IconButton onClick={() => handleDeleteItem(index)} color="error">
                                    <IconTrash width={22} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
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
                <Grid container spacing={2} justifyContent="flex-end">
                  {/* Row 1 */}
                  <Grid size={{ xs: 6 }}>
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
