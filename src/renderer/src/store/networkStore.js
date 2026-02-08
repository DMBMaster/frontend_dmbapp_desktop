import { create } from 'zustand'

// ================================
// SYNC REGISTRY (Singleton)
// Menyimpan daftar fungsi sync dari berbagai service
// ================================
const syncRegistry = new Map()

export const registerSyncFunction = (name, fn) => {
  syncRegistry.set(name, fn)
  console.log(`📝 Registered sync function: ${name}`)
}

export const unregisterSyncFunction = (name) => {
  syncRegistry.delete(name)
  console.log(`🗑️ Unregistered sync function: ${name}`)
}

export const getSyncRegistry = () => syncRegistry

// ================================
// NETWORK STATUS STORE
// ================================

export const useNetworkStore = create((set, get) => ({
  // Initial state - will be updated by main process via IPC
  isOnline: true,
  lastOnlineAt: new Date().toISOString(),
  lastOfflineAt: null,
  isSyncing: false,
  lastSyncResult: [],

  // Set online - triggers sync automatically
  setOnline: () => {
    const wasOffline = !get().isOnline
    set({
      isOnline: true,
      lastOnlineAt: new Date().toISOString()
    })
    console.log('🟢 Network: Online')

    // Auto-sync jika sebelumnya offline
    if (wasOffline) {
      console.log('🔄 Kembali online → mulai sinkronisasi...')
      // Wait a moment untuk pastikan connection stabil
      setTimeout(() => {
        get().syncAllPending()
      }, 500)
    }
  },

  // Set offline
  setOffline: () => {
    set({
      isOnline: false,
      lastOfflineAt: new Date().toISOString()
    })
    console.log('🔴 Network: Offline')
  },

  // Request manual check from main process via IPC
  checkConnection: async () => {
    try {
      const isOnline = await window.api.checkNetworkStatus()
      if (isOnline) {
        get().setOnline()
      } else {
        get().setOffline()
      }
      return isOnline
    } catch (error) {
      console.log('🔴 IPC network check failed:', error)
      get().setOffline()
      return false
    }
  },

  // Sync all pending data from all registered services
  syncAllPending: async () => {
    const state = get()

    // Skip if already syncing or offline
    if (state.isSyncing || !state.isOnline) {
      console.log('⏭️ Sync skipped:', state.isSyncing ? 'already syncing' : 'offline')
      return []
    }

    set({ isSyncing: true })
    console.log('🔄 Starting sync for all pending data...')

    const results = []

    for (const [serviceName, syncFn] of syncRegistry) {
      try {
        console.log(`🔄 Syncing: ${serviceName}...`)
        const result = await syncFn()
        results.push({
          service: serviceName,
          synced: result.synced,
          failed: result.failed
        })

        if (result.synced > 0) {
          console.log(`✅ ${serviceName}: ${result.synced} synced, ${result.failed} failed`)
        }
      } catch (error) {
        console.error(`❌ Error syncing ${serviceName}:`, error)
        results.push({
          service: serviceName,
          synced: 0,
          failed: -1 // -1 indicates error
        })
      }
    }

    set({ isSyncing: false, lastSyncResult: results })

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0)
    if (totalSynced > 0) {
      console.log(`✅ Sync complete: ${totalSynced} total items synced`)
    } else {
      console.log('✅ Sync complete: No pending items')
    }

    return results
  }
}))

// ================================
// NETWORK LISTENER HOOK
// ================================
// Call this once in App.jsx or main layout to setup listeners

export const initNetworkListeners = () => {
  const { setOnline, setOffline } = useNetworkStore.getState()

  // Listen to network status changes from main process via IPC
  const removeIpcListener = window.api.onNetworkStatusChanged((isOnline) => {
    console.log(`🌐 Received network status from main process: ${isOnline ? 'Online' : 'Offline'}`)
    if (isOnline) {
      setOnline()
    } else {
      setOffline()
    }
  })

  // Request initial check from main process
  console.log('🔍 Requesting initial network check from main process...')
  window.api.checkNetworkStatus().then((isOnline) => {
    if (isOnline) {
      setOnline()
    } else {
      setOffline()
    }
  })

  // Register sync functions for all services
  registerExpensesSyncFunction()
  registerExpenseCategorySyncFunction()
  registerComponentSyncFunction()
  registerTransactionDetailSyncFunction()
  registerReservationSyncFunction()
  registerCheckoutSyncFunction()

  // Return cleanup function
  return () => {
    // Remove IPC listener
    removeIpcListener()

    // Unregister all sync functions
    unregisterSyncFunction('expenses')
    unregisterSyncFunction('expenseCategories')
    unregisterSyncFunction('componentData')
    unregisterSyncFunction('transactionDetail')
    unregisterSyncFunction('reservations')
    unregisterSyncFunction('checkouts')
  }
}

