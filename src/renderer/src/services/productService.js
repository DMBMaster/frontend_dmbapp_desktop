import { useAxiosInstance } from '@renderer/api/axiosInstance'
import { localdb } from '@renderer/config/localdb'
import { useNetworkStore } from '@renderer/store/networkStore'

// ================================
// PAYLOAD INTERFACES
// ================================
export const IPayloadProduct = {
  // outlet_id?: string
  // name: string
  // descriptions?: string
  // price: number
  // base_price?: number
  // stock?: number
  // category_id?: string
  // images?: string | File | null
  // featured_image?: string | File | null
  // published?: boolean
  // type?: string
  // barcode?: string
}

// ================================
// HELPER: Check if online from Zustand store
// ================================
const isOnline = () => useNetworkStore.getState().isOnline

// ================================
// SERVICE IMPLEMENTATION
// ================================
const ProductService = () => {
  const axiosInstance = useAxiosInstance()
  const getOutletGuid = () => localStorage.getItem('outletGuid')

  // ============================
  // GET PRODUCTS LIST
  // ============================
  const getProducts = async (params) => {
    const outletGuid = getOutletGuid()

    // Check network status FIRST - skip API call if offline
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading products from cache directly')
      return getProductsFromCache(outletGuid)
    }

    try {
      // ===== ONLINE - TRY API =====
      const res = await axiosInstance.get('/product-service/products', { params })
      const responseData = res.data

      // Cache ke Dexie (replace existing cache for this outlet)
      if (Array.isArray(responseData?.data)) {
        await localdb.products.where({ outlet_guid: outletGuid }).delete()
        await localdb.products.bulkAdd(
          responseData.data.map((product) => ({
            outlet_guid: outletGuid,
            product_guid: product.guid,
            data: product,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      // API call failed - try cache
      console.warn('⚠️ API failed → Loading products from cache')
      return getProductsFromCache(outletGuid, error)
    }
  }

  const getProductsV2 = async (params) => {
    const outletGuid = getOutletGuid()

    // Check network status FIRST - skip API call if offline
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading products from cache directly')
      return getProductsFromCache(outletGuid)
    }

    try {
      // ===== ONLINE - TRY API =====
      const res = await axiosInstance.get('/product-service/v2/products', { params })
      const responseData = res.data

      // Cache ke Dexie (replace existing cache for this outlet)
      if (Array.isArray(responseData?.data)) {
        await localdb.products.where({ outlet_guid: outletGuid }).delete()
        await localdb.products.bulkAdd(
          responseData.data.map((product) => ({
            outlet_guid: outletGuid,
            product_guid: product.guid,
            data: product,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      // API call failed - try cache
      console.warn('⚠️ API failed → Loading products from cache')
      return getProductsFromCache(outletGuid, error)
    }
  }

  // Helper: Get products from cache
  const getProductsFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.products.where({ outlet_guid: outletGuid }).toArray()

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
  // GET PRODUCT DETAIL
  // ============================
  const getProductDetail = async (guid) => {
    const outletGuid = getOutletGuid()

    // Check network status FIRST
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading product detail from cache directly')
      return getProductDetailFromCache(guid)
    }

    try {
      // ===== ONLINE - TRY API =====
      const res = await axiosInstance.get(`product-service/products/${guid}`)
      const detail = res.data?.data

      // Cache ke Dexie
      if (detail) {
        await localdb.productDetails.put({
          guid: detail.guid,
          outlet_guid: outletGuid,
          data: detail,
          updated_at: new Date().toISOString()
        })
      }

      return res.data
    } catch (error) {
      // API call failed - try cache
      console.warn('⚠️ API failed → Loading product detail from cache')
      return getProductDetailFromCache(guid, error)
    }
  }

  // Helper: Get product detail from cache
  const getProductDetailFromCache = async (guid, originalError) => {
    const cached = await localdb.productDetails.get(guid)

    if (!cached) {
      if (originalError) throw originalError
      throw new Error('Data tidak ditemukan di cache')
    }

    return {
      status: 'ok',
      status_code: 200,
      message: 'Data dari cache offline',
      error: '',
      data: cached.data,
      offline: true
    }
  }

  // ============================
  // CREATE PRODUCT
  // ============================
  const createProduct = async (payload) => {
    const outletGuid = getOutletGuid()

    // Check if online
    if (isOnline()) {
      try {
        // ===== TRY ONLINE =====
        const res = await axiosInstance.post('product-service/product', payload)
        return res.data
      } catch (err) {
        // Network error, save to pending queue
        console.warn('⚠️ Create failed → Saving to offline queue', err)
        await saveToPendingQueue(outletGuid, payload)

        return {
          status: 'ok',
          status_code: 200,
          message: 'Produk disimpan offline. Akan disinkronkan saat online.',
          error: '',
          offline: true,
          pending: true
        }
      }
    } else {
      // ===== OFFLINE MODE =====
      await saveToPendingQueue(outletGuid, payload)

      return {
        status: 'ok',
        status_code: 200,
        message: 'Produk disimpan offline. Akan disinkronkan saat online.',
        error: '',
        offline: true,
        pending: true
      }
    }
  }

  const getUnitsProducts = async () => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading units from cache directly')
      return getUnitsFromCache(outletGuid)
    }

    try {
      const response = await axiosInstance.get('/product-service/satuan')
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

  // Helper: Save to pending queue
  const saveToPendingQueue = async (outletGuid, payload) => {
    await localdb.pendingProducts.add({
      outlet_guid: outletGuid,
      payload: payload,
      created_at: new Date().toISOString(),
      synced: false
    })
  }

  // ============================
  // UPDATE PRODUCT
  // ============================
  const updateProduct = async (guid, payload) => {
    try {
      const res = await axiosInstance.put(`product-service/products/${guid}`, payload)

      // Update cache if exists
      const cached = await localdb.productDetails.get(guid)
      if (cached && cached.data) {
        const existingData = cached.data
        await localdb.productDetails.update(guid, {
          data: { ...existingData, ...payload },
          updated_at: new Date().toISOString()
        })
      }

      return res.data
    } catch (err) {
      console.error('Error updating product:', err)
      throw err
    }
  }

  // ============================
  // DELETE PRODUCT
  // ============================
  const deleteProduct = async (guid) => {
    const outletGuid = getOutletGuid()

    if (isOnline()) {
      try {
        const res = await axiosInstance.delete(`product-service/products/${guid}`)

        // Remove from cache
        await localdb.products.where({ product_guid: guid }).delete()
        await localdb.productDetails.delete(guid)

        return res.data
      } catch (err) {
        // Save delete to pending queue
        console.warn('⚠️ Delete failed → Saving to offline queue', err)
        await localdb.pendingDeletes.add({
          outlet_guid: outletGuid,
          entity_type: 'product',
          entity_guid: guid,
          created_at: new Date().toISOString(),
          synced: false
        })

        // Remove from local cache anyway
        await localdb.products.where({ product_guid: guid }).delete()
        await localdb.productDetails.delete(guid)

        return {
          status: 'ok',
          status_code: 200,
          message: 'Penghapusan akan disinkronkan saat online.',
          error: '',
          offline: true,
          pending: true
        }
      }
    } else {
      // Offline: queue delete
      await localdb.pendingDeletes.add({
        outlet_guid: outletGuid,
        entity_type: 'product',
        entity_guid: guid,
        created_at: new Date().toISOString(),
        synced: false
      })

      // Remove from local cache
      await localdb.products.where({ product_guid: guid }).delete()
      await localdb.productDetails.delete(guid)

      return {
        status: 'ok',
        status_code: 200,
        message: 'Penghapusan akan disinkronkan saat online.',
        error: '',
        offline: true,
        pending: true
      }
    }
  }

  // ============================
  // SYNC PENDING PRODUCTS
  // ============================
  const syncPendingProducts = async () => {
    let synced = 0
    let failed = 0

    // Get all and filter - more reliable than compound query with boolean
    const allPendingProducts = await localdb.pendingProducts.toArray()
    const pendingCreates = allPendingProducts.filter((p) => p.synced === false)

    for (const item of pendingCreates) {
      try {
        await axiosInstance.post('product-service/products', item.payload)
        await localdb.pendingProducts.delete(item.id)
        synced++
      } catch (err) {
        console.error('Failed to sync pending product:', err)
        failed++
      }
    }

    // Sync pending deletes
    const allPendingDeletes = await localdb.pendingDeletes.toArray()
    const pendingDeletes = allPendingDeletes.filter(
      (p) => p.entity_type === 'product' && p.synced === false
    )

    for (const item of pendingDeletes) {
      try {
        await axiosInstance.delete(`product-service/products/${item.entity_guid}`)
        await localdb.pendingDeletes.delete(item.id)
        synced++
      } catch (err) {
        console.error('Failed to sync pending delete:', err)
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

    // Get all and filter - more reliable than compound query with boolean
    const [allPendingProducts, allPendingDeletes] = await Promise.all([
      localdb.pendingProducts.toArray(),
      localdb.pendingDeletes.toArray()
    ])

    const creates = allPendingProducts.filter(
      (p) => p.outlet_guid === outletGuid && p.synced === false
    ).length
    const deletes = allPendingDeletes.filter(
      (p) => p.outlet_guid === outletGuid && p.entity_type === 'product' && p.synced === false
    ).length

    return creates + deletes
  }

  // ============================
  // CLEAR CACHE
  // ============================
  const clearCache = async () => {
    const outletGuid = getOutletGuid()
    if (outletGuid) {
      await Promise.all([
        localdb.products.where({ outlet_guid: outletGuid }).delete(),
        localdb.productDetails.where({ outlet_guid: outletGuid }).delete()
      ])
    }
  }

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

  return {
    getProducts,
    getProductsV2,
    getProductDetail,
    createProduct,
    updateProduct,
    deleteProduct,
    syncPendingProducts,
    getPendingCount,
    clearCache,
    getUnitsProducts
  }
}

export default ProductService
