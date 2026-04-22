/* eslint-disable react/prop-types */
import { Box } from '@mui/material'
import {
  Button,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
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
  Tooltip,
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
  IconEye,
  IconHome2,
  IconLayoutList,
  IconMoon,
  IconMoodSmile,
  IconSearch,
  IconUser
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import CheckOutFormDrawer from './components/DrawerCO'
import { CancelRounded } from '@mui/icons-material'
import { UseFrontOffice } from './hook/useFrontOffice'
import { TabContext, TabPanel } from '@mui/lab'
import { useNavigate } from 'react-router-dom'

function a11yProps(index) {
  return {
    id: `frontoffice-tab-${index}`,
    'aria-controls': `frontoffice-tabpanel-${index}`
  }
}

// Tab label with count badge
const TabLabel = ({ label, count }) => (
  <Box component="span" display="inline-flex" alignItems="center" gap={0.5}>
    {label}
    <Box
      component="span"
      sx={{
        fontSize: '0.7rem',
        bgcolor: 'grey.200',
        color: 'text.secondary',
        px: 0.75,
        borderRadius: '10px',
        minWidth: 20,
        textAlign: 'center',
        lineHeight: 1.6
      }}
    >
      {count ?? 0}
    </Box>
  </Box>
)

const STATUS_OPTIONS = [
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Pending', value: 'PENDING_PAYMENT' },
  { label: 'Cancelled', value: 'CANCELLED' }
]

const getBookingMainItem = (reservation) => {
  if (reservation?.transaction_item?.[0]) {
    return reservation.transaction_item[0]
  }

  if (reservation?.items?.[0]) {
    return reservation.items[0]
  }

  return null
}

const formatDateLabel = (value) => {
  if (!value) return '-'

  const normalizedValue = typeof value === 'string' ? value.replace(' ', 'T') : value
  const parsedDate = dayjs(normalizedValue)

  return parsedDate.isValid() ? parsedDate.format('DD/MM/YYYY') : '-'
}

const formatDateTimeLabel = (value) => {
  if (!value) return '-'

  const normalizedValue = typeof value === 'string' ? value.replace(' ', 'T') : value
  const parsedDate = dayjs(normalizedValue)

  return parsedDate.isValid() ? parsedDate.format('DD/MM/YYYY HH:mm') : '-'
}

const calculateNights = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) return 0

  const nights = dayjs(checkOutDate).diff(dayjs(checkInDate), 'day')
  return nights >= 0 ? nights : 0
}

const getBookingStatusMeta = (reservation) => {
  const status = reservation?.status?.toUpperCase()

  if (['CANCELLED', 'CANCEL', 'EXPIRED'].includes(status)) {
    return { label: 'Dibatalkan', color: 'error.main' }
  }

  if (['PENDING_PAYMENT', 'PENDING', 'SUBMIT'].includes(status)) {
    return { label: 'Belum Bayar', color: 'warning.main' }
  }

  if (['CHECKED_IN', 'CHECKIN', 'IN-HOUSE', 'IN_HOUSE'].includes(status)) {
    return { label: 'Check-In', color: 'info.main' }
  }

  if (['CHECKED_OUT', 'CHECKOUT'].includes(status)) {
    return { label: 'Check-Out', color: 'secondary.main' }
  }

  if (['PAID', 'CONFIRMED'].includes(status)) {
    return { label: 'Sudah Bayar', color: 'success.main' }
  }

  return { label: reservation?.status || '-', color: 'text.disabled' }
}

const getReservationSource = (reservation) => {
  const source = reservation?.channel || reservation?.extranet || '-'
  return source === 'WALKIN' ? 'Walk In' : source
}

