import { useAxiosInstanceB } from '@renderer/api/axiosInstanceB'
import { localdb } from '@renderer/config/localdb'
import { useNetworkStore } from '@renderer/store/networkStore'

// ================================
// HELPER: Check if online from Zustand store
// ================================
const isOnline = () => useNetworkStore.getState().isOnline

// ================================
// SERVICE IMPLEMENTATION
// ================================
const ExpensesCategoryService = () => {
  const axiosInstance = useAxiosInstanceB()
  const getOutletGuid = () => localStorage.getItem('outletGuid')

  // ============================
  // GET EXPENSES CATEGORIES LIST
  // ============================
  const getExpensesCategories = async (params) => {
    const outletGuid = getOutletGuid()

    // Check network status FIRST - skip API call if offline
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading expenses categories from cache directly')
      return getCategoriesFromCache(outletGuid)
    }

    try {
      // ===== ONLINE - TRY API =====
      const res = await axiosInstance.get('/expenses-category', { params })
      const responseData = res.data

      // Cache ke Dexie (replace existing cache for this outlet)
      if (Array.isArray(responseData?.data)) {
        await localdb.expensesCategories.where({ outlet_guid: outletGuid }).delete()
        await localdb.expensesCategories.bulkAdd(
          responseData.data.map((category) => ({
            outlet_guid: outletGuid,
            category_id: category.id,
            data: category,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      // API call failed - try cache
      console.warn('⚠️ API failed → Loading expenses categories from cache')
      // Mark as offline since API failed
      // useNetworkStore.getState().setOffline()
      return getCategoriesFromCache(outletGuid, error)
    }
  }

  // Helper: Get categories from cache
  const getCategoriesFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.expensesCategories.where({ outlet_guid: outletGuid }).toArray()

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
  // CREATE EXPENSES CATEGORY
  // ============================
  const createExpensesCategory = async (payload) => {
    const outletGuid = getOutletGuid()

    // Check if online
    if (isOnline()) {
      try {
        // ===== TRY ONLINE =====
        const res = await axiosInstance.post('/expenses-category', payload)

        const responseData = res.data

        // Cache the new category
        if (responseData?.data) {
          await localdb.expensesCategories.add({
            outlet_guid: outletGuid,
            category_id: responseData.data.id,
            data: responseData.data,
            updated_at: new Date().toISOString()
          })
        }

        return responseData
      } catch (err) {
        // Network error, save to pending queue
        console.warn('⚠️ Create failed → Saving to offline queue', err)
        return await saveToPendingQueue(outletGuid, payload)
      }
    } else {
      // ===== OFFLINE MODE =====
      return await saveToPendingQueue(outletGuid, payload)
    }
  }

  // Helper: Save to pending queue and return optimistic response
  const saveToPendingQueue = async (outletGuid, payload) => {
    // Save to pending queue
    await localdb.pendingExpenseCategories.add({
      outlet_guid: outletGuid,
      payload: payload,
      created_at: new Date().toISOString(),
      synced: false
    })

    // Create optimistic local category for immediate UI feedback
    const localCategory = {
      id: Date.now(), // temporary ID
      name: payload.name,
      description: payload.description || '',
      guid: `local-${Date.now()}`,
      is_local: true
    }

    // Add to local cache for immediate display
    await localdb.expensesCategories.add({
      outlet_guid: outletGuid,
      category_id: localCategory.id,
      data: localCategory,
      updated_at: new Date().toISOString()
    })

    return {
      status: 'ok',
      status_code: 200,
      message: 'Kategori disimpan offline. Akan disinkronkan saat online.',
      error: '',
      data: localCategory,
      offline: true,
      pending: true
    }
  }

  // ============================
  // GET PENDING COUNT
  // ============================
  const getPendingCount = async () => {
    const outletGuid = getOutletGuid()
    const allPending = await localdb.pendingExpenseCategories.toArray()
    return allPending.filter((p) => p.outlet_guid === outletGuid && p.synced === false).length
  }

  return {
    getExpensesCategories,
    createExpensesCategory,
    getPendingCount
  }
}

export default ExpensesCategoryService
