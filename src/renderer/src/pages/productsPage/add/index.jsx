import {
  Alert,
  Box,
  Grid,
  Button,
  Stack,
  FormGroup,
  FormControlLabel,
  Typography,
  Autocomplete,
  CircularProgress,
  TextField,
  Card,
  CardContent
} from '@mui/material'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { useNetworkStore } from '@renderer/store/networkStore'
import { useDropzone } from 'react-dropzone'
import { useState } from 'react'
import { UseAddProduct } from './hook/useAddProduct'
import CustomSwitch from '@renderer/components/ui/forms/theme-elements/CustomSwitch'

export const AddProductPage = () => {
  const isOnline = useNetworkStore((state) => state.isOnline)
  const {
    categories,
    units,
    loading,
    handleChange,
    handleSubmit,
    formData,
    setFormData,
    formOption,
    setFormOption,
    selectedCategory,
    setSelectedCategory,
    selectedUnit,
    setSelectedUnit
  } = UseAddProduct()

  const [uploadImage, setUploadImage] = useState(null)

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: async (acceptedFiles) => {
      setUploadImage(acceptedFiles[0])
      setFormData((prev) => ({ ...prev, images: acceptedFiles[0] }))
    }
  })

  return (
    <Box>
      {/* Network Status Indicator */}
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          📴 Anda sedang offline. Data ditampilkan dari cache.
        </Alert>
      )}

      <Breadcrumb
        showBackButton={true}
        title="Tambah Produk"
        items={[
          { to: '/', title: 'Home' },
          { to: '/product/list', title: 'Produk' },
          { title: 'Tambah Produk' }
        ]}
      />

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Stack spacing={3}>
              <Card>
                <CardContent>
                  {/* Kategori */}
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    Kategori
                  </Typography>
                  <Autocomplete
                    value={selectedCategory}
                    onChange={(event, newValue) => {
                      setSelectedCategory(newValue)
                    }}
                    options={categories}
                    getOptionLabel={(option) => option.category_name || ''}
                    isOptionEqualToValue={(option, value) => option.guid === value?.guid}
                    loading={loading.fetchCategories}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Pilih Kategori"
                        size="small"
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading.fetchCategories ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />

                  {/* Nama */}
                  <Typography variant="subtitle1" fontWeight={600} mt={2} mb={1}>
                    Nama
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    name="product_name"
                    value={formData.product_name || ''}
                    onChange={handleChange}
                    placeholder="Masukkan nama produk"
                  />

                  {/* Kode */}
                  <Typography variant="subtitle1" fontWeight={600} mt={2} mb={1}>
                    Kode
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    name="product_code"
                    value={formData.product_code || ''}
                    onChange={handleChange}
                    placeholder="Masukkan kode produk"
                  />

                  {/* Satuan */}
                  <Typography variant="subtitle1" fontWeight={600} mt={2} mb={1}>
                    Satuan
                  </Typography>
                  <Autocomplete
                    value={selectedUnit}
                    onChange={(event, newValue) => {
                      setSelectedUnit(newValue)
                    }}
                    options={units}
                    getOptionLabel={(option) => option.name || ''}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    loading={loading.fetchUnitsProducts}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Pilih Satuan"
                        size="small"
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading.fetchUnitsProducts ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />

                  {/* Harga Modal */}
                  <Typography variant="subtitle1" fontWeight={600} mt={2} mb={1}>
                    Harga Modal
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    name="base_price"
                    value={formData.base_price || 0}
                    onChange={handleChange}
                    placeholder="0"
                  />

                  {/* Harga In Store */}
                  <Typography variant="subtitle1" fontWeight={600} mt={2} mb={1}>
                    Harga In Store
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    name="price_walkin"
                    value={formData.price_walkin || 0}
                    onChange={handleChange}
                    placeholder="0"
                  />

                  {/* Harga DMB (conditional) */}
                  {formOption.isDMBEnabled && (
                    <>
                      <Typography variant="subtitle1" fontWeight={600} mt={2} mb={1}>
                        Harga DMB
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        name="price"
                        value={formData.price || 0}
                        onChange={handleChange}
                        placeholder="0"
                      />
                    </>
                  )}

                  {/* Stok (conditional) */}
                  {!formOption.isInventory && (
                    <>
                      <Typography variant="subtitle1" fontWeight={600} mt={2} mb={1}>
                        Stok
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        name="stock"
                        value={formData.stock || 0}
                        onChange={handleChange}
                        placeholder="0"
                      />
                    </>
                  )}

                  {/* Deskripsi */}
                  <Typography variant="subtitle1" fontWeight={600} mt={2} mb={1}>
                    Deskripsi
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    size="small"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    placeholder="Deskripsi produk"
                  />
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Stack spacing={3}>
              {/* Gambar */}
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    Gambar
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: 'primary.light',
                      color: 'primary.main',
                      padding: '30px',
                      textAlign: 'center',
                      border: '1px dashed',
                      borderColor: 'primary.main',
                      cursor: 'pointer',
                      borderRadius: 1
                    }}
                    {...getRootProps()}
                  >
                    <input {...getInputProps()} />
                    {uploadImage ? (
                      <img
                        src={URL.createObjectURL(uploadImage)}
                        alt="Uploaded preview"
                        style={{
                          width: '100%',
                          maxWidth: '300px',
                          height: 'auto',
                          marginTop: '10px'
                        }}
                      />
                    ) : (
                      <Typography variant="body2">
                        Drag n drop some files here, or click to select files
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Channel Penjualan */}
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    Channel Penjualan
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <CustomSwitch
                          checked={formOption.inStore}
                          onChange={(e) =>
                            setFormOption((prev) => ({ ...prev, inStore: e.target.checked }))
                          }
                        />
                      }
                      label="In Store"
                    />
                    <FormControlLabel
                      control={
                        <CustomSwitch
                          checked={formOption.bookingEngine}
                          onChange={(e) =>
                            setFormOption((prev) => ({ ...prev, bookingEngine: e.target.checked }))
                          }
                        />
                      }
                      label="Booking Engine"
                    />
                    <FormControlLabel
                      control={
                        <CustomSwitch
                          checked={formOption.miniBar}
                          onChange={(e) =>
                            setFormOption((prev) => ({ ...prev, miniBar: e.target.checked }))
                          }
                        />
                      }
                      label="Mini Bar"
                    />
                    <FormControlLabel
                      control={
                        <CustomSwitch
                          checked={formOption.isDMBEnabled}
                          onChange={(e) =>
                            setFormOption((prev) => ({ ...prev, isDMBEnabled: e.target.checked }))
                          }
                        />
                      }
                      label="DMB"
                    />
                  </FormGroup>
                </CardContent>
              </Card>

              {/* Persediaan */}
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    Persediaan
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <CustomSwitch
                          checked={formOption.isInventory}
                          onChange={(e) =>
                            setFormOption((prev) => ({ ...prev, isInventory: e.target.checked }))
                          }
                        />
                      }
                      label="Monitor Persediaan"
                    />
                    <FormControlLabel
                      control={
                        <CustomSwitch
                          checked={formOption.sale}
                          onChange={(e) =>
                            setFormOption((prev) => ({ ...prev, sale: e.target.checked }))
                          }
                        />
                      }
                      label="Produk Dijual"
                    />
                  </FormGroup>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading.submitData}
          sx={{ mt: 2 }}
        >
          {loading.submitData ? 'Proses...' : 'Tambah Produk'}
        </Button>
      </form>
    </Box>
  )
}
// [file content end]
