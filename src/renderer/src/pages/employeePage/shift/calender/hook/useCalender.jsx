import { useNotifier } from '@renderer/components/core/NotificationProvider'
import EmployeeService from '@renderer/services/employeeService'
import { selectedOutlet } from '@renderer/utils/config'
import { useEffect, useState } from 'react'

export const UseCalender = () => {
  const today = new Date()
  const jakartaTime = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const firstDayOfMonth = new Date(jakartaTime.getFullYear(), jakartaTime.getMonth(), 1)
  const start_at = new Date(firstDayOfMonth)
  start_at.setDate(firstDayOfMonth.getDate() + 1)
  const end_at = new Date(jakartaTime)
  end_at.setDate(jakartaTime.getDate() + 1)
  const formatted_start_at = start_at.toISOString().split('T')[0]
  const formatted_end_at = end_at.toISOString().split('T')[0]

  const notifier = useNotifier()
  const employeeService = EmployeeService()

  const [attendanceData, setAttendanceData] = useState([])
  const [dates, setDates] = useState([])
  const [employees, setEmployees] = useState([])
  const [startDate, setStartDate] = useState(formatted_start_at)
  const [employeeId, setEmployeeId] = useState('')
  const [endDate, setEndDate] = useState(formatted_end_at)

  const [loading, setLoading] = useState({
    fetchEmployees: false,
    fetchData: false
  })

  const fetchData = async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      setLoading(true)
      const params = {
        // p: page,
        // ps: pageSize,
        outlet_id: selectedOutlet?.guid || null
      }

      if (startDate) {
        params.start_at = startDate
      }

      if (endDate) {
        params.end_at = endDate
      }

      if (employeeId) {
        params.user_id = employeeId
      }

      const response = await employeeService.getShiftEmployee(params)
      const { data } = response
      setAttendanceData(data)

      if (data.length > 0) {
        const allDates = new Set()

        data.forEach((employee) => {
          employee.schedule.forEach((shift) => {
            allDates.add(shift.date)
          })
        })

        setDates([...allDates])
      }
    } catch (err) {
      console.log(err)
      notifier.show({
        message: 'Gagal Mengambil Data Shift',
        description: err.response?.data?.message || 'Terjadi kesalahan pada server!',
        severity: 'error'
      })
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }

  const fetchEmployees = async () => {
    try {
      setLoading((prev) => ({ ...prev, fetchEmployees: true }))
      const params = {
        p: 1,
        ps: 20,
        outlet_id: selectedOutlet?.guid || null
      }

      const response = await employeeService.getEmployees(params)
      const data = response.data || []

      setEmployees(data)
    } catch (error) {
      console.log(error)
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Mengambil Data Employee',
        description: message,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchEmployees: false }))
    }
  }
  useEffect(() => {
    fetchEmployees()
    fetchData()
  }, [])

  return {
    loading,
    employees,
    setEmployees,
    startDate,
    setStartDate,
    employeeId,
    setEmployeeId,
    endDate,
    setEndDate,
    fetchData,
    attendanceData,
    dates
  }
}
