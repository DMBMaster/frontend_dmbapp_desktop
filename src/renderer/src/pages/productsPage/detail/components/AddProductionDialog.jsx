/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete
} from '@mui/material'
import ProductService from '@renderer/services/productService'

// eslint-disable-next-line react/prop-types
const AddItemDialog = ({ open, onClose, handleUpdate, updatedData }) => {
  const productService = ProductService()
  const [formData, setFormData] = useState({
    product_id: '',
    qty: '',
    type: 'source'
  })
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({
    product_id: false,
    qty: false
  })

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    setErrors({ ...errors, [field]: false }) // Clear error when user types
  }

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = {
          outletId: localStorage.getItem('outletGuid'),
          ob: 'id',
          d: 'DESC',
          is_inventory: true
        }
        const response = await productService.getProducts(params)
        setProducts(response.data)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const generateRandomCode = () => {
    const randomNumber = Math.floor(Math.random() * 900000) + 100000
    return `X/${randomNumber}`
  }

  const handleAdd = () => {
    const newErrors = {
      product_id: formData.product_id === '',
      qty: formData.qty === '' || isNaN(formData.qty) || parseInt(formData.qty, 10) <= 0
    }

    if (newErrors.product_id || newErrors.qty) {
      setErrors(newErrors) // Set errors if any field is empty or invalid
      return // Prevent form submission
    }

    if (!updatedData || updatedData.length === 0) {
      updatedData = [
        {
          outlet: {
            guid: localStorage.getItem('outletGuid')
          },
          no_production: generateRandomCode(),
          items: [],
          notes: 'Tambah dari Produk',
          new: true
        }
      ]
    }

    const newItem = {
      product_id: formData.product_id,
      qty: parseInt(formData.qty, 10),
      type: 'source',
      product: {
        guid: formData.product_id
      }
    }

    const updatedItems = [newItem, ...(updatedData[0]?.items || [])]

    const updatedDataWithNewItem = updatedData.map((item) => {
      if (item.id === updatedData[0]?.id) {
        return {
          ...item,
          items: updatedItems
        }
      }
      return item
    })

    handleUpdate(updatedDataWithNewItem[0])
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Tambah Bahan</DialogTitle>
      <DialogContent style={{ width: 400 }}>
        <Autocomplete
          options={products}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.guid === value}
          loading={loading}
          fullWidth
          onChange={(event, newValue) => handleChange('product_id', newValue?.guid || '')}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Pilih Produk"
              margin="dense"
              variant="outlined"
              fullWidth
              required
              error={errors.product_id}
              helperText={errors.product_id ? 'Product is required' : ''}
            />
          )}
        />
        <TextField
          margin="dense"
          label="Qty"
          type="number"
          fullWidth
          value={formData.qty}
          onChange={(e) => handleChange('qty', e.target.value)}
          required
          error={errors.qty}
          helperText={errors.qty ? 'Quantity is required and must be a positive number' : ''}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleAdd} color="primary">
          Tambah
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddItemDialog
