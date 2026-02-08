/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import {
  Drawer,
  Box,
  TextField,
  Button,
  Autocomplete,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Grid,
  CircularProgress,
  IconButton
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

export const CheckinFormDrawer = ({
  open,
  handleClose,
  order,
  transactionitem,
  guid,
  reloadTransactions,
  frontofficeService
}) => {
  // Form state
  const [formValues, setFormValues] = useState({
    account_name: order?.account_name || '',
    phone: order?.phone || '',
    identity: order?.identity || '',
    identity_number: order?.identity_number || '',
    deposit: order?.deposit || '',
    room: []
  })
  const [rooms, setRooms] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingBtn, setLoadingBtn] = useState(false)
  const [error, setError] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Update form values
  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'deposit') {
      const numericValue = value.replace(/[^0-9]/g, '')
      const formattedValue = formatNumberWithCommas(numericValue)
      setFormValues((prevValues) => ({
        ...prevValues,
        [name]: formattedValue
      }))
    } else {
      setFormValues((prevValues) => ({
        ...prevValues,
        [name]: value
      }))
    }
  }

  // Fetch room data via service
  useEffect(() => {
    const fetchRooms = async () => {
      if (!frontofficeService) return
      try {
        const result = await frontofficeService.getRooms({ status_id: 6 })
        setRooms(result.data || [])
      } catch (err) {
        console.error('Error fetching rooms:', err)
      }
    }
    fetchRooms()
  }, [frontofficeService])

  // Fetch customers via service
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!frontofficeService) return
      setLoading(true)
      try {
        const result = await frontofficeService.getCustomers()
        setCustomers(result.data || [])
      } catch (err) {
        console.error('Error fetching customers:', err)
        setCustomers([])
      } finally {
        setLoading(false)
      }
    }
    fetchCustomers()
  }, [frontofficeService])

  const formatNumberWithCommas = (value) => {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // Filter rooms based on transaction items
  useEffect(() => {
    const filterRooms = () => {
      if (!transactionitem?.length) return
      const newFilteredRooms = rooms.filter((room) => {
        return transactionitem.some((item) => {
          return item.product_id === room.product?.guid
        })
      })
      setFilteredRooms(newFilteredRooms)
    }
    if (rooms.length > 0 && transactionitem?.length > 0) {
      filterRooms()
    }
  }, [rooms, transactionitem])

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    let requestData = {}
    if (selectedCustomer) {
      requestData = {
        deposit: formValues.deposit.replace(/,/g, ''),
        status_deposit: true,
        customer_id: selectedCustomer,
        room: [formValues.room]
      }
    } else {
      requestData = {
        account_name: formValues.account_name,
        phone: formValues.phone,
        identity: formValues.identity,
        identity_number: formValues.identity_number,
        room: [formValues.room],
        deposit: formValues.deposit.replace(/,/g, ''),
        status_deposit: true
      }
    }

    setLoadingBtn(true)
    try {
      await frontofficeService.checkIn(guid, requestData)
      handleClose()

      if (reloadTransactions) {
        reloadTransactions()
      }
    } catch (err) {
      setLoadingBtn(false)
      if (err.response) {
        console.error('Error during check-in', err.response.data.message)
        setError(err.response.data.message)
      }
    }
  }

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}>
      <Box sx={{ width: 500, p: 2 }}>
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{ height: '100%', mt: 3 }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Check-in Form - {order?.booking_id}</Typography>
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Box>
            <form id="checkin-form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                {/* Autocomplete for Customer Selection */}
                <Grid item xs={12}>
                  <Autocomplete
                    value={customers.find((c) => c.id === selectedCustomer) || null}
                    onChange={(event, newValue) => {
                      if (newValue) {
                        setSelectedCustomer(newValue.id)
                      } else {
                        setSelectedCustomer(null)
                      }
                    }}
                    options={customers}
                    getOptionLabel={(option) => option.full_name || ''}
                    isOptionEqualToValue={(option, val) => option.id === val?.id}
                    loading={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Customer"
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>
                {!selectedCustomer && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nama Pemesan"
                        name="account_name"
                        value={formValues.account_name}
                        onChange={handleInputChange}
                        disabled={!!order?.customer_id}
                        required
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nomor Handphone"
                        name="phone"
                        value={formValues.phone}
                        onChange={handleInputChange}
                        type="number"
                        disabled={!!order?.customer_id}
                        required
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Jenis Identitas</InputLabel>
                        <Select
                          name="identity"
                          value={formValues.identity}
                          onChange={handleInputChange}
                          disabled={!!order?.customer_id}
                          required
                        >
                          <MenuItem value="KTP">KTP</MenuItem>
                          <MenuItem value="SIM">SIM</MenuItem>
                          <MenuItem value="Paspor">Paspor</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nomor Identitas"
                        name="identity_number"
                        value={formValues.identity_number}
                        onChange={handleInputChange}
                        disabled={!!order?.customer_id}
                        required
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Room Number</InputLabel>
                    <Select
                      name="room"
                      value={formValues.room}
                      onChange={handleInputChange}
                      required
                    >
                      {filteredRooms.length > 0 ? (
                        filteredRooms.map((room, index) => (
                          <MenuItem key={index} value={room.guid}>
                            {room.room_no}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>
                          No rooms available for the selected accommodation
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Deposit"
                    name="deposit"
                    type="text"
                    value={formValues.deposit}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    disabled={loadingBtn}
                    variant="contained"
                    color="primary"
                    fullWidth
                  >
                    {loadingBtn ? 'Check-In...' : 'Check-In'}
                  </Button>
                  {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
                </Grid>
              </Grid>
            </form>
          </>
        )}
      </Box>
    </Drawer>
  )
}
