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
  const getOutletGuid = () => localStorage.getItem('outletGuid')

  // ============================
  // HELPER: Get from cache
  // ============================
  const getFromCache = async (cacheType, cacheKey) => {
    const outletGuid = getOutletGuid()
    const cached = await localdb.dashboardCache
      .where({ outlet_guid: outletGuid, cache_type: cacheType, cache_key: cacheKey })
      .first()

    if (cached) {
      return {
        status: 'ok',
        status_code: 200,
        message: 'Data dari cache offline',
        error: '',
        data: cached.data,
        offline: true
      }
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
  // GET DASHBOARD SUMMARY
  // ============================
  const getDashboardSummary = async (params) => {
    const cacheKey = `summary_${params?.outletId || 'all'}_${params?.year || 'default'}`

    // Check network status FIRST
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading dashboard summary from cache')
      const cached = await getFromCache('summary', cacheKey)
      if (cached) return cached
      return {
        status: 'ok',
        status_code: 200,
        message: 'Tidak ada data cache',
        error: '',
        data: {},
        offline: true
      }
    }

    try {
      const response = await axiosInstance.get(`/trx-service/v2/dashboard`, { params })

      // Save to cache
      if (response.data?.data) {
        await saveToCache('summary', cacheKey, response.data.data)
      }

      return response.data
    } catch (error) {
      await LoggerService.error(
        'DashboardService.getDashboardSummary',
        'Get dashboard summary failed',
        {
          request: '/dashboard/summary',
          params,
          response: error.response
        }
      )

      // Try cache on error
      // useNetworkStore.getState().setOffline()
      const cached = await getFromCache('summary', cacheKey)
      if (cached) return cached

      throw error
    }
  }

  // ============================
  // GET YEARLY SALES
  // ============================
  const getYearlySales = async (year, outletId) => {
    const cacheKey = `yearly_${year}_${outletId || 'all'}`

    // Check network status FIRST
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading yearly sales from cache')
      const cached = await getFromCache('yearly_sales', cacheKey)
      if (cached) return cached
      return {
        status: 'ok',
        status_code: 200,
        message: 'Tidak ada data cache',
        error: '',
        data: [],
        offline: true
      }
    }

    try {
      const response = await axiosInstance.get(`/dashboard/yearly-sales`, {
        params: { year, outletId }
      })

      // Save to cache
      if (response.data?.data) {
        await saveToCache('yearly_sales', cacheKey, response.data.data)
      }

      return response.data
    } catch (error) {
      await LoggerService.error('DashboardService.getYearlySales', 'Get yearly sales failed', {
        request: '/dashboard/yearly-sales',
        params: { year, outletId },
        response: error.response
      })

      // Try cache on error
      // useNetworkStore.getState().setOffline()
      const cached = await getFromCache('yearly_sales', cacheKey)
      if (cached) return cached

      throw error
    }
  }

  // ============================
  // GET MONTHLY SALES
  // ============================
  const getMonthlySales = async (data) => {
    const cacheKey = `monthly_${JSON.stringify(data)}`

    // Check network status FIRST
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading monthly sales from cache')
      const cached = await getFromCache('monthly_sales', cacheKey)
      if (cached) return cached
      return {
        status: 'ok',
        status_code: 200,
        message: 'Tidak ada data cache',
        error: '',
        data: [],
        offline: true
      }
    }

    try {
      const response = await axiosInstance.post(`/stats/report-month`, data)

      // Save to cache
      if (response.data?.data) {
        await saveToCache('monthly_sales', cacheKey, response.data.data)
      }

      return response.data
    } catch (error) {
      await LoggerService.error('DashboardService.getMonthlySales', 'Get monthly sales failed', {
        request: '/stats/report-month',
        response: error.response
      })

      // Try cache on error
      // useNetworkStore.getState().setOffline()
      const cached = await getFromCache('monthly_sales', cacheKey)
      if (cached) return cached

      throw error
    }
  }

  // ============================
  // GET BOOKING CHANNEL
  // ============================
  const getBookingChannel = async (params) => {
    const cacheKey = `booking_channel_${params?.outletId || 'all'}`

    // Check network status FIRST
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading booking channel from cache')
      const cached = await getFromCache('booking_channel', cacheKey)
      if (cached) return cached
      return {
        status: 'ok',
        status_code: 200,
        message: 'Tidak ada data cache',
        error: '',
        data: [],
        offline: true
      }
    }

    try {
      const response = await axiosInstance.get(`/dashboard/booking-channel`, { params })

      // Save to cache
      if (response.data?.data) {
        await saveToCache('booking_channel', cacheKey, response.data.data)
      }

      return response.data
    } catch (error) {
      await LoggerService.error(
        'DashboardService.getBookingChannel',
        'Get booking channel failed',
        {
          request: '/dashboard/booking-channel',
          params,
          response: error.response
        }
      )

      // Try cache on error
      // useNetworkStore.getState().setOffline()
      const cached = await getFromCache('booking_channel', cacheKey)
      if (cached) return cached

      throw error
    }
  }

  // ============================
  // GET RECENT ACTIVITIES
  // ============================
  const getRecentActivities = async (params) => {
    const cacheKey = `recent_activities_${params?.outletId || 'all'}`

    // Check network status FIRST
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading recent activities from cache')
      const cached = await getFromCache('recent_activities', cacheKey)
      if (cached) return cached
      return {
        status: 'ok',
        status_code: 200,
        message: 'Tidak ada data cache',
        error: '',
        data: [],
        offline: true
      }
    }

    try {
      const response = await axiosInstance.get(`/trx-service/v2/transaction-activity`, { params })

      // Save to cache
      if (response.data?.data) {
        await saveToCache('recent_activities', cacheKey, response.data.data)
      }

      return response.data
    } catch (error) {
      await LoggerService.error(
        'DashboardService.getRecentActivities',
        'Get recent activities failed',
        {
          request: '/dashboard/recent-activities',
          params,
          response: error.response
        }
      )

      // Try cache on error
      // useNetworkStore.getState().setOffline()
      const cached = await getFromCache('recent_activities', cacheKey)
      if (cached) return cached

      throw error
    }
  }

  // ============================
  // GET BOOKING LIST
  // ============================
  const getBookingList = async (params) => {
    const cacheKey = `booking_list_${params?.outletId || 'all'}`

    // Check network status FIRST
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading booking list from cache')
      const cached = await getFromCache('booking_list', cacheKey)
      if (cached) return cached
      return {
        status: 'ok',
        status_code: 200,
        message: 'Tidak ada data cache',
        error: '',
        data: [],
        offline: true
      }
    }

    try {
      const response = await axiosInstance.get(`/dashboard/booking-list`, { params })

      // Save to cache
      if (response.data?.data) {
        await saveToCache('booking_list', cacheKey, response.data.data)
      }

      return response.data
    } catch (error) {
      await LoggerService.error('DashboardService.getBookingList', 'Get booking list failed', {
        request: '/dashboard/booking-list',
        params,
        response: error.response
      })

      // Try cache on error
      // useNetworkStore.getState().setOffline()
      const cached = await getFromCache('booking_list', cacheKey)
      if (cached) return cached

      throw error
    }
  }

  return {
    getDashboardSummary,
    getYearlySales,
    getMonthlySales,
    getBookingChannel,
    getRecentActivities,
    getBookingList
  }
}

export default DashboardService
