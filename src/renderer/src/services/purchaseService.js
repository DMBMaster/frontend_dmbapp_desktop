import { useAxiosInstance } from '@renderer/api/axiosInstance'

const PurchaseService = () => {
  const axiosInstance = useAxiosInstance()

  const getPreOrders = async (params) => {
    try {
      const res = await axiosInstance.get('/product-service/pre-order', { params })
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading pre-orders from cache')
      throw error
    }
  }

  const getDetailPreOrder = async (id) => {
    try {
      const res = await axiosInstance.get(`/product-service/pre-order/${id}`)
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading pre-orders from cache')
      throw error
    }
  }

  const createPreOrders = async (data) => {
    try {
      const res = await axiosInstance.post('/product-service/pre-order', data)
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading pre-orders from cache')
      throw error
    }
  }

  const deletePreOrders = async (id) => {
    try {
      const res = await axiosInstance.delete(`/product-service/pre-order/${id}`)
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading pre-orders from cache')
      throw error
    }
  }

  const updatePreOrders = async (id, data) => {
    try {
      const res = await axiosInstance.put(`/product-service/pre-order/${id}`, data)
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading pre-orders from cache')
      throw error
    }
  }

  const rejectPreOrder = async (id, data) => {
    try {
      const res = await axiosInstance.post(`/product-service/pre-order/2/${id}`, data)
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading pre-orders from cache')
      throw error
    }
  }

  const approvePreOrder = async (id) => {
    try {
      const res = await axiosInstance.post(`/product-service/pre-order/1/${id}`, {})
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading pre-orders from cache')
      throw error
    }
  }

  return {
    getPreOrders,
    getDetailPreOrder,
    createPreOrders,
    updatePreOrders,
    rejectPreOrder,
    approvePreOrder,
    deletePreOrders
  }
}

export default PurchaseService
