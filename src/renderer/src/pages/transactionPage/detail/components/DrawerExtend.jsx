import React from 'react'
import PropTypes from 'prop-types'
import {
  Drawer,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Button,
  CircularProgress
} from '@mui/material'
import ComponentService from '@renderer/services/componentService'

export const ExtendDrawer = ({ guid, trx_item, fetchData, open, onClose }) => {
  const componentService = ComponentService()

  const [item, setItem] = React.useState('')
  const [price, setPrice] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [products, setProducts] = React.useState([])
  const [loadingProducts, setLoadingProducts] = React.useState(false)
  const [loadingSubmit, setLoadingSubmit] = React.useState(false)
  const [checkOutDate, setCheckOutDate] = React.useState('')
  const [selectedValue, setSelectedValue] = React.useState('')
  const formatDate = (date) => {
    const d = new Date(date)
    return d.toISOString().split('T')[0] // Get the date part in YYYY-MM-DD format
  }
  const today = new Date()
  const minCheckOutDate = formatDate(
    new Date(new Date(today).setDate(Math.max(new Date(today).getDate() + 1, today.getDate())))
  )

  console.log(trx_item, 'isi trx item')

  const handleAddItem = async () => {
    const newItem = {
      transaction_id: guid,
      products: [
        {
          product_id: item,
          qty: 1,
          status: 'IN-HOUSE',
          room_number: selectedValue.no_room,
          room_id: selectedValue.room_id,
          check_in: formatDate(today),
          check_out: checkOutDate,
          note: notes || '',
          ...(price ? { price: Number(price) } : {})
        }
      ]
    }

    console.log(newItem, 'extension payload')

    try {
      setLoadingSubmit(true)
      await componentService.addExtensionService(newItem)
      console.log('Extension added successfully')
      fetchData()
      onClose()
    } catch (err) {
      console.error('Error adding extension:', err)
    } finally {
      setLoadingSubmit(false)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const outletId = localStorage.getItem('outletGuid')
      const response = await componentService.getProductsWithRooms(outletId)
      const { data } = response
      console.log(data, 'products with rooms')
      setProducts(data)
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoadingProducts(false)
    }
  }

  React.useEffect(() => {
    if (open) {
      fetchProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleProductChange = (e) => {
    const selectedProductId = e.target.value
    setItem(selectedProductId)

    const selectedProduct = products.find((product) => product.guid === selectedProductId)
    if (selectedProduct) {
      setPrice(selectedProduct.price)
    }
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <div style={{ width: 500, padding: 20 }}>
        <Typography variant="h6" gutterBottom>
          Extend Booking
        </Typography>

        {/* Item Dropdown */}
        <FormControl fullWidth margin="normal" disabled={loadingProducts}>
          <InputLabel>Produk</InputLabel>
          <Select value={item} onChange={handleProductChange}>
            {loadingProducts && <MenuItem disabled>Loading...</MenuItem>}
            {/* {error && <MenuItem disabled>Error loading products</MenuItem>} */}
            {!loadingProducts &&
              products.map((product) => (
                <MenuItem key={product.id} value={product.guid}>
                  {product.product_name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        {/* Assign To Dropdown */}
        {/* <FormControl fullWidth margin="normal">
                    <InputLabel>Assign to</InputLabel>
                    <Select
                        value={assignTo}
                        onChange={(e) => setAssignTo(e.target.value)}
                    >
                        <MenuItem value="suzy_practice">SUZY PRACTICE</MenuItem>
                    </Select>
                </FormControl> */}

        {/* Checkbox for Current Date and Time */}
        {/* <FormControlLabel
                    control={
                        <Checkbox
                            checked={postCurrentTime}
                            onChange={(e) => setPostCurrentTime(e.target.checked)}
                        />
                    }
                    label="Post with current date and time"
                /> */}

        {/* Price Field */}
        <TextField
          fullWidth
          margin="normal"
          label="Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)} // Update state on change
        />

        {/* Quantity Field */}
        <TextField
          required
          fullWidth
          label="Pilih Tanggal Check-out"
          type="date"
          value={checkOutDate}
          onChange={(e) => setCheckOutDate(e.target.value)}
          margin="normal"
          InputLabelProps={{ shrink: true }}
          inputProps={{
            min: minCheckOutDate,
            onKeyDown: (event) => event.preventDefault()
          }}
        />

        {/* Payment Type Dropdown */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Room</InputLabel>
          <Select
            value={JSON.stringify(selectedValue)} // Ensure this matches the MenuItem value
            onChange={(e) => {
              const selectedValue = JSON.parse(e.target.value) // Parse JSON string
              setSelectedValue(selectedValue) // Update state with the parsed object
              console.log('Selected Room ID:', selectedValue.room_id)
              console.log('Selected Room Number:', selectedValue.no_room)
            }}
          >
            {trx_item
              ?.filter((item) => {
                // Calculate duration in days
                const checkIn = new Date(item.check_in)
                const checkOut = new Date(item.check_out)
                const duration = (checkOut - checkIn) / (1000 * 60 * 60 * 24)

                return duration >= 1 // Filter out items with 0 or negative duration
              })
              .reduce(
                (acc, item) => {
                  // Use a Set to keep track of unique room_id and no_room
                  const uniqueKey = `${item.room_id}-${item.no_room}`
                  if (!acc.set.has(uniqueKey)) {
                    acc.set.add(uniqueKey)
                    acc.result.push(item)
                  }
                  return acc
                },
                { set: new Set(), result: [] }
              )
              .result // Extract the result array
              .map((item, index) => (
                <MenuItem
                  key={index}
                  value={JSON.stringify({ room_id: item.room_id, no_room: item.no_room })}
                >
                  {item.no_room}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        {/* Notes Field */}
        <TextField
          fullWidth
          margin="normal"
          label="Notes"
          multiline
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Actions */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddItem}
            disabled={!item || !checkOutDate || !selectedValue || loadingSubmit}
          >
            {loadingSubmit ? <CircularProgress size={24} /> : 'Tambah'}
          </Button>
          <Button variant="outlined" onClick={onClose}>
            Batal
          </Button>
        </div>
      </div>
    </Drawer>
  )
}

ExtendDrawer.propTypes = {
  guid: PropTypes.string.isRequired,
  trx_item: PropTypes.array.isRequired,
  fetchData: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}
