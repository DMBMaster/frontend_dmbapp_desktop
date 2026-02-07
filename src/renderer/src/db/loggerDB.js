import Dexie from 'dexie'

export class LoggerDB extends Dexie {
  constructor() {
    super('SatuDMBLocalDB')

    this.version(1).stores({
      logs: '++id, type, action, created_at, [type+created_at]'
    })
  }
}

export const loggerDB = new LoggerDB()
