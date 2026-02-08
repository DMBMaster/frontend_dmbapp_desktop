import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import dayjs from 'dayjs'
import DashboardService from '@renderer/services/dashboardService'

export const UseIndex = () => {
  const theme = useTheme()
  const dashboardService = DashboardService()

  // ================================
  // THEME COLORS
  // ================================
  const primary = theme.palette.primary.main
  const primarylight = theme.palette.grey[100]
  const secondary = theme.palette.secondary.main
  const secondarylight = theme.palette.secondary.light
  const warning = theme.palette.warning.main

  // ================================
  // DATE DEFAULTS
  // ================================
  const currentYear = new Date().getFullYear().toString()
  const currentMonth = new Date().getMonth() + 1
  const defaultMonth = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`

  // ================================
  // STATES
  // ================================
  const [loading, setLoading] = useState(true)
  const [loadingChart, setLoadingChart] = useState(false)
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(defaultMonth)
  const [selectedOutlet, setSelectedOutlet] = useState('')

  // Data states
  const [dashboardData, setDashboardData] = useState({})
  const [recentActivities, setRecentActivities] = useState([])
  const [bookingList, setBookingList] = useState([])
  const [bookingChannel, setBookingChannel] = useState([])

  // Chart states (yearly)
  const [optionscolumnchartYear, setOptionsColumnChartYear] = useState({
    chart: {
      type: 'bar',
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: '#adb0bb',
      toolbar: { show: false },
      height: 295
    },
    colors: [primarylight, primarylight, primary, primarylight, primarylight, primarylight],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '45%',
        distributed: true,
        endingShape: 'rounded'
      }
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: { yaxis: { lines: { show: false } } },
    xaxis: {
      categories: [],
      axisBorder: { show: false }
    },
    yaxis: { labels: { show: false } },
    tooltip: {
      y: {
        formatter: (value) => formatNumber(value)
      },
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light'
    }
  })

  const [seriescolumnchartYear, setSeriesColumnChartYear] = useState([
    {
      name: 'Total Sales',
      data: []
    }
  ])

  // Chart states (monthly)
  const [optionscolumnchartMonth, setOptionsColumnChartMonth] = useState({
    chart: {
      type: 'bar',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: '#adb0bb',
      toolbar: { show: false },
      height: 295
    },
    colors: [primarylight, primarylight, primary, primarylight, primarylight, primarylight],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '45%',
        distributed: true,
        endingShape: 'rounded'
      }
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: { yaxis: { lines: { show: false } } },
    xaxis: {
      categories: [],
      axisBorder: { show: false }
    },
    yaxis: { labels: { show: false } },
    tooltip: {
      y: {
        formatter: (value) => formatNumber(value)
      },
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light'
    }
  })

  const [seriescolumnchartMonth, setSeriesColumnChartMonth] = useState([
    {
      name: 'Total Sales',
      data: []
    }
  ])

  // ================================
  // STATIC CHART CONFIGS
  // ================================
  const optionscolumnchart = useMemo(
    () => ({
      chart: {
        type: 'bar',
        fontFamily: "'Plus Jakarta Sans', sans-serif;",
        foreColor: '#adb0bb',
        toolbar: { show: false },
        height: 25,
        resize: true,
        barColor: '#fff',
        offsetX: -15,
        sparkline: { enabled: true }
      },
      colors: [primary],
      grid: { show: false },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '100%',
          borderRadius: 3,
          distributed: true
        }
      },
      dataLabels: { enabled: false },
      stroke: {
        show: true,
        width: 5,
        colors: ['rgba(0,0,0,0.01)']
      },
      xaxis: {
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { show: false }
      },
      yaxis: { labels: { show: false } },
      axisBorder: { show: false },
      fill: { opacity: 1 },
      tooltip: {
        theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
        x: { show: false },
        responsive: [
          {
            breakpoint: 767,
            options: {
              chart: { height: 60 },
              plotOptions: { bar: { columnWidth: '60%' } }
            }
          }
        ]
      }
    }),
    [primary, theme.palette.mode]
  )

  const seriescolumnchart = useMemo(
    () => [
      {
        name: '',
        data: [100, 60, 35, 90, 35, 100]
      }
    ],
    []
  )

  // ================================
  // COMPUTED: Doughnut chart from bookingChannel
  // ================================
  const seriesdoughnutchart = useMemo(
    () => bookingChannel.map((item) => Number(item.total)),
    [bookingChannel]
  )

  const labelsdoughnutchart = useMemo(
    () => bookingChannel.map((item) => item.extranet),
    [bookingChannel]
  )

  const optionsdoughnutchart = useMemo(
    () => ({
      chart: { type: 'donut' },
      labels: labelsdoughnutchart,
      legend: {
        position: 'right',
        margin: '12px',
        fontSize: '12px',
        fontFamily: 'sans-serif',
        formatter: function (seriesName, opts) {
          const value = seriesdoughnutchart[opts.seriesIndex]
          const total = seriesdoughnutchart.reduce((a, b) => a + b, 0)
          const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
          return `${percent}% ${seriesName}`
        }
      },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: { size: '55%' }
        }
      },
      tooltip: {
        y: {
          formatter: (val) => Number(val).toLocaleString()
        }
      },
      colors: [primary, primarylight, secondary, secondarylight, warning]
    }),
    [
      labelsdoughnutchart,
      seriesdoughnutchart,
      primary,
      primarylight,
      secondary,
      secondarylight,
      warning
    ]
  )

  // ================================
  // OPTIONS
  // ================================
  const yearOptions = useMemo(() => {
    const years = []
    const currentYearInt = parseInt(currentYear)
    const startYear = currentYearInt - 4
    const endYear = currentYearInt
    for (let y = startYear; y <= endYear; y++) {
      years.push(y.toString())
    }
    return years.reverse() // Tampilkan dari tahun terbaru
  }, [currentYear])

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

  // ================================
  // HELPERS
  // ================================
  function formatNumber(value) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const fetchDashboard = async () => {
    try {
      const outletId = localStorage.getItem('outletGuid')
      const result = await dashboardService.getDashboardSummary({ outlet_id: outletId })
      setDashboardData(result.data || {})
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
  }

  const fetchRecentActivities = async () => {
    try {
      const outletId = localStorage.getItem('outletGuid')
      const result = await dashboardService.getRecentActivities({
        p: 1,
        ps: 6,
        outlet_id: outletId
      })
      setRecentActivities(result.data || [])
    } catch (error) {
      console.error('Error fetching recent activities:', error)
    }
  }

  const fetchBookingList = async () => {
    try {
      const outletId = localStorage.getItem('outletGuid')
      const result = await dashboardService.getBookingList({
        p: 1,
        ps: 5,
        outlet_id: outletId,
        ob: 'transaction.created_at',
        d: 'DESC',
        date_of: 'booking'
      })
      setBookingList(result.data || [])
    } catch (error) {
      console.error('Error fetching booking list:', error)
    }
  }

  const fetchBookingChannel = async () => {
    try {
      const outletId = localStorage.getItem('outletGuid')
      const start_at = dayjs().startOf('month').format('YYYY-MM-DD')
      const end_at = dayjs().endOf('month').format('YYYY-MM-DD')
      const result = await dashboardService.getBookingChannel({
        outlet_id: outletId,
        start_at,
        end_at
      })
      setBookingChannel(result.data || [])
    } catch (error) {
      console.error('Error fetching booking channel:', error)
    }
  }

  const fetchYearlyData = async (selectedYear) => {
    setLoadingChart(true)
    try {
      const result = await dashboardService.getYearlySales({
        type: 'non-ppob',
        year: selectedYear,
        merchant_id: localStorage.getItem('outletGuid')
      })

      const data = result.data || []
      const monthNames = {
        '01': 'Jan',
        '02': 'Feb',
        '03': 'Mar',
        '04': 'Apr',
        '05': 'May',
        '06': 'Jun',
        '07': 'Jul',
        '08': 'Aug',
        '09': 'Sep',
        10: 'Oct',
        11: 'Nov',
        12: 'Dec'
      }

      const categories = data.map((item) => monthNames[item.month] || item.month)
      const salesData = data.map((item) => Number(item.total_sales))

      setOptionsColumnChartYear((prev) => ({
        ...prev,
        xaxis: { ...prev.xaxis, categories }
      }))
      setSeriesColumnChartYear([{ name: 'Total Sales', data: salesData }])
    } catch (error) {
      console.error('Error fetching yearly data:', error)
    } finally {
      setLoadingChart(false)
    }
  }

  const fetchMonthlyData = async (selectedYear, selectedMonth) => {
    setLoadingChart(true)
    try {
      const result = await dashboardService.getMonthlySales({
        type: 'non-ppob',
        year: selectedYear,
        month: selectedMonth,
        merchant_id: localStorage.getItem('outletGuid')
      })

      const data = result.data || []
      const formattedData = data.map((item) => Number(item.total_sales))
      const categories = data.map((item) => item.day)

      setOptionsColumnChartMonth((prev) => ({
        ...prev,
        xaxis: { ...prev.xaxis, categories }
      }))
      setSeriesColumnChartMonth([{ name: 'Total Sales', data: formattedData }])
    } catch (error) {
      console.error('Error fetching monthly data:', error)
    } finally {
      setLoadingChart(false)
    }
  }

  // ================================
  // HANDLERS
  // ================================
  const handleYearChange = (event) => {
    setYear(event.target.value)
  }

  const handleMonthChange = (event) => {
    setMonth(event.target.value)
  }

  const handleOutletChange = (event) => {
    setSelectedOutlet(event.target.value)
  }

  // ================================
  // EFFECTS
  // ================================

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const defaultOutletId = localStorage.getItem('outletGuid') || ''
        setSelectedOutlet(defaultOutletId)

        await Promise.all([
          fetchDashboard(),
          fetchRecentActivities(),
          fetchBookingList(),
          fetchBookingChannel()
        ])
      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

  // Fetch chart data when year/month changes
  useEffect(() => {
    fetchYearlyData(year)
    fetchMonthlyData(year, month)
  }, [month, year])

  // ================================
  // RETURN VALUES
  // ================================
  return {
    // Loading states
    loading,
    loadingChart,

    // Filter states
    year,
    month,
    selectedOutlet,
    yearOptions,
    monthOptions,

    // Data
    dashboardData,
    recentActivities,
    bookingList,
    bookingChannel,

    // Chart configs - static sparkline
    optionscolumnchart,
    seriescolumnchart,

    // Chart configs - yearly
    optionscolumnchartYear,
    seriescolumnchartYear,

    // Chart configs - monthly
    optionscolumnchartMonth,
    seriescolumnchartMonth,

    // Chart configs - doughnut
    optionsdoughnutchart,
    seriesdoughnutchart,

    // Handlers
    handleYearChange,
    handleMonthChange,
    handleOutletChange,

    // Utils
    formatNumber
  }
}
