import { useAxiosInstance } from '@renderer/api/axiosInstance'
import { localdb } from '@renderer/config/localdb'
import { useNetworkStore } from '@renderer/store/networkStore'

// ================================
// HELPER: Check if online from Zustand store
// ================================
const isOnline = () => useNetworkStore.getState().isOnline

// ================================
// SERVICE IMPLEMENTATION
// ================================
const RatePlanService = () => {
  const axiosInstance = useAxiosInstance()
  const getOutletGuid = () => localStorage.getItem('outletGuid')

  // ============================
  // GET RATE PLANS
  // ============================
  const getRatePlans = async (params) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading rate plans from cache directly')
      return getRatePlansFromCache(outletGuid)
    }

    try {
      const res = await axiosInstance.get('/product-service/rate-plan', { params })
      const responseData = res.data

      if (Array.isArray(responseData?.data)) {
        await localdb.ratePlans.where({ outlet_guid: outletGuid }).delete()
        await localdb.ratePlans.bulkAdd(
          responseData.data.map((rp) => ({
            outlet_guid: outletGuid,
            rate_plan_id: rp.guid || rp.id,
            data: rp,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading rate plans from cache')
      return getRatePlansFromCache(outletGuid, error)
    }
  }

  const getRatePlansFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.ratePlans.where({ outlet_guid: outletGuid }).toArray()

    if (!cached?.length) {
      if (originalError) throw originalError
      return {
        status: 'ok',
        status_code: 200,
        message: 'Tidak ada data cache',
        error: '',
        data: [],
        offline: true
      }
    }

    return {
      status: 'ok',
      status_code: 200,
      message: 'Data dari cache offline',
      error: '',
      data: cached.map((c) => c.data),
      offline: true
    }
  }

  // ============================
  // CREATE RATE PLAN
  // ============================
  const createRatePlan = async (data) => {
    try {
      const res = await axiosInstance.post('/product-service/rate-plan', data)
      return res.data
    } catch (error) {
      console.error('Error creating rate plan:', error)
      throw error
    }
  }

  // ============================
  // UPDATE RATE PLAN
  // ============================
  const updateRatePlan = async (id, data) => {
    try {
      const res = await axiosInstance.put(`/product-service/rate-plan/${id}`, data)
      return res.data
    } catch (error) {
      console.error('Error updating rate plan:', error)
      throw error
    }
  }

  // ============================
  // DELETE RATE PLAN
  // ============================
  const deleteRatePlan = async (id) => {
    try {
      const res = await axiosInstance.delete(`/product-service/rate-plan/${id}`)
      return res.data
    } catch (error) {
      console.error('Error deleting rate plan:', error)
      throw error
    }
  }

  // ============================
  // GET PRODUCTS FOR SELECT
  // ============================
  const getProductsForSelect = async (params) => {
    try {
      const res = await axiosInstance.get('/product-service/v2/products-has-rooms', { params })
      return res.data
    } catch (error) {
      console.error('Error fetching products for select:', error)
      throw error
    }
  }

  // ============================
  // GET CANCEL POLICIES
  // ============================
  const getCancelPolicies = async () => {
    try {
      const res = await axiosInstance.get('/booking-service/cancel-policy', {
        params: { outlet_id: getOutletGuid() }
      })
      return res.data
    } catch (error) {
      console.error('Error fetching cancel policies:', error)
      throw error
    }
  }

  return {
    getRatePlans,
    createRatePlan,
    updateRatePlan,
    deleteRatePlan,
    getProductsForSelect,
    getCancelPolicies
  }
}

export default RatePlanService
