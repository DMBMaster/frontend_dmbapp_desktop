/* eslint-disable react/prop-types */
import { useState } from 'react'
import { Drawer, Box, TextField, Button, Typography, Grid, CircularProgress } from '@mui/material'

const CheckOutFormDrawer = ({
  open,
  handleClose,
  order,
  guid,
  reloadTransactions,
  loading,
  frontofficeService
}) => {
  // Form state
  const [formValues, setFormValues] = useState({
    deposit: order?.deposit || ''
  })
  const [loadingBtn, setLoadingBtn] = useState(false)
  const [error, setError] = useState('')

  const formatNumberWithCommas = (value) => {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

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

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    const requestData = {
      deposit: formValues.deposit.replace(/,/g, ''),
      status_deposit: false
    }

    setLoadingBtn(true)
    try {
      await frontofficeService.checkOut(guid, requestData)
      handleClose()

      if (reloadTransactions) {
        reloadTransactions()
      }
    } catch (err) {
      setLoadingBtn(false)
      if (err.response) {
        console.error('Error during check-out', err.response.data.message)
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
            <Typography mb={3} variant="h6" gutterBottom>
              Check-out Form
            </Typography>
            <form id="checkin-form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Pengembalian Deposit"
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
                    {loadingBtn ? 'Check-Out...' : 'Check-Out'}
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

export default CheckOutFormDrawer
