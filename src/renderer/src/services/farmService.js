import { useAxiosInstanceB } from '@renderer/api/axiosInstanceB'

const FarmService = () => {
  const axiosInstance = useAxiosInstanceB()

  const importAllFarm = async (formData) => {
    try {
      const response = await axiosInstance.post(`/livestock/upload-all`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.warn('⚠️ API failed → Import farm data')
      throw error
    }
  }

  const getAllFarmAyamKampung = async (params = {}) => {
    try {
      const response = await axiosInstance.get(`/livestock/ayam-kampung`, {
        headers: {
          'Content-Type': 'application/json'
        },
        params
      })
      return response.data
    } catch (error) {
      console.warn('⚠️ API failed → Import farm data')
      throw error
    }
  }

  const getAllFarmAyamPedaging = async (params = {}) => {
    try {
      const response = await axiosInstance.get(`/livestock/ayam-pedaging`, {
        headers: {
          'Content-Type': 'application/json'
        },
        params
      })
      return response.data
    } catch (error) {
      console.warn('⚠️ API failed → Import farm data')
      throw error
    }
  }

  const getAllFarmAyamPetelur = async (params = {}) => {
    try {
      const response = await axiosInstance.get(`/livestock/ayam-petelur`, {
        headers: {
          'Content-Type': 'application/json'
        },
        params
      })
      return response.data
    } catch (error) {
      console.warn('⚠️ API failed → Import farm data')
      throw error
    }
  }

  const getAllFarmLele = async (params = {}) => {
    try {
      const response = await axiosInstance.get(`/livestock/lele`, {
        headers: {
          'Content-Type': 'application/json'
        },
        params
      })
      return response.data
    } catch (error) {
      console.warn('⚠️ API failed → Import farm data')
      throw error
    }
  }

  const getAllFarmPinahan = async (params = {}) => {
    try {
      const response = await axiosInstance.get(`/livestock/pinahan`, {
        headers: {
          'Content-Type': 'application/json'
        },
        params
      })
      return response.data
    } catch (error) {
      console.warn('⚠️ API failed → Import farm data')
      throw error
    }
  }

  return {
    importAllFarm,
    getAllFarmAyamKampung,
    getAllFarmAyamPedaging,
    getAllFarmAyamPetelur,
    getAllFarmLele,
    getAllFarmPinahan
  }
}

export default FarmService
