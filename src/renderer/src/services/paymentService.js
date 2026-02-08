import { useAxiosInstance } from '@renderer/api/axiosInstance'
import { localdb } from '@renderer/config/localdb'
import { useNetworkStore } from '@renderer/store/networkStore'

// ================================
// PAYMENT INTERFACES
// ================================
export const IPaymentMethod = {
  // id: string
  // name: string
  // type: string
  // account_no?: string
  // is_active: boolean
}

export const IPaymentUpdate = {
  // payment_method: string
  // payment_type?: string
  // amount_paid: number
  // bank_recipient?: string
  // bank_account_recipient?: string
  // bank_recipient_name?: string
  // reference_number?: string
  // sender_name?: string
  // approval_code?: string
  // trace_number?: string
  // attachment_url?: string
  // tenor?: string
  // card_type?: string
  // status?: string
  // paid_by?: string
  // paid_cash?: number
  // return_cash?: number
}

// ================================
// HELPER: Check if online from Zustand store
// ================================
const isOnline = () => useNetworkStore.getState().isOnline

// ================================
// SERVICE IMPLEMENTATION
// ================================
const PaymentService = () => {
  const axiosInstance = useAxiosInstance()
  const getOutletGuid = () => localStorage.getItem('outletGuid')

  // ============================
  // GET PAYMENT METHODS
  // ============================
  const getPaymentMethods = async () => {
    const outletGuid = getOutletGuid()

    // Check network status FIRST
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading payment methods from cache')
      return getPaymentMethodsFromCache(outletGuid)
    }

    try {
      // ===== ONLINE - TRY API =====
      const params = {
        outlet_id: outletGuid
      }
      const res = await axiosInstance.get('/payment-service/list-payment', { params })
      const responseData = res.data

      // Cache ke Dexie
      if (Array.isArray(responseData?.data)) {
        await localdb.paymentMethods.where({ outlet_guid: outletGuid }).delete()
        await localdb.paymentMethods.bulkAdd(
          responseData.data.map((payment) => ({
            outlet_guid: outletGuid,
            payment_id: payment.id,
            data: payment,
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
        message: 'Tidak ada data cache payment methods',
        error: '',
        data: [],
        offline: true
      }
    }

    return {
      status: 'ok',
      status_code: 200,
      message: 'Data payment methods dari cache offline',
      error: '',
      data: cached.map((c) => c.data),
      offline: true
    }
  }

  // ============================
  // UPDATE TRANSACTION PAYMENT
  // ============================
  const updateTransactionPayment = async (transactionGuid, payload) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      // Queue for later sync
      await localdb.pendingUpdates.add({
        outlet_guid: outletGuid,
        entity_type: 'transaction_payment',
        entity_guid: transactionGuid,
        payload: payload,
        created_at: new Date().toISOString(),
        synced: false
      })

      return {
        status: 'ok',
        status_code: 200,
        message: 'Payment akan diupdate saat online',
        offline: true
      }
    }

    try {
      const res = await axiosInstance.patch(`/trx-service/transaction/${transactionGuid}`, payload)

      // Update cache if successful
      const cachedTransaction = await localdb.transactionDetails.get(transactionGuid)
      if (cachedTransaction) {
        cachedTransaction.data = { ...cachedTransaction.data, ...payload }
        await localdb.transactionDetails.put(cachedTransaction)
      }

      return res.data
    } catch (error) {
      console.error('Error updating payment:', error)
      throw error
    }
  }

  // ============================
  // ADD TRANSACTION ITEM
  // ============================
  const addTransactionItem = async (transactionId, products) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      // Queue for later sync
      await localdb.pendingUpdates.add({
        outlet_guid: outletGuid,
        entity_type: 'transaction_item',
        entity_guid: transactionId,
        payload: { products },
        created_at: new Date().toISOString(),
        synced: false
      })

      return {
        status: 'ok',
        status_code: 200,
        message: 'Item akan ditambahkan saat online',
        offline: true
      }
    }

    try {
      const payload = {
        transaction_id: transactionId,
        products: products.map((product) => ({
          product_id: product.product_id,
          qty: product.qty.toString()
        }))
      }

      const res = await axiosInstance.post('/trx-service/transaction-item', payload)
      return res.data
    } catch (error) {
      console.error('Error adding transaction item:', error)
      throw error
    }
  }

  // ============================
  // CLEAR CACHE
  // ============================
  const clearCache = async () => {
    const outletGuid = getOutletGuid()
    if (outletGuid) {
      await Promise.all([
        localdb.paymentMethods.where({ outlet_guid: outletGuid }).delete(),
        localdb.pendingUpdates.where({ outlet_guid: outletGuid }).delete()
      ])
    }
  }

  return {
    getPaymentMethods,
    updateTransactionPayment,
    addTransactionItem,
    clearCache
  }
}

export default PaymentService
