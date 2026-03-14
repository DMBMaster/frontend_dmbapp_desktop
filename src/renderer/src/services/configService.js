import { useAxiosInstance } from '@renderer/api/axiosInstance'

const ConfigService = () => {
  const axiosInstance = useAxiosInstance()

  const checkSessionCashier = async (id, userId) => {
    try {
      const res = await axiosInstance.get(`/trx-service/outlet-session/check/${id}/user/${userId}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const closeCashier = async (data) => {
    try {
      const res = await axiosInstance.put(`/trx-service/outlet-session/closed`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const openCashier = async (data) => {
    try {
      const res = await axiosInstance.post(`/trx-service/outlet-session`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  return {
    checkSessionCashier,
    closeCashier,
    openCashier
  }
}

export default ConfigService
