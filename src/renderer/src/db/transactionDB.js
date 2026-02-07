import Dexie from 'dexie'

export class TransactionDB extends Dexie {
  constructor() {
    super('SatuDMBTransactionDB')

    this.version(1).stores({
      transactions: 'id, status, isPrinted, isNotified, date, outletId, lastUpdated'
    })
  }
}

export const transactionDB = new TransactionDB()
