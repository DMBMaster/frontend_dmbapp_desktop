'use client'
import * as React from 'react'
import {
  Grid,
  Tabs,
  Tab,
  Box,
  CardContent,
  Divider,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Typography,
  TableBody,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Avatar,
  Tooltip,
  IconButton,
  DialogContentText,
  FormControl,
  Select,
  MenuItem,
  Menu,
  InputLabel
} from '@mui/material'

// components
import {
  IconBrandWhatsapp,
  IconEditCircle,
  IconKey,
  IconPinEnd,
  IconSend,
  IconUserFilled
} from '@tabler/icons-react'
import { IconX } from '@tabler/icons-react'
import { IconBedFilled } from '@tabler/icons-react'
import { useDetail } from './hook/useDetail'
import BlankCard from '@renderer/components/ui/BlankCard'
import CustomFormLabel from '@renderer/components/ui/forms/theme-elements/CustomFormLabel'
import CustomTextField from '@renderer/components/ui/forms/theme-elements/CustomTextField'
import Breadcrumb from '@renderer/components/ui/breadcrumb/Breadcrumb'
import { AddPaymentDrawer } from './components/DrawerPayment'
import { ExtendDrawer } from './components/DrawerExtend'
import { AddItemDrawer } from './components/DrawerAddItem'
import { BreakfastVoucher } from './components/BreakfastVoucher'

const BCrumb = [
  {
    to: '/',
    title: 'Home'
  },
  {
    title: 'Transaksi'
  },
  {
    title: 'Detail'
  }
]

function TabPanel(props) {
  // eslint-disable-next-line react/prop-types
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  )
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  }
}

