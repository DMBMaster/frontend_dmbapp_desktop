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

  const getPurchaseOrder = async (params) => {
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

  const getPreOrdersByOutlet = async (outletId, params) => {
    try {
      const res = await axiosInstance.get(`/product-service/pre-order/outlet/${outletId}`, {
        params
      })
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading pre-orders data from cache')
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

  const createPurchaseOrder = async (data) => {
    try {
      const res = await axiosInstance.post('/product-service/stock-transaction', data)
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading purchase order from cache')
      throw error
    }
  }

  const getStockRotation = async (params) => {
    try {
      const res = await axiosInstance.get('product-service/stock-transaction/daftar-stock', {
        params
      })
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading stock rotation data from cache')
      throw error
    }
  }

  const getStockMovement = async (params) => {
    try {
      const res = await axiosInstance.get('product-service/stock-transaction-move', {
        params
      })
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading stock movement data from cache')
      throw error
    }
  }

  const exportStockRotation = async (params) => {
    try {
      const res = await axiosInstance.post(
        'product-service/export-stock-transaction',
        {
          params
        },
        {
          responseType: 'blob'
        }
      )
      const responseData = res.data
      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading stock rotation data from cache')
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
    deletePreOrders,
    getPurchaseOrder,
    getSuplierByOutlet,
    getPreOrdersByOutlet,
    createPurchaseOrder,
    getStockRotation,
    exportStockRotation,
    getStockMovement
  }
}

export default PurchaseService
