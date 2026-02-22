import { useState } from 'react'
import { TableCell, Dialog, DialogContent, DialogActions, Button } from '@mui/material'
import { getImgUrl } from '@renderer/utils/myFunctions'

// eslint-disable-next-line react/prop-types
const ProductImageCell = ({ imageUrli }) => {
  const imageUrl = imageUrli ? `${getImgUrl(imageUrli)}` : ''
  const [openPreview, setOpenPreview] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')

  const handleImageClick = () => {
    setPreviewImageUrl(imageUrl)
    setOpenPreview(true)
  }

  return (
    <TableCell>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {imageUrli && (
          <img
            src={imageUrl}
            style={{ width: '40px', height: '40px', marginRight: '8px', cursor: 'pointer' }}
            onClick={handleImageClick}
          />
        )}
        {/* Modal for image preview */}
        <Dialog open={openPreview} onClose={() => setOpenPreview(false)}>
          <DialogContent>
            <img src={previewImageUrl} alt="Preview" style={{ width: '100%', height: 'auto' }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPreview(false)} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </TableCell>
  )
}

export default ProductImageCell
