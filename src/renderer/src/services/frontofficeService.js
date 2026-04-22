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
  const buildCacheKey = (params = {}) =>
    JSON.stringify(
      Object.keys(params)
        .sort()
        .reduce((accumulator, key) => {
          accumulator[key] = params[key]
          return accumulator
        }, {})
    )

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
      const res = await axiosInstance.get('/trx-service/v2/hotel/metrics', { params })

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
  // GET FRONT OFFICE DASHBOARD STATS
  // ============================
  const getFoDashboardStats = async (params = {}) => {
    const requestParams = {
      outlet_id: getOutletGuid(),
      ...params
    }
    const cacheKey = buildCacheKey(requestParams)

    if (!isOnline()) {
      console.log('📴 Offline → Loading front office stats from cache')
      const cached = await getFromCache('fo_dashboard_stats', cacheKey)
      return (
        cached || {
          data: {
            reservations: 0,
            arrivals: 0,
            departures: 0,
            in_house: 0,
            pending: 0,
            cancelled: 0,
            total: 0
          }
        }
      )
    }

    try {
      const res = await axiosInstance.get('/merchant/fo-dashboard/stats', {
        params: requestParams
      })

      const data = res.data?.data || res.data || {}
      await saveToCache('fo_dashboard_stats', cacheKey, data)
      return { data }
    } catch (error) {
      console.warn('⚠️ API failed → Loading front office stats from cache')
      const cached = await getFromCache('fo_dashboard_stats', cacheKey)
      if (cached) return cached
      throw error
    }
  }

  // ============================
  // GET FRONT OFFICE DASHBOARD BOOKINGS
  // ============================
  const getFoDashboardBookings = async (params = {}) => {
    const requestParams = {
      outlet_id: getOutletGuid(),
      ...params
    }
    const cacheKey = buildCacheKey(requestParams)

    if (!isOnline()) {
      console.log('📴 Offline → Loading front office bookings from cache')
      const cached = await getFromCache('fo_dashboard_bookings', cacheKey)
      return cached || { data: [], pagination: { current_page: 1, total_pages: 1 } }
    }

    try {
      const res = await axiosInstance.get('/merchant/fo-dashboard/bookings', {
        params: requestParams
      })

      const data = res.data || {}
      await saveToCache('fo_dashboard_bookings', cacheKey, data)
      return { data }
    } catch (error) {
      console.warn('⚠️ API failed → Loading front office bookings from cache')
      const cached = await getFromCache('fo_dashboard_bookings', cacheKey)
      if (cached) return cached
      throw error
    }
  }

  // ============================
  // GET RESERVATIONS (Arrivals / Departures / Stayovers / In-House)
  // ============================
  const getReservations = async (params = {}) => {
    const requestParams = {
      outlet_id: getOutletGuid(),
      ...params
    }
    const cacheKey = buildCacheKey(requestParams)

    if (!isOnline()) {
      console.log('📴 Offline → Loading reservations from cache')
      const cached = await getFromCache('fo_reservations', cacheKey)
      return cached || { data: [], total: 0, page: 1, page_count: 1 }
    }

    try {
      const filter = requestParams.filter || 'arrivals'
      const { filter: _ignoredFilter, ...queryParams } = requestParams

      const res = await axiosInstance.get(`/trx-service/v2/property?filter=${filter}`, {
        params: queryParams
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
  // GET AVAILABLE ROOMS COUNT
  // ============================
  const getAvailableRoomsCount = async () => {
    if (!isOnline()) {
      console.log('📴 Offline → Loading available rooms count from cache')
      const cached = await getFromCache('fo_available_count', 'default')
      return cached || { data: { count: 0 } }
    }

    try {
      const outletGuid = getOutletGuid()
      const res = await axiosInstance.get(`/product-service/rooms-count/outlet/${outletGuid}`)

      const data = res.data
      await saveToCache('fo_available_count', 'default', data)
      return { data }
    } catch (error) {
      console.warn('⚠️ API failed → Loading available rooms count from cache')
      const cached = await getFromCache('fo_available_count', 'default')
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
    getFoDashboardStats,
    getFoDashboardBookings,
    getReservations,
    getReservationDetail,
    getRooms,
    getCustomers,
    getAvailableRoomsCount,
    checkIn,
    checkOut
  }
}

export default FrontofficeService
