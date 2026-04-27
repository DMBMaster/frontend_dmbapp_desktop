import { useAxiosInstance } from '@renderer/api/axiosInstance'

const CACHE_KEY = 'receipt_settings_cache_v1'

const ReceiptService = () => {
  const axiosInstance = useAxiosInstance()

  const getReceiptSettings = async (params = {}) => {
    const response = await axiosInstance.get('/merchant/setting/receipt', { params })
    const rawData = response?.data?.data
    const payload = rawData?.initialData ?? rawData?.settings ?? rawData ?? null

    if (payload) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
    }

    return {
      ...response.data,
      data: payload
    }
  }

  const getCachedReceiptSettings = () => {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw)
    } catch (error) {
      console.error('Failed to parse cached receipt settings:', error)
      return null
    }
  }

  const saveReceiptSettings = async (payload) => {
    try {
      const response = await axiosInstance.put('/merchant/setting/receipt', payload)
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
      return response.data
    } catch (error) {
      if (error?.response?.status === 404 || error?.response?.status === 405) {
        const fallbackResponse = await axiosInstance.post('/merchant/setting/receipt', payload)
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
        return fallbackResponse.data
      }
      throw error
    }
  }

  return {
    getReceiptSettings,
    getCachedReceiptSettings,
    saveReceiptSettings
  }
}

export default ReceiptService
