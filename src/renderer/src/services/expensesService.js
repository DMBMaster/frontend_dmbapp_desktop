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
const ExpensesService = () => {
  const axiosInstance = useAxiosInstanceB()
  const getOutletGuid = () => localStorage.getItem('outletGuid')

  // ============================
  // GET EXPENSES LIST
  // ============================
  const getExpenses = async (params) => {
    const outletGuid = getOutletGuid()

    // Check network status FIRST - skip API call if offline
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading expenses from cache directly')
      return getExpensesFromCache(outletGuid)
    }

    try {
      // ===== ONLINE - TRY API =====
      const res = await axiosInstance.get('/expenses', { params })
      const responseData = res.data

      // Cache ke Dexie (replace existing cache for this outlet)
      if (Array.isArray(responseData?.data)) {
        await localdb.expenses.where({ outlet_guid: outletGuid }).delete()
        await localdb.expenses.bulkAdd(
          responseData.data.map((expense) => ({
            outlet_guid: outletGuid,
            expense_guid: expense.guid,
            data: expense,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      // API call failed - try cache
      console.warn('⚠️ API failed → Loading expenses from cache')
      // Mark as offline since API failed
      // useNetworkStore.getState().setOffline()
      return getExpensesFromCache(outletGuid, error)
    }
  }

  // Helper: Get expenses from cache
  const getExpensesFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.expenses.where({ outlet_guid: outletGuid }).toArray()

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
  // GET EXPENSES DETAIL
  // ============================
  const getExpensesDetail = async (guid) => {
    const outletGuid = getOutletGuid()

    // Check network status FIRST
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading expense detail from cache directly')
      return getExpenseDetailFromCache(guid)
    }

    try {
      // ===== ONLINE - TRY API =====
      const res = await axiosInstance.get(`/expenses/${guid}`)
      const detail = res.data?.data

      // Cache ke Dexie
      if (detail) {
        await localdb.expenseDetails.put({
          guid: detail.guid,
          outlet_guid: outletGuid,
          data: detail,
          updated_at: new Date().toISOString()
        })
      }

      return res.data
    } catch (error) {
      // API call failed - try cache
      console.warn('⚠️ API failed → Loading expense detail from cache')
      // useNetworkStore.getState().setOffline()
      return getExpenseDetailFromCache(guid, error)
    }
  }

  // Helper: Get expense detail from cache
  const getExpenseDetailFromCache = async (guid, originalError) => {
    const cached = await localdb.expenseDetails.get(guid)

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
  // CREATE EXPENSES
  // ============================
  const createExpenses = async (payload) => {
    const outletGuid = getOutletGuid()

    // Check if online
    if (isOnline()) {
      try {
        // ===== TRY ONLINE =====
        const res = await axiosInstance.post('/expenses', payload)
        return res.data
      } catch (err) {
        // Network error, save to pending queue
        console.warn('⚠️ Create failed → Saving to offline queue', err)
        await saveToPendingQueue(outletGuid, payload)

        return {
          status: 'ok',
          status_code: 200,
          message: 'Pengeluaran disimpan offline. Akan disinkronkan saat online.',
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
        message: 'Pengeluaran disimpan offline. Akan disinkronkan saat online.',
        error: '',
        offline: true,
        pending: true
      }
    }
  }

  // Helper: Save to pending queue
  const saveToPendingQueue = async (outletGuid, payload) => {
    await localdb.pendingExpenses.add({
      outlet_guid: outletGuid,
      payload: payload,
      created_at: new Date().toISOString(),
      synced: false
    })
  }

  // ============================
  // UPDATE EXPENSES
  // ============================
  const updateExpenses = async (guid, payload) => {
    try {
      const res = await axiosInstance.patch(`/expenses/${guid}`, payload)

      // Update cache if exists
      const cached = await localdb.expenseDetails.get(guid)
      if (cached && cached.data) {
        const existingData = cached.data
        await localdb.expenseDetails.update(guid, {
          data: { ...existingData, ...payload },
          updated_at: new Date().toISOString()
        })
      }

      return res.data
    } catch (err) {
      console.error('Error updating expense:', err)
      throw err
    }
  }

  // ============================
  // DELETE EXPENSE
  // ============================
  const deleteExpense = async (guid) => {
    const outletGuid = getOutletGuid()

    if (isOnline()) {
      try {
        const res = await axiosInstance.delete(`/expenses/${guid}`)

        // Remove from cache
        await localdb.expenses.where({ expense_guid: guid }).delete()
        await localdb.expenseDetails.delete(guid)

        return res.data
      } catch (err) {
        // Save delete to pending queue
        console.warn('⚠️ Delete failed → Saving to offline queue', err)
        await localdb.pendingDeletes.add({
          outlet_guid: outletGuid,
          entity_type: 'expense',
          entity_guid: guid,
          created_at: new Date().toISOString(),
          synced: false
        })

        // Remove from local cache anyway
        await localdb.expenses.where({ expense_guid: guid }).delete()
        await localdb.expenseDetails.delete(guid)

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
        entity_type: 'expense',
        entity_guid: guid,
        created_at: new Date().toISOString(),
        synced: false
      })

      // Remove from local cache
      await localdb.expenses.where({ expense_guid: guid }).delete()
      await localdb.expenseDetails.delete(guid)

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
  // SYNC PENDING EXPENSES
  // ============================
  const syncPendingExpenses = async () => {
    let synced = 0
    let failed = 0

    // Get all and filter - more reliable than compound query with boolean
    const allPendingExpenses = await localdb.pendingExpenses.toArray()
    const pendingCreates = allPendingExpenses.filter((p) => p.synced === false)

    for (const item of pendingCreates) {
      try {
        await axiosInstance.post('/expenses', item.payload)
        await localdb.pendingExpenses.delete(item.id)
        synced++
      } catch (err) {
        console.error('Failed to sync pending expense:', err)
        failed++
      }
    }

    // Sync pending deletes
    const allPendingDeletes = await localdb.pendingDeletes.toArray()
    const pendingDeletes = allPendingDeletes.filter(
      (p) => p.entity_type === 'expense' && p.synced === false
    )

    for (const item of pendingDeletes) {
      try {
        await axiosInstance.delete(`/expenses/${item.entity_guid}`)
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
  // APPROVE EXPENSE
  // ============================
  const approveExpenseApproval = async (approvalId, payload) => {
    try {
      const res = await axiosInstance.patch(`/expense-approvals/${approvalId}/approve`, payload)
      return res.data
    } catch (error) {
      console.error('Error approving expense:', error)
      throw error
    }
  }

  // ============================
  // REJECT EXPENSE
  // ============================
  const rejectExpenseApproval = async (approvalId, payload) => {
    try {
      const res = await axiosInstance.patch(`/expense-approvals/${approvalId}/reject`, payload)
      return res.data
    } catch (error) {
      console.error('Error rejecting expense:', error)
      throw error
    }
  }

  // ============================
  // GET PENDING COUNT
  // ============================
  const getPendingCount = async () => {
    const outletGuid = getOutletGuid()

    // Get all and filter - more reliable than compound query with boolean
    const [allPendingExpenses, allPendingDeletes] = await Promise.all([
      localdb.pendingExpenses.toArray(),
      localdb.pendingDeletes.toArray()
    ])

    const creates = allPendingExpenses.filter(
      (p) => p.outlet_guid === outletGuid && p.synced === false
    ).length
    const deletes = allPendingDeletes.filter(
      (p) => p.outlet_guid === outletGuid && p.entity_type === 'expense' && p.synced === false
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
        localdb.expenses.where({ outlet_guid: outletGuid }).delete(),
        localdb.expenseDetails.where({ outlet_guid: outletGuid }).delete()
      ])
    }
  }

  return {
    getExpenses,
    getExpensesDetail,
    createExpenses,
    updateExpenses,
    deleteExpense,
    syncPendingExpenses,
    approveExpenseApproval,
    rejectExpenseApproval,
    getPendingCount,
    clearCache
  }
}

export default ExpensesService
