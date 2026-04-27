/* eslint-disable react/prop-types */
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import { IconInfoCircle, IconMinus, IconPlus } from '@tabler/icons-react'

const QR_TYPE_OPTIONS = [
  { label: 'Link URL', value: 'LINK_URL' },
  { label: 'Text', value: 'TEXT' }
]

const PAPER_SIZE_OPTIONS = [
  { label: '58mm (Thermal Printer)', value: 'MM58' },
  { label: '80mm (Standard)', value: 'MM80' }
]

const TabPanel = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
)

const SettingItem = ({ label, description, checked, onChange, disabled, showInfo = false }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      py: 1.4,
      borderBottom: '1px solid',
      borderColor: 'divider'
    }}
  >
    <Box sx={{ pr: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        {showInfo && <IconInfoCircle size={14} color="#7d8aac" />}
      </Box>
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35 }}>
          {description}
        </Typography>
      )}
    </Box>
    <Switch
      checked={Boolean(checked)}
      onChange={onChange}
      disabled={disabled}
      size="small"
      sx={{ mt: 0.25 }}
    />
  </Box>
)

const PaperSizeOption = ({ label, subtitle, value, selectedValue, onChange }) => {
  const selected = selectedValue === value

  return (
    <Box
      onClick={() => onChange(value)}
      sx={{
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderRadius: 1.5,
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main'
        }
      }}
    >
      <FormControlLabel
        value={value}
        control={<Radio size="small" />}
        label={
          <Box>
            <Typography variant="body2">{label}</Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        }
        sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
      />
    </Box>
  )
}