// ================================
// REGISTER EXPENSES SYNC FUNCTION
// ================================
// Standalone sync function untuk expenses (tidak pakai hook)
const registerExpensesSyncFunction = () => {
  registerSyncFunction('expenses', async () => {
    // Import dinamis untuk menghindari circular dependency
    const { localdb } = await import('@renderer/config/localdb')
    const { createStandaloneAxiosB } = await import('@renderer/api/axiosInstanceB')

    // Gunakan standalone axios (bukan hook)
    const axiosInstance = createStandaloneAxiosB()
    let synced = 0
    let failed = 0

    try {
      // Get all pending expenses and filter by synced === false
      const allPendingExpenses = await localdb.pendingExpenses.toArray()
      const pendingCreates = allPendingExpenses.filter((p) => p.synced === false)

      console.log(`📤 Found ${pendingCreates.length} pending expenses to sync`)

      for (const item of pendingCreates) {
        try {
          await axiosInstance.post('/expenses', item.payload)
          await localdb.pendingExpenses.delete(item.id)
          synced++
          console.log(`✅ Synced expense ID: ${item.id}`)
        } catch (err) {
          console.error('Failed to sync pending expense:', err)
          failed++
        }
      }

      // Get all pending deletes and filter
      const allPendingDeletes = await localdb.pendingDeletes.toArray()
      const pendingDeletes = allPendingDeletes.filter(
        (p) => p.entity_type === 'expense' && p.synced === false
      )

      console.log(`📤 Found ${pendingDeletes.length} pending deletes to sync`)

      for (const item of pendingDeletes) {
        try {
          await axiosInstance.delete(`/expenses/${item.entity_guid}`)
          await localdb.pendingDeletes.delete(item.id)
          synced++
          console.log(`✅ Synced delete ID: ${item.id}`)
        } catch (err) {
          console.error('Failed to sync pending delete:', err)
          failed++
        }
      }
    } catch (error) {
      console.error('Error in expenses sync:', error)
    }

    return { synced, failed }
  })
}

// ================================
// REGISTER EXPENSE CATEGORIES SYNC FUNCTION
// ================================
const registerExpenseCategorySyncFunction = () => {
  registerSyncFunction('expenseCategories', async () => {
    const { localdb } = await import('@renderer/config/localdb')
    const { createStandaloneAxiosB } = await import('@renderer/api/axiosInstanceB')

    const axiosInstance = createStandaloneAxiosB()
    let synced = 0
    let failed = 0

    try {
      // Get all pending expense categories and filter by synced === false
      const allPending = await localdb.pendingExpenseCategories.toArray()
      const pendingCreates = allPending.filter((p) => p.synced === false)

      console.log(`📤 Found ${pendingCreates.length} pending expense categories to sync`)

      for (const item of pendingCreates) {
        try {
          await axiosInstance.post('/expenses/categories', item.payload)
          await localdb.pendingExpenseCategories.delete(item.id)
          synced++
          console.log(`✅ Synced expense category ID: ${item.id}`)
        } catch (err) {
          console.error('Failed to sync pending expense category:', err)
          failed++
        }
      }
    } catch (error) {
      console.error('Error in expense categories sync:', error)
    }

    return { synced, failed }
  })
}

// ================================
// REGISTER COMPONENT DATA SYNC FUNCTION
// (transaction items, deposits, extensions, payments)
// ================================
const registerComponentSyncFunction = () => {
  registerSyncFunction('componentData', async () => {
    const { localdb } = await import('@renderer/config/localdb')
    const { createStandaloneAxios } = await import('@renderer/api/axiosInstance')

    const axiosInstance = createStandaloneAxios()
    let synced = 0
    let failed = 0

    try {
      // Sync pending transaction items
      const allPendingItems = await localdb.pendingTransactionItems.toArray()
      const pendingItems = allPendingItems.filter((p) => p.synced === false)

      console.log(`📤 Found ${pendingItems.length} pending transaction items to sync`)

      for (const item of pendingItems) {
        try {
          let endpoint = ''
          switch (item.entity_type) {
            case 'transaction_item':
            case 'detail_transaction_item':
              endpoint = '/trx-service/transaction-item'
              break
            case 'transaction_deposit':
            case 'detail_deposit':
              endpoint = '/trx-service/transaction-deposit'
              break
            case 'extension_service':
            case 'detail_extension':
              endpoint = '/trx-service/v2/add-on'
              break
            default:
              continue
          }
          await axiosInstance.post(endpoint, item.payload)
          await localdb.pendingTransactionItems.delete(item.id)
          synced++
          console.log(`✅ Synced transaction item ID: ${item.id} (${item.entity_type})`)
        } catch (err) {
          console.error('Failed to sync pending transaction item:', err)
          failed++
        }
      }

      // Sync pending payments
      const allPendingPayments = await localdb.pendingPayments.toArray()
      const pendingPayments = allPendingPayments.filter((p) => p.synced === false)

      console.log(`📤 Found ${pendingPayments.length} pending payments to sync`)

      for (const item of pendingPayments) {
        try {
          await axiosInstance.post('/trx-service/add-payment', item.payload)
          await localdb.pendingPayments.delete(item.id)
          synced++
          console.log(`✅ Synced payment ID: ${item.id}`)
        } catch (err) {
          console.error('Failed to sync pending payment:', err)
          failed++
        }
      }

      // Sync pending deletes for transaction items
      const allPendingDeletes = await localdb.pendingDeletes.toArray()
      const pendingItemDeletes = allPendingDeletes.filter(
        (p) => p.entity_type === 'transaction_item' && p.synced === false
      )

      console.log(`📤 Found ${pendingItemDeletes.length} pending transaction item deletes to sync`)

      for (const item of pendingItemDeletes) {
        try {
          await axiosInstance.delete(`/trx-service/transaction-items/${item.entity_guid}`)
          await localdb.pendingDeletes.delete(item.id)
          synced++
          console.log(`✅ Synced transaction item delete ID: ${item.id}`)
        } catch (err) {
          console.error('Failed to sync pending transaction item delete:', err)
          failed++
        }
      }
    } catch (error) {
      console.error('Error in component data sync:', error)
    }

    return { synced, failed }
  })
}

