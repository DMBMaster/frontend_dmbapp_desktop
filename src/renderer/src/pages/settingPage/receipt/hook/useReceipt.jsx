import { useNotifier } from '@renderer/components/core/NotificationProvider'
import ReceiptService from '@renderer/services/receiptService'
import { useNetworkStore } from '@renderer/store/networkStore'
import { useCallback, useEffect, useMemo, useState } from 'react'

const getMerchantId = () => localStorage.getItem('outletGuid') || localStorage.getItem('outletId')

const createDefaultSettings = (initialData = {}) => {
  const printData = initialData?.printData || {}

  return {
    printLimit: initialData?.printLimit ?? false,
    maxPrintCount: initialData?.maxPrintCount ?? 1,
    paperSize: initialData?.paperSize ?? 'MM58',

    showLogo: initialData?.showLogo ?? false,
    showBusinessName: initialData?.showBusinessName ?? false,
    showOutletName: initialData?.showOutletName ?? false,
    showAddress: initialData?.showAddress ?? false,
    showCity: initialData?.showCity ?? false,
    showProvince: initialData?.showProvince ?? false,
    showCountry: initialData?.showCountry ?? false,
    showEmail: initialData?.showEmail ?? false,
    showPhone: initialData?.showPhone ?? false,
    customHeaderText: initialData?.customHeaderText ?? false,
    headerText: initialData?.headerText ?? printData?.headerText ?? '',

    showNoteNumber: initialData?.showNoteNumber ?? true,
    showTransactionTime: initialData?.showTransactionTime ?? true,
    showOrderNumber: initialData?.showOrderNumber ?? true,
    showCashierOrderName: initialData?.showCashierOrderName ?? true,
    showCashierPaymentName: initialData?.showCashierPaymentName ?? true,
    showCustomer: initialData?.showCustomer ?? false,
    showOwnership: initialData?.showOwnership ?? false,
    showServedBy: initialData?.showServedBy ?? false,
    showOrderType: initialData?.showOrderType ?? false,
    showOrderName: initialData?.showOrderName ?? false,
    showTableNumber: initialData?.showTableNumber ?? false,

    showUnitPrice: initialData?.showUnitPrice ?? false,
    showEmployeeCommission: initialData?.showEmployeeCommission ?? false,
    showExtras: initialData?.showExtras ?? false,
    showSerialNumber: initialData?.showSerialNumber ?? false,

    showNotes: initialData?.showNotes ?? false,
    customFooterText: initialData?.customFooterText ?? false,
    footerText: initialData?.footerText ?? printData?.footerText ?? '',

    customQR: initialData?.customQR ?? false,
    qrType: initialData?.qrType ?? printData?.qr?.type ?? 'LINK_URL',
    qrTitle: initialData?.qrTitle ?? printData?.qr?.title ?? '',
    qrLink: initialData?.qrLink ?? printData?.qr?.link ?? '',
    hideQRLink: initialData?.hideQRLink ?? printData?.qr?.hideLink ?? false,

    webQR: initialData?.webQR ?? false,
    webQRTitle: initialData?.webQRTitle ?? printData?.webQR?.title ?? '',
    hideWebQRLink: initialData?.hideWebQRLink ?? printData?.webQR?.hideLink ?? false,

    orderNumberQR: initialData?.orderNumberQR ?? false,
    electronicBarcode: initialData?.electronicBarcode ?? false,

    showWifi: initialData?.showWifi ?? printData?.showWifi ?? false,
    wifiName: initialData?.wifiName ?? printData?.wifiName ?? '',
    wifiPassword: initialData?.wifiPassword ?? printData?.wifiPassword ?? '',
    showRoomPin: initialData?.showRoomPin ?? printData?.showRoomPin ?? false,
    showBreakfast: initialData?.showBreakfast ?? printData?.showBreakfast ?? false,

    showSocialMedia: initialData?.showSocialMedia ?? false,
    socialMedia: Array.isArray(initialData?.socialMedia)
      ? initialData.socialMedia
      : Array.isArray(printData?.socialMedia)
        ? printData.socialMedia
        : []
  }
}

