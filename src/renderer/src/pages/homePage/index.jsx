import { lazy, Suspense } from 'react'
import {
  Box,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Skeleton,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Stack,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material'
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  timelineOppositeContentClasses,
  TimelineSeparator
} from '@mui/lab'
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconCalendar,
  IconCash,
  IconLogin2,
  IconLogout2
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import { UseIndex } from './hook/useIndex'
import { DashboardWidgetCard } from './components/DashboardWidgetCard'
import { DashboardCard } from './components/DashboardCard'
import { HotelForecastDashboard } from './components/HotelForecastDashboard'
import { HotelOccupancyDashboard } from './components/HotelOccupancyDashboard'
import { listOutlets } from '@renderer/utils/config'

const MONTH_KEYS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Lazy import for ApexCharts
const Chart = lazy(() => import('react-apexcharts'))

export const HomePage = () => {
  const {
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

    // Chart configs
    optionscolumnchart,
    seriescolumnchart,
    optionsYearCompare,
    seriesYearCompare,
    optionscolumnchartMonth,
    seriescolumnchartMonth,
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
  } = UseIndex()

  // ================================
  // LOADING SKELETON
  // ================================
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="rounded" height={400} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rounded" height={400} />
          </Grid>
        </Grid>
      </Box>
    )
  }

  // ================================
  // RENDER HELPERS
  // ================================

  // Render Year Compare Chart (sama seperti versi web)
  const renderYearCompareChart = () => (
    <DashboardWidgetCard sx={{ height: '100%', width: '100%' }} title="Penjualan Bulanan">
      <Stack direction="row" spacing={2} mb={2}>
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel>Tahun</InputLabel>
          <Select value={year} onChange={handleYearChange} label="Tahun">
            {yearOptions.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Compare</InputLabel>
          <Select
            value={compareYear}
            onChange={(e) => setCompareYear(e.target.value)}
            label="Compare"
          >
            <MenuItem value="">Tanpa Compare</MenuItem>
            <MenuItem value={String(+year - 1)}>{+year - 1}</MenuItem>
            <MenuItem value={String(+year - 2)}>{+year - 2}</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <Box height="310px">
        {loadingCompare ? (
          <Box height="100%" display="flex" alignItems="center" justifyContent="center">
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Suspense fallback={<CircularProgress />}>
            <Chart
              key={`year-compare-${year}-${compareYear}`}
              options={optionsYearCompare}
              series={seriesYearCompare}
              type="area"
              height="295px"
              width="100%"
            />
          </Suspense>
        )}
      </Box>
    </DashboardWidgetCard>
  )

  // Render Monthly Chart dengan compare
  const renderMonthChart = (labelId) => (
    <>
      <Stack direction="row" spacing={2} mt={1} mb={1} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id={`${labelId}-main`}>Bulan</InputLabel>
          <Select
            labelId={`${labelId}-main`}
            value={month}
            onChange={handleMonthChange}
            label="Bulan"
          >
            {MONTH_KEYS.map((m, i) => (
              <MenuItem key={m} value={m}>{MONTH_NAMES[i]}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id={`${labelId}-compare`}>Compare Bulan</InputLabel>
          <Select
            labelId={`${labelId}-compare`}
            value={compareMonth}
            onChange={handleCompareMonthChange}
            label="Compare Bulan"
          >
            <MenuItem value="">Tanpa Compare</MenuItem>
            {MONTH_KEYS.map((m, i) => (
              <MenuItem key={m} value={m}>{MONTH_NAMES[i]}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {compareMonth && (
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel id={`${labelId}-cmy`}>Tahun</InputLabel>
            <Select
              labelId={`${labelId}-cmy`}
              value={compareMonthYear || year}
              onChange={(e) => setCompareMonthYear(e.target.value)}
              label="Tahun"
            >
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      <Box height="310px">
        {loadingMonthCompare ? (
          <Box height="100%" display="flex" alignItems="center" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <Suspense fallback={<CircularProgress />}>
            <Chart
              key={`month-${month}-${year}-${compareMonth}-${compareMonthYear}`}
              options={optionscolumnchartMonth}
              series={seriescolumnchartMonth}
              type="area"
              height="295px"
              width="100%"
            />
          </Suspense>
        )}
      </Box>
    </>
  )

  // ================================
  // MAIN RENDER
  // ================================
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Typography variant="h5" color="textPrimary" fontWeight={700}>
          Dashboard
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {listOutlets.length > 1 && (
            <TextField
              select
              size="small"
              label="Outlet"
              value={selectedOutlet}
              onChange={handleOutletChange}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Semua Outlet</MenuItem>
              {listOutlets.map((outlet) => (
                <MenuItem key={outlet.id} value={String(outlet.id)}>
                  {outlet && outlet.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* ================================
            NON-HOTEL LAYOUT (outletCategoryId != 1)
        ================================ */}
        {localStorage.getItem('outletCategoryId') != 1 && (
          <>
            {/* Year Compare Chart */}
            <Grid size={{ xs: 12, lg: 8 }} sx={{ display: 'flex' }}>
              {renderYearCompareChart()}
            </Grid>

            {/* Channel Penjualan */}
            <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'flex' }}>
              <DashboardCard sx={{ height: '100%', width: '100%' }} title="Channel Penjualan">
                {seriesdoughnutchart.length === 0 ? (
                  <Box height="380px" display="flex" alignItems="center" justifyContent="center">
                    <Typography variant="body2" color="text.secondary">
                      Tidak ada data channel
                    </Typography>
                  </Box>
                ) : (
                  <Suspense fallback={<CircularProgress />}>
                    <Chart
                      options={optionsdoughnutchart}
                      series={seriesdoughnutchart}
                      type="donut"
                      height="380px"
                      width="100%"
                    />
                  </Suspense>
                )}
              </DashboardCard>
            </Grid>

            {/* Penjualan Harian */}
            <Grid size={{ xs: 12 }}>
              <DashboardWidgetCard title="Penjualan Harian">
                {renderMonthChart('month-label-1')}
              </DashboardWidgetCard>
            </Grid>
          </>
        )}

        {/* ================================
            HOTEL LAYOUT (outletCategoryId == 1)
        ================================ */}
        {localStorage.getItem('outletCategoryId') == 1 && (
          <>
            {/* Summary Widget Cards */}
            {[
              {
                icon: <IconCalendar width={22} />,
                label: 'New Booking',
                title: 'Minggu Ini',
                count: dashboardData?.booking_count ?? 0,
                pct: dashboardData?.booking_change_percentage
              },
              {
                icon: <IconLogin2 width={22} />,
                label: 'Check-In',
                title: 'Minggu Ini',
                count: dashboardData?.check_in_count ?? 0,
                pct: dashboardData?.check_in_change_percentage
              },
              {
                icon: <IconLogout2 width={22} />,
                label: 'Check Out',
                title: 'Minggu Ini',
                count: dashboardData?.check_out_count ?? 0,
                pct: dashboardData?.check_out_change_percentage
              },
              {
                icon: <IconCash width={22} />,
                label: 'Total Sales',
                title: 'Minggu Ini',
                count: formatNumber(dashboardData?.total_revenue ?? 0),
                pct: dashboardData?.revenue_change_percentage
              }
            ].map(({ icon, label, title, count, pct }) => {
              const isNegative = (pct ?? 0) < 0
              const pctColor = isNegative ? '#F04438' : '#39B69A'
              const pctAbs = Math.abs(pct ?? 0)
              return (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={label}>
                  <DashboardCard>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                            {label}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            mt={0.3}
                            display="block"
                          >
                            {title}
                          </Typography>
                        </Box>
                        <Box
                          width={42}
                          height={42}
                          bgcolor="primary.light"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          borderRadius="8px"
                          flexShrink={0}
                        >
                          <Box
                            color="primary.main"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            {icon}
                          </Box>
                        </Box>
                      </Stack>

                      <Box mt={2} mb={1} height="25px">
                        <Suspense fallback={null}>
                          <Chart
                            options={optionscolumnchart}
                            series={seriescolumnchart}
                            type="bar"
                            height="25px"
                            width="100%"
                          />
                        </Suspense>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1} mt={1} flexWrap="wrap">
                        <Typography variant="h4" fontWeight={700} lineHeight={1}>
                          {count}
                        </Typography>
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={0.5}
                          sx={{
                            bgcolor: isNegative ? '#FEF3F2' : '#ECFDF3',
                            borderRadius: '6px',
                            px: 0.8,
                            py: 0.3
                          }}
                        >
                          {isNegative ? (
                            <IconArrowDownRight width={15} color={pctColor} />
                          ) : (
                            <IconArrowUpRight width={15} color={pctColor} />
                          )}
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            color={pctColor}
                            lineHeight={1}
                          >
                            {pctAbs}%
                          </Typography>
                        </Box>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        mt={0.5}
                        display="block"
                      >
                        vs minggu lalu
                      </Typography>
                    </Box>
                  </DashboardCard>
                </Grid>
              )
            })}

            {/* Forecast */}
            <Grid size={{ xs: 12 }}>
              <HotelForecastDashboard />
            </Grid>

            {/* Year Compare Chart */}
            <Grid size={{ xs: 12, lg: 8 }} sx={{ display: 'flex' }}>
              {renderYearCompareChart()}
            </Grid>

            {/* Channel Penjualan */}
            <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'flex' }}>
              <DashboardCard sx={{ height: '100%', width: '100%' }} title="Channel Penjualan">
                {seriesdoughnutchart.length === 0 ? (
                  <Box height="380px" display="flex" alignItems="center" justifyContent="center">
                    <Typography variant="body2" color="text.secondary">
                      Tidak ada data channel
                    </Typography>
                  </Box>
                ) : (
                  <Suspense fallback={<CircularProgress />}>
                    <Chart
                      options={optionsdoughnutchart}
                      series={seriesdoughnutchart}
                      type="donut"
                      height="380px"
                      width="100%"
                    />
                  </Suspense>
                )}
              </DashboardCard>
            </Grid>

            {/* Penjualan Harian */}
            <Grid size={{ xs: 12 }}>
              <DashboardWidgetCard title="Penjualan Harian">
                {renderMonthChart('month-label-2')}
              </DashboardWidgetCard>
            </Grid>

            {/* Occupancy Hotel */}
            <Grid size={{ xs: 12 }}>
              <HotelOccupancyDashboard year={year} month={month} />
            </Grid>

            {/* Booking List */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <DashboardCard title="Booking List">
                <TableContainer>
                  <Table aria-label="simple table" sx={{ whiteSpace: 'nowrap' }}>
                    <TableHead>
                      <TableRow>
                        {[
                          'Booking ID',
                          'Guest Name',
                          'Room Type',
                          'Room Number',
                          'Duration',
                          'Checkin - Checkout',
                          'Status'
                        ].map((h) => (
                          <TableCell key={h}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {h}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(bookingList || []).map((item, index) => {
                        const totalNights = dayjs(item.check_out).diff(
                          dayjs(item.check_in),
                          'day'
                        )
                        return (
                          <TableRow key={index}>
                            <TableCell sx={{ pl: 0 }}>
                              <Typography
                                color="textSecondary"
                                variant="subtitle2"
                                fontWeight={400}
                              >
                                {item.refference_id}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                color="textSecondary"
                                variant="subtitle2"
                                fontWeight={400}
                              >
                                {item.reservation_name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {item.transaction_item?.map(
                                (item2, index2) =>
                                  item2.check_in != null && (
                                    <Typography variant="subtitle2" key={index2}>
                                      {item2.name}
                                    </Typography>
                                  )
                              )}
                            </TableCell>
                            <TableCell>
                              {item.transaction_item?.map((item2, index2) => (
                                <Typography variant="subtitle2" key={index2}>
                                  {item2.no_room}
                                </Typography>
                              ))}
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2">{totalNights} malam</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2">
                                {dayjs(item.check_in).format('DD MMM YYYY')} -{' '}
                                {dayjs(item.check_out).format('DD MMM YYYY')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {item.ticket?.status === 'PAID' && (
                                <Chip
                                  sx={{
                                    bgcolor: (theme) => theme.palette.primary.light,
                                    color: (theme) => theme.palette.primary.main,
                                    borderRadius: '6px',
                                    width: 100
                                  }}
                                  size="small"
                                  label="Reserved"
                                />
                              )}
                              {item.ticket?.status === 'CHECKIN' && (
                                <Chip
                                  sx={{
                                    bgcolor: (theme) => theme.palette.success.light,
                                    color: (theme) => theme.palette.success.main,
                                    borderRadius: '6px',
                                    width: 100
                                  }}
                                  size="small"
                                  label="Check-In"
                                />
                              )}
                              {item.ticket?.status === 'CHECKOUT' && (
                                <Chip
                                  sx={{
                                    bgcolor: (theme) => theme.palette.error.light,
                                    color: (theme) => theme.palette.error.main,
                                    borderRadius: '6px',
                                    width: 100
                                  }}
                                  size="small"
                                  label="Check-Out"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </DashboardCard>
            </Grid>

            {/* Recent Activity */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <DashboardCard title="Recent Activity">
                <Timeline
                  className="theme-timeline"
                  nonce={undefined}
                  onResize={undefined}
                  onResizeCapture={undefined}
                  sx={{
                    p: 0,
                    mb: '-40px',
                    [`& .${timelineOppositeContentClasses.root}`]: {
                      flex: 0.5,
                      paddingLeft: 0
                    }
                  }}
                >
                  {recentActivities.map((item, index) => (
                    <TimelineItem key={index}>
                      <TimelineOppositeContent>
                        {dayjs(item.created_at).format('DD/MM HH:mm')}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color="primary" variant="outlined" />
                        <TimelineConnector />
                      </TimelineSeparator>
                      <TimelineContent>
                        {item.user_full_name} - {item.description}
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </DashboardCard>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  )
}