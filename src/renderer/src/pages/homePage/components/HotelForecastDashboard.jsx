import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
  Box,
  CircularProgress,
  Grid,
  TextField,
  Typography,
  Alert
} from '@mui/material'
import { DashboardCard } from './DashboardCard'
import DashboardService from '@renderer/services/dashboardService'

const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(Number(value || 0))

export const HotelForecastDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [forecast, setForecast] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const dashboardService = DashboardService()

  useEffect(() => {
    const outletId = localStorage.getItem('outletGuid')
    const token = localStorage.getItem('token')

    if (!outletId || !token) {
      setError('Data outlet atau token tidak ditemukan')
      return
    }

    const fetchForecast = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await dashboardService.getHotelMetrics({
          outlet_id: outletId,
          start_date: selectedDate,
          end_date: selectedDate
        })

        setForecast(response.data || {})
      } catch (err) {
        console.error('Error fetching hotel forecast:', err)
        setError('Gagal memuat forecast hotel')
        setForecast({})
      } finally {
        setLoading(false)
      }
    }

    fetchForecast()
  }, [selectedDate])

  const selectedDateObj = useMemo(() => dayjs(selectedDate), [selectedDate])

  const metricItems = [
    { label: 'Occupancy', value: `${Number(forecast.occupancy || 0)}%` },
    { label: 'Room Nights', value: Number(forecast.room_nights || 0) },
    { label: 'ADR', value: formatRupiah(forecast.adr || 0) },
    { label: 'RevPar', value: formatRupiah(forecast.revPar || 0) },
    { label: 'Sales', value: formatRupiah(forecast.revenue || 0) }
  ]

  return (
    <DashboardCard
      title="Forecast"
      action={
        <TextField
          type="date"
          size="small"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          inputProps={{ max: dayjs().format('YYYY-MM-DD') }}
          sx={{ minWidth: 170 }}
        />
      }
    >
      {loading ? (
        <Box height="120px" display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={2} alignItems="stretch">
          <Grid size={{ xs: 12, sm: 3, md: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {DAY_NAMES_ID[selectedDateObj.day()]}
              </Typography>
              <Typography variant="h2" fontWeight={700} lineHeight={1.1}>
                {selectedDateObj.date()}
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {MONTH_NAMES_ID[selectedDateObj.month()]}
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 9, md: 10 }}>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 2,
                py: 1.75,
                height: '100%'
              }}
            >
              <Grid container spacing={1.5}>
                {metricItems.map((item) => (
                  <Grid size={{ xs: 6, sm: 4, md: 2 }} key={item.label}>
                    <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                      {item.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      )}
    </DashboardCard>
  )
}
