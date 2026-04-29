import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import dayjs from 'dayjs'
import DashboardService from '@renderer/services/dashboardService'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_KEYS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

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
  const [loadingCompare, setLoadingCompare] = useState(false)
  const [loadingMonthCompare, setLoadingMonthCompare] = useState(false)

  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(defaultMonth)
  const [compareYear, setCompareYear] = useState('')
  const [compareMonth, setCompareMonth] = useState('')
  const [compareMonthYear, setCompareMonthYear] = useState('')
  const [selectedOutlet, setSelectedOutlet] = useState('')

  // Data states
  const [dashboardData, setDashboardData] = useState({})
  const [recentActivities, setRecentActivities] = useState([])
  const [bookingList, setBookingList] = useState([])
  const [bookingChannel, setBookingChannel] = useState([])

  // ================================
  // YEAR COMPARE CHART STATE
  // ================================
  const [optionsYearCompare, setOptionsYearCompare] = useState({
    chart: {
      type: 'area',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: '#adb0bb',
      toolbar: { show: false },
      height: 295,
      stacked: false
    },
    colors: ['#3b82f6', '#f59e0b'],
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] }
    },
    markers: { size: 0 },
    dataLabels: {
      enabled: true,
      formatter: (value) =>
        Number(value) > 500000 ? `${Number(value / 1000000).toFixed(1)}Jt` : '',
      style: { fontSize: '10px', fontWeight: 700 },
      background: {
        enabled: true,
        foreColor: '#fff',
        padding: 2,
        borderRadius: 2,
        opacity: 1,
        borderWidth: 1,
        borderColor: '#3b82f6'
      },
      offsetY: -15,
      dropShadow: { enabled: true, top: 1, left: 0, blur: 2, opacity: 0.5 }
    },
    legend: { show: true, position: 'top', horizontalAlign: 'left', fontSize: '12px' },
    grid: { borderColor: '#f1f1f1', strokeDashArray: 3 },
    xaxis: {
      categories: MONTH_SHORT,
      axisBorder: { show: false },
      labels: { style: { fontSize: '12px' } }
    },
    yaxis: {
      title: { text: 'Penjualan (Jt)', style: { fontSize: '11px', color: '#adb0bb' } },
      labels: { formatter: (value) => `${Number(value / 1000000).toFixed(1)}Jt` }
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      y: { formatter: (val) => `Rp ${Number(val).toLocaleString('id-ID')}` }
    }
  })

  const [seriesYearCompare, setSeriesYearCompare] = useState([
    { name: currentYear, data: [] }
  ])

  // ================================
  // MONTHLY CHART STATE
  // ================================
  const [optionscolumnchartMonth, setOptionsColumnChartMonth] = useState({
    chart: {
      type: 'area',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: '#adb0bb',
      toolbar: { show: false },
      height: 295,
      stacked: false
    },
    colors: ['#10b981', '#f59e0b'],
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] }
    },
    markers: { size: 0 },
    dataLabels: {
      enabled: true,
      formatter: (value) =>
        Number(value) > 500000 ? `${Number(value / 1000000).toFixed(1)}Jt` : '',
      style: { fontSize: '10px', fontWeight: 700 },
      background: {
        enabled: true,
        foreColor: '#fff',
        padding: 2,
        borderRadius: 2,
        opacity: 1,
        borderWidth: 1,
        borderColor: '#10b981'
      },
      offsetY: -15,
      dropShadow: { enabled: true, top: 1, left: 0, blur: 2, opacity: 0.5 }
    },
    legend: { show: true, position: 'top', horizontalAlign: 'left', fontSize: '12px' },
    grid: { borderColor: '#f1f1f1', strokeDashArray: 3 },
    xaxis: {
      categories: [],
      axisBorder: { show: false },
      labels: { rotate: -45, style: { fontSize: '11px' } },
      title: { text: 'Tanggal', style: { fontSize: '11px', color: '#adb0bb' } }
    },
    yaxis: {
      title: { text: 'Penjualan (Jt)', style: { fontSize: '11px', color: '#adb0bb' } },
      labels: { formatter: (value) => `${Number(value / 1000000).toFixed(1)}M` }
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (val) => `Rp ${Number(val).toLocaleString('id-ID')}` }
    }
  })

  const [seriescolumnchartMonth, setSeriesColumnChartMonth] = useState([
    { name: 'Total Sales', data: [] }
  ])

  // ================================
  // STATIC SPARKLINE CHART
  // ================================
  const optionscolumnchart = useMemo(
    () => ({
      chart: {
        type: 'bar',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        foreColor: '#adb0bb',
        toolbar: { show: false },
        height: 25,
        sparkline: { enabled: true }
      },
      colors: [primary],
      grid: { show: false },
      plotOptions: {
        bar: { horizontal: false, columnWidth: '100%', borderRadius: 3, distributed: true }
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 5, colors: ['rgba(0,0,0,0.01)'] },
      xaxis: { axisBorder: { show: false }, axisTicks: { show: false }, labels: { show: false } },
      yaxis: { labels: { show: false } },
      fill: { opacity: 1 },
      tooltip: {
        theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
        x: { show: false }
      }
    }),
    [primary, theme.palette.mode]
  )

  const seriescolumnchart = useMemo(
    () => [{ name: '', data: [100, 60, 35, 90, 35, 100] }],
    []
  )

  // ================================
  // DOUGHNUT CHART (Booking Channel)
  // ================================
  const seriesdoughnutchart = useMemo(
    () => (bookingChannel || []).map((item) => Number(item.total)),
    [bookingChannel]
  )

  const labelsdoughnutchart = useMemo(
    () => (bookingChannel || []).map((item) => item.extranet),
    [bookingChannel]
  )

  const optionsdoughnutchart = useMemo(
    () => ({
      chart: { type: 'donut' },
      labels: labelsdoughnutchart,
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '12px',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        itemMargin: { horizontal: 8, vertical: 4 },
        formatter: (seriesName, opts) => {
          const value = seriesdoughnutchart[opts.seriesIndex]
          const total = seriesdoughnutchart.reduce((a, b) => a + b, 0)
          return `${((value / total) * 100).toFixed(1)}% ${seriesName}`
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => `${val.toFixed(1)}%`,
        style: { fontSize: '12px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 },
        dropShadow: { enabled: false }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                fontSize: '13px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 600,
                color: '#adb0bb',
                formatter: () => {
                  const total = seriesdoughnutchart.reduce((a, b) => a + b, 0)
                  return total.toLocaleString('id-ID')
                }
              },
              value: {
                show: true,
                fontSize: '18px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 700,
                color: '#2a3547',
                formatter: (val) => Number(val).toLocaleString('id-ID')
              }
            }
          }
        }
      },
      tooltip: { y: { formatter: (val) => Number(val).toLocaleString('id-ID') } },
      colors: [
        primary, '#f59e0b', secondary, '#6366f1', warning,
        '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4',
        '#84cc16', '#e11d48', '#0ea5e9', '#d946ef', '#fb923c',
        '#a3e635', '#38bdf8', '#f43f5e', '#4ade80', '#c084fc'
      ],
      responsive: [
        { breakpoint: 600, options: { chart: { height: 300 }, legend: { position: 'bottom' } } }
      ]
    }),
    [labelsdoughnutchart, seriesdoughnutchart, primary, secondary, warning]
  )

  // ================================
  // OPTIONS
  // ================================
  const yearOptions = useMemo(() => {
    const currentYearInt = parseInt(currentYear)
    const years = []
    for (let y = currentYearInt; y >= currentYearInt - 4; y--) {
      years.push(y.toString())
    }
    return years
  }, [currentYear])

  const monthOptions = useMemo(
    () => MONTH_KEYS.map((value, i) => ({ value, label: MONTH_NAMES[i] })),
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

  // Ambil data 1 bulan → return { categories, formattedData, daysInMonth }
  const getMonthDataArray = async (selectedYear, selectedMonth) => {
    const result = await dashboardService.getMonthlySales({
      type: 'non-ppob',
      year: selectedYear,
      month: selectedMonth,
      merchant_id: localStorage.getItem('outletGuid')
    })

    const data = result.data || []
    const daysInMonth = dayjs(`${selectedYear}-${selectedMonth}-01`).daysInMonth()
    const salesMap = {}
    data.forEach((item) => {
      const raw = String(item.day)
      const dayNum = raw.includes('-') ? parseInt(raw.split('-')[2]) : parseInt(raw)
      salesMap[dayNum] = Number(item.total_sales)
    })
    const categories = Array.from({ length: daysInMonth }, (_, i) =>
      String(i + 1).padStart(2, '0')
    )
    const formattedData = Array.from({ length: daysInMonth }, (_, i) => salesMap[i + 1] || 0)
    return { categories, formattedData, daysInMonth }
  }

  // ================================
  // FETCH FUNCTIONS
  // ================================
  const fetchDashboard = async () => {
    try {
      const outletId = localStorage.getItem('outletGuid')
      const params = {
        outlet_id: outletId,
        year: year || currentYear,
        start_date: dayjs(`${year || currentYear}-${month || currentMonth}-01`).startOf('month').format('YYYY-MM-DD'),
        end_date: dayjs(`${year || currentYear}-${month || currentMonth}-01`).endOf('month').format('YYYY-MM-DD')
      }
      const result = await dashboardService.getDashboardSummary(params)
      setDashboardData(result.data || {})
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
  }

  const fetchRecentActivities = async () => {
    try {
      const outletId = localStorage.getItem('outletGuid')
      const result = await dashboardService.getRecentActivities({ p: 1, ps: 6, outlet_id: outletId })
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

  const fetchBookingChannel = async (selectedYear) => {
    try {
      const outletId = localStorage.getItem('outletGuid')
      const result = await dashboardService.getBookingChannel({
        outlet_id: outletId,
        start_date: `${selectedYear}-01-01`,
        end_date: `${selectedYear}-12-31`
      })
      setBookingChannel(result.data || [])
    } catch (error) {
      console.error('Error fetching booking channel:', error)
    }
  }

  const fetchYearCompare = async (selectedYear, selectedCompare) => {
    setLoadingCompare(true)
    try {
      const result = await dashboardService.getYearCompare({
        year: selectedYear,
        compare_year: selectedCompare,
        merchant_id: localStorage.getItem('outletGuid')
      })
      const data = result.data
      setSeriesYearCompare([
        { name: `${data.current_year}`, data: data.current.monthly_revenue },
        { name: `${data.compare_year}`, data: data.previous.monthly_revenue }
      ])
      setOptionsYearCompare((prev) => ({
        ...prev,
        xaxis: { ...prev.xaxis, categories: MONTH_SHORT }
      }))
    } catch (error) {
      console.error('Error fetching year compare:', error)
    } finally {
      setLoadingCompare(false)
    }
  }

  const fetchYearlyData = async (selectedYear) => {
    setLoadingCompare(true)
    try {
      const result = await dashboardService.getYearlySales({
        type: 'non-ppob',
        year: selectedYear,
        merchant_id: localStorage.getItem('outletGuid')
      })

      const data = result.data || []
      const monthMap = {
        '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
        '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
        '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
      }
      const categories = data.map((item) => monthMap[item.month] || item.month)
      const salesData = data.map((item) => Number(item.total_sales))

      setOptionsYearCompare((prev) => ({
        ...prev,
        xaxis: { ...prev.xaxis, categories }
      }))
      setSeriesYearCompare([{ name: `${selectedYear}`, data: salesData }])
    } catch (error) {
      console.error('Error fetching yearly data:', error)
    } finally {
      setLoadingCompare(false)
    }
  }

  const fetchMonthData = async (selectedYear, selectedMonth, selCompareMonth, selCompareMonthYear) => {
    setLoadingMonthCompare(true)
    setOptionsColumnChartMonth((prev) => ({
      ...prev,
      xaxis: { ...prev.xaxis, categories: [] }
    }))
    setSeriesColumnChartMonth([{ name: 'Total Sales', data: [] }])

    const resolvedCompareYear = selCompareMonth ? (selCompareMonthYear || selectedYear) : ''

    try {
      // Menambahkan timeout manual untuk berjaga-jaga jika ada promise yang hang
      const fetchPromise = getMonthDataArray(selectedYear, selectedMonth)
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 15000))
      
      const { categories, formattedData, daysInMonth } = await Promise.race([fetchPromise, timeoutPromise])
      const mainLabel = `${MONTH_NAMES[parseInt(selectedMonth) - 1]} ${selectedYear}`

      if (selCompareMonth && resolvedCompareYear) {
        const compareFetchPromise = getMonthDataArray(resolvedCompareYear, selCompareMonth)
        const compareResult = await Promise.race([compareFetchPromise, timeoutPromise])
        const compareLabel = `${MONTH_NAMES[parseInt(selCompareMonth) - 1]} ${resolvedCompareYear}`

        const maxDays = Math.max(daysInMonth, compareResult.daysInMonth)
        const padArr = (arr, len) => [...arr, ...Array(len - arr.length).fill(0)]
        const paddedCategories = Array.from({ length: maxDays }, (_, i) =>
          String(i + 1).padStart(2, '0')
        )

        setOptionsColumnChartMonth((prev) => ({
          ...prev,
          colors: ['#10b981', '#f59e0b'],
          xaxis: { ...prev.xaxis, categories: paddedCategories }
        }))
        setSeriesColumnChartMonth([
          { name: mainLabel, data: padArr(formattedData, maxDays) },
          { name: compareLabel, data: padArr(compareResult.formattedData, maxDays) }
        ])
      } else {
        setOptionsColumnChartMonth((prev) => ({
          ...prev,
          colors: ['#10b981'],
          xaxis: { ...prev.xaxis, categories }
        }))
        setSeriesColumnChartMonth([{ name: mainLabel, data: formattedData }])
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error)
    } finally {
      setLoadingMonthCompare(false)
    }
  }

  // ================================
  // HANDLERS
  // ================================
  const handleYearChange = (event) => {
    setCompareYear('')
    setYear(event.target.value)
  }

  const handleMonthChange = (event) => {
    setMonth(event.target.value)
  }

  const handleOutletChange = (event) => {
    setSelectedOutlet(event.target.value)
  }

  const handleCompareMonthChange = (event) => {
    const val = event.target.value
    setCompareMonth(val)
    if (val && !compareMonthYear) setCompareMonthYear(year)
    if (!val) setCompareMonthYear('')
  }

  // ================================
  // EFFECTS
  // ================================
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const defaultOutletId = localStorage.getItem('outletGuid') || ''
        setSelectedOutlet(defaultOutletId)

        await Promise.all([
          fetchDashboard(),
          fetchRecentActivities(),
          fetchBookingList()
        ])
      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

  // Fetch booking channel saat year berubah
  useEffect(() => {
    fetchBookingChannel(year)
  }, [year])

  // Fetch tahunan: jika ada compareYear pakai year-compare, kalau tidak pakai yearly biasa
  useEffect(() => {
    if (compareYear) fetchYearCompare(year, compareYear)
    else fetchYearlyData(year)
  }, [year, compareYear])

  // Fetch bulanan saat month/year/compare berubah
  useEffect(() => {
    const resolvedCMY = compareMonth ? (compareMonthYear || year) : ''
    fetchMonthData(year, month, compareMonth, resolvedCMY)
  }, [month, year, compareMonth, compareMonthYear])

  // Fetch Dashboard saat year/month/outlet berubah
  useEffect(() => {
    // Supaya tidak double fetch saat mount, cek loading state
    // Jika loading initial (false karena baru mount dan ditangani by loadInitialData)
    // Tapi karena effect ini baru jalan, mending dipisah logic update nya
    fetchDashboard()
  }, [year, month, selectedOutlet])

  // Update tooltip theme saat theme berubah
  useEffect(() => {
    setOptionsYearCompare((prev) => ({
      ...prev,
      tooltip: { ...prev.tooltip, theme: theme.palette.mode }
    }))
  }, [theme.palette.mode])

  // ================================
  // RETURN VALUES
  // ================================
  return {
    // Loading states
    loading,
    loadingCompare,
    loadingMonthCompare,

    // Filter states
    year,
    month,
    compareYear,
    compareMonth,
    compareMonthYear,
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

    // Chart configs - yearly / year compare
    optionsYearCompare,
    seriesYearCompare,

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
    handleCompareMonthChange,
    setCompareYear,
    setCompareMonthYear,

    // Utils
    formatNumber
  }
}