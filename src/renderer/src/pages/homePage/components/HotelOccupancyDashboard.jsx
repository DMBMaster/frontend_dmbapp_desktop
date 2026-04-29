import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Alert
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DashboardCard } from './DashboardCard'
import DashboardService from '@renderer/services/dashboardService'

const Chart = lazy(() => import('react-apexcharts'))

const STATUS_OPTIONS = [
  { label: 'Semua Status', value: '' },
  { label: 'PAID', value: 'PAID' },
  { label: 'SUBMIT', value: 'SUBMIT' }
]

export const HotelOccupancyDashboard = ({ year, month }) => {
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [data, setData] = useState(null)

  const dashboardService = DashboardService()

  const startAt = useMemo(
    () => dayjs(`${year}-${month}-01`).startOf('month').format('YYYY-MM-DD'),
    [year, month]
  )
  const endAt = useMemo(
    () => dayjs(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD'),
    [year, month]
  )

  useEffect(() => {
    const outletId = localStorage.getItem('outletGuid')
    const token = localStorage.getItem('token')

    if (!outletId || !token) {
      setError('Data outlet atau token tidak ditemukan')
      setData(null)
      return
    }

    const fetchOccupancy = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await dashboardService.getHotelOccupancy({
          outlet_id: outletId,
          start_at: startAt,
          end_at: endAt,
          ...(status ? { status } : {})
        })

        setData(response.data || null)
      } catch (err) {
        console.error('Error fetching hotel occupancy:', err)
        setError('Gagal memuat data occupancy hotel')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchOccupancy()
  }, [startAt, endAt, status])

  const dailySeries = [
    {
      name: 'Occupancy',
      data: (data?.daily || []).map((item) => Number(item.occ_percent || 0))
    }
  ]

  const dailyOptions = {
    chart: {
      type: 'area',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      foreColor: '#adb0bb',
      toolbar: { show: false }
    },
    colors: ['#6366f1'],
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.04, stops: [0, 90, 100] }
    },
    markers: { size: 0 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: (data?.daily || []).map((item) => dayjs(item.date).format('DD MMM')),
      axisBorder: { show: false },
      labels: { rotate: -45, style: { fontSize: '10px' } }
    },
    yaxis: {
      min: 0,
      max: 100,
      title: { text: 'Occupancy (%)', style: { fontSize: '11px', color: '#adb0bb' } },
      labels: { formatter: (value) => `${Number(value).toFixed(0)}%` }
    },
    grid: { borderColor: '#f1f1f1', strokeDashArray: 3 },
    tooltip: {
      theme: theme.palette.mode,
      y: { formatter: (value) => `${Number(value).toFixed(1)}%` },
      custom: ({ dataPointIndex }) => {
        const item = (data?.daily || [])[dataPointIndex]

        if (!item) return ''

        return `
          <div style="padding: 10px 12px; min-width: 180px;">
            <div style="font-size: 12px; font-weight: 600; margin-bottom: 8px; color: #111827;">
              ${dayjs(item.date).format('DD MMM YYYY')}
            </div>
            <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">
              Occupancy: <strong style="color: #111827;">${Number(item.occ_percent || 0).toFixed(1)}%</strong>
            </div>
            <div style="font-size: 12px; color: #4b5563;">
              Kamar terisi: <strong style="color: #111827;">${item.rooms_occupied || 0}/${item.total_rooms || 0}</strong>
            </div>
          </div>
        `
      }
    }
  }

  return (
    <DashboardCard
      title="Occupancy Hotel"
      subtitle={`Periode ${dayjs(startAt).format('DD MMM YYYY')} - ${dayjs(endAt).format('DD MMM YYYY')}`}
      action={
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value || 'all'} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      }
    >
      {loading ? (
        <Box height="420px" display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !data ? (
        <Alert severity="info">Belum ada data occupancy untuk periode ini.</Alert>
      ) : (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
          <Typography variant="h6" mb={2}>
            Occupancy Harian
          </Typography>
          {(data?.daily || []).length === 0 ? (
            <Box height="320px" display="flex" alignItems="center" justifyContent="center">
              <Typography variant="body2" color="text.secondary">
                Tidak ada data harian
              </Typography>
            </Box>
          ) : (
            <Suspense fallback={<CircularProgress />}>
              <Chart
                options={dailyOptions}
                series={dailySeries}
                type="area"
                height="320px"
                width="100%"
              />
            </Suspense>
          )}
        </Box>
      )}
    </DashboardCard>
  )
}