export const ReceiptSettingsForm = ({
  activeTab,
  setActiveTab,
  settings,
  loading,
  onToggle,
  onInput,
  onSave,
  onSocialChange,
  onAddSocial,
  onRemoveSocial
}) => {
  return (
    <Box>
      <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'grey.300', mb: 2 }}>
        <CardContent sx={{ p: 2.2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
            Paper Size
          </Typography>
          <RadioGroup
            value={settings.paperSize}
            onChange={(e) => onInput('paperSize', e.target.value)}
          >
            {PAPER_SIZE_OPTIONS.map((option) => (
              <Box key={option.value} sx={{ mb: 1.2 }}>
                <PaperSizeOption
                  value={option.value}
                  label={option.label}
                  subtitle={
                    option.value === 'MM58'
                      ? 'Ideal for thermal printers and mobile POS'
                      : 'Standard size for most receipt printers'
                  }
                  selectedValue={settings.paperSize}
                  onChange={(value) => onInput('paperSize', value)}
                />
              </Box>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'grey.300', mb: 2 }}>
        <CardContent sx={{ p: 2.2 }}>
          <SettingItem
            label="Batasan Jumlah Cetak Struk"
            description="Batasi jumlah pemakaian cetakan struk yang akan digunakan di setiap transaksi"
            checked={settings.printLimit}
            onChange={() => onToggle('printLimit')}
          />
          <TextField
            type="number"
            fullWidth
            label="Maksimal Jumlah Print"
            value={settings.maxPrintCount}
            onChange={(e) => onInput('maxPrintCount', Number(e.target.value || 1))}
            disabled={!settings.printLimit}
            inputProps={{ min: 1 }}
            sx={{ mt: 1.8 }}
          />
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'grey.300' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 2.2, pt: 2.2 }}>
            <Typography variant="h6" fontWeight={700}>
              Atur Tampilan Struk
            </Typography>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant="scrollable"
            sx={{
              mt: 1.1,
              px: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '& .MuiTabs-indicator': {
                backgroundColor: 'primary.main',
                height: 2
              },
              '& .MuiTab-root': {
                minHeight: 40,
                textTransform: 'none',
                fontSize: '0.92rem',
                px: 2,
                color: 'text.secondary'
              },
              '& .Mui-selected': {
                color: 'text.primary'
              }
            }}
          >
            <Tab label="Header" />
            <Tab label="Body" />
            <Tab label="Footer" />
          </Tabs>

          <Box sx={{ px: 2.2 }}>
            <TabPanel value={activeTab} index={0}>
              <Typography variant="subtitle2" sx={{ mb: 0.45 }}>
                Informasi Outlet
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Atur informasi utama yang akan tampil pada bagian teratas struk
              </Typography>

              <SettingItem
                label="Logo"
                checked={settings.showLogo}
                onChange={() => onToggle('showLogo')}
              />
              <SettingItem
                label="Nama Usaha"
                checked={settings.showBusinessName}
                onChange={() => onToggle('showBusinessName')}
              />
              <SettingItem
                label="Nama Outlet"
                checked={settings.showOutletName}
                onChange={() => onToggle('showOutletName')}
              />
              <SettingItem
                label="Alamat"
                checked={settings.showAddress}
                onChange={() => onToggle('showAddress')}
              />
              <SettingItem
                label="Kota"
                checked={settings.showCity}
                onChange={() => onToggle('showCity')}
              />
              <SettingItem
                label="Provinsi"
                checked={settings.showProvince}
                onChange={() => onToggle('showProvince')}
              />
              <SettingItem
                label="Negara"
                checked={settings.showCountry}
                onChange={() => onToggle('showCountry')}
              />
              <SettingItem
                label="Email"
                checked={settings.showEmail}
                onChange={() => onToggle('showEmail')}
              />
              <SettingItem
                label="No Telepon"
                checked={settings.showPhone}
                onChange={() => onToggle('showPhone')}
              />
              <SettingItem
                label="Teks Header Kustom"
                checked={settings.customHeaderText}
                onChange={() => onToggle('customHeaderText')}
              />
              {settings.customHeaderText && (
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Teks Header"
                  value={settings.headerText}
                  onChange={(e) => onInput('headerText', e.target.value)}
                  sx={{ mt: 1.5 }}
                />
              )}

              <Typography variant="subtitle2" sx={{ mt: 2.2, mb: 0.45 }}>
                Informasi Transaksi
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Informasi data pesanan dan data pelanggan yang akan ditampilkan
              </Typography>

              <SettingItem
                label="Nomor Nota"
                checked={settings.showNoteNumber}
                onChange={() => onToggle('showNoteNumber')}
              />
              <SettingItem
                label="Waktu Transaksi"
                checked={settings.showTransactionTime}
                onChange={() => onToggle('showTransactionTime')}
              />
              <SettingItem
                label="Nomor Urut Pesanan"
                checked={settings.showOrderNumber}
                onChange={() => onToggle('showOrderNumber')}
              />
              <SettingItem
                label="Nama Kasir Order"
                checked={settings.showCashierOrderName}
                onChange={() => onToggle('showCashierOrderName')}
              />
              <SettingItem
                label="Nama Kasir Bayar"
                checked={settings.showCashierPaymentName}
                onChange={() => onToggle('showCashierPaymentName')}
              />
              <SettingItem
                label="Customer"
                checked={settings.showCustomer}
                onChange={() => onToggle('showCustomer')}
              />
              <SettingItem
                label="Kepemilikan (Khusus Mode Reservasi)"
                checked={settings.showOwnership}
                onChange={() => onToggle('showOwnership')}
                showInfo
              />
              <SettingItem
                label="Dilayani oleh / Waiters"
                checked={settings.showServedBy}
                onChange={() => onToggle('showServedBy')}
              />
              <SettingItem
                label="Jenis Order"
                checked={settings.showOrderType}
                onChange={() => onToggle('showOrderType')}
              />
              <SettingItem
                label="Nama Order"
                checked={settings.showOrderName}
                onChange={() => onToggle('showOrderName')}
              />
              <SettingItem
                label="Nomor Meja"
                checked={settings.showTableNumber}
                onChange={() => onToggle('showTableNumber')}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Typography variant="subtitle2" sx={{ mb: 0.45 }}>
                Informasi Produk
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Atur informasi produk yang akan tampil pada struk sesuai dengan pesanan
              </Typography>

              <SettingItem
                label="Harga Satuan & Ekstra"
                checked={settings.showUnitPrice}
                onChange={() => onToggle('showUnitPrice')}
                showInfo
              />
              <SettingItem
                label="Komisi Karyawan"
                checked={settings.showEmployeeCommission}
                onChange={() => onToggle('showEmployeeCommission')}
                showInfo
              />
              <SettingItem
                label="Ekstra"
                checked={settings.showExtras}
                onChange={() => onToggle('showExtras')}
                showInfo
              />
              <SettingItem
                label="Serial Number"
                checked={settings.showSerialNumber}
                onChange={() => onToggle('showSerialNumber')}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Typography variant="subtitle2" sx={{ mb: 0.45 }}>
                Teks Footer
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Atur teks tambahan yang akan tampil pada struk
              </Typography>

              <SettingItem
                label="Catatan"
                checked={settings.showNotes}
                onChange={() => onToggle('showNotes')}
              />
              <SettingItem
                label="Teks Footer Kustom"
                checked={settings.customFooterText}
                onChange={() => onToggle('customFooterText')}
              />
              {settings.customFooterText && (
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Teks Footer"
                  value={settings.footerText}
                  onChange={(e) => onInput('footerText', e.target.value)}
                  sx={{ mt: 1.5 }}
                />
              )}

              <Typography variant="subtitle2" sx={{ mt: 2.2, mb: 0.45 }}>
                Kode QR & Barcode
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Atur informasi pendukung yang memuat Kode QR dan Barcode
              </Typography>

              <SettingItem
                label="Kode QR Kustom"
                checked={settings.customQR}
                onChange={() => onToggle('customQR')}
              />
              {settings.customQR && (
                <Grid container spacing={1.25} sx={{ mt: 0.5, mb: 0.8 }}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel id="qr-type-label">Tipe QR</InputLabel>
                      <Select
                        labelId="qr-type-label"
                        value={settings.qrType}
                        label="Tipe QR"
                        onChange={(e) => onInput('qrType', e.target.value)}
                      >
                        {QR_TYPE_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Judul QR"
                      value={settings.qrTitle}
                      onChange={(e) => onInput('qrTitle', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Konten QR"
                      value={settings.qrLink}
                      onChange={(e) => onInput('qrLink', e.target.value)}
                    />
                  </Grid>
                </Grid>
              )}
              <FormControlLabel
                sx={{ mt: 0.5, mb: 1 }}
                control={
                  <Switch
                    checked={Boolean(settings.hideQRLink)}
                    onChange={() => onToggle('hideQRLink')}
                    disabled={!settings.customQR}
                  />
                }
                label="Sembunyikan link QR"
              />

              <SettingItem
                label="Kode QR Webstruk"
                checked={settings.webQR}
                onChange={() => onToggle('webQR')}
              />
              {settings.webQR && (
                <TextField
                  fullWidth
                  label="Judul Web QR"
                  value={settings.webQRTitle}
                  onChange={(e) => onInput('webQRTitle', e.target.value)}
                  sx={{ mt: 1.5, mb: 0.5 }}
                />
              )}
              <FormControlLabel
                sx={{ mt: 0.5, mb: 1 }}
                control={
                  <Switch
                    checked={Boolean(settings.hideWebQRLink)}
                    onChange={() => onToggle('hideWebQRLink')}
                    disabled={!settings.webQR}
                  />
                }
                label="Sembunyikan link Web QR"
              />

              <SettingItem
                label="Kode QR Nomor Order"
                checked={settings.orderNumberQR}
                onChange={() => onToggle('orderNumberQR')}
              />
              <SettingItem
                label="Barcode Struk Elektronik"
                checked={settings.electronicBarcode}
                onChange={() => onToggle('electronicBarcode')}
              />

              <Typography variant="subtitle2" sx={{ mt: 2.2, mb: 0.45 }}>
                Informasi Lainnya
              </Typography>
              <SettingItem
                label="Tampilkan Wifi"
                checked={settings.showWifi}
                onChange={() => onToggle('showWifi')}
              />
              {settings.showWifi && (
                <Grid container spacing={1.25} sx={{ mt: 0.8, mb: 0.8 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Nama Wifi"
                      value={settings.wifiName}
                      onChange={(e) => onInput('wifiName', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Password Wifi"
                      value={settings.wifiPassword}
                      onChange={(e) => onInput('wifiPassword', e.target.value)}
                    />
                  </Grid>
                </Grid>
              )}
              <SettingItem
                label="PIN Kamar"
                checked={settings.showRoomPin}
                onChange={() => onToggle('showRoomPin')}
              />
              <SettingItem
                label="Voucher Breakfast"
                checked={settings.showBreakfast}
                onChange={() => onToggle('showBreakfast')}
              />

              <SettingItem
                label="Media Sosial"
                checked={settings.showSocialMedia}
                onChange={() => onToggle('showSocialMedia')}
              />

              {settings.showSocialMedia && (
                <Box sx={{ mt: 1.5 }}>
                  {settings.socialMedia.map((item, index) => (
                    <Grid key={`social-${index}`} container spacing={1.5} sx={{ mb: 1.5 }}>
                      <Grid size={{ xs: 12, md: 5 }}>
                        <TextField
                          fullWidth
                          label="Platform"
                          value={item.platform || ''}
                          onChange={(e) => onSocialChange(index, 'platform', e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 5 }}>
                        <TextField
                          fullWidth
                          label="Username"
                          value={item.username || ''}
                          onChange={(e) => onSocialChange(index, 'username', e.target.value)}
                        />
                      </Grid>
                      <Grid
                        size={{ xs: 12, md: 2 }}
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                      >
                        <IconButton color="error" onClick={() => onRemoveSocial(index)}>
                          <IconMinus size={18} />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}

                  <Button
                    variant="outlined"
                    startIcon={<IconPlus size={18} />}
                    onClick={onAddSocial}
                  >
                    Tambah Social Media
                  </Button>
                </Box>
              )}
            </TabPanel>
          </Box>

          <Box sx={{ px: 2.2, py: 2, borderTop: '1px solid', borderColor: 'divider', mt: 1 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={onSave}
              disabled={loading.saveData}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, py: 1.1 }}
            >
              {loading.saveData ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
