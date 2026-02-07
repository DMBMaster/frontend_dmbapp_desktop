import { useAxiosInstance } from '@renderer/api/axiosInstance'
import { localdb } from '@renderer/config/localdb'
import { useNetworkStore } from '@renderer/store/networkStore'

// ================================
// HELPER: Check if online from Zustand store
// ================================
const isOnline = () => useNetworkStore.getState().isOnline

const ComponentService = () => {
  const axiosInstance = useAxiosInstance()
  const getOutletGuid = () => localStorage.getItem('outletGuid') || ''

  // ============================
  // CATEGORY SERVICES
  // ============================

  const getCategories = async (outletId) => {
    const outletGuid = getOutletGuid()

    // Check network status FIRST - skip API call if offline
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading categories from cache directly')
      return getCategoriesFromCache(outletGuid)
    }

    try {
      const response = await axiosInstance.get(`/product-service/category/outlet/${outletId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      })
      const responseData = response.data

      // Cache ke Dexie
      if (Array.isArray(responseData?.data)) {
        await localdb.productCategories.where({ outlet_guid: outletGuid }).delete()
        await localdb.productCategories.bulkAdd(
          responseData.data.map((cat) => ({
            outlet_guid: outletGuid,
            category_guid: cat.guid || cat.id,
            data: cat,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading categories from cache')
      return getCategoriesFromCache(outletGuid, error)
    }
  }

  // Helper: Get categories from cache
  const getCategoriesFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.productCategories.where({ outlet_guid: outletGuid }).toArray()

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

  const getProducts = async (categoryId) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading products from cache directly')
      return getProductsFromCache(outletGuid, categoryId)
    }

    try {
      const response = await axiosInstance.get(
        `/product-service/products?category_id=${categoryId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )
      const responseData = response.data

      // Cache ke Dexie
      if (Array.isArray(responseData?.data)) {
        for (const product of responseData.data) {
          await localdb.products.put({
            outlet_guid: outletGuid,
            product_guid: product.guid || product.id,
            category_id: categoryId,
            data: product,
            updated_at: new Date().toISOString()
          })
        }
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading products from cache')
      return getProductsFromCache(outletGuid, categoryId, error)
    }
  }

  // Helper: Get products from cache
  const getProductsFromCache = async (outletGuid, categoryId, originalError) => {
    const cached = await localdb.products.where({ outlet_guid: outletGuid }).toArray()
    const filtered = categoryId
      ? cached.filter((c) => c.category_id === categoryId)
      : cached

    if (!filtered?.length) {
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
      data: filtered.map((c) => c.data),
      offline: true
    }
  }

  const getProductsWithRooms = async (outletId) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading room types from cache directly')
      return getRoomTypesFromCache(outletGuid)
    }

    try {
      const response = await axiosInstance.get(`/product-service/v2/products-has-rooms`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        params: {
          outlet_id: outletId
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
  // TRANSACTION ITEM SERVICES
  // ============================

  const addTransactionItem = async (data) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      // Queue for later sync when offline
      await localdb.pendingTransactionItems.add({
        outlet_guid: outletGuid,
        entity_type: 'transaction_item',
        payload: data,
        created_at: new Date().toISOString(),
        synced: false
      })

      return {
        status: 'ok',
        status_code: 200,
        message: 'Item transaksi disimpan offline. Akan disinkronkan saat online.',
        error: '',
        data: { guid: `offline-${Date.now()}`, ...data },
        offline: true,
        pending: true
      }
    }

    try {
      const response = await axiosInstance.post(`/trx-service/transaction-item`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.warn('⚠️ API failed → Saving transaction item to offline queue')
      await localdb.pendingTransactionItems.add({
        outlet_guid: outletGuid,
        entity_type: 'transaction_item',
        payload: data,
        created_at: new Date().toISOString(),
        synced: false
      })

      return {
        status: 'ok',
        status_code: 200,
        message: 'Item transaksi disimpan offline. Akan disinkronkan saat online.',
        error: '',
        data: { guid: `offline-${Date.now()}`, ...data },
        offline: true,
        pending: true
      }
    }
  }

  const addTransactionDeposit = async (data) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      await localdb.pendingTransactionItems.add({
        outlet_guid: outletGuid,
        entity_type: 'transaction_deposit',
        payload: data,
        created_at: new Date().toISOString(),
        synced: false
      })

      return {
        status: 'ok',
        status_code: 200,
        message: 'Deposit disimpan offline. Akan disinkronkan saat online.',
        error: '',
        data: { guid: `offline-${Date.now()}`, ...data },
        offline: true,
        pending: true
      }
    }

    try {
      const response = await axiosInstance.post(`/trx-service/transaction-deposit`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.warn('⚠️ API failed → Saving deposit to offline queue')
      await localdb.pendingTransactionItems.add({
        outlet_guid: outletGuid,
        entity_type: 'transaction_deposit',
        payload: data,
        created_at: new Date().toISOString(),
        synced: false
      })

      return {
        status: 'ok',
        status_code: 200,
        message: 'Deposit disimpan offline. Akan disinkronkan saat online.',
        error: '',
        data: { guid: `offline-${Date.now()}`, ...data },
        offline: true,
        pending: true
      }
    }
  }

  const addExtensionService = async (data) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      await localdb.pendingTransactionItems.add({
        outlet_guid: outletGuid,
        entity_type: 'extension_service',
        payload: data,
        created_at: new Date().toISOString(),
        synced: false
      })

      return {
        status: 'ok',
        status_code: 200,
        message: 'Ekstensi disimpan offline. Akan disinkronkan saat online.',
        error: '',
        data: { guid: `offline-${Date.now()}`, ...data },
        offline: true,
        pending: true
      }
    }

    try {
      const response = await axiosInstance.post(`/trx-service/v2/add-on`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.warn('⚠️ API failed → Saving extension to offline queue')
      await localdb.pendingTransactionItems.add({
        outlet_guid: outletGuid,
        entity_type: 'extension_service',
        payload: data,
        created_at: new Date().toISOString(),
        synced: false
      })

      return {
        status: 'ok',
        status_code: 200,
        message: 'Ekstensi disimpan offline. Akan disinkronkan saat online.',
        error: '',
        data: { guid: `offline-${Date.now()}`, ...data },
        offline: true,
        pending: true
      }
    }
  }

  // ============================
  // PAYMENT SERVICES
  // ============================

  const addPayment = async (data) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      await localdb.pendingPayments.add({
        outlet_guid: outletGuid,
        payload: data,
        created_at: new Date().toISOString(),
        synced: false
      })

      return {
        status: 'ok',
        status_code: 200,
        message: 'Pembayaran disimpan offline. Akan disinkronkan saat online.',
        error: '',
        data: { guid: `offline-${Date.now()}`, ...data },
        offline: true,
        pending: true
      }
    }

    try {
      const response = await axiosInstance.post(`/trx-service/add-payment`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.warn('⚠️ API failed → Saving payment to offline queue')
      await localdb.pendingPayments.add({
        outlet_guid: outletGuid,
        payload: data,
        created_at: new Date().toISOString(),
        synced: false
      })

      return {
        status: 'ok',
        status_code: 200,
        message: 'Pembayaran disimpan offline. Akan disinkronkan saat online.',
        error: '',
        data: { guid: `offline-${Date.now()}`, ...data },
        offline: true,
        pending: true
      }
    }
  }

  const getBankOptions = async (outletId) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading bank options from cache directly')
      return getBankOptionsFromCache(outletGuid)
    }

    try {
      const response = await axiosInstance.get(`/trx-service/payment-methods`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        params: {
          outlet_id: outletId
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

  const getTransactionPayment = async (transactionId) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading transaction payment from cache directly')
      return getTransactionPaymentFromCache(outletGuid, transactionId)
    }

    try {
      const response = await axiosInstance.get(`/trx-service/transaction-payment`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        },
        params: {
          transaction_id: transactionId
        }
      })
      const responseData = response.data

      // Cache ke Dexie
      if (responseData?.data) {
        // Delete old cache for this transaction
        const oldCache = await localdb.transactionPayments
          .where({ outlet_guid: outletGuid })
          .toArray()
        const toDelete = oldCache.filter((c) => c.transaction_id === transactionId)
        for (const item of toDelete) {
          await localdb.transactionPayments.delete(item.id)
        }

        await localdb.transactionPayments.add({
          outlet_guid: outletGuid,
          transaction_id: transactionId,
          data: responseData.data,
          updated_at: new Date().toISOString()
        })
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading transaction payment from cache')
      return getTransactionPaymentFromCache(outletGuid, transactionId, error)
    }
  }

  // Helper: Get transaction payment from cache
  const getTransactionPaymentFromCache = async (outletGuid, transactionId, originalError) => {
    const cached = await localdb.transactionPayments
      .where({ outlet_guid: outletGuid })
      .toArray()
    const found = cached.find((c) => c.transaction_id === transactionId)

    if (!found) {
      if (originalError) throw originalError
      return {
        status: 'ok',
        status_code: 200,
        message: 'Tidak ada data cache',
        error: '',
        data: null,
        offline: true
      }
    }

    return {
      status: 'ok',
      status_code: 200,
      message: 'Data dari cache offline',
      error: '',
      data: found.data,
      offline: true
    }
  }

  // ============================
  // FILE UPLOAD SERVICES
  // ============================

  const uploadFile = async (file) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Upload tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    const formData = new FormData()
    formData.append('file', file)

    const response = await axiosInstance.post(`/file-service/upload`, formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    return response.data
  }

  const uploadMedia = async (file) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Upload tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    const formData = new FormData()
    formData.append('files', file)

    const response = await axiosInstance.post(`/media-service/upload`, formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }

  // ============================
  // SYNC PENDING DATA
  // ============================
  const syncPendingComponentData = async () => {
    if (!isOnline()) return { synced: 0, failed: 0 }

    let synced = 0
    let failed = 0

    // Sync pending transaction items
    const allPendingItems = await localdb.pendingTransactionItems.toArray()
    const pendingItems = allPendingItems.filter((p) => p.synced === false)

    for (const item of pendingItems) {
      try {
        let endpoint = ''
        switch (item.entity_type) {
          case 'transaction_item':
            endpoint = '/trx-service/transaction-item'
            break
          case 'transaction_deposit':
            endpoint = '/trx-service/transaction-deposit'
            break
          case 'extension_service':
            endpoint = '/trx-service/v2/add-on'
            break
          default:
            continue
        }
        await axiosInstance.post(endpoint, item.payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
        await localdb.pendingTransactionItems.delete(item.id)
        synced++
      } catch (err) {
        console.error('Failed to sync pending transaction item:', err)
        failed++
      }
    }

    // Sync pending payments
    const allPendingPayments = await localdb.pendingPayments.toArray()
    const pendingPayments = allPendingPayments.filter((p) => p.synced === false)

    for (const item of pendingPayments) {
      try {
        await axiosInstance.post('/trx-service/add-payment', item.payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
        await localdb.pendingPayments.delete(item.id)
        synced++
      } catch (err) {
        console.error('Failed to sync pending payment:', err)
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

    const [allPendingItems, allPendingPayments] = await Promise.all([
      localdb.pendingTransactionItems.toArray(),
      localdb.pendingPayments.toArray()
    ])

    const items = allPendingItems.filter(
      (p) => p.outlet_guid === outletGuid && p.synced === false
    ).length
    const payments = allPendingPayments.filter(
      (p) => p.outlet_guid === outletGuid && p.synced === false
    ).length

    return items + payments
  }

  // ============================
  // CLEAR CACHE
  // ============================
  const clearCache = async () => {
    const outletGuid = getOutletGuid()
    if (outletGuid) {
      await Promise.all([
        localdb.bankOptions.where({ outlet_guid: outletGuid }).delete(),
        localdb.transactionPayments.where({ outlet_guid: outletGuid }).delete()
      ])
    }
  }

  return {
    // Category services
    getCategories,
    getProducts,
    getProductsWithRooms,

    // Transaction item services
    addTransactionItem,
    addTransactionDeposit,
    addExtensionService,

    // Payment services
    addPayment,
    getBankOptions,
    getTransactionPayment,

    // File services
    uploadFile,
    uploadMedia,

    // Offline support
    syncPendingComponentData,
    getPendingCount,
    clearCache
  }
}

export default ComponentService
