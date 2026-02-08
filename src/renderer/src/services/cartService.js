import { useAxiosInstance } from '@renderer/api/axiosInstance'
import { localdb } from '@renderer/config/localdb'
import { useNetworkStore } from '@renderer/store/networkStore'

// ================================
// HELPER: Check if online from Zustand store
// ================================
const isOnline = () => useNetworkStore.getState().isOnline

const CartService = () => {
  const axiosInstance = useAxiosInstance()
  const getOutletGuid = () => localStorage.getItem('outletGuid') || ''
  const getToken = () => localStorage.getItem('token') || ''

  // ============================
  // CART OPERATIONS
  // ============================

  /**
   * Get current cart items
   * Online: fetch from API + merge offline items
   * Offline: return cached server cart + offline local items
   */
  const getCart = async () => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading cart from cache + offline items')
      return getMergedOfflineCart(outletGuid)
    }

    try {
      const response = await axiosInstance.get('/merchant/sale/mycart', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      })

      if (response.data.results) {
        const cartData = {
          sub_total: response.data.results.sub_total || 0,
          grand_total: response.data.results.grand_total || 0,
          items: response.data.results.items || []
        }

        // Cache ke Dexie
        await localdb.cartCache.where({ outlet_guid: outletGuid }).delete()
        await localdb.cartCache.add({
          outlet_guid: outletGuid,
          cache_key: 'mycart',
          data: cartData,
          updated_at: new Date().toISOString()
        })

        // Also merge any remaining offline items (in case sync hasn't happened yet)
        const offlineItems = await localdb.offlineCartItems
          .where({ outlet_guid: outletGuid })
          .toArray()

        if (offlineItems.length > 0) {
          const offlineDisplayItems = offlineItems.map((item) => ({
            ...item.display_data,
            _offline: true
          }))
          const mergedItems = [...cartData.items, ...offlineDisplayItems]
          const offlineSubTotal = offlineItems.reduce(
            (sum, item) => sum + item.display_data.price * item.display_data.qty,
            0
          )
          return {
            sub_total: cartData.sub_total + offlineSubTotal,
            grand_total: cartData.grand_total + offlineSubTotal,
            items: mergedItems
          }
        }

        return cartData
      }
      return null
    } catch (error) {
      console.log(error)
      console.warn('⚠️ API failed → Loading cart from cache + offline items')
      return getMergedOfflineCart(outletGuid)
    }
  }

  /**
   * Helper: Get merged cart from cache + offline items
   */
  const getMergedOfflineCart = async (outletGuid) => {
    // Get cached server cart
    const cached = await localdb.cartCache.where({ outlet_guid: outletGuid }).toArray()
    const cartItem = cached.find((c) => c.cache_key === 'mycart')

    const serverItems = cartItem?.data?.items || []
    const serverSubTotal = cartItem?.data?.sub_total || 0
    const serverGrandTotal = cartItem?.data?.grand_total || 0

    // Get offline-added items
    const offlineItems = await localdb.offlineCartItems.where({ outlet_guid: outletGuid }).toArray()

    const offlineDisplayItems = offlineItems.map((item) => ({
      ...item.display_data,
      _offline: true
    }))

    const offlineSubTotal = offlineItems.reduce(
      (sum, item) => sum + item.display_data.price * item.display_data.qty,
      0
    )

    const mergedItems = [...serverItems, ...offlineDisplayItems]
    const totalSubTotal = serverSubTotal + offlineSubTotal
    const totalGrandTotal = serverGrandTotal + offlineSubTotal

    return {
      sub_total: totalSubTotal,
      grand_total: totalGrandTotal,
      items: mergedItems,
      offline: true
    }
  }

  /**
   * Add item to cart
   * Online: send to API
   * Offline: save to offlineCartItems in Dexie
   *
   * @param {Object} payload - { product_id, check_in, check_out, qty, note, customer_id, no_room, product_satuan_id }
   * @param {Object} productInfo - product data for offline display { name, price, satuan_name, customer_name }
   */
  const addToCart = async (payload, productInfo = {}) => {
    if (!isOnline()) {
      console.log('📴 Offline → Saving cart item locally')
      const outletGuid = getOutletGuid()
      const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Build display data matching server cart item shape
      const displayData = {
        cart_items_id: offlineId,
        product_name: productInfo.name || 'Produk Offline',
        customer_name: productInfo.customer_name || '-',
        price: productInfo.price || 0,
        qty: payload.qty || 1,
        product_satuan: productInfo.satuan_id
          ? { satuan: { name: productInfo.satuan_name || '' } }
          : null,
        product: { satuan_detail: { name: productInfo.satuan_name || '' } },
        _offline: true
      }

      await localdb.offlineCartItems.add({
        outlet_guid: outletGuid,
        product_id: payload.product_id,
        add_payload: payload,
        display_data: displayData,
        created_at: new Date().toISOString()
      })

      return {
        status: 'ok',
        status_code: 200,
        message: 'Item ditambahkan ke keranjang (offline)',
        data: displayData,
        offline: true
      }
    }

    const response = await axiosInstance.post('/merchant/sale/new-cart', payload, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    })
    return response.data
  }

  /**
   * Remove item from cart
   * Online: send to API
   * Offline: if offline item → remove from Dexie, if server item → not available
   */
  const removeCartItem = async (cartItemId) => {
    // Check if it's an offline item
    if (String(cartItemId).startsWith('offline_')) {
      console.log('🗑️ Removing offline cart item:', cartItemId)
      const outletGuid = getOutletGuid()
      const offlineItems = await localdb.offlineCartItems
        .where({ outlet_guid: outletGuid })
        .toArray()
      const itemToDelete = offlineItems.find(
        (item) => item.display_data.cart_items_id === cartItemId
      )
      if (itemToDelete) {
        await localdb.offlineCartItems.delete(itemToDelete.id)
      }
      return {
        status: 'ok',
        status_code: 200,
        message: 'Item offline dihapus dari keranjang',
        offline: true
      }
    }

    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Hapus item server tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    const response = await axiosInstance.post(
      `/merchant/sale/remove-cartitem/${cartItemId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      }
    )
    return response.data
  }

  /**
   * Checkout cart
   * Online: send to API
   * Offline: save to pendingCheckouts in Dexie with all cart items for later sync
   */
  const checkout = async (payload) => {
    if (!isOnline()) {
      console.log('📴 Offline → Saving checkout to pending queue')
      const outletGuid = getOutletGuid()

      // Gather all offline cart items for this checkout
      const offlineItems = await localdb.offlineCartItems
        .where({ outlet_guid: outletGuid })
        .toArray()

      // Also get cached server cart items
      const cached = await localdb.cartCache.where({ outlet_guid: outletGuid }).toArray()
      const cachedCart = cached.find((c) => c.cache_key === 'mycart')
      const serverItems = cachedCart?.data?.items || []

      // Build the pending checkout entry
      await localdb.pendingCheckouts.add({
        outlet_guid: outletGuid,
        checkout_payload: payload,
        offline_cart_items: offlineItems.map((item) => item.add_payload),
        server_cart_items: serverItems,
        created_at: new Date().toISOString(),
        synced: false
      })

      // Clear offline cart items after checkout
      await localdb.offlineCartItems.where({ outlet_guid: outletGuid }).delete()

      // Clear cart cache so it appears empty after checkout
      await localdb.cartCache.where({ outlet_guid: outletGuid }).delete()

      return {
        status: 'ok',
        status_code: 200,
        message: 'Checkout tersimpan offline. Akan disinkronisasi saat online.',
        offline: true
      }
    }

    const response = await axiosInstance.post('/merchant/sale/checkout', payload, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    })
    return response.data
  }

  // ============================
  // MASTER DATA
  // ============================

  /**
   * Get products list
   */
  const getProducts = async (params) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading cart products from cache directly')
      return getCartProductsFromCache(outletGuid)
    }

    try {
      const response = await axiosInstance.get('/product-service/products', {
        params: {
          outletId: getOutletGuid(),
          stock: true,
          sale: true,
          ...params
        },
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      })
      const responseData = response.data

      // Cache ke Dexie
      if (Array.isArray(responseData?.data)) {
        await localdb.cartProducts.where({ outlet_guid: outletGuid }).delete()
        await localdb.cartProducts.bulkAdd(
          responseData.data.map((product) => ({
            outlet_guid: outletGuid,
            product_id: product.guid || product.id,
            data: product,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading cart products from cache')
      return getCartProductsFromCache(outletGuid, error)
    }
  }

  // Helper: Get cart products from cache
  const getCartProductsFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.cartProducts.where({ outlet_guid: outletGuid }).toArray()

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

  /**
   * Get customers list
   */
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

  /**
   * Get employees list
   */
  const getEmployees = async (params) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading employees from cache directly')
      return getEmployeesFromCache(outletGuid)
    }

    try {
      const response = await axiosInstance.get('/product-service/employee', {
        params: {
          outlet_id: getOutletGuid(),
          ...params
        },
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      })
      const responseData = response.data

      // Cache ke Dexie
      if (Array.isArray(responseData?.data)) {
        await localdb.employees.where({ outlet_guid: outletGuid }).delete()
        await localdb.employees.bulkAdd(
          responseData.data.map((emp) => ({
            outlet_guid: outletGuid,
            employee_id: emp.guid || emp.id,
            data: emp,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading employees from cache')
      return getEmployeesFromCache(outletGuid, error)
    }
  }

  // Helper: Get employees from cache
  const getEmployeesFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.employees.where({ outlet_guid: outletGuid }).toArray()

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

  /**
   * Get bank/payment options
   */
  const getBankOptions = async (params) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading bank options from cache directly')
      return getBankOptionsFromCache(outletGuid)
    }

    try {
      const response = await axiosInstance.get('/payment-service/list-payment', {
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
        await localdb.bankOptions.where({ outlet_guid: outletGuid }).delete()
        await localdb.bankOptions.bulkAdd(
          responseData.data.map((bank) => ({
            outlet_guid: outletGuid,
            bank_id: bank.guid || bank.id,
            data: bank,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading bank options from cache')
      return getBankOptionsFromCache(outletGuid, error)
    }
  }

  // Helper: Get bank options from cache
  const getBankOptionsFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.bankOptions.where({ outlet_guid: outletGuid }).toArray()

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

  /**
   * Get rooms list
   */
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

  /**
   * Get units/satuan list
   */
  const getUnits = async () => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading units from cache directly')
      return getUnitsFromCache(outletGuid)
    }

    try {
      const response = await axiosInstance.get('/product-service/satuan', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      })
      const responseData = response.data

      // Cache ke Dexie
      if (Array.isArray(responseData?.data)) {
        await localdb.units.where({ outlet_guid: outletGuid }).delete()
        await localdb.units.bulkAdd(
          responseData.data.map((unit) => ({
            outlet_guid: outletGuid,
            unit_id: unit.guid || unit.id,
            data: unit,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading units from cache')
      return getUnitsFromCache(outletGuid, error)
    }
  }

  // Helper: Get units from cache
  const getUnitsFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.units.where({ outlet_guid: outletGuid }).toArray()

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

  /**
   * Check if commission is active for outlet
   */
  const getCommissionStatus = async () => {
    if (!isOnline()) {
      console.log('📴 Offline detected → Returning cached commission status')
      // Default to false when offline
      return false
    }

    try {
      const response = await axiosInstance.get('/trx-service/group-commission', {
        params: {
          p: 1,
          ps: 1,
          outlet_id: getOutletGuid()
        },
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      })
      return response.data.data && response.data.data.length > 0
    } catch (error) {
      console.error('Error checking commission status:', error)
      return false
    }
  }

  // ============================
  // CLEAR CACHE
  // ============================
  const clearCache = async () => {
    const outletGuid = getOutletGuid()
    if (outletGuid) {
      await Promise.all([
        localdb.cartProducts.where({ outlet_guid: outletGuid }).delete(),
        localdb.cartCache.where({ outlet_guid: outletGuid }).delete(),
        localdb.units.where({ outlet_guid: outletGuid }).delete(),
        localdb.offlineCartItems.where({ outlet_guid: outletGuid }).delete()
      ])
    }
  }

  return {
    // Cart
    getCart,
    addToCart,
    removeCartItem,
    checkout,

    // Master Data
    getProducts,
    getCustomers,
    getEmployees,
    getBankOptions,
    getRooms,
    getUnits,
    getCommissionStatus,

    // Offline support
    clearCache
  }
}

export default CartService
