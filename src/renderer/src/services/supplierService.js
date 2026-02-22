import { useAxiosInstance } from '@renderer/api/axiosInstance'

const SupplierService = () => {
  const axiosInstance = useAxiosInstance()

  const getSupplierOrder = async (params) => {
    try {
      const res = await axiosInstance.get('/product-service/v2/stock-transaction', { params })
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading purchase order data from cache')
      throw error
    }
  }

  const getSuplierByOutlet = async (outletId) => {
    try {
      const res = await axiosInstance.get(`/product-service/v2/suplier/outlet/${outletId}`)
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading supplier data from cache')
      throw error
    }
  }

  const createSuplier = async (data) => {
    try {
      const res = await axiosInstance.post(`/product-service/v2/suplier`, data)
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading supplier data from cache')
      throw error
    }
  }

  const updateSuplier = async (id, data) => {
    try {
      const res = await axiosInstance.put(`/product-service/v2/suplier/${id}`, data)
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading supplier data from cache')
      throw error
    }
  }

  const deleteSuplier = async (id) => {
    try {
      const res = await axiosInstance.delete(`/product-service/v2/suplier/${id}`)
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading supplier data from cache')
      throw error
    }
  }

  return {
    getSupplierOrder,
    getSuplierByOutlet,
    createSuplier,
    updateSuplier,
    deleteSuplier
  }
}

export default SupplierService
