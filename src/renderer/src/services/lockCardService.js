import { useAxiosInstanceCM } from '@renderer/api/axiosInstanceCM'

const LockCardService = () => {
  const axiosInstance = useAxiosInstanceCM()

  // Payload dinamis (JSON) — backend belum ada, kirim apa adanya sesuai action.
  const logActivity = async (payload) => {
    try {
      const res = await axiosInstance.post('/lock-card/log', payload)
      return res.data
    } catch (error) {
      console.error('Failed to log lock card activity:', error)
      throw error
    }
  }

  return {
    logActivity
  }
}

export default LockCardService
