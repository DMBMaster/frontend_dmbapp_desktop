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
const FrontofficeService = () => {
  const axiosInstance = useAxiosInstance()
  const getOutletGuid = () => localStorage.getItem('outletGuid') || ''
  const getToken = () => localStorage.getItem('token') || ''

  // ============================
  // HELPER: Get from cache
  // ============================
  const getFromCache = async (cacheType, cacheKey) => {
    const outletGuid = getOutletGuid()
    const cached = await localdb.dashboardCache
      .where({ outlet_guid: outletGuid, cache_type: cacheType, cache_key: cacheKey })
      .first()

    if (cached) {
      return { data: cached.data, offline: true }
    }
    return null
  }

  // ============================
  // HELPER: Save to cache
  // ============================
  const saveToCache = async (cacheType, cacheKey, data) => {
    const outletGuid = getOutletGuid()

    const existing = await localdb.dashboardCache
      .where({ outlet_guid: outletGuid, cache_type: cacheType, cache_key: cacheKey })
      .toArray()

    for (const item of existing) {
      if (item.id) {
        await localdb.dashboardCache.delete(item.id)
      }
    }

    await localdb.dashboardCache.add({
      outlet_guid: outletGuid,
      cache_type: cacheType,
      cache_key: cacheKey,
      data: data,
      updated_at: new Date().toISOString()
    })
  }

  // ============================
  // GET FORECAST
  // ============================
  const getForecast = async (params = {}) => {
    if (!isOnline()) {
      console.log('📴 Offline → Loading forecast from cache')
      const cached = await getFromCache('fo_forecast', 'default')
      return cached || { data: { occupancy: 0, room_nights: 0, adr: 0, revPar: 0, revenue: 0 } }
    }

    try {
      const res = await axiosInstance.get('/trx-service/v2/dashboard', {
        params: {
          outlet_id: getOutletGuid(),
          ...params
        }
      })

      const data = res.data?.data || res.data
      await saveToCache('fo_forecast', 'default', data)
      return { data }
    } catch (error) {
      console.warn('⚠️ API failed → Loading forecast from cache')
      const cached = await getFromCache('fo_forecast', 'default')
      if (cached) return cached
      throw error
    }
  }

  // ============================
  // GET RESERVATIONS (Arrivals / Departures / Stayovers / In-House)
  // ============================
  const getReservations = async (params = {}) => {
    const cacheKey = `${params.status || 'all'}_${params.start_date || ''}_${params.end_date || ''}_${params.page || 1}`

    if (!isOnline()) {
      console.log('📴 Offline → Loading reservations from cache')
      const cached = await getFromCache('fo_reservations', cacheKey)
      return cached || { data: [], total: 0, page: 1, page_count: 1 }
    }

    try {
      const res = await axiosInstance.get('/trx-service/v3/history-transaction', {
        params: {
          outlet_id: getOutletGuid(),
          ...params
        }
      })

      const responseData = res.data
      await saveToCache('fo_reservations', cacheKey, responseData)
      return { data: responseData }
    } catch (error) {
      console.warn('⚠️ API failed → Loading reservations from cache')
      const cached = await getFromCache('fo_reservations', cacheKey)
      if (cached) return cached
      throw error
    }
  }

  // ============================
  // GET RESERVATION DETAIL
  // ============================
  const getReservationDetail = async (guid) => {
    if (!isOnline()) {
      console.log('📴 Offline → Loading reservation detail from cache')
      const cached = await getFromCache('fo_reservation_detail', guid)
      return cached || { data: null }
    }

    try {
      const res = await axiosInstance.get(`/trx-service/v3/history-transaction/${guid}`)
      const data = res.data?.data || res.data
      await saveToCache('fo_reservation_detail', guid, data)
      return { data }
    } catch (error) {
      console.warn('⚠️ API failed → Loading reservation detail from cache')
      const cached = await getFromCache('fo_reservation_detail', guid)
      if (cached) return cached
      throw error
    }
  }

  // ============================
  // GET ROOMS
  // ============================
  const getRooms = async (params = {}) => {
    if (!isOnline()) {
      console.log('📴 Offline → Loading rooms from cache')
      const cached = await getFromCache('fo_rooms', 'default')
      return cached || { data: [] }
    }

    try {
      const res = await axiosInstance.get('/product-service/v2/rooms', {
        params: {
          outlet_id: getOutletGuid(),
          status_id: 6,
          ...params
        }
      })

      const data = res.data?.data || []
      await saveToCache('fo_rooms', 'default', data)
      return { data }
    } catch (error) {
      console.warn('⚠️ API failed → Loading rooms from cache')
      const cached = await getFromCache('fo_rooms', 'default')
      if (cached) return cached
      throw error
    }
  }

  // ============================
  // GET CUSTOMERS
  // ============================
  const getCustomers = async () => {
    if (!isOnline()) {
      console.log('📴 Offline → Loading customers from cache')
      const cached = await getFromCache('fo_customers', 'default')
      return cached || { data: [] }
    }

    try {
      const res = await axiosInstance.get('/merchant/customer', {
        params: { outlet_id: getOutletGuid() }
      })

      const data = res.data?.data || []
      await saveToCache('fo_customers', 'default', data)
      return { data }
    } catch (error) {
      console.warn('⚠️ API failed → Loading customers from cache')
      const cached = await getFromCache('fo_customers', 'default')
      if (cached) return cached
      throw error
    }
  }

  // ============================
  // CHECK-IN
  // ============================
  const checkIn = async (guid, payload) => {
    const res = await axiosInstance.put(`/trx-service/ticket/check-in/${guid}`, payload, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    })
    return res.data
  }

  // ============================
  // CHECK-OUT
  // ============================
  const checkOut = async (guid, payload) => {
    const res = await axiosInstance.put(`/trx-service/ticket/check-out/${guid}`, payload, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    })
    return res.data
  }

  return {
    getForecast,
    getReservations,
    getReservationDetail,
    getRooms,
    getCustomers,
    checkIn,
    checkOut
  }
}

export default FrontofficeService
