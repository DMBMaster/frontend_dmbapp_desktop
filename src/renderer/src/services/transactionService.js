import { useAxiosInstance } from '@renderer/api/axiosInstance'
import { localdb } from '@renderer/config/localdb'
import { useNetworkStore } from '@renderer/store/networkStore'

// ================================
// TRANSACTION INTERFACES
// ================================
export const ITransactionItem = {
  // guid: string
  // name: string
  // qty: number
  // price: number
  // sub_total: number
  // satuan?: string
  // account_name?: string
  // no_room?: string
}

export const ITransaction = {
  // guid: string
  // transaction_no: string
  // booking_id?: string
  // refference_id?: string
  // reservation_number?: string
  // reservation_name?: string
  // channel?: string
  // booking_date?: string
  // created_at: string
  // checkin_time?: string
  // checkout_time?: string
  // check_in?: string
  // check_out?: string
  // product_name?: string
  // room?: string
  // no_polisi?: string
  // sub_total: number
  // discount_nominal?: number
  // grand_total: number
  // status: string
  // notes?: string
  // transaction_item: ITransactionItem[]
  // ticket?: {
  //   booking_id: string
  // }
}

export const IPayloadTransaction = {
  // outlet_id: string
  // reservation_name?: string
  // items: {
  //   product_guid: string
  //   qty: number
  //   price?: number
  // }[]
  // notes?: string
  // no_polisi?: string
  // payment_method?: string
  // amount_paid?: number
  // grand_total?: number
}

export const IPayloadPaymentUpdate = {
  // payment_method: string
  // payment_type?: string
  // amount_paid: number
  // bank_recipient?: string
  // bank_account_recipient?: string
  // reference_number?: string
  // sender_name?: string
  // approval_code?: string
  // trace_number?: string
  // attachment_url?: string
  // tenor?: string
  // card_type?: string
}

// ================================
// HELPER: Check if online from Zustand store
// ================================
const isOnline = () => useNetworkStore.getState().isOnline

