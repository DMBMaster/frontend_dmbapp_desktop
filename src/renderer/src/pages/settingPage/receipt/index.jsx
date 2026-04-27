import { Alert, Box, CircularProgress, Grid, Typography } from '@mui/material'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { useNetworkStore } from '@renderer/store/networkStore'
import { ReceiptPreview } from './components/ReceiptPreview'
import { ReceiptSettingsForm } from './components/ReceiptSettingsForm'
import { UseReceipt } from './hook/useReceipt'

export const SettingReceiptPage = () => {
  const isOnline = useNetworkStore((state) => state.isOnline)
  const {
    activeTab,
    setActiveTab,
    settings,
    loading,
    error,
    socialMediaLines,
    saveReceiptSettings,
    toggleSetting,
    handleInputChange,
    handleSocialMediaChange,
    handleAddSocialMedia,
    handleRemoveSocialMedia
  } = UseReceipt()

  return (
    <Box>
      {/* Network Status Indicator */}
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          📴 Anda sedang offline. Data ditampilkan dari cache.
        </Alert>
      )}

      <Breadcrumb
        title="Pengaturan Struk"
        items={[{ to: '/', title: 'Home' }, { title: 'Pengaturan' }, { title: 'Pengaturan Struk' }]}
      />

      <Box sx={{ mt: 3 }}>
        {loading.fetchData ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Memuat pengaturan struk...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Grid container spacing={2.5} alignItems="flex-start">
            <Grid size={{ xs: 12, lg: 6 }}>
              <ReceiptSettingsForm
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                settings={settings}
                loading={loading}
                onToggle={toggleSetting}
                onInput={handleInputChange}
                onSave={saveReceiptSettings}
                onSocialChange={handleSocialMediaChange}
                onAddSocial={handleAddSocialMedia}
                onRemoveSocial={handleRemoveSocialMedia}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <ReceiptPreview settings={settings} socialMediaLines={socialMediaLines} />
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  )
}
