import React, { Suspense, lazy } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Skeleton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material'
import { TrendingUp, Receipt, ShoppingCart, People, AttachMoney } from '@mui/icons-material'
import { UseIndex } from './hook/useIndex'

// Lazy import for ApexCharts
const Chart = lazy(() => import('react-apexcharts'))

// Icon mapping for summary cards
const iconMap = {
  TrendingUp: <TrendingUp />,
  Receipt: <Receipt />,
  ShoppingCart: <ShoppingCart />,
  People: <People />,
  AttachMoney: <AttachMoney />
}

export const HomePage = () => {
  const {
    loading,
    loadingChart,
    year,
    month,
    selectedOutlet,
    outlets,
    summaryCards,
    recentActivities,
    yearlyChartOptions,
    yearlyChartSeries,
    monthlyChartOptions,
    monthlyChartSeries,
    donutChartOptions,
    donutChartSeries,
    yearOptions,
    monthOptions,
    handleYearChange,
    handleMonthChange,
    handleOutletChange,
    formatRupiah
  } = UseIndex()

  // Loading skeleton
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
          {outlets.length > 1 && (
            <TextField
              select
              size="small"
              label="Outlet"
              value={selectedOutlet}
              onChange={handleOutletChange}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Semua Outlet</MenuItem>
              {outlets.map((outlet) => (
                <MenuItem key={outlet.id} value={String(outlet.id)}>
                  {outlet.name}
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
        {/* Summary Cards */}
        {summaryCards.map((card, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 2px 14px 0 rgba(0,0,0,0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: card.bgColor,
                      color: card.color,
                      width: 56,
                      height: 56
                    }}
                  >
                    {iconMap[card.icon]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {card.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Yearly Sales Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 14px 0 rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  Penjualan Tahunan {year}
                </Typography>
                {loadingChart && <CircularProgress size={20} />}
              </Box>
              <Box sx={{ height: 295 }}>
                <Suspense
                  fallback={
                    <Skeleton variant="rectangular" height={295} sx={{ borderRadius: 2 }} />
                  }
                >
                  <Chart
                    options={yearlyChartOptions}
                    series={yearlyChartSeries}
                    type="bar"
                    height={295}
                  />
                </Suspense>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Booking Channel Donut Chart */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 2px 14px 0 rgba(0,0,0,0.08)',
              height: '100%'
            }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Channel Booking
              </Typography>
              <Box sx={{ height: 295 }}>
                {donutChartSeries.length > 0 ? (
                  <Suspense
                    fallback={
                      <Skeleton variant="rectangular" height={295} sx={{ borderRadius: 2 }} />
                    }
                  >
                    <Chart
                      options={donutChartOptions}
                      series={donutChartSeries}
                      type="donut"
                      height={295}
                    />
                  </Suspense>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}
                  >
                    <Typography color="text.secondary">Tidak ada data</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Sales Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 14px 0 rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  Penjualan Bulanan - {monthOptions.find((m) => m.value === month)?.label} {year}
                </Typography>
                {loadingChart && <CircularProgress size={20} />}
              </Box>
              <Box sx={{ height: 295 }}>
                <Suspense
                  fallback={
                    <Skeleton variant="rectangular" height={295} sx={{ borderRadius: 2 }} />
                  }
                >
                  <Chart
                    options={monthlyChartOptions}
                    series={monthlyChartSeries}
                    type="bar"
                    height={295}
                  />
                </Suspense>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 2px 14px 0 rgba(0,0,0,0.08)',
              height: '100%'
            }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Aktivitas Terbaru
              </Typography>
              {recentActivities.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {recentActivities.slice(0, 5).map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor:
                                activity.type === 'transaction'
                                  ? 'primary.light'
                                  : activity.type === 'booking'
                                    ? 'secondary.light'
                                    : 'warning.light',
                              color:
                                activity.type === 'transaction'
                                  ? 'primary.main'
                                  : activity.type === 'booking'
                                    ? 'secondary.main'
                                    : 'warning.main'
                            }}
                          >
                            {activity.type === 'transaction' ? (
                              <Receipt fontSize="small" />
                            ) : activity.type === 'booking' ? (
                              <People fontSize="small" />
                            ) : (
                              <ShoppingCart fontSize="small" />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.title}
                          secondary={
                            <Box
                              component="span"
                              sx={{ display: 'flex', justifyContent: 'space-between' }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                {activity.description}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={activity.amount >= 0 ? 'success.main' : 'error.main'}
                          >
                            {formatRupiah(activity.amount)}
                          </Typography>
                          <Chip
                            label={activity.status}
                            size="small"
                            color={
                              activity.status === 'success'
                                ? 'success'
                                : activity.status === 'pending'
                                  ? 'warning'
                                  : 'default'
                            }
                            sx={{ mt: 0.5, fontSize: 10 }}
                          />
                        </Box>
                      </ListItem>
                      {index < recentActivities.slice(0, 5).length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 200
                  }}
                >
                  <Typography color="text.secondary">Tidak ada aktivitas terbaru</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
