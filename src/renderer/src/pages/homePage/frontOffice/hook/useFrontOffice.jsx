import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import FrontofficeService from '@renderer/services/frontofficeService'
import { useDebounce } from '@uidotdev/usehooks'

const TAB_CONFIG = [
  { view: 'new', legacy: 'arrivals', counterKey: 'reservations' },
  { view: 'arrivals', legacy: 'arrivals', counterKey: 'arrivals' },
  { view: 'departures', legacy: 'departures', counterKey: 'departures' },
  { view: 'in-house', legacy: 'in_house_guest', counterKey: 'in_house' }
]

export const UseFrontOffice = () => {
  const navigate = useNavigate()
  const frontofficeService = FrontofficeService()
  const formattedToday = dayjs().format('YYYY-MM-DD')
  const formattedTomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')

  const [loading, setLoading] = useState(true)
  const [loadingTrx, setLoadingTrx] = useState(false)
  const [formattedDate, setFormattedDate] = useState('')

  const [forecast, setForecast] = useState({
    occupancy: 0,
    room_nights: 0,
    adr: 0,
    revPar: 0,
    revenue: 0
  })

  const [reservationCount, setReservationCount] = useState(0)
  const [availableCount, setAvailableCount] = useState(0)
  const [cancel, setCancel] = useState(0)

  const [value, setValue] = useState(0)
  const [startDate, setStartDate] = useState(formattedToday)
  const [endDate, setEndDate] = useState(formattedTomorrow)

  const [data, setData] = useState([])
  const [cardData, setCardData] = useState([])

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  const [foStats, setFoStats] = useState({
    reservations: 0,
    arrivals: 0,
    departures: 0,
    in_house: 0,
    pending: 0,
    cancelled: 0,
    total: 0
  })

  const [viewMode, setViewMode] = useState('setViewMode')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [status, setStatus] = useState('CONFIRMED')

  const [openCI, setOpenCI] = useState(false)
  const [openCO, setOpenCO] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [ReservationDetails, setReservationDetails] = useState(null)

  useEffect(() => {
    setFormattedDate(dayjs().format('dddd, DD MMMM'))
  }, [])

  const fetchForecast = useCallback(async () => {
    try {
      const result = await frontofficeService.getForecast({
        outlet_id: localStorage.getItem('outletGuid'),
        start_date: startDate || formattedToday,
        end_date: endDate || formattedTomorrow
      })

      const metrics = result.data || {}
      setForecast({
        occupancy: metrics.occupancy ?? 0,
        room_nights: metrics.room_nights ?? 0,
        adr: metrics.adr ?? 0,
        revPar: metrics.revPar ?? metrics.rev_par ?? 0,
        revenue: metrics.revenue ?? 0
      })

      setReservationCount(metrics.reservation_count ?? metrics.total_booking ?? 0)
      setCancel(metrics.cancel_count ?? metrics.cancel ?? 0)
    } catch (error) {
      console.error('Error fetching forecast:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  const fetchAvailable = useCallback(async () => {
    try {
      const result = await frontofficeService.getAvailableRoomsCount()
      setAvailableCount(result.data?.data?.count ?? 0)
    } catch (error) {
      console.error('Error fetching available rooms count:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchFoStats = useCallback(async () => {
    try {
      const result = await frontofficeService.getFoDashboardStats({
        outlet_id: localStorage.getItem('outletGuid')
      })
      const stats = result.data || {}

      setFoStats({
        reservations: stats.reservations ?? 0,
        arrivals: stats.arrivals ?? 0,
        departures: stats.departures ?? 0,
        in_house: stats.in_house ?? 0,
        pending: stats.pending ?? 0,
        cancelled: stats.cancelled ?? 0,
        total: stats.total ?? 0
      })
      setReservationCount(stats.total ?? 0)
      setCancel(stats.cancelled ?? 0)
    } catch (error) {
      console.error('Error fetching front office stats:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchReservations = useCallback(async () => {
    setLoadingTrx(true)
    try {
      const currentTab = TAB_CONFIG[value] || TAB_CONFIG[0]
      const result = await frontofficeService.getReservations({
        filter: currentTab.legacy,
        p: page,
        ps: pageSize,
        ...(startDate ? { start_at: startDate } : {}),
        ...(endDate ? { end_at: endDate } : {}),
        ...(status ? { status } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {})
      })

      const responseData = result.data

      if (responseData?.data && Array.isArray(responseData.data)) {
        const rows = responseData.data
        const meta = responseData.meta || {}
        const total = meta.totalCount ?? responseData.total ?? rows.length
        const resolvedPageSize = meta.perPage ?? pageSize

        setData(rows)
        setTotalCount(total)
        setPageCount(meta.totalPages ?? Math.max(1, Math.ceil(total / resolvedPageSize)))
      } else if (Array.isArray(responseData)) {
        setData(responseData)
        setTotalCount(responseData.length)
        setPageCount(Math.max(1, Math.ceil(responseData.length / pageSize)))
      } else {
        setData([])
        setTotalCount(0)
        setPageCount(1)
      }
    } catch (error) {
      console.error('Error fetching reservations:', error)
      setData([])
      setTotalCount(0)
      setPageCount(1)
    } finally {
      setLoadingTrx(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, startDate, endDate, page, pageSize, debouncedSearch, status])

  const fetchCardBookings = useCallback(async () => {
    setLoadingTrx(true)
    try {
      const currentTab = TAB_CONFIG[value] || TAB_CONFIG[0]
      const result = await frontofficeService.getFoDashboardBookings({
        outlet_id: localStorage.getItem('outletGuid'),
        view: currentTab.view,
        status: status || 'CONFIRMED',
        date: startDate || formattedToday,
        p: page,
        ps: pageSize,
        ...(debouncedSearch ? { search: debouncedSearch } : {})
      })

      const payload = result.data || {}
      const rows = Array.isArray(payload.data) ? payload.data : []
      const pagination = payload.pagination || {}

      setCardData(rows)
      setTotalCount(pagination.total_records ?? payload.count ?? rows.length)
      setPageCount(Math.max(1, pagination.total_pages ?? 1))
    } catch (error) {
      console.error('Error fetching front office card bookings:', error)
      setCardData([])
      setTotalCount(0)
      setPageCount(1)
    } finally {
      setLoadingTrx(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, startDate, page, pageSize, debouncedSearch, status])

  const fetchReservationDetail = useCallback(async (guid) => {
    try {
      const result = await frontofficeService.getReservationDetail(guid)
      setReservationDetails(result)
    } catch (error) {
      console.error('Error fetching reservation detail:', error)
      setReservationDetails(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true)
      await Promise.all([fetchForecast(), fetchAvailable(), fetchFoStats()])
      setLoading(false)
    }

    loadSummary()
  }, [fetchForecast, fetchAvailable, fetchFoStats])

  useEffect(() => {
    if (viewMode === 'card') {
      fetchCardBookings()
      return
    }

    fetchReservations()
  }, [viewMode, fetchCardBookings, fetchReservations])

  const handleChange = (_event, newValue) => {
    setValue(newValue)
    setPage(1)
  }

  const handleOTA = () => {
    navigate('/transaction/instore', { state: { type: 'ota' } })
  }

  const handleGuest = () => {
    navigate('/transaction/instore', { state: { type: 'reservation' } })
  }

  const handleWalkIn = () => {
    navigate('/transaction/instore', { state: { type: 'walkin' } })
  }

  const handleOpenCI = (reservation) => {
    setSelectedReservation(reservation)
    fetchReservationDetail(reservation.guid)
    setOpenCI(true)
  }

  const handleOpenCO = (reservation) => {
    setSelectedReservation(reservation)
    fetchReservationDetail(reservation.guid)
    setOpenCO(true)
  }

  const handleCloseDrawer = () => {
    setOpenCI(false)
    setOpenCO(false)
    setSelectedReservation(null)
    setReservationDetails(null)
  }

  const reloadTransactions = () => {
    if (viewMode === 'card') {
      fetchCardBookings()
    } else {
      fetchReservations()
    }

    fetchFoStats()
    fetchForecast()
  }

  const tabCounts = {
    0: foStats.reservations ?? 0,
    1: foStats.arrivals ?? 0,
    2: foStats.departures ?? 0,
    3: foStats.in_house ?? 0
  }

  return {
    loading,
    loadingTrx,
    formattedDate,
    forecast,
    reservationCount,
    availableCount,
    cancel,
    value,
    handleChange,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    viewMode,
    setViewMode,
    search,
    setSearch,
    status,
    setStatus,
    tabCounts,
    data,
    cardData,
    page,
    pageSize,
    totalCount,
    pageCount,
    setPage,
    setPageSize,
    openCI,
    openCO,
    selectedReservation,
    ReservationDetails,
    handleOpenCI,
    handleOpenCO,
    handleCloseDrawer,
    handleOTA,
    handleGuest,
    handleWalkIn,
    reloadTransactions,
    frontofficeService
  }
}