const normalizeSocialMedia = (socialMedia = []) => {
  if (!Array.isArray(socialMedia)) return []

  return socialMedia
    .map((item) => ({
      platform: String(item?.platform || '').trim(),
      username: String(item?.username || '').trim()
    }))
    .filter((item) => item.platform || item.username)
}

const buildSocialMediaBreakdown = (socialMedia = []) => {
  const byPlatform = socialMedia.reduce((acc, item) => {
    const key = (item.platform || 'OTHER').toUpperCase()
    if (!acc[key]) acc[key] = []
    acc[key].push(item.username || '')
    return acc
  }, {})

  const lines = socialMedia.map((item) => `${item.platform || 'OTHER'}: ${item.username || ''}`)

  return {
    byPlatform,
    lines
  }
}

const buildSavePayload = (settings) => {
  const merchantId = getMerchantId()
  const socialMedia = settings.showSocialMedia ? normalizeSocialMedia(settings.socialMedia) : []

  return {
    merchant_id: merchantId,
    printData: {
      headerText: settings.headerText || '',
      footerText: settings.footerText || '',
      qr: {
        type: settings.qrType || 'LINK_URL',
        title: settings.qrTitle || '',
        link: settings.qrLink || '',
        hideLink: Boolean(settings.hideQRLink)
      },
      webQR: {
        title: settings.webQRTitle || '',
        hideLink: Boolean(settings.hideWebQRLink)
      },
      socialMedia,
      socialMediaBreakdown: buildSocialMediaBreakdown(socialMedia),
      showWifi: Boolean(settings.showWifi),
      wifiName: settings.wifiName || '',
      wifiPassword: settings.wifiPassword || '',
      showRoomPin: Boolean(settings.showRoomPin),
      showBreakfast: Boolean(settings.showBreakfast)
    },
    showWifi: Boolean(settings.showWifi),
    wifiName: settings.wifiName || '',
    wifiPassword: settings.wifiPassword || '',
    showRoomPin: Boolean(settings.showRoomPin),
    showBreakfast: Boolean(settings.showBreakfast),
    printLimit: Boolean(settings.printLimit),
    maxPrintCount: Number(settings.maxPrintCount || 1),
    paperSize: settings.paperSize || 'MM58',
    showLogo: Boolean(settings.showLogo),
    showBusinessName: Boolean(settings.showBusinessName),
    showOutletName: Boolean(settings.showOutletName),
    showAddress: Boolean(settings.showAddress),
    showCity: Boolean(settings.showCity),
    showProvince: Boolean(settings.showProvince),
    showCountry: Boolean(settings.showCountry),
    showEmail: Boolean(settings.showEmail),
    showPhone: Boolean(settings.showPhone),
    customHeaderText: Boolean(settings.customHeaderText),
    headerText: settings.headerText || '',
    showNoteNumber: Boolean(settings.showNoteNumber),
    showTransactionTime: Boolean(settings.showTransactionTime),
    showOrderNumber: Boolean(settings.showOrderNumber),
    showCashierOrderName: Boolean(settings.showCashierOrderName),
    showCashierPaymentName: Boolean(settings.showCashierPaymentName),
    showCustomer: Boolean(settings.showCustomer),
    showOwnership: Boolean(settings.showOwnership),
    showServedBy: Boolean(settings.showServedBy),
    showOrderType: Boolean(settings.showOrderType),
    showOrderName: Boolean(settings.showOrderName),
    showTableNumber: Boolean(settings.showTableNumber),
    showUnitPrice: Boolean(settings.showUnitPrice),
    showEmployeeCommission: Boolean(settings.showEmployeeCommission),
    showExtras: Boolean(settings.showExtras),
    showSerialNumber: Boolean(settings.showSerialNumber),
    showNotes: Boolean(settings.showNotes),
    customFooterText: Boolean(settings.customFooterText),
    footerText: settings.footerText || '',
    customQR: Boolean(settings.customQR),
    qrType: settings.qrType || 'LINK_URL',
    qrTitle: settings.qrTitle || '',
    qrLink: settings.qrLink || '',
    hideQRLink: Boolean(settings.hideQRLink),
    webQR: Boolean(settings.webQR),
    webQRTitle: settings.webQRTitle || '',
    hideWebQRLink: Boolean(settings.hideWebQRLink),
    orderNumberQR: Boolean(settings.orderNumberQR),
    electronicBarcode: Boolean(settings.electronicBarcode),
    socialMedia
  }
}

