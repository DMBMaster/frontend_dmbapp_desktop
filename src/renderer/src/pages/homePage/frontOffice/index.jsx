import { Box, Select } from '@mui/material'
import {
  Button,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import BlankCard from '@renderer/components/ui/BlankCard'
import { formatRupiah } from '@renderer/utils/myFunctions'
import { CheckinFormDrawer } from './components/DrawerCI'
import {
  IconBedFilled,
  IconBedFlat,
  IconBell,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconHome2,
  IconUser
} from '@tabler/icons-react'
import CheckOutFormDrawer from './components/DrawerCO'
import { CancelRounded } from '@mui/icons-material'
import { UseFrontOffice } from './hook/useFrontOffice'
import { TabContext, TabPanel } from '@mui/lab'

function a11yProps(index) {
  return {
    id: `frontoffice-tab-${index}`,
    'aria-controls': `frontoffice-tabpanel-${index}`
  }
}

// ================================
// RESERVATION TABLE COMPONENT
// ================================
// eslint-disable-next-line react/prop-types
const ReservationTable = ({ data = [], loading }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <Typography color="text.secondary">Tidak ada data</Typography>
      </Box>
    )
  }

  return (
    <TableContainer>
      <Table aria-label="reservation table" sx={{ whiteSpace: 'nowrap' }}>
        <TableHead>
          <TableRow>
            <TableCell>No</TableCell>
            <TableCell>Booking ID</TableCell>
            <TableCell>Nama</TableCell>
            <TableCell>Room</TableCell>
            <TableCell>Check-In</TableCell>
            <TableCell>Check-Out</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* eslint-disable-next-line react/prop-types */}
          {data.map((item, index) => (
            <TableRow key={item.guid || index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{item.booking_id || item.ticket?.booking_id || '-'}</TableCell>
              <TableCell>{item.reservation_name || item.account_name || '-'}</TableCell>
              <TableCell>{item.room || item.product_name || '-'}</TableCell>
              <TableCell>{item.check_in || item.checkin_time || '-'}</TableCell>
              <TableCell>{item.check_out || item.checkout_time || '-'}</TableCell>
              <TableCell>{item.status || '-'}</TableCell>
              <TableCell>{formatRupiah(item.grand_total || 0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// ================================
// FRONT OFFICE DASHBOARD PAGE (Pure UI)
// ================================
export const FrontOfficeDashboardPage = () => {
  const {
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
    handleCloseDrawer,

    // Navigation
    handleOTA,
    handleGuest,
    handleWalkIn,

    // Reload
    reloadTransactions,

    // Service
    frontofficeService
  } = UseFrontOffice()

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" color="textPrimary">
            Forecast
          </Typography>
        </Grid>

        <Grid
          size={{ xs: 3, sm: 1 }}
          p={3}
          sx={{ marginTop: { xs: '60px', sm: '0px' }, mt: { xs: '60px', sm: '0px' } }}
        >
          <Typography variant="h6" color="textPrimary">
            {formattedDate.split(',')[0]} {/* Weekday */}
          </Typography>
          <Typography variant="h1" color="textPrimary">
            {formattedDate.split(',')[1]?.trim().split(' ')[0]} {/* Day */}
          </Typography>
          <Typography variant="h6" color="textPrimary">
            {formattedDate.split(',')[1]?.trim().split(' ')[1]} {/* Month */}
          </Typography>
        </Grid>

        <Grid size={{ xs: 9, sm: 11 }} p={3}>
          <BlankCard p={2}>
            <Grid container spacing={2} mt={2} mb={2} px={2}>
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <Box>
                  <Typography variant="h6">{forecast.occupancy ?? 0}%</Typography>
                  <Typography>Occupancy</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <Box>
                  <Typography variant="h6">{forecast.room_nights ?? 0}</Typography>
                  <Typography>Room Nights</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <Box>
                  <Typography variant="h6">{formatRupiah(forecast.adr ?? 0)}</Typography>
                  <Typography>ADR</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <Box>
                  <Typography variant="h6">{formatRupiah(forecast.revPar ?? 0)}</Typography>
                  <Typography>RevPar</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box>
                  <Typography variant="h6">{formatRupiah(forecast.revenue ?? 0)}</Typography>
                  <Typography>Revenue</Typography>
                </Box>
              </Grid>
            </Grid>
          </BlankCard>
        </Grid>
      </Grid>

      {selectedReservation && openCO && (
        <CheckOutFormDrawer
          open={openCO}
          handleClose={handleCloseDrawer}
          ticket={ReservationDetails?.data?.ticket}
          order={ReservationDetails?.data}
          transactionitem={ReservationDetails?.data?.transaction_item}
          guid={ReservationDetails?.data?.guid}
          reloadTransactions={reloadTransactions}
          loading={loading}
          frontofficeService={frontofficeService}
        />
      )}

      {selectedReservation && openCI && (
        <CheckinFormDrawer
          open={openCI}
          handleClose={handleCloseDrawer}
          ticket={ReservationDetails?.data?.ticket}
          order={ReservationDetails?.data}
          transactionitem={ReservationDetails?.data?.transaction_item}
          guid={ReservationDetails?.data?.guid}
          reloadTransactions={reloadTransactions}
          loading={loading}
          frontofficeService={frontofficeService}
        />
      )}

      {/* Action Buttons */}
      <Grid size={{ xs: 12 }}>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            onClick={handleOTA}
            variant="contained"
            disableElevation
            color="warning"
            sx={{ mr: 2 }}
          >
            OTA Baru
          </Button>
          <Button
            onClick={handleGuest}
            variant="contained"
            disableElevation
            color="secondary"
            sx={{ mr: 2 }}
          >
            Reservasi Baru
          </Button>
          <Button onClick={handleWalkIn} variant="contained" disableElevation color="primary">
            Walk In Baru
          </Button>
        </Box>
      </Grid>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }} sx={{ mb: 3 }}>
          <Box backgroundColor="secondary.light" p={3} sx={{ cursor: 'pointer' }}>
            <Stack direction="row" gap={2} alignItems="center">
              <Box
                width={38}
                height={38}
                bgcolor="secondary.main"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Typography
                  color="primary.contrastText"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <IconUser width={22} />
                </Typography>
              </Box>
              <Box>
                <Typography color="textPrimary">Reservasi</Typography>
                <Typography fontWeight={500} color="textPrimary">
                  {reservationCount}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Box backgroundColor="success.light" p={3} sx={{ cursor: 'pointer' }}>
            <Stack direction="row" gap={2} alignItems="center">
              <Box
                width={38}
                height={38}
                bgcolor="success.main"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Typography
                  color="primary.contrastText"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <IconBedFilled width={22} />
                </Typography>
              </Box>
              <Box>
                <Typography color="textPrimary">Available</Typography>
                <Typography fontWeight={500} color="textPrimary">
                  {availableCount}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Box backgroundColor="error.light" p={3} sx={{ cursor: 'pointer' }}>
            <Stack direction="row" gap={2} alignItems="center">
              <Box
                width={38}
                height={38}
                bgcolor="warning.main"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Typography
                  color="primary.contrastText"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <CancelRounded width={22} />
                </Typography>
              </Box>
              <Box>
                <Typography color="textPrimary">Cancel</Typography>
                <Typography fontWeight={500} color="textPrimary">
                  {cancel}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      {/* Tabs + Reservation Table */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <BlankCard>
            <TabContext value={String(value)}>
              <Box>
                <Tabs
                  value={value}
                  onChange={handleChange}
                  scrollButtons="auto"
                  aria-label="basic tabs example"
                >
                  <Tab
                    iconPosition="start"
                    icon={<IconHome2 size="22" />}
                    label="Arrivals"
                    {...a11yProps(0)}
                  />
                  <Tab
                    iconPosition="start"
                    icon={<IconBell size="22" />}
                    label="Departures"
                    {...a11yProps(1)}
                  />
                  <Tab
                    iconPosition="start"
                    icon={<IconBedFlat size="22" />}
                    label="Stayovers"
                    {...a11yProps(2)}
                  />
                  <Tab
                    iconPosition="start"
                    icon={<IconBedFlat size="22" />}
                    label="In-House Guests"
                    {...a11yProps(3)}
                  />
                </Tabs>
              </Box>
              <Divider />
              <Box
                display="flex"
                alignItems="center"
                justifyContent="flex-end"
                gap={2}
                mt={2}
                px={2}
              >
                {/* Start Date Filter */}
                <TextField
                  variant="outlined"
                  label="Start Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />

                {/* End Date Filter */}
                <TextField
                  variant="outlined"
                  label="End Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Box>

              <CardContent>
                <TabPanel value="0">
                  <ReservationTable data={data} loading={loadingTrx} />
                </TabPanel>
                <TabPanel value="1">
                  <ReservationTable data={data} loading={loadingTrx} />
                </TabPanel>
                <TabPanel value="2">
                  <ReservationTable data={data} loading={loadingTrx} />
                </TabPanel>
                <TabPanel value="3">
                  <ReservationTable data={data} loading={loadingTrx} />
                </TabPanel>
              </CardContent>
            </TabContext>
          </BlankCard>
        </Grid>

        {/* Pagination */}
        <Box display="flex" justifyContent="center" alignItems="center" width="100%" height="100px">
          {loading ? (
            <CircularProgress />
          ) : (
            <Stack
              gap={1}
              p={3}
              alignItems="center"
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
            >
              <Typography variant="body1" color="textPrimary">
                {totalCount} Rows
              </Typography>

              <Stack direction="row" alignItems="center" gap={1}>
                <IconButton size="small" onClick={() => setPage(1)} disabled={page === 1}>
                  <IconChevronsLeft />
                </IconButton>
                <IconButton
                  size="small"
                  color="textPrimary"
                  onClick={() => setPage((prev) => prev - 1)}
                  disabled={page === 1}
                >
                  <IconChevronLeft />
                </IconButton>
                <Typography color="textPrimary">
                  Page {page} of {pageCount}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={page === pageCount}
                >
                  <IconChevronRight />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setPage(pageCount)}
                  disabled={page === pageCount}
                >
                  <IconChevronsRight />
                </IconButton>
              </Stack>

              <Stack direction="row" alignItems="center" gap={1}>
                <Typography color="textPrimary">Rows per page:</Typography>
                <Select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  {[10, 15, 20, 25, 100].map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            </Stack>
          )}
        </Box>
      </Grid>
    </Box>
  )
}
