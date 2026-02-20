import { useNotifier } from '@renderer/components/core/NotificationProvider'
import ProductService from '@renderer/services/productService'
import { selectedOutlet, userRole } from '@renderer/utils/config'
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table'
import { useDebounce } from '@uidotdev/usehooks'
import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { IconEdit, IconEye, IconTrash } from '@tabler/icons-react'
import { formatRupiah, getImgUrl } from '@renderer/utils/myFunctions'
import { usePermissions } from '@renderer/store/usePermission'

const columnHelper = createColumnHelper()

export const UseListProduct = () => {
  const navigate = useNavigate()
  const notifier = useNotifier()
  const productService = ProductService()

  const [data, setData] = useState([])
  const permissions = usePermissions(userRole)
  const [openDialog, setOpenDialog] = useState({ delete: false })
  const [selectedDeleteId, setSelectedDeleteId] = useState(null)
  const [sorting, setSorting] = useState([])

  const [loading, setLoading] = useState({
    fetchData: false,
    handleDelete: false
  })

  const [openPreview, setOpenPreview] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')

  // Pagination
  const [pageParams, setPageParams] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    pageCount: 0,
    searchTerm: ''
  })
  const debouncedSearch = useDebounce(pageParams.searchTerm, 500)

  const fetchData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        outletId: selectedOutlet?.guid || null,
        ob: 'id',
        d: 'DESC',
        ...(debouncedSearch && { search: debouncedSearch })
      }

      const response = await productService.getProductsV2(params)
      const products = response.data || []
      const meta = response.meta

      setData(products)
      if (meta) {
        setPageParams((prev) => ({
          ...prev,
          page: meta.page,
          pageSize: meta.perPage,
          totalCount: meta.totalCount,
          pageCount: meta.pageCount
        }))
      } else {
        setPageParams((prev) => ({
          ...prev,
          pageCount: Math.ceil(products.length / prev.pageSize)
        }))
      }
    } catch (error) {
      console.log(error)
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Mengambil Data Produk',
        description: message,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }, [productService, pageParams.page, pageParams.pageSize, debouncedSearch])

  const handleDelete = async (id) => {
    try {
      setLoading((prev) => ({ ...prev, handleDelete: true }))
      await productService.deleteProduct(id)
      notifier.show({
        message: 'Berhasil Menghapus Produk',
        description: 'Produk berhasil dihapus.',
        severity: 'success'
      })
      fetchData()
    } catch (error) {
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Menghapus Produk',
        description: message,
        severity: 'error'
      })
      console.error('Error deleting product:', error)
    } finally {
      setLoading((prev) => ({ ...prev, handleDelete: false }))
    }
  }

  const handleDeleteClick = (item) => {
    setSelectedDeleteId(item.guid || item.id || null)
    setOpenDialog({ delete: true })
  }

  const handleCancelDelete = () => {
    setSelectedDeleteId(null)
    setOpenDialog({ delete: false })
  }

  const handleConfirmDelete = async () => {
    if (!selectedDeleteId) return handleCancelDelete()
    try {
      await handleDelete(selectedDeleteId)
    } finally {
      handleCancelDelete()
    }
  }

  const columns = [
    columnHelper.accessor('rowIndex', {
      header: () => 'No',
      cell: (info) => <Typography variant="body1">{info.row.index + 1}</Typography>
    }),

    // Kode
    columnHelper.accessor('product_code', {
      enableSorting: true,
      header: () => 'Kode',
      cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
    }),

    // Nama
    columnHelper.accessor('name', {
      enableSorting: true,
      header: () => 'Nama',
      cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
    }),

    // Gambar
    columnHelper.accessor('images', {
      enableSorting: false,
      header: () => 'Gambar',
      cell: (info) => {
        const productName = info.getValue()
        const imageUrl = getImgUrl(productName)
        const handleImageClick = () => {
          setPreviewImageUrl(imageUrl)
          setOpenPreview(true)
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={imageUrl}
              alt={info.row.original.name}
              style={{ width: '40px', height: '40px', marginRight: '8px', cursor: 'pointer' }} // Add pointer cursor
              onClick={handleImageClick} // Click handler
            />
            {/* Modal for image preview */}
            <Dialog open={openPreview} onClose={() => setOpenPreview(false)}>
              <DialogContent>
                <img
                  src={previewImageUrl}
                  alt="Preview"
                  style={{ width: '100%', height: 'auto' }} // Responsive image
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenPreview(false)} color="primary">
                  Close
                </Button>
              </DialogActions>
            </Dialog>
          </div>
        )
      }
    }),

    // Satuan
    columnHelper.accessor('satuan', {
      enableSorting: true,
      header: () => 'Satuan',
      cell: (info) => <Typography variant="body2">{info.getValue() || '-'}</Typography>
    }),

    // Stok
    columnHelper.accessor('stock', {
      enableSorting: true,
      header: () => 'Stok',
      cell: (info) => <Typography variant="body2">{info.getValue() ?? '-'}</Typography>
    }),

    // Persediaan
    columnHelper.accessor('stock', {
      enableSorting: true,
      header: () => 'Persediaan',
      cell: (info) => (
        <Chip
          size="small"
          label={info.getValue() > 0 ? 'In Stock' : 'Out of Stock'}
          color={info.getValue() > 0 ? 'success' : 'error'}
          sx={{ borderRadius: '6px' }}
        />
      )
    }),
    ...(permissions.update
      ? [
          columnHelper.accessor('base_price', {
            header: () => 'Harga Modal',
            cell: (info) => <Typography variant="body1">{formatRupiah(info.getValue())}</Typography>
          })
        ]
      : []),

    // Harga
    columnHelper.accessor('price_walkin', {
      header: () => 'Harga',
      cell: (info) => <Typography variant="body1">{formatRupiah(info.getValue())}</Typography>
    }),
    columnHelper.accessor('category', {
      header: () => 'Kategori',
      cell: (info) => <Typography variant="body1">{info.getValue()?.name ?? ''}</Typography>
    }),

    // Aksi
    columnHelper.display({
      id: 'actions',
      header: () => 'Aksi',
      cell: (info) => {
        return (
          <Box display="flex" justifyContent="center" gap={1}>
            {permissions.update && (
              <Tooltip title="Edit">
                <IconButton
                  color="success"
                  onClick={() => {
                    navigate(`/product/edit/${info.row.original.guid}`)
                  }}
                >
                  <IconEdit width={22} />
                </IconButton>
              </Tooltip>
            )}
            {permissions.update && (
              <Tooltip title="View">
                <IconButton
                  color="primary"
                  onClick={() => {
                    navigate(`/product/detail/${info.row.original.guid}`)
                  }}
                >
                  <IconEye width={22} />
                </IconButton>
              </Tooltip>
            )}
            {permissions.delete && (
              <Tooltip title="Delete">
                <IconButton
                  color="error"
                  onClick={() => {
                    handleDeleteClick(info.row.original)
                  }}
                >
                  <IconTrash width={22} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      }
    })
  ]

  const table = useReactTable({
    data,
    columns,
    pageCount: pageParams.pageCount,
    state: {
      pagination: {
        pageIndex: pageParams.page - 1,
        pageSize: pageParams.pageSize
      },
      sorting
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex: pageParams.page - 1, pageSize: pageParams.pageSize })
          : updater
      setPageParams((prev) => ({
        ...prev,
        page: next.pageIndex + 1,
        pageSize: next.pageSize
      }))
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true
  })

  useEffect(() => {
    fetchData()
  }, [pageParams.page, pageParams.pageSize, debouncedSearch])

  return {
    data,
    loading,
    pageParams,
    setPageParams,
    fetchData,
    table,
    permissions,
    openDialog,
    setOpenDialog,
    handleDeleteClick,
    handleCancelDelete,
    handleConfirmDelete
  }
}
