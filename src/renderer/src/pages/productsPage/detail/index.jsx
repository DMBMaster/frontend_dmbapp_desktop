import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  CardContent,
  Checkbox,
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
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import BlankCard from '@renderer/components/ui/BlankCard'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import CustomFormLabel from '@renderer/components/ui/forms/theme-elements/CustomFormLabel'
import CustomTextField from '@renderer/components/ui/forms/theme-elements/CustomTextField'
import { useNetworkStore } from '@renderer/store/networkStore'
import { useState } from 'react'
import { UseDetail } from './hook/useDetail'
import { formatRupiah, getImgUrl } from '@renderer/utils/myFunctions'
import AddItemDialog from './components/AddProductionDialog'
import EditItemDialog from './components/EditProductionDialog'

// eslint-disable-next-line react/prop-types
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  )
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  }
}

export const DetailProductPage = () => {
  const isOnline = useNetworkStore((state) => state.isOnline)
  const [tabValue, setTabValue] = useState(0)

  const {
    detailData,
    multiSatuan,
    multiHarga,
    productions,
    units,

    multiSatuanData,
    setMultiSatuanData,
    multiHargaData,

    // variant
    availableVariants,
    openVariantDialog,
    setOpenVariantDialog,
    variantDialogMode,
    setVariantDialogMode,
    selectedVariantToAdd,
    setSelectedVariantToAdd,
    newVariantData,
    setNewVariantData,
    resetNewVariantData,

    loading,
    openDialog,
    setOpenDialog,
    error,
    snackbar,
    closeSnackbar,

    handleChangeMultiSatuan,
    handleSubmitMultiSatuan,
    handleDeleteMultiSatuan,
    handleConfirmDeleteMultiSatuan,
    handleCancelDeleteMultiSatuan,

    handleChangeMultiHarga,
    handleSubmitMultiHarga,
    handleDeleteMultiHarga,
    handleConfirmDeleteMultiHarga,
    handleCancelDeleteMultiHarga,

    handleUpdateProduction,
    handleDeleteProductionItem,

    handleSubmitVariant,
    handleUnlinkVariant
  } = UseDetail()

  return (
    <Box>
      {/* Offline Warning */}
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          📴 Anda sedang offline. Data ditampilkan dari cache.
        </Alert>
      )}

      {/* Breadcrumb */}
      <Breadcrumb
        showBackButton={true}
        title="Detail Produk"
        items={[
          { to: '/', title: 'Home' },
          { to: '/product/list', title: 'Produk' },
          { title: 'Detail Produk' }
        ]}
      />

      {/* Global Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Grid spacing={3}>
        <Grid item xs={12}>
          <BlankCard>
            {/* Tabs Header */}
            <Box sx={{ maxWidth: { xs: 320, sm: 680 } }}>
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                scrollButtons="auto"
                aria-label="product detail tabs"
              >
                <Tab iconPosition="start" label="Info" {...a11yProps(0)} />
                <Tab iconPosition="start" label="Multi Satuan" {...a11yProps(1)} />
                <Tab iconPosition="start" label="Bahan/Resep" {...a11yProps(2)} />
                <Tab iconPosition="start" label="Multi Harga" {...a11yProps(3)} />
                <Tab iconPosition="start" label="Varian" {...a11yProps(4)} />
              </Tabs>
            </Box>
            <Divider />

            <CardContent>
              {/* ─── TAB 0: INFO ────────────────────────────────────────────── */}
              <TabPanel value={tabValue} index={0}>
                {loading.fetchDetail ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, lg: 4 }}>
                      <BlankCard>
                        <CardContent>
                          <Typography variant="h5" mb={1}>
                            Gambar
                          </Typography>
                          <Box textAlign="center" display="flex" justifyContent="center">
                            <Avatar
                              src={getImgUrl(detailData?.images)}
                              alt={detailData?.name}
                              sx={{ width: 180, height: 180, margin: '0 auto' }}
                            />
                          </Box>
                        </CardContent>
                      </BlankCard>
                    </Grid>
                    <Grid size={{ xs: 12, lg: 8 }}>
                      <BlankCard>
                        <CardContent>
                          <form>
                            <CustomFormLabel sx={{ mt: 0 }} htmlFor="text-name">
                              Nama
                            </CustomFormLabel>
                            <CustomTextField
                              id="text-name"
                              value={detailData?.name}
                              variant="outlined"
                              fullWidth
                              disabled
                            />
                            <CustomFormLabel htmlFor="text-code">Kode Produk</CustomFormLabel>
                            <CustomTextField
                              id="text-code"
                              value={detailData?.product_code}
                              variant="outlined"
                              fullWidth
                              disabled
                            />
                            <CustomFormLabel htmlFor="text-stock">Stok</CustomFormLabel>
                            <CustomTextField
                              id="text-stock"
                              value={detailData?.stock}
                              variant="outlined"
                              fullWidth
                              disabled
                            />
                          </form>
                        </CardContent>
                      </BlankCard>
                    </Grid>
                  </Grid>
                )}
              </TabPanel>

              {/* ─── TAB 1: MULTI SATUAN ────────────────────────────────────── */}
              <TabPanel value={tabValue} index={1}>
                <Grid spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <CardContent>
                      <Box>
                        {/* Toolbar */}
                        <Stack
                          justifyContent="flex-end"
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={{ xs: 1, sm: 2 }}
                          mb={2}
                        >
                          <Button
                            variant="contained"
                            disableElevation
                            color="primary"
                            onClick={() =>
                              setOpenDialog((prev) => ({ ...prev, addMultiSatuan: true }))
                            }
                          >
                            Tambah
                          </Button>
                        </Stack>

                        {/* Tabel Multi Satuan */}
                        <Box sx={{ overflowX: 'auto' }}>
                          <Table sx={{ whiteSpace: { xs: 'nowrap', md: 'unset' } }}>
                            <TableHead>
                              <TableRow>
                                {['Satuan', 'Jumlah', 'Harga', 'Stok', 'Total Harga', 'Aksi'].map(
                                  (h) => (
                                    <TableCell key={h}>
                                      <Typography variant="h6" fontSize="14px">
                                        {h}
                                      </Typography>
                                    </TableCell>
                                  )
                                )}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {loading.fetchDataMultiSatuan ? (
                                <TableRow>
                                  <TableCell colSpan={6} align="center">
                                    <CircularProgress size={24} />
                                  </TableCell>
                                </TableRow>
                              ) : multiSatuan.length > 0 ? (
                                multiSatuan.map((row, index) => (
                                  <TableRow key={row.id ?? index}>
                                    <TableCell>
                                      <Typography variant="h6" fontSize="14px">
                                        {row.satuan?.name}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontSize="14px">{row.qty}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontSize="14px">
                                        {formatRupiah(row.value)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontSize="14px">
                                        {row.stock ?? 'Unlimited'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontSize="14px">
                                        {formatRupiah(row.amount)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Tooltip title="Hapus">
                                        <IconButton
                                          color="error"
                                          onClick={() => handleDeleteMultiSatuan(row)}
                                        >
                                          <IconTrash width={22} />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={6} align="center">
                                    <Typography variant="body1">Belum ada data</Typography>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Box>

                        {/* Dialog Tambah Multi Satuan */}
                        <Dialog
                          open={openDialog.addMultiSatuan}
                          onClose={() =>
                            setOpenDialog((prev) => ({ ...prev, addMultiSatuan: false }))
                          }
                          fullWidth
                          maxWidth="sm"
                        >
                          <DialogTitle sx={{ mt: 1 }}>Tambah Multi Satuan</DialogTitle>
                          <DialogContent>
                            <Box component="form" noValidate autoComplete="off">
                              <Grid spacing={2} mt={0.5} container>
                                <Grid size={{ xs: 12 }}>
                                  <Autocomplete
                                    value={
                                      units.find((unit) => unit.id === multiSatuanData.satuan_id) ||
                                      null
                                    }
                                    onChange={(_, newValue) =>
                                      setMultiSatuanData((prev) => ({
                                        ...prev,
                                        satuan_id: newValue ? newValue.id : ''
                                      }))
                                    }
                                    options={units}
                                    getOptionLabel={(option) => option.name || ''}
                                    isOptionEqualToValue={(option, value) =>
                                      option.id === value?.id
                                    }
                                    loading={loading.fetchDataUnit}
                                    renderInput={(params) => (
                                      <CustomTextField
                                        {...params}
                                        label="Pilih Satuan"
                                        fullWidth
                                        InputProps={{
                                          ...params.InputProps,
                                          endAdornment: (
                                            <>
                                              {loading.fetchDataUnit ? (
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
                                <Grid size={{ xs: 12 }}>
                                  <TextField
                                    label="Jumlah"
                                    name="qty"
                                    value={multiSatuanData.qty}
                                    onChange={handleChangeMultiSatuan}
                                    fullWidth
                                    type="number"
                                    variant="outlined"
                                  />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                  <TextField
                                    label="Harga"
                                    name="value"
                                    value={multiSatuanData.value ?? ''}
                                    onChange={handleChangeMultiSatuan}
                                    fullWidth
                                    type="number"
                                    variant="outlined"
                                  />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                  <TextField
                                    label="Total Harga"
                                    name="amount"
                                    value={multiSatuanData.amount}
                                    onChange={handleChangeMultiSatuan}
                                    fullWidth
                                    type="number"
                                    variant="outlined"
                                    disabled
                                  />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                  <TextField
                                    label="Stok"
                                    name="stock"
                                    value={multiSatuanData.stock ?? ''}
                                    onChange={handleChangeMultiSatuan}
                                    fullWidth
                                    type="number"
                                    variant="outlined"
                                  />
                                </Grid>
                              </Grid>
                              {error && (
                                <Typography color="error" mt={2}>
                                  {error}
                                </Typography>
                              )}
                            </Box>
                          </DialogContent>
                          <DialogActions>
                            <Button
                              onClick={() =>
                                setOpenDialog((prev) => ({ ...prev, addMultiSatuan: false }))
                              }
                            >
                              Batal
                            </Button>
                            <Button
                              onClick={handleSubmitMultiSatuan}
                              variant="contained"
                              color="primary"
                              disabled={loading.submit}
                            >
                              {loading.submit ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                          </DialogActions>
                        </Dialog>

                        {/* Dialog Hapus Multi Satuan */}
                        <Dialog
                          open={openDialog.deleteMultiSatuan}
                          onClose={handleCancelDeleteMultiSatuan}
                        >
                          <DialogTitle>Konfirmasi Hapus</DialogTitle>
                          <DialogContent>
                            <DialogContentText>
                              Apakah Anda yakin ingin menghapus item ini?
                            </DialogContentText>
                          </DialogContent>
                          <DialogActions>
                            <Button onClick={handleCancelDeleteMultiSatuan} color="primary">
                              Batal
                            </Button>
                            <Button onClick={handleConfirmDeleteMultiSatuan} color="error">
                              Hapus
                            </Button>
                          </DialogActions>
                        </Dialog>
                      </Box>
                    </CardContent>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* ─── TAB 2: BAHAN / RESEP ───────────────────────────────────── */}
              <TabPanel value={tabValue} index={2}>
                <Grid spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <CardContent>
                      <Box>
                        {/* Toolbar */}
                        <Stack
                          justifyContent="flex-end"
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={{ xs: 1, sm: 2 }}
                          mb={2}
                        >
                          <AddItemDialog
                            open={openDialog.addProduction}
                            onClose={() =>
                              setOpenDialog((prev) => ({ ...prev, addProduction: false }))
                            }
                            handleUpdate={handleUpdateProduction}
                            updatedData={productions}
                          />
                          <Button
                            variant="contained"
                            disableElevation
                            color="primary"
                            onClick={() =>
                              setOpenDialog((prev) => ({ ...prev, addProduction: true }))
                            }
                          >
                            Tambah Bahan
                          </Button>
                        </Stack>

                        {/* Tabel Bahan/Resep */}
                        <Box sx={{ overflowX: 'auto' }}>
                          <Table sx={{ whiteSpace: { xs: 'nowrap', md: 'unset' } }}>
                            <TableHead>
                              <TableRow>
                                {['Nama Produk', 'Satuan', 'Jumlah', 'Aksi'].map((h) => (
                                  <TableCell key={h}>
                                    <Typography variant="h6" fontSize="14px">
                                      {h}
                                    </Typography>
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {loading.fetchDataProduction ? (
                                <TableRow>
                                  <TableCell colSpan={4} align="center">
                                    <CircularProgress size={24} />
                                  </TableCell>
                                </TableRow>
                              ) : productions.length > 0 ? (
                                productions.flatMap((production, pIdx) =>
                                  production.items.map((item, iIdx) => (
                                    <TableRow key={`${pIdx}-${item.id ?? iIdx}`}>
                                      <TableCell>
                                        <Typography variant="h6" fontSize="14px">
                                          {item?.product?.product_name}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography fontSize="14px">
                                          {item?.product?.satuan?.name}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography fontSize="14px">{item.qty}</Typography>
                                      </TableCell>
                                      <TableCell>
                                        <EditItemDialog
                                          data={production}
                                          item={item}
                                          onUpdate={handleUpdateProduction}
                                        />
                                        <Tooltip title="Hapus">
                                          <IconButton
                                            color="error"
                                            onClick={() => handleDeleteProductionItem(item)}
                                          >
                                            <IconTrash width={22} />
                                          </IconButton>
                                        </Tooltip>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} align="center">
                                    <Typography variant="body1">Belum ada data</Typography>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Box>
                      </Box>
                    </CardContent>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* ─── TAB 3: MULTI HARGA ─────────────────────────────────────── */}
              <TabPanel value={tabValue} index={3}>
                <Grid spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <CardContent>
                      <Box>
                        {/* Toolbar */}
                        <Stack
                          justifyContent="flex-end"
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={{ xs: 1, sm: 2 }}
                          mb={2}
                        >
                          <Button
                            variant="contained"
                            disableElevation
                            color="primary"
                            onClick={() =>
                              setOpenDialog((prev) => ({ ...prev, addMultiHarga: true }))
                            }
                          >
                            Tambah
                          </Button>
                        </Stack>

                        {/* Tabel Multi Harga */}
                        <Box sx={{ overflowX: 'auto' }}>
                          <Table sx={{ whiteSpace: { xs: 'nowrap', md: 'unset' } }}>
                            <TableHead>
                              <TableRow>
                                {['Harga', 'Minimal Qty', 'Maksimal Qty', 'Aksi'].map((h) => (
                                  <TableCell key={h}>
                                    <Typography variant="h6" fontSize="14px">
                                      {h}
                                    </Typography>
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {loading.fetchDataMultiHarga ? (
                                <TableRow>
                                  <TableCell colSpan={4} align="center">
                                    <CircularProgress size={24} />
                                  </TableCell>
                                </TableRow>
                              ) : multiHarga.length > 0 ? (
                                multiHarga.map((row, index) => (
                                  <TableRow key={row.id ?? index}>
                                    <TableCell>
                                      <Typography variant="h6" fontSize="14px">
                                        {formatRupiah(row.price)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontSize="14px">{row.min_quantity}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontSize="14px">{row.max_quantity}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Tooltip title="Hapus">
                                        <IconButton
                                          color="error"
                                          onClick={() => handleDeleteMultiHarga(row)}
                                        >
                                          <IconTrash width={22} />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} align="center">
                                    <Typography variant="body1">Belum ada data</Typography>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Box>

                        {/* Dialog Tambah Multi Harga */}
                        <Dialog
                          open={openDialog.addMultiHarga}
                          onClose={() =>
                            setOpenDialog((prev) => ({ ...prev, addMultiHarga: false }))
                          }
                          fullWidth
                          maxWidth="sm"
                        >
                          <DialogTitle sx={{ mt: 1 }}>Tambah Multi Harga</DialogTitle>
                          <DialogContent>
                            <Box component="form" noValidate autoComplete="off">
                              <Grid spacing={2} mt={0.5} container>
                                <Grid size={{ xs: 12 }}>
                                  <TextField
                                    label="Minimal Qty"
                                    name="min_quantity"
                                    value={multiHargaData.min_quantity ?? ''}
                                    onChange={handleChangeMultiHarga}
                                    fullWidth
                                    type="number"
                                    variant="outlined"
                                  />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                  <TextField
                                    label="Maksimal Qty"
                                    name="max_quantity"
                                    value={multiHargaData.max_quantity ?? ''}
                                    onChange={handleChangeMultiHarga}
                                    fullWidth
                                    type="number"
                                    variant="outlined"
                                  />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                  <TextField
                                    label="Harga"
                                    name="price"
                                    value={multiHargaData.price ?? ''}
                                    onChange={handleChangeMultiHarga}
                                    fullWidth
                                    type="number"
                                    variant="outlined"
                                  />
                                </Grid>
                              </Grid>
                              {error && (
                                <Typography color="error" mt={2}>
                                  {error}
                                </Typography>
                              )}
                            </Box>
                          </DialogContent>
                          <DialogActions>
                            <Button
                              onClick={() =>
                                setOpenDialog((prev) => ({ ...prev, addMultiHarga: false }))
                              }
                            >
                              Batal
                            </Button>
                            <Button
                              onClick={handleSubmitMultiHarga}
                              variant="contained"
                              color="primary"
                              disabled={loading.submit}
                            >
                              {loading.submit ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                          </DialogActions>
                        </Dialog>

                        {/* Dialog Hapus Multi Harga */}
                        <Dialog
                          open={openDialog.deleteMultiHarga}
                          onClose={handleCancelDeleteMultiHarga}
                        >
                          <DialogTitle>Konfirmasi Hapus</DialogTitle>
                          <DialogContent>
                            <DialogContentText>
                              Apakah Anda yakin ingin menghapus item ini?
                            </DialogContentText>
                          </DialogContent>
                          <DialogActions>
                            <Button onClick={handleCancelDeleteMultiHarga} color="primary">
                              Batal
                            </Button>
                            <Button onClick={handleConfirmDeleteMultiHarga} color="error">
                              Hapus
                            </Button>
                          </DialogActions>
                        </Dialog>
                      </Box>
                    </CardContent>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* ─── TAB 4: VARIAN ──────────────────────────────────────────── */}
              <TabPanel value={tabValue} index={4}>
                <Grid spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <CardContent>
                      <Box>
                        {/* Toolbar */}
                        <Stack
                          justifyContent="flex-end"
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={{ xs: 1, sm: 2 }}
                          mb={2}
                        >
                          <Button
                            variant="contained"
                            disableElevation
                            color="primary"
                            startIcon={<IconPlus size={18} />}
                            onClick={() => setOpenVariantDialog(true)}
                          >
                            Tambah Varian
                          </Button>
                        </Stack>

                        {/* Tabel Varian */}
                        <Box sx={{ overflowX: 'auto' }}>
                          <Table sx={{ whiteSpace: { xs: 'nowrap', md: 'unset' } }}>
                            <TableHead>
                              <TableRow>
                                {['Nama Varian', 'Pilihan (Items)', 'Wajib', 'Multi', 'Aksi'].map(
                                  (h) => (
                                    <TableCell key={h}>
                                      <Typography variant="h6" fontSize="14px">
                                        {h}
                                      </Typography>
                                    </TableCell>
                                  )
                                )}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {loading.fetchDetail ? (
                                <TableRow>
                                  <TableCell colSpan={5} align="center">
                                    <CircularProgress size={24} />
                                  </TableCell>
                                </TableRow>
                              ) : detailData?.variants?.length > 0 ? (
                                detailData.variants.map((variant) => (
                                  <TableRow key={variant.id}>
                                    <TableCell>
                                      <Typography fontSize="14px">{variant.name}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontSize="14px">
                                        {variant.items
                                          ?.map(
                                            (item) =>
                                              `${item.name} (+${formatRupiah(item.price)})`
                                          )
                                          .join(', ')}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontSize="14px">
                                        {variant.is_required ? 'Ya' : 'Tidak'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontSize="14px">
                                        {variant.can_multiple ? 'Ya' : 'Tidak'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Tooltip title="Hapus">
                                        <IconButton
                                          color="error"
                                          onClick={() => handleUnlinkVariant(variant.id)}
                                          disabled={loading.submit}
                                        >
                                          <IconTrash width={22} />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={5} align="center">
                                    <Typography variant="body1">Belum ada varian</Typography>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Box>

                        {/* Dialog Tambah Varian */}
                        <Dialog
                          open={openVariantDialog}
                          onClose={() => {
                            setOpenVariantDialog(false)
                            resetNewVariantData()
                          }}
                          maxWidth="sm"
                          fullWidth
                        >
                          <DialogTitle sx={{ mt: 1 }}>Tambah Varian ke Produk</DialogTitle>
                          <DialogContent>
                            {/* Mode selector tabs */}
                            <Box sx={{ mb: 2 }}>
                              <Tabs
                                value={variantDialogMode}
                                onChange={(_, v) => setVariantDialogMode(v)}
                                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                              >
                                <Tab label="Buat Baru" value="create" />
                                <Tab label="Pilih dari Master" value="select" />
                              </Tabs>
                            </Box>

                            {variantDialogMode === 'select' ? (
                              /* ── Mode: Pilih dari master ── */
                              <Box sx={{ pt: 1 }}>
                                <Autocomplete
                                  options={availableVariants}
                                  getOptionLabel={(option) => option.name || ''}
                                  loading={loading.fetchAvailableVariants}
                                  onChange={(_, newValue) => setSelectedVariantToAdd(newValue)}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Pilih Grup Varian"
                                      fullWidth
                                      InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                          <>
                                            {loading.fetchAvailableVariants ? (
                                              <CircularProgress color="inherit" size={20} />
                                            ) : null}
                                            {params.InputProps.endAdornment}
                                          </>
                                        )
                                      }}
                                    />
                                  )}
                                />
                              </Box>
                            ) : (
                              /* ── Mode: Buat baru ── */
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                                <TextField
                                  label="Nama Grup Varian"
                                  fullWidth
                                  value={newVariantData.name}
                                  onChange={(e) =>
                                    setNewVariantData({ ...newVariantData, name: e.target.value })
                                  }
                                  placeholder="Contoh: Ukuran, Topping, Level Pedas"
                                />

                                <Stack direction="row" spacing={2}>
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={newVariantData.is_required}
                                        onChange={(e) =>
                                          setNewVariantData({
                                            ...newVariantData,
                                            is_required: e.target.checked
                                          })
                                        }
                                      />
                                    }
                                    label="Wajib Pilih"
                                  />
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={newVariantData.can_multiple}
                                        onChange={(e) =>
                                          setNewVariantData({
                                            ...newVariantData,
                                            can_multiple: e.target.checked
                                          })
                                        }
                                      />
                                    }
                                    label="Bisa Pilih Banyak"
                                  />
                                </Stack>

                                <Typography variant="subtitle1" fontWeight="bold">
                                  Pilihan Item:
                                </Typography>

                                {newVariantData.items.map((item, index) => (
                                  <Stack key={index} direction="row" spacing={1} alignItems="center">
                                    <TextField
                                      label="Nama Item"
                                      size="small"
                                      sx={{ flexGrow: 1 }}
                                      value={item.name}
                                      onChange={(e) => {
                                        const newItems = [...newVariantData.items]
                                        newItems[index].name = e.target.value
                                        setNewVariantData({ ...newVariantData, items: newItems })
                                      }}
                                    />
                                    <TextField
                                      label="Harga Tambahan"
                                      size="small"
                                      type="number"
                                      sx={{ width: '140px' }}
                                      value={item.price}
                                      onChange={(e) => {
                                        const newItems = [...newVariantData.items]
                                        newItems[index].price = Number(e.target.value)
                                        setNewVariantData({ ...newVariantData, items: newItems })
                                      }}
                                    />
                                    <IconButton
                                      color="error"
                                      disabled={newVariantData.items.length === 1}
                                      onClick={() => {
                                        const newItems = newVariantData.items.filter(
                                          (_, i) => i !== index
                                        )
                                        setNewVariantData({ ...newVariantData, items: newItems })
                                      }}
                                    >
                                      <IconTrash size={18} />
                                    </IconButton>
                                  </Stack>
                                ))}

                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<IconPlus size={18} />}
                                  onClick={() =>
                                    setNewVariantData({
                                      ...newVariantData,
                                      items: [...newVariantData.items, { name: '', price: 0 }]
                                    })
                                  }
                                >
                                  Tambah Item
                                </Button>
                              </Box>
                            )}
                          </DialogContent>
                          <DialogActions sx={{ p: 2 }}>
                            <Button
                              onClick={() => {
                                setOpenVariantDialog(false)
                                resetNewVariantData()
                              }}
                            >
                              Batal
                            </Button>
                            <Button
                              onClick={handleSubmitVariant}
                              variant="contained"
                              color="primary"
                              disabled={
                                loading.submit ||
                                (variantDialogMode === 'select'
                                  ? !selectedVariantToAdd
                                  : !newVariantData.name)
                              }
                            >
                              {loading.submit ? 'Menyimpan...' : 'Simpan Varian'}
                            </Button>
                          </DialogActions>
                        </Dialog>
                      </Box>
                    </CardContent>
                  </Grid>
                </Grid>
              </TabPanel>
            </CardContent>
          </BlankCard>
        </Grid>
      </Grid>
    </Box>
  )
}