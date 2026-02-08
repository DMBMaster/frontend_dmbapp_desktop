import { LoggerService } from './loggerService'
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
const DashboardService = () => {
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

    // Delete existing cache for this type and key
    const existing = await localdb.dashboardCache
      .where({ outlet_guid: outletGuid, cache_type: cacheType, cache_key: cacheKey })
      .toArray()

    for (const item of existing) {
      if (item.id) {
        await localdb.dashboardCache.delete(item.id)
      }
    }

    // Add new cache
    await localdb.dashboardCache.add({
      outlet_guid: outletGuid,
      cache_type: cacheType,
      cache_key: cacheKey,
      data: data,
      updated_at: new Date().toISOString()
    })
  }

  // ============================
  // GET OUTLETS
  // ============================
  const getOutlets = async () => {
    const userId = localStorage.getItem('userId') || ''
    const cacheKey = `outlets_${userId}`

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading outlets from cache')
      const cached = await getFromCache('outlets', cacheKey)
      if (cached) return cached
      // Fallback to localStorage
      const stored = localStorage.getItem('outlets')
      return { data: stored ? JSON.parse(stored) : [], offline: true }
    }

    try {
      const response = await axiosInstance.get(`/user-service/me/outlets`, {
        params: { user_id: userId },
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      })

      const data = response.data

      // Save to localStorage (legacy) and cache
      localStorage.setItem('outlets', JSON.stringify(data))
      await saveToCache('outlets', cacheKey, data)

      return { data }
    } catch (error) {
      await LoggerService.error('DashboardService.getOutlets', 'Get outlets failed', {
        response: error.response
      })
      const cached = await getFromCache('outlets', cacheKey)
      if (cached) return cached
      const stored = localStorage.getItem('outlets')
      return { data: stored ? JSON.parse(stored) : [] }
    }
  }

  // ============================
  // GET DASHBOARD SUMMARY
  // ============================
  const getDashboardSummary = async (params = {}) => {
    const cacheKey = `summary_${params?.outlet_id || 'all'}`

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading dashboard summary from cache')
      const cached = await getFromCache('summary', cacheKey)
      if (cached) return cached
      return { data: {}, offline: true }
    }

    try {
      const response = await axiosInstance.get(`/trx-service/v2/dashboard`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        },
        params
      })

      const data = response.data?.data || {}
      await saveToCache('summary', cacheKey, data)

      return { data }
    } catch (error) {
      await LoggerService.error(
        'DashboardService.getDashboardSummary',
        'Get dashboard summary failed',
        { params, response: error.response }
      )
      const cached = await getFromCache('summary', cacheKey)
      if (cached) return cached
      throw error
    }
  }

  // ============================
  // GET RECENT ACTIVITIES
  // ============================
  const getRecentActivities = async (params = {}) => {
    const cacheKey = `recent_activities_${params?.outlet_id || 'all'}`

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading recent activities from cache')
      const cached = await getFromCache('recent_activities', cacheKey)
      if (cached) return cached
      return { data: [], offline: true }
    }

    try {
      const response = await axiosInstance.get(`/trx-service/v2/transaction-activity`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        },
        params
      })

      const data = response.data?.data || []
      await saveToCache('recent_activities', cacheKey, data)

      return { data }
    } catch (error) {
      await LoggerService.error(
        'DashboardService.getRecentActivities',
        'Get recent activities failed',
        { params, response: error.response }
      )
      const cached = await getFromCache('recent_activities', cacheKey)
      if (cached) return cached
      throw error
    }
  }

  // ============================
  // GET BOOKING LIST
  // ============================
  const getBookingList = async (params = {}) => {
    const cacheKey = `booking_list_${params?.outlet_id || 'all'}`

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading booking list from cache')
      const cached = await getFromCache('booking_list', cacheKey)
      if (cached) return cached
      return { data: [], offline: true }
    }

    try {
      const response = await axiosInstance.get(`/trx-service/v3/history-transaction`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        },
        params
      })

      const data = response.data?.data || []
      await saveToCache('booking_list', cacheKey, data)

      return { data }
    } catch (error) {
      await LoggerService.error('DashboardService.getBookingList', 'Get booking list failed', {
        params,
        response: error.response
      })
      const cached = await getFromCache('booking_list', cacheKey)
      if (cached) return cached
      throw error
    }
  }

  // ============================
  // GET BOOKING CHANNEL
  // ============================
  const getBookingChannel = async (params = {}) => {
    const cacheKey = `booking_channel_${params?.outlet_id || 'all'}`

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading booking channel from cache')
      const cached = await getFromCache('booking_channel', cacheKey)
      if (cached) return cached
      return { data: [], offline: true }
    }

    try {
      const response = await axiosInstance.get(`/trx-service/reports/group-by-channel`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        },
        params
      })

      const data = response.data?.data || []
      await saveToCache('booking_channel', cacheKey, data)

      return { data }
    } catch (error) {
      await LoggerService.error(
        'DashboardService.getBookingChannel',
        'Get booking channel failed',
        { params, response: error.response }
      )
      const cached = await getFromCache('booking_channel', cacheKey)
      if (cached) return cached
      throw error
    }
  }

  // ============================
  // GET YEARLY SALES
  // ============================
  const getYearlySales = async (body = {}) => {
    const cacheKey = `yearly_${body?.year || 'default'}_${body?.merchant_id || 'all'}`

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading yearly sales from cache')
      const cached = await getFromCache('yearly_sales', cacheKey)
      if (cached) return cached
      return { data: [], offline: true }
    }

    try {
      const response = await axiosInstance.post(`/stats/report-year`, body, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      })

      const data = response.data?.data || []
      await saveToCache('yearly_sales', cacheKey, data)

      return { data }
    } catch (error) {
      await LoggerService.error('DashboardService.getYearlySales', 'Get yearly sales failed', {
        body,
        response: error.response
      })
      const cached = await getFromCache('yearly_sales', cacheKey)
      if (cached) return cached
      throw error
    }
  }

  // ============================
  // GET MONTHLY SALES
  // ============================
  const getMonthlySales = async (body = {}) => {
    const cacheKey = `monthly_${body?.year || 'default'}_${body?.month || 'default'}_${body?.merchant_id || 'all'}`

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading monthly sales from cache')
      const cached = await getFromCache('monthly_sales', cacheKey)
      if (cached) return cached
      return { data: [], offline: true }
    }

    try {
      const response = await axiosInstance.post(`/stats/report-month`, body, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      })

      const data = response.data?.data || []
      await saveToCache('monthly_sales', cacheKey, data)

      return { data }
    } catch (error) {
      await LoggerService.error('DashboardService.getMonthlySales', 'Get monthly sales failed', {
        body,
        response: error.response
      })
      const cached = await getFromCache('monthly_sales', cacheKey)
      if (cached) return cached
      throw error
    }
  }

  return {
    getOutlets,
    getDashboardSummary,
    getRecentActivities,
    getBookingList,
    getBookingChannel,
    getYearlySales,
    getMonthlySales
  }
}

export default DashboardService
