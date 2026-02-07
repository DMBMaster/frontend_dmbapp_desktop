import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import DashboardService from '@renderer/services/dashboardService'
import { formatRupiah } from '@renderer/utils/myFunctions'

export const UseIndex = () => {
  const theme = useTheme()
  const dashboardService = DashboardService()

  // Theme colors
  const primary = theme.palette.primary.main
  const primaryLight = theme.palette.grey[100]
  const secondary = theme.palette.secondary.main
//   const secondaryLight = theme.palette.secondary.light
  const warning = theme.palette.warning.main
  const success = theme.palette.success.main
  const error = theme.palette.error.main

  // Current date defaults
  const currentYear = new Date().getFullYear().toString()
  const currentMonth = new Date().getMonth() + 1
  const defaultMonth = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`

  // States
  const [loading, setLoading] = useState(true)
  const [loadingChart, setLoadingChart] = useState(false)
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(defaultMonth)
  const [selectedOutlet, setSelectedOutlet] = useState('')
  const [outlets, setOutlets] = useState([])

  // Data states
  const [dashboardSummary, setDashboardSummary] = useState({
    booking_count: 0,
    booking_change_percentage: 0,
    check_in_count: 0,
    check_in_change_percentage: 0,
    check_out_count: 0,
    check_out_change_percentage: 0,
    total_revenue: 0,
    revenue_change_percentage: 0
  })
  const [yearlySales, setYearlySales] = useState([])
  const [monthlySales, setMonthlySales] = useState([])
  const [bookingChannel, setBookingChannel] = useState([])
  const [recentActivities, setRecentActivities] = useState([])

  // Year options
  const yearOptions = useMemo(() => {
    const years = []
    const startYear = 2020
    const endYear = parseInt(currentYear) + 1
    for (let y = startYear; y <= endYear; y++) {
      years.push(y.toString())
    }
    return years
  }, [currentYear])

  // Month options
  const monthOptions = useMemo(
    () => [
      { value: '01', label: 'Januari' },
      { value: '02', label: 'Februari' },
      { value: '03', label: 'Maret' },
      { value: '04', label: 'April' },
      { value: '05', label: 'Mei' },
      { value: '06', label: 'Juni' },
      { value: '07', label: 'Juli' },
      { value: '08', label: 'Agustus' },
      { value: '09', label: 'September' },
      { value: '10', label: 'Oktober' },
      { value: '11', label: 'November' },
      { value: '12', label: 'Desember' }
    ],
    []
  )

  // Yearly Sales Chart Options
  const yearlyChartOptions = useMemo(
    () => ({
      chart: {
        type: 'bar',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        foreColor: '#adb0bb',
        toolbar: { show: false },
        height: 295
      },
      colors: yearlySales.map((_, index) => {
        const currentMonthIndex = parseInt(month) - 1
        return index === currentMonthIndex ? primary : primaryLight
      }),
      plotOptions: {
        bar: {
          borderRadius: 3,
          columnWidth: '60%'
        }
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: {
        yaxis: { lines: { show: false } },
        xaxis: { lines: { show: false } }
      },
      xaxis: {
        categories: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec'
        ],
        labels: {
          style: { fontSize: '13px', colors: theme.palette.text.secondary }
        }
      },
      yaxis: {
        labels: {
          style: { fontSize: '12px', colors: theme.palette.text.secondary },
          formatter: (value) => formatRupiah(value || 0)
        }
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val) => `${formatRupiah(val || 0)}`
        }
      }
    }),
    [yearlySales, month, theme, primary, primaryLight]
  )

  // Booking Channel Chart Options
  const bookingChannelChartOptions = useMemo(
    () => ({
      color: '#adb0bb',
      chart: {
        type: 'pie',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        toolbar: { show: false },
        height: 200
      },
      colors: [primary, secondary, warning, success, error],
      plotOptions: {
        pie: {
          startAngle: 0,
          endAngle: 360,
          donut: {
            size: '75%'
          }
        }
      },
      stroke: { show: false },
      dataLabels: { enabled: false },
      legend: {
        show: true,
        position: 'bottom',
        width: 50,
        labels: {
          colors: theme.palette.text.secondary
        }
      },
      tooltip: {
        theme: 'dark',
        fillSeriesColor: false
      }
    }),
    [theme, primary, secondary, warning, success, error]
  )

  // Fetch Dashboard Summary
  const fetchDashboardSummary = async (params = {}) => {
    try {
      const response = await dashboardService.getDashboardSummary(params)
      setDashboardSummary(response)
    } catch (error) {
      console.error('Error fetching dashboard summary:', error)
    }
  }

  // Fetch Yearly Sales
  const fetchYearlySales = async (params = {}) => {
    setLoadingChart(true)
    try {
      const response = await dashboardService.getYearlySales(params)
      setYearlySales(response || [])
    } catch (error) {
      console.error('Error fetching yearly sales:', error)
    } finally {
      setLoadingChart(false)
    }
  }

  // Fetch Monthly Sales
  const fetchMonthlySales = async (params = {}) => {
    try {
      const response = await dashboardService.getMonthlySales(params)
      setMonthlySales(response || [])
    } catch (error) {
      console.error('Error fetching monthly sales:', error)
    }
  }

  // Fetch Booking Channel
  const fetchBookingChannel = async (params = {}) => {
    try {
      const response = await dashboardService.getBookingChannel(params)
      setBookingChannel(response || [])
    } catch (error) {
      console.error('Error fetching booking channel:', error)
    }
  }

  // Fetch Recent Activities
  const fetchRecentActivities = async (params = {}) => {
    try {
      const response = await dashboardService.getRecentActivities(params)
      setRecentActivities(response || [])
    } catch (error) {
      console.error('Error fetching recent activities:', error)
    }
  }

  // Fetch all data
  const fetchAllData = async (params = {}) => {
    setLoading(true)
    try {
      await Promise.all([
        fetchDashboardSummary(params),
        fetchYearlySales(params),
        fetchMonthlySales(params),
        fetchBookingChannel(params),
        fetchRecentActivities(params)
      ])
    } catch (error) {
      console.error('Error fetching all data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle filter changes
  const handleYearChange = (newYear) => {
    setYear(newYear)
    const params = { year: newYear, month, outlet_id: selectedOutlet }
    fetchAllData(params)
  }

  const handleMonthChange = (newMonth) => {
    setMonth(newMonth)
    const params = { year, month: newMonth, outlet_id: selectedOutlet }
    fetchAllData(params)
  }

  const handleOutletChange = (outletId) => {
    setSelectedOutlet(outletId)
    const params = { year, month, outlet_id: outletId }
    fetchAllData(params)
  }

  // Initial data fetch
  useEffect(() => {
    const outletsData = JSON.parse(localStorage.getItem('outlets') || '[]')
    setOutlets(outletsData)

    const defaultOutletId = localStorage.getItem('outletGuid') || ''
    setSelectedOutlet(defaultOutletId)

    fetchAllData({ year: currentYear, month: defaultMonth, outlet_id: defaultOutletId })
  }, [])

  return {
    // Loading states
    loading,
    loadingChart,

    // Filter states
    year,
    month,
    selectedOutlet,
    outlets,
    yearOptions,
    monthOptions,

    // Chart data
    dashboardSummary,
    yearlySales,
    monthlySales,
    bookingChannel,
    recentActivities,

    // Chart options
    yearlyChartOptions,
    bookingChannelChartOptions,

    // Handlers
    handleYearChange,
    handleMonthChange,
    handleOutletChange,
    fetchAllData
  }
}
