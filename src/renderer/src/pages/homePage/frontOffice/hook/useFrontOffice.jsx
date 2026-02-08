import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import FrontofficeService from '@renderer/services/frontofficeService'

// ================================
// Tab status mapping
// ================================
const TAB_STATUS_MAP = {
  0: 'arrival', // Arrivals
  1: 'departure', // Departures
  2: 'stayover', // Stayovers
  3: 'in-house' // In-House Guests
}

// ================================
// HOOK: UseFrontOffice
// ================================
export const UseFrontOffice = () => {
  const navigate = useNavigate()
  const frontofficeService = FrontofficeService()

  // ============================
  // STATE
  // ============================

  // Loading states
  const [loading, setLoading] = useState(true)
  const [loadingTrx, setLoadingTrx] = useState(false)

  // Date display
  const [formattedDate, setFormattedDate] = useState('')

  // Forecast data
  const [forecast, setForecast] = useState({
    occupancy: 0,
    room_nights: 0,
    adr: 0,
    revPar: 0,
    revenue: 0
  })

  // Summary counts
  const [reservationCount, setReservationCount] = useState(0)
  const [availableCount, setAvailableCount] = useState(0)
  const [cancel, setCancel] = useState(0)

  // Tab state
  const [value, setValue] = useState(0)

  // Date filters
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'))

  // Table data
  const [data, setData] = useState([])

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  // Drawer states (Check-in / Check-out)
  const [openCI, setOpenCI] = useState(false)
  const [openCO, setOpenCO] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [ReservationDetails, setReservationDetails] = useState(null)

  // ============================
  // FORMATTED DATE (today)
  // ============================
  useEffect(() => {
    const today = dayjs()
    // Format: "Jumat, 07 Februari"
    setFormattedDate(today.format('dddd, DD MMMM'))
  }, [])

  // ============================
  // FETCH FORECAST / DASHBOARD SUMMARY
  // ============================
  const fetchForecast = useCallback(async () => {
    try {
      const result = await frontofficeService.getForecast({
        start_date: startDate,
        end_date: endDate
      })
      const d = result.data
      setForecast({
        occupancy: d?.occupancy ?? 0,
        room_nights: d?.room_nights ?? 0,
        adr: d?.adr ?? 0,
        revPar: d?.revPar ?? d?.rev_par ?? 0,
        revenue: d?.revenue ?? 0
      })

      // Extract summary counts
      setReservationCount(d?.reservation_count ?? d?.total_booking ?? 0)
      setAvailableCount(d?.available_count ?? d?.available_rooms ?? 0)
      setCancel(d?.cancel_count ?? d?.cancel ?? 0)
    } catch (error) {
      console.error('Error fetching forecast:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  // ============================
  // FETCH RESERVATIONS (TAB DATA)
  // ============================
  const fetchReservations = useCallback(async () => {
    setLoadingTrx(true)
    try {
      const status = TAB_STATUS_MAP[value] || 'arrival'
      const result = await frontofficeService.getReservations({
        status,
        start_date: startDate,
        end_date: endDate,
        page,
        page_size: pageSize
      })

      const responseData = result.data

      // Handle data shape
      if (responseData?.data) {
        setData(responseData.data)
        setTotalCount(responseData.total || responseData.data.length)
        setPageCount(
          responseData.page_count ||
            Math.ceil((responseData.total || responseData.data.length) / pageSize)
        )
      } else if (Array.isArray(responseData)) {
        setData(responseData)
        setTotalCount(responseData.length)
        setPageCount(Math.ceil(responseData.length / pageSize))
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
  }, [value, startDate, endDate, page, pageSize])

  // ============================
  // FETCH RESERVATION DETAIL (for CI/CO drawer)
  // ============================
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

  // ============================
  // INITIAL LOAD
  // ============================
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      await Promise.all([fetchForecast(), fetchReservations()])
      setLoading(false)
    }
    loadInitialData()
  }, [fetchForecast, fetchReservations])

  // ============================
  // HANDLERS
  // ============================

  // Tab change
  const handleChange = (_event, newValue) => {
    setValue(newValue)
    setPage(1) // Reset to page 1 on tab change
  }

  // Navigation handlers
  const handleOTA = () => {
    navigate('/transaction/instore', { state: { type: 'ota' } })
  }

  const handleGuest = () => {
    navigate('/transaction/instore', { state: { type: 'reservation' } })
  }

  const handleWalkIn = () => {
    navigate('/transaction/instore', { state: { type: 'walkin' } })
  }

  // Drawer handlers
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

  // Reload transactions (called after CI/CO success)
  const reloadTransactions = () => {
    fetchReservations()
    fetchForecast()
  }

  // ============================
  // RETURN
  // ============================
  return {
    // Loading
    loading,
    loadingTrx,

    // Date display
    formattedDate,

    // Forecast
    forecast,

    // Summary counts
    reservationCount,
    availableCount,
    cancel,

    // Tab
    value,
    handleChange,

    // Date filters
    startDate,
    endDate,
    setStartDate,
    setEndDate,

    // Table data
    data,

    // Pagination
    page,
    pageSize,
    totalCount,
    pageCount,
    setPage,
    setPageSize,

    // Drawer states
    openCI,
    openCO,
    selectedReservation,
    ReservationDetails,

    // Drawer handlers
    handleOpenCI,
    handleOpenCO,
    handleCloseDrawer,

    // Navigation
    handleOTA,
    handleGuest,
    handleWalkIn,

    // Reload
    reloadTransactions,

    // Service (passed to drawers)
    frontofficeService
  }
}
