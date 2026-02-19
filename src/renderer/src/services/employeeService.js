import { useAxiosInstance } from '@renderer/api/axiosInstance'
import { localdb } from '@renderer/config/localdb'
import { useNetworkStore } from '@renderer/store/networkStore'

const isOnline = () => useNetworkStore.getState().isOnline

const EmployeeService = () => {
  const axiosInstance = useAxiosInstance()
  const getOutletGuid = () => localStorage.getItem('outletGuid')

  const getEmployees = async (params) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading employees from cache directly')
      return getEmployeesFromCache(outletGuid)
    }

    try {
      const res = await axiosInstance.get('/product-service/employee', { params })
      const responseData = res.data

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
      console.warn('⚠️ API failed → Loading employees from cache')

      return getEmployeesFromCache(outletGuid, error)
    }
  }

  const changeOutletEmploye = async (data) => {
    try {
      const res = await axiosInstance.put(`/product-service/employee/change-outlet`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const forgotPassword = async (data) => {
    try {
      const res = await axiosInstance.post(`/user-service/forgot`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const resetPin = async (data) => {
    try {
      const res = await axiosInstance.post(`/user-service/reset-pin`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const importEmployee = async (data) => {
    try {
      const res = await axiosInstance.post(`/product-service/employee/import`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const createEmployee = async (data) => {
    try {
      const res = await axiosInstance.post(`/product-service/employee`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const assignShift = async (data) => {
    try {
      const res = await axiosInstance.post(`/attendance/employee-shift`, data)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const getShift = async (params) => {
    try {
      const res = await axiosInstance.get(`/attendance/shift`, { params })
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const checkEmailUser = async (email) => {
    try {
      const res = await axiosInstance.get(`/user-service/user-by?email=${email}`)
      return res.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

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
    getEmployees,
    changeOutletEmploye,
    forgotPassword,
    resetPin,
    importEmployee,
    getShift,
    checkEmailUser,
    assignShift,
    createEmployee
  }
}

export default EmployeeService
