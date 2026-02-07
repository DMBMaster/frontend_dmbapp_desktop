import { useAxiosInstance } from '@renderer/api/axiosInstance'
import { localdb } from '@renderer/config/localdb'
import { useNetworkStore } from '@renderer/store/networkStore'

// ================================
// HELPER: Check if online from Zustand store
// ================================
const isOnline = () => useNetworkStore.getState().isOnline

const TransactionDetailService = () => {
  const axiosInstance = useAxiosInstance()
  const getOutletGuid = () => localStorage.getItem('outletGuid') || ''

  // ============================
  // GET TRANSACTION DETAIL
  // ============================
  const getTransactionDetail = async (guid) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading transaction detail from cache directly')
      return getTransactionDetailFromCache(guid)
    }

    try {
      const response = await axiosInstance.get(`/trx-service/v2/transaction/${guid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      const responseData = response.data

      // Cache ke Dexie
      if (responseData?.data) {
        await localdb.transactionDetails.put({
          guid: guid,
          outlet_guid: outletGuid,
          data: responseData.data,
          updated_at: new Date().toISOString()
        })
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading transaction detail from cache')
      return getTransactionDetailFromCache(guid, error)
    }
  }

  // Helper: Get transaction detail from cache
  const getTransactionDetailFromCache = async (guid, originalError) => {
    const cached = await localdb.transactionDetails.get(guid)

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
  // GET BALANCE DUE
  // ============================
  const getBalanceDue = async (guid) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading balance due from cache directly')
      return getBalanceDueFromCache(guid)
    }

    try {
      const response = await axiosInstance.get(`/trx-service/balance-due/${guid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      const responseData = response.data

      // Cache ke Dexie
      if (responseData?.data !== undefined) {
        await localdb.balanceDue.put({
          guid: guid,
          outlet_guid: outletGuid,
          data: responseData.data,
          updated_at: new Date().toISOString()
        })
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading balance due from cache')
      return getBalanceDueFromCache(guid, error)
    }
  }

  // Helper: Get balance due from cache
  const getBalanceDueFromCache = async (guid, originalError) => {
    const cached = await localdb.balanceDue.get(guid)

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
  // GET BREAKFAST LIST
  // ============================
  const getBreakfastList = async (guid) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading breakfast list from cache directly')
      return getBreakfastListFromCache(guid)
    }

    try {
      const response = await axiosInstance.get(`/trx-service/breakfast/${guid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      const responseData = response.data

      // Cache ke Dexie
      if (responseData?.data) {
        await localdb.breakfastList.put({
          guid: guid,
          outlet_guid: outletGuid,
          data: responseData.data,
          updated_at: new Date().toISOString()
        })
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading breakfast list from cache')
      return getBreakfastListFromCache(guid, error)
    }
  }

  // Helper: Get breakfast list from cache
  const getBreakfastListFromCache = async (guid, originalError) => {
    const cached = await localdb.breakfastList.get(guid)

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
  // ADD TRANSACTION ITEM
  // ============================
  const addTransactionItem = async (data) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      await localdb.pendingTransactionItems.add({
        outlet_guid: outletGuid,
        entity_type: 'detail_transaction_item',
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
      console.warn('⚠️ API failed → Saving to offline queue')
      await localdb.pendingTransactionItems.add({
        outlet_guid: outletGuid,
        entity_type: 'detail_transaction_item',
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

  // ============================
  // ADD TRANSACTION PAYMENT
  // ============================
  const addTransactionPayment = async (data) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      await localdb.pendingPayments.add({
        outlet_guid: outletGuid,
        entity_type: 'detail_payment',
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
        entity_type: 'detail_payment',
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

  // ============================
  // ADD DEPOSIT
  // ============================
  const addDeposit = async (data) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      await localdb.pendingTransactionItems.add({
        outlet_guid: outletGuid,
        entity_type: 'detail_deposit',
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
        entity_type: 'detail_deposit',
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

  // ============================
  // ADD EXTENSION/ADDON
  // ============================
  const addExtension = async (data) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      await localdb.pendingTransactionItems.add({
        outlet_guid: outletGuid,
        entity_type: 'detail_extension',
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
        entity_type: 'detail_extension',
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
  // UPDATE GUEST INFORMATION
  // ============================
  const updateGuest = async (transactionId, guestData) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Update tamu tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    try {
      const response = await axiosInstance.put(
        `/trx-service/transactions/guest/${transactionId}`,
        guestData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error updating guest:', error)
      throw error
    }
  }

  // ============================
  // DELETE TRANSACTION ITEM
  // ============================
  const deleteTransactionItem = async (guid) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      await localdb.pendingDeletes.add({
        outlet_guid: outletGuid,
        entity_type: 'transaction_item',
        entity_guid: guid,
        created_at: new Date().toISOString(),
        synced: false
      })

      return {
        status: 'ok',
        status_code: 200,
        message: 'Penghapusan akan disinkronkan saat online.',
        error: '',
        offline: true,
        pending: true
      }
    }

    try {
      const response = await axiosInstance.delete(`/trx-service/transaction-items/${guid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.warn('⚠️ API failed → Saving delete to offline queue')
      await localdb.pendingDeletes.add({
        outlet_guid: outletGuid,
        entity_type: 'transaction_item',
        entity_guid: guid,
        created_at: new Date().toISOString(),
        synced: false
      })

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
  // CHANGE ROOM
  // ============================
  const changeRoom = async (data) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Pindah kamar tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    try {
      const response = await axiosInstance.post(`/trx-service/change-room`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error changing room:', error)
      throw error
    }
  }

  // ============================
  // CHANGE PRODUCT
  // ============================
  const changeProduct = async (data) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Ganti produk tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    try {
      const response = await axiosInstance.post(`/trx-service/change-product`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error changing product:', error)
      throw error
    }
  }

  // ============================
  // UPDATE TRANSACTION STATUS
  // ============================
  const updateTransactionStatus = async (productId, guid, status) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Update status tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    try {
      const response = await axiosInstance.put(
        `/trx-service/v2/transaction-item/status`,
        {
          product_id: productId,
          transaction_item_id: guid,
          status
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error updating transaction status:', error)
      throw error
    }
  }

  // ============================
  // GET ROOMS BY PRODUCT
  // ============================
  const getRoomsByProduct = async (productId) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading rooms from cache directly')
      return getRoomsByProductFromCache(outletGuid, productId)
    }

    try {
      const response = await axiosInstance.get(
        `/product-service/rooms-by-product-guid/${productId}`,
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
        // Cache rooms with product reference
        for (const room of responseData.data) {
          await localdb.rooms.put({
            outlet_guid: outletGuid,
            room_id: room.guid || room.id,
            product_id: productId,
            data: room,
            updated_at: new Date().toISOString()
          })
        }
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading rooms from cache')
      return getRoomsByProductFromCache(outletGuid, productId, error)
    }
  }

  // Helper: Get rooms by product from cache
  const getRoomsByProductFromCache = async (outletGuid, productId, originalError) => {
    const cached = await localdb.rooms.where({ outlet_guid: outletGuid }).toArray()
    const filtered = cached.filter((c) => c.product_id === productId)

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

  // ============================
  // CANCEL TRANSACTION
  // ============================
  const cancelTransaction = async (guid, reason) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Pembatalan tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    try {
      const response = await axiosInstance.post(
        `/trx-service/cancel`,
        {
          guid,
          reason
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error cancelling transaction:', error)
      throw error
    }
  }

  // ============================
  // GET PIN CODES
  // ============================
  const getPinCodes = async (transactionId) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'PIN code tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    try {
      const response = await axiosInstance.get(`/trx-service/pin-code/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error getting pin codes:', error)
      throw error
    }
  }

  // ============================
  // SEND PIN CODE
  // ============================
  const sendPinCode = async (data) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Kirim PIN tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    try {
      const response = await axiosInstance.post(`/trx-service/send-pin`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error sending pin code:', error)
      throw error
    }
  }

  // ============================
  // RESEND PIN CODE
  // ============================
  const resendPinCode = async (codePin) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Kirim ulang PIN tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    try {
      const response = await axiosInstance.post(
        `/trx-service/resend-pin`,
        { code_pin: codePin },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error resending pin code:', error)
      throw error
    }
  }

  // ============================
  // REQUEST PIN CODE
  // ============================
  const requestPinCode = async (guid) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Request PIN tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    try {
      const response = await axiosInstance.post(
        `/trx-service/request-pin`,
        { guid },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error requesting pin code:', error)
      throw error
    }
  }

  // ============================
  // UPLOAD FILE
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

  // ============================
  // OPEN PAYMENT POPUP
  // ============================
  const openPaymentPopup = async (guid) => {
    if (!isOnline()) {
      return {
        status: 'error',
        status_code: 503,
        message: 'Payment link tidak tersedia saat offline.',
        error: 'offline',
        data: null,
        offline: true
      }
    }

    try {
      const response = await axiosInstance.get(`/trx-service/payment-link/${guid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error getting payment link:', error)
      throw error
    }
  }

  // ============================
  // SYNC PENDING DATA
  // ============================
  const syncPendingDetailData = async () => {
    if (!isOnline()) return { synced: 0, failed: 0 }

    let synced = 0
    let failed = 0

    // Sync pending transaction items for detail service
    const allPendingItems = await localdb.pendingTransactionItems.toArray()
    const pendingDetailItems = allPendingItems.filter(
      (p) => p.synced === false && p.entity_type?.startsWith('detail_')
    )

    for (const item of pendingDetailItems) {
      try {
        let endpoint = ''
        switch (item.entity_type) {
          case 'detail_transaction_item':
            endpoint = '/trx-service/transaction-item'
            break
          case 'detail_deposit':
            endpoint = '/trx-service/transaction-deposit'
            break
          case 'detail_extension':
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
        console.error('Failed to sync pending detail item:', err)
        failed++
      }
    }

    // Sync pending payments for detail service
    const allPendingPayments = await localdb.pendingPayments.toArray()
    const pendingDetailPayments = allPendingPayments.filter(
      (p) => p.synced === false && p.entity_type === 'detail_payment'
    )

    for (const item of pendingDetailPayments) {
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
        console.error('Failed to sync pending detail payment:', err)
        failed++
      }
    }

    // Sync pending deletes for transaction items
    const allPendingDeletes = await localdb.pendingDeletes.toArray()
    const pendingItemDeletes = allPendingDeletes.filter(
      (p) => p.synced === false && p.entity_type === 'transaction_item'
    )

    for (const item of pendingItemDeletes) {
      try {
        await axiosInstance.delete(`/trx-service/transaction-items/${item.entity_guid}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
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

    const [allPendingItems, allPendingPayments, allPendingDeletes] = await Promise.all([
      localdb.pendingTransactionItems.toArray(),
      localdb.pendingPayments.toArray(),
      localdb.pendingDeletes.toArray()
    ])

    const items = allPendingItems.filter(
      (p) =>
        p.outlet_guid === outletGuid &&
        p.synced === false &&
        p.entity_type?.startsWith('detail_')
    ).length
    const payments = allPendingPayments.filter(
      (p) =>
        p.outlet_guid === outletGuid &&
        p.synced === false &&
        p.entity_type === 'detail_payment'
    ).length
    const deletes = allPendingDeletes.filter(
      (p) =>
        p.outlet_guid === outletGuid &&
        p.synced === false &&
        p.entity_type === 'transaction_item'
    ).length

    return items + payments + deletes
  }

  // ============================
  // CLEAR CACHE
  // ============================
  const clearCache = async () => {
    const outletGuid = getOutletGuid()
    if (outletGuid) {
      await Promise.all([
        localdb.transactionDetails.where({ outlet_guid: outletGuid }).delete(),
        localdb.balanceDue.where({ outlet_guid: outletGuid }).delete(),
        localdb.breakfastList.where({ outlet_guid: outletGuid }).delete()
      ])
    }
  }

  return {
    getTransactionDetail,
    getBalanceDue,
    getBreakfastList,
    addTransactionItem,
    addTransactionPayment,
    addDeposit,
    addExtension,
    updateGuest,
    deleteTransactionItem,
    changeRoom,
    changeProduct,
    updateTransactionStatus,
    getRoomsByProduct,
    cancelTransaction,
    getPinCodes,
    sendPinCode,
    resendPinCode,
    requestPinCode,
    uploadFile,
    openPaymentPopup,
    syncPendingDetailData,
    getPendingCount,
    clearCache
  }
}

export default TransactionDetailService
