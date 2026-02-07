import Dexie from 'dexie'

class LocalDatabase extends Dexie {
  // Tables
  // expenses
  // expenseDetails
  // pendingExpenses
  // pendingDeletes
  // settings
  // expensesCategories
  // employees
  // dashboardCache
  // pendingExpenseCategories

  // Products
  // products
  // productDetails
  // pendingProducts

  // Product Categories
  // productCategories
  // productCategoryDetails
  // pendingProductCategories

  // Transactions
  // transactions
  // transactionDetails

  // Instore / Component / Cart cache
  // customers
  // rooms
  // roomTypes
  // ratePlans
  // bankOptions
  // cartProducts
  // cartCache
  // units
  // balanceDue
  // breakfastList
  // transactionPayments
  // pendingReservations
  // pendingTransactionItems
  // pendingPayments

  // Offline cart (walk-in sale)
  // offlineCartItems
  // pendingCheckouts

  constructor() {
    super('dmbapp_db')

    this.version(11).stores({
      // Expenses
      expenses: '++id, outlet_guid, expense_guid, updated_at',
      expenseDetails: 'guid, outlet_guid, updated_at',
      pendingExpenses: '++id, outlet_guid, created_at, synced',
      pendingDeletes: '++id, outlet_guid, entity_type, entity_guid, synced',

      // Reference data
      expensesCategories: '++id, outlet_guid, category_id, updated_at',
      employees: '++id, outlet_guid, employee_id, updated_at',

      // Dashboard
      dashboardCache: '++id, outlet_guid, cache_type, cache_key, updated_at',

      // Pending queues
      pendingExpenseCategories: '++id, outlet_guid, created_at, synced',
      pendingUpdates: '++id, outlet_guid, entity_type, entity_guid, created_at, synced',

      // Products
      products: '++id, outlet_guid, product_guid, updated_at',
      productDetails: 'guid, outlet_guid, updated_at',
      pendingProducts: '++id, outlet_guid, created_at, synced',

      // Product Categories
      productCategories: '++id, outlet_guid, category_guid, updated_at',
      productCategoryDetails: 'guid, outlet_guid, updated_at',
      pendingProductCategories: '++id, outlet_guid, created_at, synced',

      // Transactions
      transactions: '++id, outlet_guid, transaction_guid, updated_at',
      transactionDetails: 'guid, outlet_guid, updated_at',

      // Payment Methods
      paymentMethods: '++id, outlet_guid, payment_id, updated_at',

      // Customers
      customers: '++id, outlet_guid, customer_id, updated_at',

      // Rooms & Room Types
      rooms: '++id, outlet_guid, room_id, updated_at',
      roomTypes: '++id, outlet_guid, room_type_id, updated_at',

      // Rate Plans
      ratePlans: '++id, outlet_guid, rate_plan_id, updated_at',

      // Bank / Payment Options (component/cart level)
      bankOptions: '++id, outlet_guid, bank_id, updated_at',

      // Cart
      cartProducts: '++id, outlet_guid, product_id, updated_at',
      cartCache: '++id, outlet_guid, cache_key, updated_at',

      // Units / Satuan
      units: '++id, outlet_guid, unit_id, updated_at',

      // Balance Due cache
      balanceDue: 'guid, outlet_guid, updated_at',

      // Breakfast List cache
      breakfastList: 'guid, outlet_guid, updated_at',

      // Transaction Payments cache
      transactionPayments: '++id, outlet_guid, transaction_id, updated_at',

      // Pending queues for instore/component/cart
      pendingReservations: '++id, outlet_guid, created_at, synced',
      pendingTransactionItems: '++id, outlet_guid, entity_type, created_at, synced',
      pendingPayments: '++id, outlet_guid, created_at, synced',

      // Offline cart items (walk-in sale)
      offlineCartItems: '++id, outlet_guid, product_id, created_at',

      // Pending checkouts (offline checkout queue)
      pendingCheckouts: '++id, outlet_guid, created_at, synced',

      // Settings
      settings: 'key'
    })
  }

  // ================================
  // HELPER METHODS
  // ================================

