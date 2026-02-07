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

export const AddItemDrawer = ({ guid, fetchData, open, onClose }) => {
  const componentService = ComponentService()

  const [category, setCategory] = React.useState('')
  const [item, setItem] = React.useState('')
  const [price, setPrice] = React.useState('')
  const [quantity, setQuantity] = React.useState(1)
  const [notes, setNotes] = React.useState('')
  const [categories, setCategories] = React.useState([])
  const [categoryName, setCategoryName] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [products, setProducts] = React.useState([])
  const [loadingProducts, setLoadingProducts] = React.useState(false)
  const [loadingSubmit, setLoadingSubmit] = React.useState(false)

  const handleAddItem = async () => {
    if (categoryName == 'deposit' || categoryName == 'Deposit' || categoryName == 'DEPOSIT') {
      if (item === 'refund_deposit') {
        const newItem = {
          transaction_id: guid,
          amount: price,
          type: '2',
          notes: notes,
          date: new Date().toISOString().split('T')[0]
        }

        try {
          setLoadingSubmit(true)
          await componentService.addTransactionDeposit(newItem)
          console.log('Refund deposit added successfully')
          fetchData()
          onClose()
        } catch (err) {
          console.error('Error adding refund:', err)
        } finally {
          setLoadingSubmit(false)
        }
      } else {
        const newItem = {
          transaction_id: guid,
          product_id: item,
          amount: price
        }

        try {
          setLoadingSubmit(true)
          await componentService.addTransactionDeposit(newItem)
          console.log('Deposit added successfully')
          fetchData()
          onClose()
        } catch (err) {
          console.error('Error adding deposit:', err)
        } finally {
          setLoadingSubmit(false)
        }
      }
    } else {
      const newItem = {
        transaction_id: guid,
        products: [
          {
            product_id: item,
            price: price,
            qty: quantity.toString(),
            note: notes || ''
          }
        ]
      }

      try {
        setLoadingSubmit(true)
        await componentService.addTransactionItem(newItem)
        console.log('Item added successfully')
        fetchData()
        onClose()
      } catch (err) {
        console.error('Error adding item:', err)
      } finally {
        setLoadingSubmit(false)
      }
    }
  }

  const fetchDatas = async () => {
    try {
      setLoading(true)
      const outletId = localStorage.getItem('outletGuid')
      const response = await componentService.getCategories(outletId)
      setCategories(response.data)
      console.log(response.data, 'categories')
    } catch (err) {
      console.log(err, 'isi error')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (open) {
      fetchDatas()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const fetchProducts = async (categoryId) => {
    try {
      setLoadingProducts(true)
      const response = await componentService.getProducts(categoryId)
      const { data } = response
      setProducts(data)
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleCategoryChange = (e) => {
    const selectedCategoryId = e.target.value
    const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId)

    setCategory(selectedCategoryId)
    setItem('')
    setPrice('')
    fetchProducts(selectedCategoryId)

    if (selectedCategory) {
      console.log('Selected Category Name:', selectedCategory.category_name)
      setCategoryName(selectedCategory.category_name)
    }
  }

  const handleProductChange = (e) => {
    const selectedProductId = e.target.value
    setItem(selectedProductId)

    // Find the selected product and set its price
    const selectedProduct = products.find((product) => product.guid === selectedProductId)
    if (selectedProduct) {
      setPrice(selectedProduct.price_walkin) // Assume `price` exists in the product object
    }
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <div style={{ width: 500, padding: 20 }}>
        <Typography variant="h6" gutterBottom>
          ADD ITEM
        </Typography>
        {/* Category Dropdown */}
        <FormControl fullWidth margin="normal" disabled={loading}>
          <InputLabel>Category</InputLabel>
          <Select value={category} onChange={handleCategoryChange}>
            {loading && <MenuItem disabled>Loading...</MenuItem>}
            {/* {error && <MenuItem disabled>Error loading categories</MenuItem>} */}
            {!loading &&
              categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.category_name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        {/* Item Dropdown */}
        <FormControl fullWidth margin="normal" disabled={loadingProducts || !category}>
          <InputLabel>Produk</InputLabel>
          <Select value={item} onChange={handleProductChange}>
            {loadingProducts && <MenuItem disabled>Loading...</MenuItem>}

            {/* {error && <MenuItem disabled>Error loading products</MenuItem>} */}
            {!loadingProducts &&
              products.map((product) => (
                <MenuItem key={product.id} value={product.guid}>
                  {product.name}
                </MenuItem>
              ))}
            {(categoryName === 'Deposit' ||
              categoryName === 'deposit' ||
              categoryName === 'DEPOSIT') && (
              <MenuItem key={99} value={'refund_deposit'}>
                Refund Deposit
              </MenuItem>
            )}
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
          // disabled
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        {/* Quantity Field */}
        <TextField
          fullWidth
          margin="normal"
          label="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

        {/* Payment Type Dropdown */}
        {/* <FormControl fullWidth margin="normal">
                    <InputLabel>Payment Type</InputLabel>
                    <Select
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                    >
                        <MenuItem value="do_not_collect_payment">
                            DO NOT COLLECT PAYMENT
                        </MenuItem>
                    </Select>
                </FormControl> */}

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
            disabled={!item || !quantity || loadingSubmit}
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

AddItemDrawer.propTypes = {
  guid: PropTypes.string.isRequired,
  fetchData: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}
