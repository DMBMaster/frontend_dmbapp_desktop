import { useAxiosInstance } from '@renderer/api/axiosInstance'
import { useNetworkStore } from '@renderer/store/networkStore'

const isOnline = () => useNetworkStore.getState().isOnline

const MediaService = () => {
  const axiosInstance = useAxiosInstance()

  const uploadReceipt = async (file) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Upload receipt tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    const formData = new FormData()
    formData.append('files', file)

    const response = await axiosInstance.post('/media-service/upload/receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return {
      url: response.data.data.download.actual,
      filename: file.name
    }
  }
  return {
    uploadReceipt
  }
}

export default MediaService
