import { useAxiosInstance } from '@renderer/api/axiosInstance'
import { localdb } from '@renderer/config/localdb'
import { useNetworkStore } from '@renderer/store/networkStore'

// ================================
// INSTORE INTERFACES
// ================================
export const IInstoreRoom = {
  // roomType: string
  // roomNumber: string
  // ratePlan: string
  // guest: number
  // price: number
}

export const IInstorePayload = {
  // outlet_id: string
  // reservation_name: string
  // guest_phone?: string
  // guest_email?: string
  // check_in: string
  // check_out: string
  // rooms: IInstoreRoom[]
  // notes?: string
  // discount_type?: string
  // discount_amount?: number
  // payment_method?: string
  // sub_total: number
  // grand_total: number
  // reference_number?: string
  // sender_name?: string
  // bank_recipient?: string
  // attachment_url?: string
  // card_type?: string
  // approval_code?: string
  // trace_number?: string
}

// ================================
// HELPER: Check if online from Zustand store
// ================================
const isOnline = () => useNetworkStore.getState().isOnline

// ================================
// SERVICE IMPLEMENTATION
// ================================
const InstoreService = () => {
  const axiosInstance = useAxiosInstance()
  const getOutletGuid = () => localStorage.getItem('outletGuid')
  const getToken = () => localStorage.getItem('token')

  // ============================
  // GET CUSTOMERS
  // ============================
  const getCustomers = async (params) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading customers from cache directly')
      return getCustomersFromCache(outletGuid)
    }

    try {
      const response = await axiosInstance.get('/merchant/customer', {
        params: {
          outlet_id: getOutletGuid(),
          ...params
        },
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      })
      const responseData = response.data

      // Cache ke Dexie
      if (Array.isArray(responseData?.data)) {
        await localdb.customers.where({ outlet_guid: outletGuid }).delete()
        await localdb.customers.bulkAdd(
          responseData.data.map((customer) => ({
            outlet_guid: outletGuid,
            customer_id: customer.guid || customer.id,
            data: customer,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading customers from cache')
      return getCustomersFromCache(outletGuid, error)
    }
  }

  // Helper: Get customers from cache
  const getCustomersFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.customers.where({ outlet_guid: outletGuid }).toArray()

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
  // GET ROOMS
  // ============================
  const getRooms = async (params) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading rooms from cache directly')
      return getRoomsFromCache(outletGuid)
    }

    try {
      const response = await axiosInstance.get('/product-service/v2/rooms', {
        params: {
          outlet_id: getOutletGuid(),
          ...params
        },
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      })
      const responseData = response.data

      // Cache ke Dexie
      if (Array.isArray(responseData?.data)) {
        await localdb.rooms.where({ outlet_guid: outletGuid }).delete()
        await localdb.rooms.bulkAdd(
          responseData.data.map((room) => ({
            outlet_guid: outletGuid,
            room_id: room.guid || room.id,
            data: room,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading rooms from cache')
      return getRoomsFromCache(outletGuid, error)
    }
  }

  // Helper: Get rooms from cache
  const getRoomsFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.rooms.where({ outlet_guid: outletGuid }).toArray()

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
  // GET RATE PLANS
  // ============================
  const getRatePlans = async (params) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading rate plans from cache directly')
      return getRatePlansFromCache(outletGuid)
    }

    try {
      const response = await axiosInstance.get('/get-rate-plan', {
        params: {
          outlet_id: getOutletGuid(),
          ...params
        },
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      })
      const responseData = response.data

      // Cache ke Dexie
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

  // Helper: Get rate plans from cache
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
  // GET PAYMENT METHODS
  // ============================
  const getPaymentMethods = async () => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading payment methods from cache directly')
      return getPaymentMethodsFromCache(outletGuid)
    }

    try {
      const response = await axiosInstance.get('/payment-service/list-payment', {
        params: {
          outlet_id: getOutletGuid()
        },
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      })
      const responseData = response.data

      // Cache ke Dexie
      if (Array.isArray(responseData?.data)) {
        await localdb.paymentMethods.where({ outlet_guid: outletGuid }).delete()
        await localdb.paymentMethods.bulkAdd(
          responseData.data.map((pm) => ({
            outlet_guid: outletGuid,
            payment_id: pm.guid || pm.id,
            data: pm,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading payment methods from cache')
      return getPaymentMethodsFromCache(outletGuid, error)
    }
  }

  // Helper: Get payment methods from cache
  const getPaymentMethodsFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.paymentMethods.where({ outlet_guid: outletGuid }).toArray()

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
  // GET ROOM TYPES
  // ============================
  const getRoomTypes = async (params) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading room types from cache directly')
      return getRoomTypesFromCache(outletGuid)
    }

    try {
      const response = await axiosInstance.get('/product-service/v2/products-has-rooms', {
        params: {
          outlet_id: getOutletGuid(),
          ...params
        },
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      })
      const responseData = response.data

      // Cache ke Dexie
      if (Array.isArray(responseData?.data)) {
        await localdb.roomTypes.where({ outlet_guid: outletGuid }).delete()
        await localdb.roomTypes.bulkAdd(
          responseData.data.map((rt) => ({
            outlet_guid: outletGuid,
            room_type_id: rt.guid || rt.id,
            data: rt,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading room types from cache')
      return getRoomTypesFromCache(outletGuid, error)
    }
  }

  // Helper: Get room types from cache
  const getRoomTypesFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.roomTypes.where({ outlet_guid: outletGuid }).toArray()

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
  // GET RATE PLANS FROM SERVICE (POST)
  // ============================
  const getRatePlansFromService = async (params) => {
    if (!isOnline()) {
      console.log('📴 Offline detected → Rate plans from service not available offline')
      const outletGuid = getOutletGuid()
      return getRatePlansFromCache(outletGuid)
    }

    try {
      const response = await axiosInstance.post('/get-rate-plan', params, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching rate plans from service:', error)
      throw error
    }
  }

  // ============================
  // CREATE INSTORE RESERVATION
  // ============================
  const createReservation = async (payload) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      // Queue for later sync when offline
      await localdb.pendingReservations.add({
        outlet_guid: outletGuid,
        payload: payload,
        created_at: new Date().toISOString(),
        synced: false
      })

      return {
        status: 'ok',
        status_code: 200,
        message: 'Reservasi disimpan offline. Akan disinkronkan saat online.',
        error: '',
        data: {
          guid: `offline-${Date.now()}`,
          ...payload
        },
        offline: true
      }
    }

    try {
      const response = await axiosInstance.post('/booking-service/instore-reservation', payload, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Error creating reservation:', error)
      throw error
    }
  }

  // ============================
  // CREATE WALK-IN TRANSACTION
  // ============================
  const createWalkInTransaction = async (payload) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Walk-in transaksi tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    try {
      const response = await axiosInstance.post('/merchant/new-transaction', payload, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error creating walk-in transaction:', error)
      throw error
    }
  }

  // ============================
  // GET ROOM AVAILABILITY
  // ============================
  const getRoomAvailability = async (checkIn, checkOut, roomType) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Ketersediaan kamar tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    try {
      const response = await axiosInstance.get('/product-service/room-availability', {
        params: {
          outlet_id: getOutletGuid(),
          check_in: checkIn,
          check_out: checkOut,
          room_type: roomType
        },
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Error checking room availability:', error)
      throw error
    }
  }

  // ============================
  // GET ROOM NUMBERS
  // ============================
  const getRoomNumbers = async (roomType, checkIn, checkOut) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Nomor kamar tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    try {
      const response = await axiosInstance.get('/product-service/rooms', {
        params: {
          product_id: roomType,
          available: true,
          check_in: checkIn,
          check_out: checkOut
        },
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch room numbers:', error)
      throw error
    }
  }

  // ============================
  // SYNC PENDING RESERVATIONS
  // ============================
  const syncPendingReservations = async () => {
    if (!isOnline()) return { synced: 0, failed: 0 }

    let synced = 0
    let failed = 0

    const pendingReservations = await localdb.pendingReservations
      .where('synced')
      .equals(false)
      .toArray()

    for (const reservation of pendingReservations) {
      try {
        await createReservation(reservation.payload)
        await localdb.pendingReservations.update(reservation.id, { synced: true })
        synced++
      } catch (error) {
        console.error('Failed to sync reservation:', reservation.id, error)
        failed++
      }
    }

    return { synced, failed }
  }

  // ============================
  // GET PENDING COUNT
  // ============================
  const getPendingCount = async () => {
    const outletGuid = getOutletGuid()
    const allPending = await localdb.pendingReservations.toArray()
    return allPending.filter((p) => p.outlet_guid === outletGuid && p.synced === false).length
  }

  // ============================
  // CLEAR CACHE
  // ============================
  const clearCache = async () => {
    const outletGuid = getOutletGuid()
    if (outletGuid) {
      await Promise.all([
        localdb.customers.where({ outlet_guid: outletGuid }).delete(),
        localdb.rooms.where({ outlet_guid: outletGuid }).delete(),
        localdb.roomTypes.where({ outlet_guid: outletGuid }).delete(),
        localdb.ratePlans.where({ outlet_guid: outletGuid }).delete(),
        localdb.paymentMethods.where({ outlet_guid: outletGuid }).delete()
      ])
    }
  }

  return {
    getCustomers,
    getRooms,
    getRoomTypes,
    getRatePlans,
    getRatePlansFromService,
    getPaymentMethods,
    createReservation,
    createWalkInTransaction,
    getRoomAvailability,
    getRoomNumbers,
    syncPendingReservations,
    getPendingCount,
    clearCache
  }
}

export default InstoreService
