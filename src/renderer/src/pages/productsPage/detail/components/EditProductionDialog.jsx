import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Tooltip,
  IconButton
} from '@mui/material'
import { IconEdit } from '@tabler/icons-react'

// eslint-disable-next-line react/prop-types
const EditItemDialog = ({ data, item, onUpdate }) => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({ ...item })

  const handleOpen = () => setOpen(true)

  const handleClose = () => setOpen(false)

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSave = () => {
    const updatedData = { ...data }
    const itemIndex = updatedData.items.findIndex((i) => i.id === formData.id)

    if (itemIndex !== -1) {
      updatedData.items[itemIndex] = { ...formData }
    }

    onUpdate(updatedData)

    handleClose()
  }

  return (
    <>
      {/* Edit Button */}
      <Tooltip title="Edit">
        <IconButton color="success" onClick={handleOpen}>
          <IconEdit width={22} />
        </IconButton>
      </Tooltip>

      {/* Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Product Name"
            type="text"
            fullWidth
            value={formData?.product?.product_name}
            disabled
          />
          <TextField
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            value={formData.qty}
            onChange={(e) => handleChange('qty', parseInt(e.target.value))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default EditItemDialog