const BookingCard = ({ reservation, onView, actionLabel }) => {
  const navigate = useNavigate()
  const mainItem = getBookingMainItem(reservation)
  const checkIn = reservation?.check_in || mainItem?.check_in
  const checkOut = reservation?.check_out || mainItem?.check_out
  const totalNights = reservation?.nights ?? calculateNights(checkIn, checkOut)
  const adultQty = reservation?.adult_qty ?? mainItem?.adult_qty ?? 0
  const childQty = reservation?.child_qty ?? mainItem?.child_qty ?? 0
  const roomNo = reservation?.room_no ?? mainItem?.room_no ?? '-'
  const productName = reservation?.product_name || mainItem?.product_name || mainItem?.name || '-'
  const paidAmount = reservation?.paid ?? reservation?.paid_amount ?? 0
  const grandTotal = reservation?.grand_total ?? 0
  const balance = reservation?.balance ?? Math.max(grandTotal - paidAmount, 0)
  const bookingId =
    reservation?.reference_id || reservation?.booking_id || reservation?.transaction_no || '-'
  const bookingDate = reservation?.booking_date || reservation?.created_at
  const guestName =
    reservation?.guest_name ||
    reservation?.reservation_name ||
    reservation?.ticket?.account_name ||
    mainItem?.account_name ||
    '-'
  const statusMeta = getBookingStatusMeta(reservation)

  return (
    <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
      <BlankCard
        sx={{
          height: '100%',
          overflow: 'hidden',
          borderRadius: 2,
          bgcolor: 'grey.50',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Box sx={{ minWidth: 0, pr: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {guestName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {bookingId}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 6,
              minWidth: 6,
              height: 34,
              borderRadius: 4,
              bgcolor: statusMeta.color
            }}
          />
        </Box>

        <Box sx={{ p: 2, bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Grid container alignItems="center">
            <Grid size={{ xs: 5 }}>
              <Typography variant="subtitle2">{formatDateLabel(checkIn)}</Typography>
            </Grid>
            <Grid size={{ xs: 2 }} textAlign="center">
              <Typography variant="subtitle1" fontWeight={700}>
                {totalNights}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Nights
              </Typography>
            </Grid>
            <Grid size={{ xs: 5 }} textAlign="right">
              <Typography variant="subtitle2">{formatDateLabel(checkOut)}</Typography>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Typography variant="body2" color="text.secondary">
                Booking Date
              </Typography>
              <Typography variant="body2" textAlign="right">
                {formatDateTimeLabel(bookingDate)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Typography variant="body2" color="text.secondary">
                Room / Rate Type
              </Typography>
              <Typography variant="body2" textAlign="right">
                {roomNo} / {productName}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Typography variant="body2" color="text.secondary">
                Channel
              </Typography>
              <Typography variant="body2" textAlign="right">
                {getReservationSource(reservation)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Typography variant="body2" color="text.secondary">
                Guest
              </Typography>
              <Typography variant="body2" textAlign="right">
                {adultQty} Adult / {childQty} Child
              </Typography>
            </Stack>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
              <Typography variant="body2">{formatRupiah(grandTotal)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Typography variant="body2" color="text.secondary">
                Paid
              </Typography>
              <Typography variant="body2">{formatRupiah(paidAmount)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Typography variant="body2" color="error.main" fontWeight={700}>
                Balance
              </Typography>
              <Typography variant="body2" color="error.main" fontWeight={700}>
                {formatRupiah(balance)}
              </Typography>
            </Stack>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: statusMeta.color,
                  flexShrink: 0
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {statusMeta.label}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              {onView && reservation?.guid && (
                <Button size="small" variant="outlined" onClick={() => onView(reservation)}>
                  {actionLabel}
                </Button>
              )}
              <Tooltip title="Detail">
                <IconButton
                  size="small"
                  onClick={() => navigate(`/transaction/detail/${reservation.guid}`)}
                >
                  <IconEye size={18} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>
      </BlankCard>
    </Grid>
  )
}

const ReservationCards = ({ data = [], loading, onView, actionLabel }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" width="100%" minHeight={160}>
        <CircularProgress />
      </Box>
    )
  }

  if (!data.length) {
    return (
      <Box py={6} textAlign="center">
        <Typography variant="body1" color="text.secondary">
          Tidak ada data
        </Typography>
      </Box>
    )
  }

  return (
    <Grid container spacing={2}>
      {data.map((reservation) => (
        <BookingCard
          key={reservation.id || reservation.guid}
          reservation={reservation}
          onView={onView}
          actionLabel={actionLabel}
        />
      ))}
    </Grid>
  )
}

// ================================
// RESERVATION TABLE COMPONENT
// ================================
const ReservationTable = ({ data = [], loading }) => {
  const navigate = useNavigate()
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
      <Table aria-label="reservation table">
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                color: 'text.secondary',
                fontWeight: 400,
                fontSize: '0.82rem',
                border: 0,
                pb: 0.5
              }}
            >
              Guest
            </TableCell>
            <TableCell
              sx={{
                color: 'text.secondary',
                fontWeight: 400,
                fontSize: '0.82rem',
                border: 0,
                pb: 0.5
              }}
            >
              Accommodation
            </TableCell>
            <TableCell
              sx={{
                color: 'text.secondary',
                fontWeight: 400,
                fontSize: '0.82rem',
                border: 0,
                pb: 0.5
              }}
            >
              Stay
            </TableCell>
            <TableCell
              sx={{
                color: 'text.secondary',
                fontWeight: 400,
                fontSize: '0.82rem',
                border: 0,
                pb: 0.5
              }}
            >
              Status
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item, index) => {
            const trxItem = getBookingMainItem(item)
            const roomName = trxItem?.name?.trim() || item.product_name || '-'
            const source = getReservationSource(item)
            const guestName =
              item.guest_name || item.reservation_name || item.ticket?.account_name || '-'
            const trxNo = item.transaction_no || '-'

            const ciDate = item.check_in || trxItem?.check_in
            const coDate = item.check_out || trxItem?.check_out
            const nights = calculateNights(ciDate, coDate)
            const adults = trxItem?.adult_qty ?? 0
            const hasBreakfast = trxItem?.breakfast === true

            const ciFormatted = formatDateLabel(ciDate)
            const coFormatted = formatDateLabel(coDate)
            const statusCfg = getBookingStatusMeta(item)

            return (
              <TableRow
                key={item.guid || index}
                sx={{
                  '&:not(:last-child) td': { borderBottom: '1px solid', borderColor: 'divider' }
                }}
              >
                {/* Guest */}
                <TableCell sx={{ py: 2.5, border: 0, verticalAlign: 'top' }}>
                  <Typography fontWeight={600} fontSize="0.9rem">
                    {guestName}
                  </Typography>
                  <Typography fontSize="0.78rem" color="text.secondary">
                    {trxNo}
                  </Typography>
                </TableCell>

                {/* Accommodation */}
                <TableCell sx={{ py: 2.5, border: 0, verticalAlign: 'top' }}>
                  <Typography fontWeight={600} fontSize="0.9rem" textTransform="uppercase">
                    {roomName}
                  </Typography>
                  <Typography fontSize="0.78rem" color="text.secondary">
                    {source}
                  </Typography>
                </TableCell>

                {/* Stay */}
                <TableCell sx={{ py: 2.5, border: 0, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                  <Typography fontSize="0.88rem">
                    {ciFormatted} - {coFormatted}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1.5} mt={0.5}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <IconMoon size={15} />
                      <Typography fontSize="0.78rem">{nights}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <IconUser size={15} />
                      <Typography fontSize="0.78rem">{adults}</Typography>
                    </Stack>
                    {hasBreakfast && (
                      <Tooltip title="Breakfast included">
                        <Box display="flex" alignItems="center">
                          <IconMoodSmile size={15} />
                        </Box>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>

                {/* Status */}
                <TableCell sx={{ py: 2.5, border: 0, verticalAlign: 'top' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        bgcolor: statusCfg.color,
                        flexShrink: 0
                      }}
                    />
                    <Typography fontSize="0.88rem">{statusCfg.label}</Typography>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/transaction/detail/${item.guid}`)}
                      sx={{ ml: 1 }}
                    >
                      <IconEye size={18} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            )
          })}
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

    // View mode
    viewMode,
    setViewMode,

    // Search
    search,
    setSearch,

    // Status filter
    status,
    setStatus,

    // Tab counts
    tabCounts,

    // Table data
    data,
    cardData,

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

    // Service
    frontofficeService
  } = UseFrontOffice()

  // Determine view handler based on active tab
  // Tab 0=Reservations, 1=Arrivals → Check-In | Tab 2=Departures, 3=In-House → Check-Out
  const onView = value <= 1 ? handleOpenCI : handleOpenCO
  const actionLabel = value <= 1 ? 'Check-In' : 'Check-Out'

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
            disabled
            color="warning"
            sx={{ mr: 2 }}
          >
            OTA Baru
          </Button>
          <Button
            onClick={handleGuest}
            variant="contained"
            disabled
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
                    icon={<IconLayoutList size="22" />}
                    label={<TabLabel label="Reservations" count={tabCounts[0]} />}
                    {...a11yProps(0)}
                  />
                  <Tab
                    iconPosition="start"
                    icon={<IconHome2 size="22" />}
                    label={<TabLabel label="Arrivals" count={tabCounts[1]} />}
                    {...a11yProps(1)}
                  />
                  <Tab
                    iconPosition="start"
                    icon={<IconBell size="22" />}
                    label={<TabLabel label="Departures" count={tabCounts[2]} />}
                    {...a11yProps(2)}
                  />
                  <Tab
                    iconPosition="start"
                    icon={<IconBedFlat size="22" />}
                    label={<TabLabel label="In-House" count={tabCounts[3]} />}
                    {...a11yProps(3)}
                  />
                </Tabs>
              </Box>
              <Divider />
              <Box display="flex" alignItems="center" flexWrap="wrap" gap={1.5} mt={2} px={2}>
                {/* Search */}
                <TextField
                  placeholder="Search"
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconSearch size={18} />
                      </InputAdornment>
                    )
                  }}
                  sx={{ minWidth: 200 }}
                />

                {/* Start Date Filter */}
                <TextField
                  size="small"
                  label="Start Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />

                {/* End Date Filter */}
                <TextField
                  size="small"
                  label="End Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />

                {/* Status Filter Buttons */}
                {STATUS_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    size="small"
                    variant={status === option.value ? 'contained' : 'outlined'}
                    color="primary"
                    disableElevation
                    onClick={() => setStatus((prev) => (prev === option.value ? '' : option.value))}
                  >
                    {option.label}
                  </Button>
                ))}

                {/* View Mode Toggle */}
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant={viewMode === 'card' ? 'contained' : 'outlined'}
                    color="primary"
                    disableElevation
                    onClick={() => setViewMode('card')}
                  >
                    Card View
                  </Button>
                  <Button
                    size="small"
                    variant={viewMode === 'table' ? 'contained' : 'outlined'}
                    color="primary"
                    disableElevation
                    onClick={() => setViewMode('table')}
                  >
                    Table View
                  </Button>
                </Box>
              </Box>

              <CardContent>
                <TabPanel value="0">
                  {viewMode === 'card' ? (
                    <ReservationCards
                      data={cardData}
                      loading={loadingTrx}
                      onView={onView}
                      actionLabel={actionLabel}
                    />
                  ) : (
                    <ReservationTable data={data} loading={loadingTrx} onView={onView} />
                  )}
                </TabPanel>
                <TabPanel value="1">
                  {viewMode === 'card' ? (
                    <ReservationCards
                      data={cardData}
                      loading={loadingTrx}
                      onView={onView}
                      actionLabel={actionLabel}
                    />
                  ) : (
                    <ReservationTable data={data} loading={loadingTrx} onView={onView} />
                  )}
                </TabPanel>
                <TabPanel value="2">
                  {viewMode === 'card' ? (
                    <ReservationCards
                      data={cardData}
                      loading={loadingTrx}
                      onView={onView}
                      actionLabel={actionLabel}
                    />
                  ) : (
                    <ReservationTable data={data} loading={loadingTrx} onView={onView} />
                  )}
                </TabPanel>
                <TabPanel value="3">
                  {viewMode === 'card' ? (
                    <ReservationCards
                      data={cardData}
                      loading={loadingTrx}
                      onView={onView}
                      actionLabel={actionLabel}
                    />
                  ) : (
                    <ReservationTable data={data} loading={loadingTrx} onView={onView} />
                  )}
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
                  Page {page} of {Math.max(pageCount, 1)}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={page >= Math.max(pageCount, 1)}
                >
                  <IconChevronRight />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setPage(Math.max(pageCount, 1))}
                  disabled={page >= Math.max(pageCount, 1)}
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
