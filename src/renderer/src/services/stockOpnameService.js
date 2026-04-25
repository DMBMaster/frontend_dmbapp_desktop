import { useAxiosInstance } from '@renderer/api/axiosInstance'

const StockOpnameService = () => {
  const axiosInstance = useAxiosInstance()

  const getStockOpname = async (params) => {
    try {
      const response = await axiosInstance.get('/product-service/v2/stock-transaction', { params })
      return response.data
    } catch (error) {
      console.warn('⚠️ API failed → Loading stock opname data from cache')
      throw error
    }
  }

  const createStockOpname = async (payload) => {
    try {
      const response = await axiosInstance.post('/product-service/stock-transaction', payload)
      return response.data
    } catch (error) {
      console.warn('⚠️ API failed → Saving stock opname data')
      throw error
    }
  }

  return {
    getStockOpname,
    createStockOpname
  }
}

export default StockOpnameService
