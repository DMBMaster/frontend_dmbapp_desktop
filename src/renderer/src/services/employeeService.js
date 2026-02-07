import { useAxiosInstance } from '@renderer/api/axiosInstance'
import { localdb } from '@renderer/config/localdb'
import { useNetworkStore } from '@renderer/store/networkStore'

// ================================
// HELPER: Check if online from Zustand store
// ================================
const isOnline = () => useNetworkStore.getState().isOnline

// ================================
// SERVICE IMPLEMENTATION
// ================================
const EmployeeService = () => {
  const axiosInstance = useAxiosInstance()
  const getOutletGuid = () => localStorage.getItem('outletGuid')

  // ============================
  // GET EMPLOYEES LIST
  // ============================
  const getEmployees = async (params) => {
    const outletGuid = getOutletGuid()

    // Check network status FIRST - skip API call if offline
    if (!isOnline()) {
      console.log('📴 Offline detected → Loading employees from cache directly')
      return getEmployeesFromCache(outletGuid)
    }

    try {
      // ===== ONLINE - TRY API =====
      const res = await axiosInstance.get('/product-service/employee', { params })
      const responseData = res.data

      // Cache ke Dexie (replace existing cache for this outlet)
      if (Array.isArray(responseData?.data)) {
        await localdb.employees.where({ outlet_guid: outletGuid }).delete()
        await localdb.employees.bulkAdd(
          responseData.data.map((employee) => ({
            outlet_guid: outletGuid,
            employee_id: employee.guid,
            data: employee,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      // API call failed - try cache
      console.warn('⚠️ API failed → Loading employees from cache')
      // Mark as offline since API failed
      // useNetworkStore.getState().setOffline()
      return getEmployeesFromCache(outletGuid, error)
    }
  }

  // Helper: Get employees from cache
  const getEmployeesFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.employees.where({ outlet_guid: outletGuid }).toArray()

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

  return {
    getEmployees
  }
}

export default EmployeeService
