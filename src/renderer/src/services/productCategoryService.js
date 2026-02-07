import { useAxiosInstance } from '@renderer/api/axiosInstance'
import { localdb } from '@renderer/config/localdb'
import { useNetworkStore } from '@renderer/store/networkStore'

// ================================
// PAYLOAD INTERFACES
// ================================
export const IPayloadProductCategory = {
  // outlet_id?: string
  // category_name: string
  // description?: string
  // is_active?: boolean
  // sort_order?: number
}

// ================================
// HELPER: Check if online from Zustand store
// ================================
const isOnline = () => useNetworkStore.getState().isOnline

// ================================
// SERVICE IMPLEMENTATION
// ================================
const ProductCategoryService = () => {
  const axiosInstance = useAxiosInstance()
  const getOutletGuid = () => localStorage.getItem('outletGuid')

  // ============================
  // GET CATEGORIES LIST
  // ============================
  const getCategories = async (params) => {
    const outletGuid = getOutletGuid()

    // Check network status FIRST - skip API call if offline
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading categories from cache directly')
      return getCategoriesFromCache(outletGuid)
    }

    try {
      // ===== ONLINE - TRY API =====
      const res = await axiosInstance.get('/product-service/category', { params })
      const responseData = res.data

      // Cache ke Dexie (replace existing cache for this outlet)
      if (Array.isArray(responseData?.data)) {
        await localdb.productCategories.where({ outlet_guid: outletGuid }).delete()
        await localdb.productCategories.bulkAdd(
          responseData.data.map((category) => ({
            outlet_guid: outletGuid,
            category_guid: category.guid,
            data: category,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      // API call failed - try cache
      console.warn('⚠️ API failed → Loading categories from cache')
      return getCategoriesFromCache(outletGuid, error)
    }
  }

  const getCategoriesByOutlet = async (outletId) => {
    const outletGuid = outletId

    // Check network status FIRST - skip API call if offline
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading categories from cache directly')
      return getCategoriesFromCache(outletGuid)
    }

    try {
      // ===== ONLINE - TRY API =====
      const res = await axiosInstance.get(`/product-service/category/outlet/${outletId}`)
      const responseData = res.data

      // Cache ke Dexie (replace existing cache for this outlet)
      if (Array.isArray(responseData?.data)) {
        await localdb.productCategories.where({ outlet_guid: outletGuid }).delete()
        await localdb.productCategories.bulkAdd(
          responseData.data.map((category) => ({
            outlet_guid: outletGuid,
            category_guid: category.guid,
            data: category,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      // API call failed - try cache
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

  // ============================
  // GET CATEGORY DETAIL
  // ============================
  const getCategoryDetail = async (guid) => {
    const outletGuid = getOutletGuid()

    // Check network status FIRST
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading category detail from cache directly')
      return getCategoryDetailFromCache(guid)
    }

    try {
      // ===== ONLINE - TRY API =====
      const res = await axiosInstance.get(`/product-service/product-categories/${guid}`)
      const detail = res.data?.data

      // Cache ke Dexie
      if (detail) {
        await localdb.productCategoryDetails.put({
          guid: detail.guid,
          outlet_guid: outletGuid,
          data: detail,
          updated_at: new Date().toISOString()
        })
      }

      return res.data
    } catch (error) {
      // API call failed - try cache
      console.warn('⚠️ API failed → Loading category detail from cache')
      return getCategoryDetailFromCache(guid, error)
    }
  }

  // Helper: Get category detail from cache
  const getCategoryDetailFromCache = async (guid, originalError) => {
    const cached = await localdb.productCategoryDetails.get(guid)

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
  // CREATE CATEGORY
  // ============================
  const createCategory = async (payload) => {
    const outletGuid = getOutletGuid()

    // Check if online
    if (isOnline()) {
      try {
        // ===== TRY ONLINE =====
        const res = await axiosInstance.post('/product-service/product-categories', payload)
        return res.data
      } catch (err) {
        // Network error, save to pending queue
        console.warn('⚠️ Create failed → Saving to offline queue', err)
        await saveToPendingQueue(outletGuid, payload)

        return {
          status: 'ok',
          status_code: 200,
          message: 'Kategori disimpan offline. Akan disinkronkan saat online.',
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
        message: 'Kategori disimpan offline. Akan disinkronkan saat online.',
        error: '',
        offline: true,
        pending: true
      }
    }
  }

  // Helper: Save to pending queue
  const saveToPendingQueue = async (outletGuid, payload) => {
    await localdb.pendingProductCategories.add({
      outlet_guid: outletGuid,
      payload: payload,
      created_at: new Date().toISOString(),
      synced: false
    })
  }

  // ============================
  // UPDATE CATEGORY
  // ============================
  const updateCategory = async (guid, payload) => {
    try {
      const res = await axiosInstance.put(`/product-service/product-categories/${guid}`, payload)

      // Update cache if exists
      const cached = await localdb.productCategoryDetails.get(guid)
      if (cached && cached.data) {
        const existingData = cached.data
        await localdb.productCategoryDetails.update(guid, {
          data: { ...existingData, ...payload },
          updated_at: new Date().toISOString()
        })
      }

      return res.data
    } catch (err) {
      console.error('Error updating category:', err)
      throw err
    }
  }

  // ============================
  // DELETE CATEGORY
  // ============================
  const deleteCategory = async (guid) => {
    const outletGuid = getOutletGuid()

    if (isOnline()) {
      try {
        const res = await axiosInstance.delete(`/product-service/product-categories/${guid}`)

        // Remove from cache
        await localdb.productCategories.where({ category_guid: guid }).delete()
        await localdb.productCategoryDetails.delete(guid)

        return res.data
      } catch (err) {
        // Save delete to pending queue
        console.warn('⚠️ Delete failed → Saving to offline queue', err)
        await localdb.pendingDeletes.add({
          outlet_guid: outletGuid,
          entity_type: 'productCategory',
          entity_guid: guid,
          created_at: new Date().toISOString(),
          synced: false
        })

        // Remove from local cache anyway
        await localdb.productCategories.where({ category_guid: guid }).delete()
        await localdb.productCategoryDetails.delete(guid)

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
        entity_type: 'productCategory',
        entity_guid: guid,
        created_at: new Date().toISOString(),
        synced: false
      })

      // Remove from local cache
      await localdb.productCategories.where({ category_guid: guid }).delete()
      await localdb.productCategoryDetails.delete(guid)

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
  // SYNC PENDING CATEGORIES
  // ============================
  const syncPendingCategories = async () => {
    let synced = 0
    let failed = 0

    // Get all and filter - more reliable than compound query with boolean
    const allPendingCategories = await localdb.pendingProductCategories.toArray()
    const pendingCreates = allPendingCategories.filter((p) => p.synced === false)

    for (const item of pendingCreates) {
      try {
        await axiosInstance.post('/product-service/product-categories', item.payload)
        await localdb.pendingProductCategories.delete(item.id)
        synced++
      } catch (err) {
        console.error('Failed to sync pending category:', err)
        failed++
      }
    }

    // Sync pending deletes
    const allPendingDeletes = await localdb.pendingDeletes.toArray()
    const pendingDeletes = allPendingDeletes.filter(
      (p) => p.entity_type === 'productCategory' && p.synced === false
    )

    for (const item of pendingDeletes) {
      try {
        await axiosInstance.delete(`/product-service/product-categories/${item.entity_guid}`)
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
    const [allPendingCategories, allPendingDeletes] = await Promise.all([
      localdb.pendingProductCategories.toArray(),
      localdb.pendingDeletes.toArray()
    ])

    const creates = allPendingCategories.filter(
      (p) => p.outlet_guid === outletGuid && p.synced === false
    ).length
    const deletes = allPendingDeletes.filter(
      (p) =>
        p.outlet_guid === outletGuid && p.entity_type === 'productCategory' && p.synced === false
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
        localdb.productCategories.where({ outlet_guid: outletGuid }).delete(),
        localdb.productCategoryDetails.where({ outlet_guid: outletGuid }).delete()
      ])
    }
  }

  return {
    getCategories,
    getCategoriesByOutlet,
    getCategoryDetail,
    createCategory,
    updateCategory,
    deleteCategory,
    syncPendingCategories,
    getPendingCount,
    clearCache
  }
}

export default ProductCategoryService