export const UseReceipt = () => {
  const notifier = useNotifier()
  const receiptService = ReceiptService()
  const isOnline = useNetworkStore((state) => state.isOnline)

  const [loading, setLoading] = useState({
    fetchData: false,
    saveData: false
  })
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [settings, setSettings] = useState(createDefaultSettings())

  const fetchReceiptSettings = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    setError('')

    try {
      const params = {
        merchant_id: getMerchantId() || undefined
      }
      const response = await receiptService.getReceiptSettings(params)
      setSettings(createDefaultSettings(response?.data || {}))
    } catch (apiError) {
      console.error(apiError)
      const cachedData = receiptService.getCachedReceiptSettings()

      if (cachedData) {
        setSettings(createDefaultSettings(cachedData))
        notifier.show({
          message: 'Data dari cache',
          description: 'Pengaturan struk terakhir berhasil dimuat dari lokal.',
          severity: 'warning'
        })
      } else {
        const message = apiError?.response?.data?.message || 'Gagal memuat pengaturan struk.'
        setError(message)
        notifier.show({
          message: 'Gagal memuat data',
          description: message,
          severity: 'error'
        })
      }
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }, [notifier, receiptService])

  useEffect(() => {
    fetchReceiptSettings()
  }, [])

  const toggleSetting = useCallback((key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleInputChange = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSocialMediaChange = useCallback((index, key, value) => {
    setSettings((prev) => ({
      ...prev,
      socialMedia: prev.socialMedia.map((item, idx) =>
        idx === index ? { ...item, [key]: value } : item
      )
    }))
  }, [])

  const handleAddSocialMedia = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      socialMedia: [...prev.socialMedia, { platform: '', username: '' }]
    }))
  }, [])

  const handleRemoveSocialMedia = useCallback((index) => {
    setSettings((prev) => ({
      ...prev,
      socialMedia: prev.socialMedia.filter((_, idx) => idx !== index)
    }))
  }, [])

  const saveReceiptSettings = useCallback(async () => {
    if (!isOnline) {
      notifier.show({
        message: 'Tidak bisa menyimpan saat offline',
        description: 'Sambungkan internet lalu coba simpan kembali.',
        severity: 'warning'
      })
      return false
    }

    setLoading((prev) => ({ ...prev, saveData: true }))

    try {
      const payload = buildSavePayload(settings)
      await receiptService.saveReceiptSettings(payload)
      notifier.show({
        message: 'Berhasil disimpan',
        description: 'Pengaturan struk berhasil diperbarui.',
        severity: 'success'
      })
      return true
    } catch (apiError) {
      console.error(apiError)
      notifier.show({
        message: 'Gagal menyimpan',
        description: apiError?.response?.data?.message || 'Terjadi kesalahan pada server.',
        severity: 'error'
      })
      return false
    } finally {
      setLoading((prev) => ({ ...prev, saveData: false }))
    }
  }, [isOnline, notifier, receiptService, settings])

  const socialMediaLines = useMemo(() => {
    if (!Array.isArray(settings.socialMedia)) return []
    return settings.socialMedia
      .filter((item) => item?.platform || item?.username)
      .map((item) => `${item?.platform || 'OTHER'}: ${item?.username || ''}`)
  }, [settings.socialMedia])

  return {
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
  }
}
