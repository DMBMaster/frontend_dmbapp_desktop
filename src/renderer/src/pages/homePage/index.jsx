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
import { listOutlets } from '@renderer/utils/config'

// Lazy import for ApexCharts
const Chart = lazy(() => import('react-apexcharts'))

export const HomePage = () => {
  const {
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

    // Chart configs
    optionscolumnchart,
    seriescolumnchart,
    optionscolumnchartYear,
    seriescolumnchartYear,
    optionscolumnchartMonth,
    seriescolumnchartMonth,
    optionsdoughnutchart,
    seriesdoughnutchart,

    // Handlers
    handleYearChange,
    handleMonthChange,
    handleOutletChange,

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
          {/* Summary Cards Skeleton */}
          {[1, 2, 3, 4].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}

          {/* Charts Skeleton */}
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
  // MAIN RENDER
  // ================================
  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Filters */}
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
          {/* Outlet Filter */}
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

          {/* Year Filter */}
          <TextField
            select
            size="small"
            label="Tahun"
            value={year}
            onChange={handleYearChange}
            sx={{ minWidth: 100 }}
          >
            {yearOptions.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>

          {/* Month Filter */}
          <TextField
            select
            size="small"
            label="Bulan"
            value={month}
            onChange={handleMonthChange}
            sx={{ minWidth: 140 }}
          >
            {monthOptions.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Box>
          <Grid container spacing={3}>
            {/* ================================
                NON-HOTEL LAYOUT (outletCategoryId != 1)
            ================================ */}
            {localStorage.getItem('outletCategoryId') != 1 && (
              <>
                <Grid size={{ xs: 12, lg: 12 }}>
                  <DashboardWidgetCard title="Yearly Sales">
                    <>
                      <FormControl margin="normal" sx={{ minWidth: 160 }}>
                        <InputLabel id="year-select-label">Select Year</InputLabel>
                        <Select
                          labelId="year-select-label"
                          value={year}
                          label="Select Year"
                          onChange={handleYearChange}
                        >
                          {yearOptions.map((y) => (
                            <MenuItem key={y} value={y}>
                              {y}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Box height="310px">
                        {loadingChart ? (
                          <p>Loading...</p>
                        ) : (
                          <Suspense fallback={<CircularProgress />}>
                            <Chart
                              options={optionscolumnchartYear}
                              series={seriescolumnchartYear}
                              type="bar"
                              height="295px"
                              width="100%"
                            />
                          </Suspense>
                        )}
                      </Box>
                    </>
                  </DashboardWidgetCard>
                </Grid>
                <Grid size={{ xs: 12, lg: 12 }}>
                  <DashboardWidgetCard title="Month Sales">
                    <>
                      <FormControl margin="normal">
                        <InputLabel id="month-select-label">Select Month</InputLabel>
                        <Select
                          labelId="month-select-label"
                          value={month}
                          onChange={handleMonthChange}
                        >
                          <MenuItem value="01">January</MenuItem>
                          <MenuItem value="02">February</MenuItem>
                          <MenuItem value="03">March</MenuItem>
                          <MenuItem value="04">April</MenuItem>
                          <MenuItem value="05">May</MenuItem>
                          <MenuItem value="06">June</MenuItem>
                          <MenuItem value="07">July</MenuItem>
                          <MenuItem value="08">August</MenuItem>
                          <MenuItem value="09">September</MenuItem>
                          <MenuItem value="10">October</MenuItem>
                          <MenuItem value="11">November</MenuItem>
                          <MenuItem value="12">December</MenuItem>
                        </Select>
                      </FormControl>
                      <Box height="310px">
                        {loadingChart ? (
                          <p>Loading...</p>
                        ) : (
                          <Suspense fallback={<CircularProgress />}>
                            <Chart
                              options={optionscolumnchartMonth}
                              series={seriescolumnchartMonth}
                              type="bar"
                              height="295px"
                              width="100%"
                            />
                          </Suspense>
                        )}
                      </Box>
                    </>
                  </DashboardWidgetCard>
                </Grid>
              </>
            )}

            {/* ================================
                HOTEL LAYOUT (outletCategoryId == 1)
            ================================ */}
            {localStorage.getItem('outletCategoryId') == 1 && (
              <>
                {/* Summary Cards */}
                <Grid size={{ xs: 12, lg: 3 }}>
                  <DashboardCard>
                    <>
                      <Box
                        width={38}
                        height={38}
                        bgcolor="primary.light"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Typography
                          color="primary.main"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <IconCalendar width={22} />
                        </Typography>
                      </Box>

                      <Box mt={3} mb={2} height="25px">
                        <Suspense fallback={null}>
                          <Chart
                            options={optionscolumnchart}
                            series={seriescolumnchart}
                            type="bar"
                            height="25px"
                            width={'100%'}
                          />
                        </Suspense>
                      </Box>

                      <Typography variant="h4">
                        {dashboardData.booking_count}
                        {dashboardData.booking_change_percentage < 0 ? (
                          <IconArrowDownRight width={18} color="#F04438" />
                        ) : (
                          <IconArrowUpRight width={18} color="#39B69A" />
                        )}
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          {Math.abs(dashboardData.booking_change_percentage || 0)}%
                        </Typography>
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        New Booking
                      </Typography>
                    </>
                  </DashboardCard>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <DashboardCard>
                    <>
                      <Box
                        width={38}
                        height={38}
                        bgcolor="primary.light"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Typography
                          color="primary.main"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <IconLogin2 width={22} />
                        </Typography>
                      </Box>

                      <Box mt={3} mb={2} height="25px">
                        <Suspense fallback={null}>
                          <Chart
                            options={optionscolumnchart}
                            series={seriescolumnchart}
                            type="bar"
                            height="25px"
                            width={'100%'}
                          />
                        </Suspense>
                      </Box>

                      <Typography variant="h4">
                        {dashboardData.check_in_count}
                        <span style={{ marginLeft: 6 }}>
                          {dashboardData.check_in_change_percentage < 0 ? (
                            <IconArrowDownRight width={18} color="#F04438" />
                          ) : (
                            <IconArrowUpRight width={18} color="#39B69A" />
                          )}
                          <Typography variant="caption" sx={{ ml: 1 }}>
                            {Math.abs(dashboardData.check_in_change_percentage || 0)}%
                          </Typography>
                        </span>
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        Check-In
                      </Typography>
                    </>
                  </DashboardCard>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <DashboardCard>
                    <>
                      <Box
                        width={38}
                        height={38}
                        bgcolor="primary.light"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Typography
                          color="primary.main"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <IconLogout2 width={22} />
                        </Typography>
                      </Box>

                      <Box mt={3} mb={2} height="25px">
                        <Suspense fallback={null}>
                          <Chart
                            options={optionscolumnchart}
                            series={seriescolumnchart}
                            type="bar"
                            height="25px"
                            width={'100%'}
                          />
                        </Suspense>
                      </Box>

                      <Typography variant="h4">
                        {dashboardData.check_out_count}
                        <span style={{ marginLeft: 6 }}>
                          {dashboardData.check_out_change_percentage < 0 ? (
                            <IconArrowDownRight width={18} color="#F04438" />
                          ) : (
                            <IconArrowUpRight width={18} color="#39B69A" />
                          )}
                          <Typography variant="caption" sx={{ ml: 1 }}>
                            {Math.abs(dashboardData.check_out_change_percentage || 0)}%
                          </Typography>
                        </span>
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        Check Out
                      </Typography>
                    </>
                  </DashboardCard>
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <DashboardCard>
                    <>
                      <Box
                        width={38}
                        height={38}
                        bgcolor="primary.light"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Typography
                          color="primary.main"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <IconCash width={22} />
                        </Typography>
                      </Box>

                      <Box mt={3} mb={2} height="25px">
                        <Suspense fallback={null}>
                          <Chart
                            options={optionscolumnchart}
                            series={seriescolumnchart}
                            type="bar"
                            height="25px"
                            width={'100%'}
                          />
                        </Suspense>
                      </Box>

                      <Typography variant="h4">
                        {formatNumber(dashboardData.total_revenue || 0)}
                        <span style={{ marginLeft: 6 }}>
                          {dashboardData.revenue_change_percentage < 0 ? (
                            <IconArrowDownRight width={18} color="#F04438" />
                          ) : (
                            <IconArrowUpRight width={18} color="#39B69A" />
                          )}
                          <Typography variant="caption" sx={{ ml: 1 }}>
                            {Math.abs(dashboardData.revenue_change_percentage || 0)}%
                          </Typography>
                        </span>
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        Total Revenue
                      </Typography>
                    </>
                  </DashboardCard>
                </Grid>

                {/* Booking Channel Doughnut */}
                <Grid size={{ xs: 12, lg: 4 }}>
                  <DashboardCard title={'Channel Penjualan'}>
                    <Suspense fallback={<CircularProgress />}>
                      <Chart
                        options={optionsdoughnutchart}
                        series={seriesdoughnutchart}
                        type="donut"
                        width={'100%'}
                      />
                    </Suspense>
                  </DashboardCard>
                </Grid>

                {/* Yearly Sales Chart */}
                <Grid size={{ xs: 12, lg: 4 }}>
                  <DashboardWidgetCard title="Yearly Sales">
                    <>
                      <FormControl margin="normal" sx={{ minWidth: 160 }}>
                        <InputLabel id="year-select-label">Select Year</InputLabel>
                        <Select
                          labelId="year-select-label"
                          value={year}
                          onChange={handleYearChange}
                        >
                          {yearOptions.map((y) => (
                            <MenuItem key={y} value={y}>
                              {y}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Box height="310px">
                        {loadingChart ? (
                          <p>Loading...</p>
                        ) : (
                          <Suspense fallback={<CircularProgress />}>
                            <Chart
                              options={optionscolumnchartYear}
                              series={seriescolumnchartYear}
                              type="bar"
                              height="295px"
                              width="100%"
                            />
                          </Suspense>
                        )}
                      </Box>
                    </>
                  </DashboardWidgetCard>
                </Grid>

                {/* Monthly Sales Chart */}
                <Grid size={{ xs: 12, lg: 4 }}>
                  <DashboardWidgetCard title="Month Sales">
                    <>
                      <FormControl margin="normal">
                        <InputLabel id="month-select-label">Select Month</InputLabel>
                        <Select
                          labelId="month-select-label"
                          value={month}
                          onChange={handleMonthChange}
                        >
                          <MenuItem value="01">January</MenuItem>
                          <MenuItem value="02">February</MenuItem>
                          <MenuItem value="03">March</MenuItem>
                          <MenuItem value="04">April</MenuItem>
                          <MenuItem value="05">May</MenuItem>
                          <MenuItem value="06">June</MenuItem>
                          <MenuItem value="07">July</MenuItem>
                          <MenuItem value="08">August</MenuItem>
                          <MenuItem value="09">September</MenuItem>
                          <MenuItem value="10">October</MenuItem>
                          <MenuItem value="11">November</MenuItem>
                          <MenuItem value="12">December</MenuItem>
                        </Select>
                      </FormControl>
                      <Box height="310px">
                        {loadingChart ? (
                          <p>Loading...</p>
                        ) : (
                          <Suspense fallback={<CircularProgress />}>
                            <Chart
                              options={optionscolumnchartMonth}
                              series={seriescolumnchartMonth}
                              type="bar"
                              height="295px"
                              width="100%"
                            />
                          </Suspense>
                        )}
                      </Box>
                    </>
                  </DashboardWidgetCard>
                </Grid>

                {/* Booking List Table */}
                <Grid size={{ xs: 12, lg: 8 }}>
                  <DashboardCard
                    title="Booking List"
                    action={
                      <>
                        <Select
                          labelId="month-dd"
                          id="month-dd"
                          size="small"
                          value={month}
                          onChange={handleMonthChange}
                        >
                          <MenuItem value="01">January</MenuItem>
                          <MenuItem value="02">February</MenuItem>
                          <MenuItem value="03">March</MenuItem>
                          <MenuItem value="04">April</MenuItem>
                          <MenuItem value="05">May</MenuItem>
                          <MenuItem value="06">June</MenuItem>
                          <MenuItem value="07">July</MenuItem>
                          <MenuItem value="08">August</MenuItem>
                          <MenuItem value="09">September</MenuItem>
                          <MenuItem value="10">October</MenuItem>
                          <MenuItem value="11">November</MenuItem>
                          <MenuItem value="12">December</MenuItem>
                        </Select>
                      </>
                    }
                  >
                    <TableContainer>
                      <Table aria-label="simple table" sx={{ whiteSpace: 'nowrap' }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ pl: 0 }}>
                              <Typography variant="subtitle2" fontWeight={600}>
                                Booking ID
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight={600}>
                                Guest Name
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight={600}>
                                Room Type
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight={600}>
                                Room Number
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight={600}>
                                Duration
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight={600}>
                                Checkin - Checkout
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight={600}>
                                Status
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {bookingList.map((item, index) => {
                            const checkIn = dayjs(item.check_in)
                            const checkOut = dayjs(item.check_out)
                            const totalNights = checkOut.diff(checkIn, 'day')

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
                                  <Typography variant="subtitle2">{totalNights}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="subtitle2">
                                    {dayjs(item.check_in).format('DD MMM YYYY')} -{' '}
                                    {dayjs(item.check_out).format('DD MMM YYYY')}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {item.ticket?.status == 'PAID' && (
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
                                  {item.ticket?.status == 'CHECKIN' && (
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
                                  {item.ticket?.status == 'CHECKOUT' && (
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

                {/* Recent Activity Timeline */}
                <Grid size={{ xs: 12, lg: 4 }}>
                  <DashboardCard title="Recent Activity">
                    <>
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
                    </>
                  </DashboardCard>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </Grid>
    </Box>
  )
}