export const DetailTransactionPage = () => {
  // Use the custom hook for all business logic
  const {
    // States
    value,
    loading,
    error,
    anchorEl,
    transactionDetail,
    setSelectedGuest,
    openDialog,
    cancelGuid,
    openReason,
    drawerOpen,
    drawerOpenExtend,
    drawerOpenPayment,
    rooms,
    selectedRoomChange,
    selectedProductChange,
    note,
    openDialogCancel,
    selectedStatus,
    imageFile,
    balanceDue,
    dialogOpen,
    dialogOpenProduct,
    reason,
    roomDetail,
    productDetail,
    hasRooms,
    loadingPin,
    breakfastList,
    selectedGuest,
    balanceDetails,
    isOpen,
    isDisabled,
    userData,
    getGuid,

    // Event Handlers
    handleChange,
    handleGuestSelect,
    handleAddGuest,
    handleClick,
    handleClose,
    handleSelectChange,
    handleRoomChange,
    handleReasonChange,
    handleFileChange,
    handleNoteChange,
    handleProductChange2,
    setOpenDialogCancel,
    setNeed,

    // Dialog Handlers
    handleDialogOpen,
    handleDialogClose,
    handleDialogOpenProduct,
    handleDialogCloseProduct,
    handleOpenReason,
    handleCloseReason,
    handleCancelDialogClose,
    handleCancelClick,
    handleCancelUpdate,

    // Drawer Handlers
    toggleDrawer,
    toggleDrawerExtend,
    toggleDrawerPayment,

    // Form Submissions
    handleSaveGuest,
    handleSubmitChangeRoom,
    handleSubmitChangeProduct,
    handleConfirmCancel,
    handleConfirmUpdate,
    handleChange3,
    handleSubmitPin,
    handleResend,
    handleSend,
    handleRequest,
    openPopupCashless,

    // Utility Functions
    formatDate,
    formatDob,
    formatNumber,
    calculateNights,

    // API Functions
    fetchData
  } = useDetail()

  // JSX content continues below...

  return (
    <Box>
      {/* breadcrumb */}
      <Breadcrumb showBackButton={true} title="Reservation Detail" items={BCrumb} />
      {/* end breadcrumb */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }} mb={5}>
          {/* <Divider></Divider> */}
          <BlankCard>
            <CardContent>
              <Stack
                direction="row"
                spacing={{ xs: 1, sm: 2, md: 4 }}
                justifyContent="space-between"
                mb={3}
              >
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography variant="h6">Nama Tamu</Typography>
                  <Typography variant="body1" mb={1}>
                    {transactionDetail?.reservation_nam || transactionDetail?.ticket?.account_name}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                  <FormControl fullWidth sx={{ marginTop: '-10px' }}>
                    <Select
                      labelId="status-select-label"
                      id="status-select"
                      value={selectedStatus}
                      // label="Select Status"
                      onChange={handleSelectChange} // Handle the status change
                    >
                      <MenuItem
                        disabled={
                          transactionDetail?.ticket?.status === 'CHECKIN' ||
                          transactionDetail?.ticket?.status === 'CHECKOUT'
                        }
                        value="confirmation"
                      >
                        Confirmation
                      </MenuItem>
                      <MenuItem
                        disabled={
                          // Check if the ticket status is 'CHECKIN' or 'CHECKOUT'
                          transactionDetail?.ticket?.status === 'CHECKIN' ||
                          transactionDetail?.ticket?.status === 'CHECKOUT' ||
                          // Check if any of the transaction_items has a null room_id
                          isDisabled ||
                          // Check if any of the transaction_items has a null or empty phone
                          transactionDetail?.guest?.some((item) => !item.phone) ||
                          transactionDetail?.guest?.some(
                            (item) => !item.identity_type || !item.identity_number
                          )
                        }
                        value="in-house"
                      >
                        In-House
                      </MenuItem>
                      <MenuItem
                        disabled={transactionDetail?.ticket?.status !== 'CHECKIN'}
                        value="checked-out"
                      >
                        Check Out
                      </MenuItem>
                      <MenuItem
                        disabled={
                          new Date(transactionDetail?.check_out).setHours(0, 0, 0, 0) >=
                          new Date().setHours(0, 0, 0, 0)
                        }
                        value="extend"
                      >
                        Extend
                      </MenuItem>
                      <MenuItem
                        disabled={
                          transactionDetail?.ticket?.status !== 'CHECKIN' ||
                          transactionDetail?.ticket?.status !== 'CHECKOUT'
                        }
                        value="no-show"
                      >
                        No Show
                      </MenuItem>
                      <MenuItem
                        value="cancel"
                        disabled={
                          transactionDetail?.ticket?.status !== 'CHECKIN' ||
                          transactionDetail?.ticket?.status !== 'CHECKOUT'
                        }
                      >
                        Cancel
                      </MenuItem>
                    </Select>
                  </FormControl>
                  {/* <FormControl fullWidth sx={{ marginTop: '-10px' }}>
                                        <Select
                                            labelId="status-select-label"
                                            id="status-select"
                                            value={selectedStatus}
                                            // label="Select Status"
                                            onChange={handleSelectChange} // Handle the status change
                                        >
                                            <MenuItem value="confirmation">Confirmation</MenuItem>
                                            <MenuItem value="in-house">In-House</MenuItem>
                                            <MenuItem value="checked-out">Check Out</MenuItem>
                                            <MenuItem value="no-show">No Show</MenuItem>
                                            <MenuItem value="cancel">Cancel</MenuItem>
                                        </Select>
                                    </FormControl> */}

                  {/* Confirmation Dialog */}
                  <Dialog open={openDialog} onClose={handleCancelUpdate}>
                    <DialogTitle>Confirm Status</DialogTitle>
                    <DialogContent>
                      <DialogContentText>
                        Are you sure you want to update the status to{' '}
                        <strong>{selectedStatus}</strong>?
                      </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={handleCancelUpdate} color="primary" disabled={loading}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConfirmUpdate}
                        color="primary"
                        variant="contained"
                        disabled={loading}
                      >
                        Confirm
                      </Button>
                    </DialogActions>
                  </Dialog>
                </Box>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1 }}>
                  <Typography variant="body1" mb={1}>
                    Check In
                  </Typography>
                  <Typography variant="h6" mb={1}>
                    {formatDate(transactionDetail?.check_in)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1 }}>
                  <Typography variant="body1" mb={1}>
                    Check Out
                  </Typography>
                  <Typography variant="h6" mb={1}>
                    {formatDate(transactionDetail?.check_out)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1 }}>
                  <Typography variant="body1" mb={1}>
                    Night
                  </Typography>
                  <Typography variant="h6" mb={1}>
                    {calculateNights(transactionDetail?.check_in, transactionDetail?.check_out)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1 }}>
                  <Typography variant="body1" mb={1}>
                    Reservation Date
                  </Typography>
                  <Typography variant="h6" mb={1}>
                    {formatDate(transactionDetail?.created_at)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1 }}>
                  <Typography variant="body1" mb={1}>
                    Guests
                  </Typography>
                  <Typography variant="h6" mb={1}>
                    {transactionDetail?.transaction_item.reduce(
                      (sum, item) => sum + (item.adult_qty || 0),
                      0
                    ) ||
                      transactionDetail?.visitor ||
                      0}
                  </Typography>
                </Grid>
                {/* <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                                    <Typography variant="body1" mb={1}>
                                        Estimated Arrival Time
                                    </Typography>
                                    <Typography variant="h6" mb={1}>
                                        1232131
                                    </Typography>
                                </Grid> */}
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1 }}>
                  <Typography variant="body1" mb={1}>
                    Source
                  </Typography>
                  <Typography variant="h6" mb={1}>
                    {transactionDetail?.extranet}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                  <Typography variant="body1" mb={1}>
                    Source Reservation-ID
                  </Typography>
                  <Typography variant="h6" mb={1}>
                    {transactionDetail?.refference_id || transactionDetail?.ticket?.booking_id}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                  <Box>
                    {/* Button to trigger dropdown */}
                    <Button
                      variant="outlined"
                      onClick={handleClick}
                      sx={{ textTransform: 'none', fontWeight: 'bold' }}
                    >
                      BALANCE DUE <br />
                      Rp {formatNumber(transactionDetail?.grand_total - balanceDue || 0)}
                    </Button>

                    {/* Menu for balance details */}
                    <Menu
                      anchorEl={anchorEl}
                      open={isOpen}
                      onClose={handleClose}
                      PaperProps={{
                        style: { width: 300 } // Adjust width as needed
                      }}
                    >
                      {balanceDetails.map((detail, index) => (
                        <Box key={index}>
                          <MenuItem>
                            <Box display="flex" justifyContent="space-between" width="100%">
                              <Typography variant="body2" color="textSecondary">
                                {detail.label}
                              </Typography>
                              <Typography variant="body2">{detail.value}</Typography>
                            </Box>
                          </MenuItem>
                          {/* Add a divider after each item, except the last one */}
                          {index !== balanceDetails.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </Menu>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </BlankCard>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <BlankCard>
            <Box sx={{ maxWidth: { xs: 320, sm: 550 } }}>
              <Tabs
                value={value}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                aria-label="scrollable tabs"
              >
                <Tab
                  iconPosition="start"
                  //   icon={<IconInfoCircle size="22" />}
                  label="Accomodations"
                  {...a11yProps(0)}
                />
                <Tab
                  iconPosition="start"
                  //   icon={<IconP size="22" />}
                  label="Folio"
                  {...a11yProps(1)}
                />
                <Tab
                  iconPosition="start"
                  //   icon={<IconP size="22" />}
                  label="Guest Details"
                  {...a11yProps(1)}
                />
                <Tab
                  iconPosition="start"
                  //   icon={<IconP size="22" />}
                  label="Breakfast"
                  {...a11yProps(1)}
                />
                {/* <Tab
                                    iconPosition="start"
                                    //   icon={<IconPackage size="22" />}
                                    label="Varian"
                                    {...a11yProps(2)}
                                /> */}
                {/* <Tab
                                    iconPosition="start"
                                    //   icon={<IconBrandProducthunt size="22" />}
                                    label="Bahan/Resep"
                                    {...a11yProps(3)}
                                /> */}
                {/* <Tab
                  iconPosition="start"
                  icon={<IconLock size="22" />}
                  label="Security"
                  {...a11yProps(3)}
                /> */}
              </Tabs>
            </Box>
            <Divider />
            <ExtendDrawer
              guid={getGuid}
              trx_item={transactionDetail?.transaction_item}
              fetchData={fetchData}
              open={drawerOpenExtend}
              onClose={toggleDrawerExtend(false)}
            />

            <CardContent>
              <TabPanel value={value} index={0}>
                <Grid container spacing={0}>
                  {/* Change Profile */}
                  <Grid size={{ xs: 12, lg: 12 }}>
                    {/* <BlankCard> */}
                    <CardContent>
                      {/* <Box sx={{ overflowX: "auto" }}> */}
                      <Table sx={{ whiteSpace: { xs: 'nowrap', md: 'unset' } }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <Typography variant="h6">Res ID</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6">Type</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6">Assignment</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6">Guest</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6">Arrival / Departure</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6">Guests</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6">Night</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6">Total</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6">Action</Typography>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {loading && (
                            <TableRow>
                              <TableCell colSpan={9} align="center">
                                <CircularProgress />
                              </TableCell>
                            </TableRow>
                          )}
                          {transactionDetail?.transaction_item.length > 0 ? (
                            transactionDetail?.transaction_item.map((x, index) => {
                              // Calculate nights difference
                              const nights = calculateNights(x.check_in, x.check_out)

                              // Only render if nights > 1
                              if (nights > 0) {
                                return (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <Typography variant="h6" fontSize="14px">
                                        {transactionDetail.transaction_no}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontSize="14px">{x.name}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <FormControl fullWidth>
                                        {/* Show Select dropdown if room_id and reservation_status are null */}
                                        {(x.room_id === null || x.room_id !== null) &&
                                        x.reservation_status === null ? (
                                          <Select
                                            value={x.room_id || ''} // Use room_id from the data to pre-select the room
                                            onChange={(event) =>
                                              handleChange3(event, x.product_id, x.guid)
                                            } // Handle room selection
                                            displayEmpty
                                            disabled={loading} // Disable dropdown while loading
                                          >
                                            <MenuItem value="" disabled>
                                              {loading ? 'Loading...' : 'Select a Room'}
                                            </MenuItem>

                                            {rooms.map((room) => (
                                              <MenuItem key={room.id} value={room.id}>
                                                {room.room_no} {/* Display the room number */}
                                              </MenuItem>
                                            ))}
                                          </Select>
                                        ) : (
                                          // Show a disabled TextField displaying no_room
                                          <TextField
                                            value={x.no_room || 'N/A'} // Display no_room value or "N/A" if not available
                                            variant="outlined"
                                            fullWidth
                                            disabled // Disable the TextField
                                          />
                                        )}
                                      </FormControl>
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontSize="14px">{x.account_name}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontSize="14px">
                                        {formatDate(x.check_in)} / {formatDate(x.check_out)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontSize="14px">{x.adult_qty}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontSize="14px">{nights}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontSize="14px">
                                        {formatNumber(x.sub_total)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      {userData?.email == 'onepediaa@gmail.com' && (
                                        <Tooltip title="Kirim Manual">
                                          <IconButton
                                            color="error"
                                            onClick={() => handleOpenReason(x)}
                                          >
                                            <IconPinEnd width={22} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      {x.reservation_status === 'IN-HOUSE' &&
                                        x.codepin_guid !== null && (
                                          <Tooltip title="Kirim Ulang">
                                            <IconButton
                                              color="warning"
                                              onClick={() => handleResend(x.codepin_guid)}
                                            >
                                              <IconSend width={22} />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                      {x.reservation_status === 'IN-HOUSE' &&
                                        x.codepin_guid !== null && (
                                          <Tooltip title="Kirim WA Sekarang">
                                            <IconButton
                                              color="warning"
                                              onClick={() => handleSend(x.codepin_guid)}
                                            >
                                              <IconBrandWhatsapp width={22} />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                      {x.reservation_status === null && (
                                        <Tooltip title="Edit Produk">
                                          <IconButton
                                            color="error"
                                            onClick={() => handleDialogOpenProduct(x)}
                                          >
                                            <IconEditCircle width={22} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      {x.reservation_status === 'IN-HOUSE' &&
                                        x.codepin_guid === null &&
                                        x.room_detail?.device_id !== null && (
                                          <Tooltip title="Minta Pin">
                                            <IconButton
                                              color="warning"
                                              onClick={() => handleRequest(x.guid)}
                                            >
                                              <IconKey width={22} />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                      {x.reservation_status === 'IN-HOUSE' && (
                                        <Tooltip title="Ganti Kamar">
                                          <IconButton
                                            color="error"
                                            onClick={() => handleDialogOpen(x)}
                                          >
                                            <IconBedFilled width={22} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                )
                              } else {
                                ;<TableRow>
                                  <TableCell colSpan={9} align="center">
                                    No transaction items found.
                                  </TableCell>
                                </TableRow>
                              }
                              return null // Return null if nights <= 1
                            })
                          ) : (
                            // Handle case when no items are present
                            <TableRow>
                              <TableCell colSpan={9} align="center">
                                No transaction items found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      {/* </Box> */}
                    </CardContent>
                  </Grid>
                </Grid>
                <Dialog open={dialogOpen} onClose={handleDialogClose}>
                  <DialogTitle>Ganti Kamar</DialogTitle>
                  <DialogContent>
                    {/* Room selection */}
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="room-select-label">Pilih Kamar</InputLabel>
                      <Select
                        labelId="room-select-label"
                        value={selectedRoomChange}
                        onChange={handleRoomChange}
                        fullWidth
                      >
                        {rooms.length === 0 ||
                        rooms.every(
                          (room) =>
                            room.room_no === roomDetail?.room_no || room.id === roomDetail?.id
                        ) ? (
                          <MenuItem disabled>No rooms available</MenuItem>
                        ) : (
                          rooms.map((room) => (
                            <MenuItem
                              key={room.id}
                              value={room.guid}
                              disabled={
                                room.room_no === roomDetail?.room_no || room.id === roomDetail?.id
                              }
                            >
                              {room.room_no} {/* Display the room number */}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>

                    {/* Reason input */}
                    <TextField
                      label="Alasan"
                      fullWidth
                      value={reason}
                      onChange={handleReasonChange}
                      margin="normal"
                      multiline
                      rows={4}
                    />
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleDialogClose} color="warning">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitChangeRoom}
                      disabled={!selectedRoomChange || !reason}
                      color="primary"
                    >
                      Ganti
                    </Button>
                  </DialogActions>
                </Dialog>

                <Dialog open={dialogOpenProduct} onClose={handleDialogCloseProduct}>
                  <DialogTitle>Edit Produk</DialogTitle>
                  <DialogContent>
                    {/* Room selection */}
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="room-select-label">Pilih Product</InputLabel>
                      <Select
                        labelId="room-select-label"
                        value={selectedProductChange}
                        onChange={(event) => handleProductChange2(event)}
                        fullWidth
                      >
                        {hasRooms.map((room) => (
                          <MenuItem
                            key={room.id}
                            value={room.guid}
                            disabled={room.guid === productDetail?.product_id}
                          >
                            {room.product_name} {/* Display the product name */}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Reason input */}
                    <TextField
                      label="Alasan"
                      fullWidth
                      value={reason}
                      onChange={handleReasonChange}
                      margin="normal"
                      multiline
                      rows={4}
                    />
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleDialogCloseProduct} color="warning">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitChangeProduct}
                      disabled={!selectedProductChange || !reason}
                      color="primary"
                    >
                      Edit
                    </Button>
                  </DialogActions>
                </Dialog>
              </TabPanel>
              <TabPanel value={value} index={1}>
                <Grid container spacing={3}>
                  {/* Change Profile */}
                  <Grid size={{ xs: 12, lg: 12 }}>
                    {/* <BlankCard> */}
                    <CardContent>
                      <Box display="flex" justifyContent="flex-start" mb={2}>
                        {/* {transactionDetail?.ticket?.status === 'CHECKIN' && ( */}
                        {/* <> */}
                        <Button
                          variant="contained"
                          disableElevation
                          color="primary"
                          onClick={toggleDrawer(true)}
                        >
                          Tambah Data
                        </Button>

                        {/* </> */}
                        {/* // )} */}
                        <Button
                          sx={{ ml: 2 }}
                          variant="contained"
                          disableElevation
                          color="secondary"
                          onClick={toggleDrawerPayment(true)}
                        >
                          Pembayaran
                        </Button>
                        {transactionDetail && transactionDetail.paid_by === 'cashless' && (
                          <Button
                            sx={{ ml: 2 }}
                            variant="contained"
                            disableElevation
                            color="success"
                            onClick={() => openPopupCashless()}
                          >
                            Bayar Cashless
                          </Button>
                        )}

                        <AddItemDrawer
                          guid={getGuid}
                          fetchData={fetchData}
                          open={drawerOpen}
                          onClose={toggleDrawer(false)}
                        />

                        <AddPaymentDrawer
                          guid={getGuid}
                          fetchData={fetchData}
                          open={drawerOpenPayment}
                          onClose={toggleDrawerPayment(false)}
                          balanceDue={transactionDetail?.grand_total - balanceDue}
                        />
                        {/* <Button variant="contained" disableElevation color="secondary" onClick={() => handlePrint()}>
                                                    Cetak Stok
                                                </Button> */}
                      </Box>
                      <Box sx={{ overflowX: 'auto' }}>
                        <Table sx={{ whiteSpace: { xs: 'nowrap', md: 'unset' } }}>
                          <TableHead>
                            <TableRow>
                              <TableCell>
                                <Typography variant="h6">Res ID</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="h6">Date Time</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="h6">Name</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="h6">Category</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="h6">Notes</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="h6">Price</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="h6">Qty</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="h6">Sub Total</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="h6">Status</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="h6">Action</Typography>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {loading && (
                              <TableRow>
                                <TableCell colSpan={7} align="center">
                                  <CircularProgress />
                                </TableCell>
                              </TableRow>
                            )}
                            {transactionDetail?.transaction_item.length > 0 ? (
                              transactionDetail?.transaction_item.map((x, index) => {
                                // Calculate the nights difference for each item
                                const nights = calculateNights(x.check_in, x.check_out)

                                // Check if nights are less than 0
                                if (nights == 0) {
                                  return (
                                    <TableRow key={index}>
                                      <TableCell>
                                        <Typography variant="h6" fontSize="14px">
                                          {transactionDetail.transaction_no}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography fontSize="14px">{x.created_at}</Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography fontSize="14px">{x.name}</Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography fontSize="14px">
                                          {x.product_detail?.category?.name}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography fontSize="14px">{x.note}</Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography fontSize="14px">
                                          {formatNumber(x.price)}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography fontSize="14px">{x.qty}</Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography fontSize="14px">
                                          {formatNumber(x.sub_total)}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography fontSize="14px">{x.status || '-'}</Typography>
                                      </TableCell>
                                      <TableCell>
                                        {x.status !== 'CANCELED' &&
                                          (transactionDetail?.ticket?.status === 'CHECKOUT' ||
                                            transactionDetail?.ticket?.status === 'PAID') && (
                                            <>
                                              <Tooltip title="Cancel">
                                                <IconButton
                                                  color="error"
                                                  onClick={() => handleCancelClick(x.guid)} // Call the cancel function
                                                >
                                                  <IconX width={22} />
                                                </IconButton>
                                              </Tooltip>

                                              <Dialog
                                                open={openDialogCancel}
                                                onClose={handleCancelDialogClose}
                                              >
                                                <DialogTitle>Confirm Cancellation</DialogTitle>
                                                <DialogContent>
                                                  <DialogContentText>
                                                    Are you sure you want to cancel the transaction?
                                                  </DialogContentText>

                                                  {/* TextField for cancellation note */}
                                                  <TextField
                                                    label="Reason for Cancellation"
                                                    variant="outlined"
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    value={note}
                                                    onChange={handleNoteChange} // Handle note change
                                                    disabled={loading} // Disable when loading
                                                  />
                                                </DialogContent>
                                                <DialogActions>
                                                  <Button
                                                    onClick={handleCancelDialogClose}
                                                    color="primary"
                                                    disabled={loading}
                                                  >
                                                    No, Cancel
                                                  </Button>
                                                  <Button
                                                    onClick={handleConfirmCancel}
                                                    color="primary"
                                                    variant="contained"
                                                    disabled={loading || !note} // Disable if no note is entered or loading
                                                  >
                                                    Yes, Confirm Cancel
                                                  </Button>
                                                </DialogActions>
                                              </Dialog>
                                            </>
                                          )}
                                      </TableCell>
                                    </TableRow>
                                  )
                                } else {
                                  ;<TableRow>
                                    <TableCell colSpan={9} align="center">
                                      No transaction items found.
                                    </TableCell>
                                  </TableRow>
                                }
                                return null // Return null if nights >= 0
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={8}>
                                  <Typography align="center" variant="body1">
                                    Belum ada data item
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </Box>
                    </CardContent>
                  </Grid>
                </Grid>
              </TabPanel>
              <TabPanel value={value} index={2}>
                <>
                  <Grid container spacing={3} justifyContent="center">
                    {/* Left Panel */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                      <BlankCard>
                        <CardContent>
                          <Avatar
                            variant="rounded"
                            sx={{
                              bgcolor: 'primary.light',
                              color: 'primary.main',
                              width: 48,
                              height: 48
                            }}
                          >
                            <IconUserFilled size="26" />
                          </Avatar>

                          <Typography variant="h6" mt={2}>
                            Guest
                          </Typography>

                          {/* Guest List */}
                          {transactionDetail?.guest.map((guest, index) => (
                            <React.Fragment key={guest.id || index}>
                              <Stack
                                direction="row"
                                spacing={2}
                                py={2}
                                mt={3}
                                p={2}
                                alignItems="center"
                                onClick={() =>
                                  transactionDetail?.ticket?.status !== 'CHECKOUT' &&
                                  handleGuestSelect(guest)
                                } // Disable onClick if status is CHECKOUT
                                sx={{
                                  cursor:
                                    transactionDetail?.ticket?.status === 'CHECKOUT'
                                      ? 'not-allowed'
                                      : 'pointer',
                                  backgroundColor:
                                    selectedGuest?.id === guest.id
                                      ? 'primary.light'
                                      : 'transparent',
                                  borderRadius: 1,
                                  '&:hover': {
                                    backgroundColor:
                                      transactionDetail?.ticket?.status === 'CHECKOUT'
                                        ? 'transparent'
                                        : 'primary.light'
                                  }
                                }}
                              >
                                <Box>
                                  <Typography variant="h6">
                                    {guest.full_name || 'Guest Name'}
                                  </Typography>
                                  <Typography variant="body1">
                                    {guest.phone || 'No Phone'}
                                  </Typography>
                                </Box>
                              </Stack>
                              <Divider />
                            </React.Fragment>
                          ))}

                          {/* Add Guest Button */}
                          {transactionDetail?.transaction_item.filter(
                            (x) => calculateNights(x.check_in, x.check_out) > 1
                          ).length >= 1 &&
                            transactionDetail?.ticket?.status !== 'CHECKOUT' && (
                              <Stack mt={2}>
                                <Button variant="text" color="primary" onClick={handleAddGuest}>
                                  Add Guest
                                </Button>
                              </Stack>
                            )}
                        </CardContent>
                      </BlankCard>
                    </Grid>

                    {/* Right Panel */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                      <BlankCard>
                        <CardContent>
                          <Typography variant="h4" mb={2}>
                            Guest Information
                          </Typography>

                          <Grid container spacing={3}>
                            {/* Full Name */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <CustomFormLabel htmlFor="text-fname">Full Name</CustomFormLabel>
                              <TextField
                                value={selectedGuest?.full_name || ''}
                                onChange={(e) =>
                                  transactionDetail?.ticket?.status !== 'CHECKOUT' &&
                                  setSelectedGuest((prev) => ({
                                    ...prev,
                                    full_name: e.target.value
                                  }))
                                }
                                variant="outlined"
                                fullWidth
                                required
                                disabled={transactionDetail?.ticket?.status === 'CHECKOUT'}
                              />
                            </Grid>

                            {/* Phone */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <CustomFormLabel htmlFor="text-fname">Phone Number</CustomFormLabel>
                              <TextField
                                value={selectedGuest?.phone || ''}
                                onChange={(e) =>
                                  transactionDetail?.ticket?.status !== 'CHECKOUT' &&
                                  setSelectedGuest((prev) => ({
                                    ...prev,
                                    phone: e.target.value
                                  }))
                                }
                                variant="outlined"
                                fullWidth
                                required
                                disabled={transactionDetail?.ticket?.status === 'CHECKOUT'}
                              />
                            </Grid>

                            {/* Date of Birth */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <CustomFormLabel htmlFor="text-fname">Date of Birth</CustomFormLabel>
                              <CustomTextField
                                id="text-fname"
                                value={formatDob(selectedGuest?.dob) || ''}
                                onChange={(e) =>
                                  transactionDetail?.ticket?.status !== 'CHECKOUT' &&
                                  setSelectedGuest((prev) => ({
                                    ...prev,
                                    dob: e.target.value
                                  }))
                                }
                                variant="outlined"
                                fullWidth
                                type="date"
                                disabled={transactionDetail?.ticket?.status === 'CHECKOUT'}
                              />
                            </Grid>

                            {/* Email */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <CustomFormLabel htmlFor="text-bsector">Email</CustomFormLabel>
                              <CustomTextField
                                id="text-bsector"
                                value={selectedGuest?.email || ''}
                                onChange={(e) =>
                                  transactionDetail?.ticket?.status !== 'CHECKOUT' &&
                                  setSelectedGuest((prev) => ({
                                    ...prev,
                                    email: e.target.value
                                  }))
                                }
                                variant="outlined"
                                fullWidth
                                disabled={transactionDetail?.ticket?.status === 'CHECKOUT'}
                              />
                            </Grid>

                            {/* Identity Type */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <CustomFormLabel htmlFor="text-bsector">Identity</CustomFormLabel>
                              <Select
                                value={selectedGuest?.identity_type || ''}
                                onChange={(e) =>
                                  transactionDetail?.ticket?.status !== 'CHECKOUT' &&
                                  setSelectedGuest((prev) => ({
                                    ...prev,
                                    identity_type: e.target.value
                                  }))
                                }
                                variant="outlined"
                                fullWidth
                                disabled={transactionDetail?.ticket?.status === 'CHECKOUT'}
                              >
                                <MenuItem value="Passport">Passport</MenuItem>
                                <MenuItem value="KTP">KTP</MenuItem>
                                <MenuItem value="SIM">SIM</MenuItem>
                              </Select>
                            </Grid>

                            {/* Identity Number */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <CustomFormLabel htmlFor="text-bsector">
                                Identity Number
                              </CustomFormLabel>
                              <TextField
                                value={selectedGuest?.identity_number || ''}
                                onChange={(e) =>
                                  transactionDetail?.ticket?.status !== 'CHECKOUT' &&
                                  setSelectedGuest((prev) => ({
                                    ...prev,
                                    identity_number: e.target.value
                                  }))
                                }
                                variant="outlined"
                                fullWidth
                                disabled={transactionDetail?.ticket?.status === 'CHECKOUT'}
                              />
                            </Grid>

                            {/* Gender */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <CustomFormLabel htmlFor="gender-select">Gender</CustomFormLabel>
                              <Select
                                id="gender-select"
                                value={selectedGuest?.gender || ''}
                                onChange={(e) =>
                                  transactionDetail?.ticket?.status !== 'CHECKOUT' &&
                                  setSelectedGuest((prev) => ({
                                    ...prev,
                                    gender: e.target.value
                                  }))
                                }
                                variant="outlined"
                                fullWidth
                                disabled={transactionDetail?.ticket?.status === 'CHECKOUT'}
                              >
                                <MenuItem value="P">Male</MenuItem>
                                <MenuItem value="L">Female</MenuItem>
                              </Select>
                            </Grid>

                            {/* Address */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <CustomFormLabel htmlFor="text-bcy">Address</CustomFormLabel>
                              <CustomTextField
                                id="text-bcy"
                                value={selectedGuest?.address || ''}
                                onChange={(e) =>
                                  transactionDetail?.ticket?.status !== 'CHECKOUT' &&
                                  setSelectedGuest((prev) => ({
                                    ...prev,
                                    address: e.target.value
                                  }))
                                }
                                variant="outlined"
                                fullWidth
                                disabled={transactionDetail?.ticket?.status === 'CHECKOUT'}
                              />
                            </Grid>

                            {/* Image Upload */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Button
                                variant="contained"
                                component="label"
                                disabled={transactionDetail?.ticket?.status === 'CHECKOUT'}
                              >
                                Upload Photo
                                <input type="file" hidden onChange={handleFileChange} />
                              </Button>
                              {imageFile && <Typography>{imageFile.name}</Typography>}
                            </Grid>
                          </Grid>
                        </CardContent>
                      </BlankCard>
                    </Grid>
                  </Grid>

                  {/* Confirmation Dialog */}
                  {transactionDetail?.ticket?.status !== 'CHECKOUT' && (
                    <Stack direction="row" spacing={2} sx={{ justifyContent: 'end' }} mt={3}>
                      <Button
                        size="large"
                        variant="contained"
                        color="primary"
                        onClick={handleSaveGuest}
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                      {/* <Button size="large" variant="text" color="error">
                                            Cancel
                                        </Button> */}
                    </Stack>
                  )}

                  <Dialog
                    open={openDialogCancel}
                    onClose={() => setOpenDialogCancel(false)} // To close dialog when clicking outside or cancel
                  >
                    <DialogTitle>Confirm Cancellation</DialogTitle>
                    <DialogContent>
                      <DialogContentText>
                        Are you sure you want to cancel the transaction with GUID:{' '}
                        <strong>{cancelGuid}</strong>?
                      </DialogContentText>

                      {/* TextField for the cancellation note */}
                      <TextField
                        label="Reason for Cancellation"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={4}
                        value={note}
                        onChange={handleNoteChange} // Handle note change
                        disabled={loading}
                      />
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={handleCancelDialogClose} color="primary" disabled={loading}>
                        No, Cancel
                      </Button>
                      <Button
                        onClick={handleConfirmCancel}
                        color="primary"
                        variant="contained"
                        disabled={loading || !note}
                      >
                        Yes, Confirm Cancel
                      </Button>
                    </DialogActions>
                  </Dialog>
                </>
              </TabPanel>
              <TabPanel value={value} index={3}>
                <Grid container spacing={3} justifyContent="center">
                  <Grid size={{ xs: 12, lg: 12 }}>
                    <BlankCard>
                      <CardContent>
                        <Typography variant="h4" mb={2}>
                          Breakfast Pax
                        </Typography>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={4}
                        >
                          <Typography variant="subtitle1" color="textSecondary">
                            Verifikasi klaim sarapan berdasarkan voucher yang masuk. Periksa jumlah
                            pax dan update status bila sudah digunakan.
                          </Typography>
                        </Stack>

                        <Divider />

                        {/* list 1 */}
                        {breakfastList.map((item, index) => (
                          <div key={index}>
                            <Stack
                              direction="row"
                              spacing={2}
                              py={2}
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <Box>
                                <Typography variant="h6">
                                  Nomor Kamar - {item?.transaction_item?.no_room || '-'}
                                </Typography>

                                <Typography variant="subtitle1" color="textSecondary">
                                  Pax: {item?.pax ?? '-'}
                                </Typography>

                                {item?.claim_status && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      mt: 1,
                                      px: 1.5,
                                      py: 0.5,
                                      borderRadius: 1,
                                      display: 'inline-block',
                                      bgcolor:
                                        item.claim_status === 'claimed'
                                          ? 'success.light'
                                          : item.claim_status === 'unclaimed'
                                            ? 'error.light'
                                            : 'warning.light',
                                      color:
                                        item.claim_status === 'claimed'
                                          ? 'success.dark'
                                          : item.claim_status === 'unclaimed'
                                            ? 'error.dark'
                                            : 'warning.dark'
                                    }}
                                  >
                                    Status: {item.claim_status}
                                  </Typography>
                                )}
                              </Box>

                              <BreakfastVoucher data={item} />
                            </Stack>
                            <Divider />
                          </div>
                        ))}
                      </CardContent>
                    </BlankCard>
                  </Grid>
                </Grid>
              </TabPanel>
            </CardContent>
          </BlankCard>
        </Grid>
      </Grid>
      <Dialog
        open={openReason}
        onClose={handleCloseReason}
        maxWidth="sm" // Adjusts the width (options: 'xs', 'sm', 'md', 'lg', 'xl')
        fullWidth // Ensures the dialog takes up the full width of the maxWidth setting
        PaperProps={{
          sx: {
            width: '300px', // Custom width, can adjust as needed
            maxWidth: '80vw', // Limits width to 80% of viewport width
            backgroundColor: 'background.paper',
            color: 'text.primary'
          }
        }}
      >
        <DialogContent
          sx={{
            backgroundColor: 'background.paper',
            color: 'text.primary'
          }}
        >
          <Box component="form" noValidate autoComplete="off">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Pin"
                  name="need"
                  onChange={(e) => setNeed(e.target.value)}
                  fullWidth
                  number
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
          {error && (
            <Typography color="error" mt={2}>
              {error}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseReason}>Cancel</Button>
          <Button
            onClick={handleSubmitPin}
            variant="contained"
            color="primary"
            type="submit"
            disabled={loadingPin}
          >
            {loadingPin ? 'Mengirim Pin...' : 'Kirim Pin'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