// ================================
// REGISTER TRANSACTION DETAIL SYNC FUNCTION
// ================================
const registerTransactionDetailSyncFunction = () => {
  registerSyncFunction('transactionDetail', async () => {
    // This shares the same pending tables as componentData
    // but the actual sync is handled by componentData sync function
    // This function is kept for completeness and future separation
    return { synced: 0, failed: 0 }
  })
}

// ================================
// REGISTER RESERVATION SYNC FUNCTION
// ================================
const registerReservationSyncFunction = () => {
  registerSyncFunction('reservations', async () => {
    const { localdb } = await import('@renderer/config/localdb')
    const { createStandaloneAxios } = await import('@renderer/api/axiosInstance')

    const axiosInstance = createStandaloneAxios()
    let synced = 0
    let failed = 0

    try {
      const allPending = await localdb.pendingReservations.toArray()
      const pendingReservations = allPending.filter((p) => p.synced === false)

      console.log(`📤 Found ${pendingReservations.length} pending reservations to sync`)

      for (const item of pendingReservations) {
        try {
          await axiosInstance.post('/booking-service/instore-reservation', item.payload)
          await localdb.pendingReservations.update(item.id, { synced: true })
          synced++
          console.log(`✅ Synced reservation ID: ${item.id}`)
        } catch (err) {
          console.error('Failed to sync pending reservation:', err)
          failed++
        }
      }
    } catch (error) {
      console.error('Error in reservations sync:', error)
    }

    return { synced, failed }
  })
}

// ================================
// REGISTER CHECKOUT SYNC FUNCTION
// (Offline cart items → add to server cart → checkout)
// ================================
const registerCheckoutSyncFunction = () => {
  registerSyncFunction('checkouts', async () => {
    const { localdb } = await import('@renderer/config/localdb')
    const { createStandaloneAxios } = await import('@renderer/api/axiosInstance')

    const axiosInstance = createStandaloneAxios()
    let synced = 0
    let failed = 0

    try {
      const allPending = await localdb.pendingCheckouts.toArray()
      const pendingCheckouts = allPending.filter((p) => p.synced === false)

      console.log(`📤 Found ${pendingCheckouts.length} pending checkouts to sync`)

      for (const item of pendingCheckouts) {
        try {
          // Step 1: Clear any existing server cart first
          try {
            const existingCart = await axiosInstance.get('/merchant/sale/mycart')
            if (existingCart.data?.results?.items) {
              for (const cartItem of existingCart.data.results.items) {
                await axiosInstance.post(
                  `/merchant/sale/remove-cartitem/${cartItem.cart_items_id}`,
                  {}
                )
              }
            }
          } catch (clearErr) {
            console.warn('⚠️ Could not clear existing cart, proceeding anyway:', clearErr)
          }

          // Step 2: Add all offline cart items to server cart
          const offlineCartItems = item.offline_cart_items || []
          console.log(`📤 Adding ${offlineCartItems.length} items to server cart...`)

          let addFailed = false
          for (const cartPayload of offlineCartItems) {
            try {
              await axiosInstance.post('/merchant/sale/new-cart', cartPayload)
            } catch (addErr) {
              console.error('Failed to add cart item during sync:', addErr)
              addFailed = true
              break
            }
          }

          if (addFailed) {
            console.error(`❌ Failed to add all items for checkout ID: ${item.id}`)
            failed++
            continue
          }

          // Step 3: Perform checkout with the stored payload
          await axiosInstance.post('/merchant/sale/checkout', item.checkout_payload)

          // Step 4: Mark as synced and remove
          await localdb.pendingCheckouts.delete(item.id)
          synced++
          console.log(`✅ Synced checkout ID: ${item.id}`)
        } catch (err) {
          console.error('Failed to sync pending checkout:', err)
          failed++
        }
      }
    } catch (error) {
      console.error('Error in checkout sync:', error)
    }

    return { synced, failed }
  })
}