// ================================
// SERVICE IMPLEMENTATION
// ================================
const TransactionService = () => {
  const axiosInstance = useAxiosInstance()
  const getOutletGuid = () => localStorage.getItem('outletGuid')

  // ============================
  // GET TRANSACTIONS LIST (HOTEL - v3)
  // ============================
  const getTransactions = async (params) => {
    const outletGuid = getOutletGuid()

    // Check network status FIRST - skip API call if offline
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading transactions from cache directly')
      return getTransactionsFromCache(outletGuid)
    }

    try {
      // ===== ONLINE - TRY API =====
      const res = await axiosInstance.get('/trx-service/v3/history-transaction', { params })
      const responseData = res.data

      // Cache ke Dexie (replace existing cache for this outlet)
      if (Array.isArray(responseData?.data)) {
        await localdb.transactions.where({ outlet_guid: outletGuid }).delete()
        await localdb.transactions.bulkAdd(
          responseData.data.map((trx) => ({
            outlet_guid: outletGuid,
            transaction_guid: trx.guid,
            data: trx,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      // API call failed - try cache
      console.warn('⚠️ API failed → Loading transactions from cache')
      return getTransactionsFromCache(outletGuid, error)
    }
  }

  // Helper: Get transactions from cache
  const getTransactionsFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.transactions.where({ outlet_guid: outletGuid }).toArray()

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
  // GET TRANSACTIONS V2 (NON-HOTEL)
  // ============================
  const getTransactionsV2 = async (params) => {
    const outletGuid = getOutletGuid()

    // Check network status FIRST - skip API call if offline
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading transactions v2 from cache directly')
      return getTransactionsV2FromCache(outletGuid, params)
    }

    try {
      // ===== ONLINE - TRY API =====
      const res = await axiosInstance.get('/trx-service/merchant/outlet/transactions-v2', { params })
      const responseData = res.data

      // Cache ke Dexie (replace existing cache for this outlet)
      if (Array.isArray(responseData?.data)) {
        await localdb.transactions.where({ outlet_guid: outletGuid }).delete()
        await localdb.transactions.bulkAdd(
          responseData.data.map((trx) => ({
            outlet_guid: outletGuid,
            transaction_guid: trx.guid,
            data: trx,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      // API call failed - try cache
      console.warn('⚠️ API failed → Loading transactions v2 from cache')
      return getTransactionsV2FromCache(outletGuid, params, error)
    }
  }

  // Helper: Get transactions v2 from cache (with pagination meta)
  const getTransactionsV2FromCache = async (outletGuid, params, originalError) => {
    const cached = await localdb.transactions.where({ outlet_guid: outletGuid }).toArray()

    if (!cached?.length) {
      if (originalError) throw originalError
      return {
        status: 'ok',
        status_code: 200,
        message: 'Tidak ada data cache',
        error: '',
        data: [],
        meta: {
          page: params?.p || 1,
          perPage: params?.ps || 10,
          totalCount: 0,
          pageCount: 0
        },
        offline: true
      }
    }

    const data = cached.map((c) => c.data)
    const page = params?.p || 1
    const perPage = params?.ps || 10
    const totalCount = data.length
    const pageCount = Math.ceil(totalCount / perPage)

    // Client-side pagination
    const startIndex = (page - 1) * perPage
    const endIndex = startIndex + perPage
    const paginatedData = data.slice(startIndex, endIndex)

    return {
      status: 'ok',
      status_code: 200,
      message: 'Data dari cache offline',
      error: '',
      data: paginatedData,
      meta: {
        page,
        perPage,
        totalCount,
        pageCount
      },
      offline: true
    }
  }

  // ============================
  // GET TRANSACTION DETAIL
  // ============================
  const getTransactionDetail = async (guid) => {
    const outletGuid = getOutletGuid()

    // Check network status FIRST
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading transaction detail from cache directly')
      return getTransactionDetailFromCache(guid)
    }

    try {
      // ===== ONLINE - TRY API =====
      const res = await axiosInstance.get(`/trx-service/v3/history-transaction/${guid}`)
      const detail = res.data?.data

      // Cache ke Dexie
      if (detail) {
        await localdb.transactionDetails.put({
          guid: detail.guid,
          outlet_guid: outletGuid,
          data: detail,
          updated_at: new Date().toISOString()
        })
      }

      return res.data
    } catch (error) {
      // API call failed - try cache
      console.warn('⚠️ API failed → Loading transaction detail from cache')
      return getTransactionDetailFromCache(guid, error)
    }
  }

  // Helper: Get transaction detail from cache
  const getTransactionDetailFromCache = async (guid, originalError) => {
    const cached = await localdb.transactionDetails.get(guid)

    if (!cached) {
      if (originalError) throw originalError
      return {
        status: 'error',
        status_code: 404,
        message: 'Data tidak ditemukan di cache',
        error: 'Not found in cache',
        data: null
      }
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
  // DELETE TRANSACTION
  // ============================
  const deleteTransaction = async (guid) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      // Queue for later sync
      await localdb.pendingDeletes.add({
        outlet_guid: outletGuid,
        entity_type: 'transaction',
        entity_guid: guid,
        created_at: new Date().toISOString(),
        synced: false
      })

      // Remove from cache
      await localdb.transactions.where({ transaction_guid: guid }).delete()
      await localdb.transactionDetails.delete(guid)

      return {
        status: 'ok',
        status_code: 200,
        message: 'Transaksi akan dihapus saat online',
        offline: true
      }
    }

    try {
      const res = await axiosInstance.delete(`/trx-service/v3/history-transaction/${guid}`)

      // Remove from cache after successful delete
      await localdb.transactions.where({ transaction_guid: guid }).delete()
      await localdb.transactionDetails.delete(guid)

      return res.data
    } catch (error) {
      console.error('Error deleting transaction:', error)
      throw error
    }
  }

  // ============================
  // UPDATE PAYMENT
  // ============================
  const updatePayment = async (guid, payload) => {
    try {
      const res = await axiosInstance.patch(
        `/trx-service/v3/history-transaction/${guid}/payment`,
        payload
      )
      return res.data
    } catch (error) {
      console.error('Error updating payment:', error)
      throw error
    }
  }

  // ============================
  // UPDATE TRANSACTION STATUS
  // ============================
  const updateTransaction = async (guid, payload) => {
    try {
      const res = await axiosInstance.patch(
        `/trx-service/transaction/${guid}`,
        payload
      )
      return res.data
    } catch (error) {
      console.error('Error updating transaction:', error)
      throw error
    }
  }

  // ============================
  // ADD TRANSACTION ITEM
  // ============================
  const addTransactionItem = async (transactionId, products) => {
    const requestBody = {
      transaction_id: transactionId,
      products: products
    }

    try {
      const res = await axiosInstance.post(
        `/trx-service/transaction-item`,
        requestBody
      )
      return res.data
    } catch (error) {
      console.error('Error adding transaction item:', error)
      throw error
    }
  }

  // ============================
  // GET PENDING COUNT
  // ============================
  const getPendingCount = async () => {
    const outletGuid = getOutletGuid()

    const allPendingDeletes = await localdb.pendingDeletes.toArray()
    const deletes = allPendingDeletes.filter(
      (p) => p.outlet_guid === outletGuid && p.entity_type === 'transaction' && p.synced === false
    ).length

    return deletes
  }

  // ============================
  // CLEAR CACHE
  // ============================
  const clearCache = async () => {
    const outletGuid = getOutletGuid()
    if (outletGuid) {
      await Promise.all([
        localdb.transactions.where({ outlet_guid: outletGuid }).delete(),
        localdb.transactionDetails.where({ outlet_guid: outletGuid }).delete()
      ])
    }
  }

  return {
    getTransactions,
    getTransactionsV2,
    getTransactionDetail,
    deleteTransaction,
    updatePayment,
    updateTransaction,
    addTransactionItem,
    getPendingCount,
    clearCache
  }
}

export default TransactionService