  /**
   * Clear all cache for a specific outlet
   */
  async clearOutletCache(outletGuid) {
    await Promise.all([
      this.expenses.where({ outlet_guid: outletGuid }).delete(),
      this.expenseDetails.where({ outlet_guid: outletGuid }).delete(),
      this.expensesCategories.where({ outlet_guid: outletGuid }).delete(),
      this.employees.where({ outlet_guid: outletGuid }).delete(),
      this.dashboardCache.where({ outlet_guid: outletGuid }).delete(),
      this.products.where({ outlet_guid: outletGuid }).delete(),
      this.productDetails.where({ outlet_guid: outletGuid }).delete(),
      this.productCategories.where({ outlet_guid: outletGuid }).delete(),
      this.productCategoryDetails.where({ outlet_guid: outletGuid }).delete(),
      this.transactions.where({ outlet_guid: outletGuid }).delete(),
      this.transactionDetails.where({ outlet_guid: outletGuid }).delete(),
      this.paymentMethods.where({ outlet_guid: outletGuid }).delete(),
      this.pendingUpdates.where({ outlet_guid: outletGuid }).delete(),
      this.customers.where({ outlet_guid: outletGuid }).delete(),
      this.rooms.where({ outlet_guid: outletGuid }).delete(),
      this.roomTypes.where({ outlet_guid: outletGuid }).delete(),
      this.ratePlans.where({ outlet_guid: outletGuid }).delete(),
      this.bankOptions.where({ outlet_guid: outletGuid }).delete(),
      this.cartProducts.where({ outlet_guid: outletGuid }).delete(),
      this.cartCache.where({ outlet_guid: outletGuid }).delete(),
      this.units.where({ outlet_guid: outletGuid }).delete(),
      this.balanceDue.where({ outlet_guid: outletGuid }).delete(),
      this.breakfastList.where({ outlet_guid: outletGuid }).delete(),
      this.transactionPayments.where({ outlet_guid: outletGuid }).delete(),
      this.offlineCartItems.where({ outlet_guid: outletGuid }).delete()
    ])
  }

  /**
   * Clear all data (logout)
   */
  async clearAllData() {
    await Promise.all([
      this.expenses.clear(),
      this.expenseDetails.clear(),
      this.pendingExpenses.clear(),
      this.pendingDeletes.clear(),
      this.expensesCategories.clear(),
      this.employees.clear(),
      this.dashboardCache.clear(),
      this.pendingExpenseCategories.clear(),
      this.products.clear(),
      this.productDetails.clear(),
      this.pendingProducts.clear(),
      this.productCategories.clear(),
      this.productCategoryDetails.clear(),
      this.pendingProductCategories.clear(),
      this.transactions.clear(),
      this.transactionDetails.clear(),
      this.paymentMethods.clear(),
      this.customers.clear(),
      this.rooms.clear(),
      this.roomTypes.clear(),
      this.ratePlans.clear(),
      this.bankOptions.clear(),
      this.cartProducts.clear(),
      this.cartCache.clear(),
      this.units.clear(),
      this.balanceDue.clear(),
      this.breakfastList.clear(),
      this.transactionPayments.clear(),
      this.pendingReservations.clear(),
      this.pendingTransactionItems.clear(),
      this.pendingPayments.clear(),
      this.offlineCartItems.clear(),
      this.pendingCheckouts.clear()
    ])
  }

  /**
   * Get pending sync count
   */
  async getPendingSyncCount() {
    const allPending = await Promise.all([
      this.pendingExpenses.toArray(),
      this.pendingDeletes.toArray(),
      this.pendingExpenseCategories.toArray(),
      this.pendingProducts.toArray(),
      this.pendingProductCategories.toArray(),
      this.pendingReservations.toArray(),
      this.pendingTransactionItems.toArray(),
      this.pendingPayments.toArray(),
      this.pendingCheckouts.toArray()
    ])

    const [
      expenses,
      deletes,
      expenseCategories,
      products,
      productCategories,
      reservations,
      transactionItems,
      payments,
      checkouts
    ] = allPending
    return (
      expenses.filter((p) => p.synced === false).length +
      deletes.filter((p) => p.synced === false).length +
      expenseCategories.filter((p) => p.synced === false).length +
      products.filter((p) => p.synced === false).length +
      productCategories.filter((p) => p.synced === false).length +
      reservations.filter((p) => p.synced === false).length +
      transactionItems.filter((p) => p.synced === false).length +
      payments.filter((p) => p.synced === false).length +
      checkouts.filter((p) => p.synced === false).length
    )
  }
}

// Export singleton instance
export const localdb = new LocalDatabase()
