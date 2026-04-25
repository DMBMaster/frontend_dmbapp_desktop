import { useNotifier } from '@renderer/components/core/NotificationProvider'
import MediaService from '@renderer/services/mediaService'
import ProductService from '@renderer/services/productService'
import StockOpnameService from '@renderer/services/stockOpnameService'
import { generateOpnameNumber } from '@renderer/utils/myFunctions'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'

const getInitialItem = () => ({
  product_id: '',
  stock: 0,
  actual: '',
  selisih: 0,
  satuan: '',
  product_satuan: [],
  product_satuan_id: ''
})

export const UseCreateStockOpname = () => {
  const navigate = useNavigate()
  const notifier = useNotifier()
  const productService = ProductService()
  const stockOpnameService = StockOpnameService()
  const mediaService = MediaService()

  const [formData, setFormData] = useState({
    outlet_id: localStorage.getItem('outletGuid'),
    nomor: generateOpnameNumber(),
    date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [getInitialItem()]
  })
  const [products, setProducts] = useState([])
  const [uploadImage, setUploadImage] = useState(null)
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [loading, setLoading] = useState({
    fetchProducts: false,
    submitData: false,
    uploadImage: false
  })

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      const [file] = acceptedFiles
      if (!file) return

      setUploadImage(file)
      setLoading((prev) => ({ ...prev, uploadImage: true }))
      try {
        const response = await mediaService.uploadReceipt(file)
        setAttachmentUrl(response.url || '')
      } catch (error) {
        notifier.show({
          message: 'Gagal upload lampiran',
          description: error.response?.data?.message || 'Terjadi kesalahan saat mengunggah file.',
          severity: 'error'
        })
      } finally {
        setLoading((prev) => ({ ...prev, uploadImage: false }))
      }
    }
  })

  const fetchProducts = async () => {
    setLoading((prev) => ({ ...prev, fetchProducts: true }))
    try {
      const response = await productService.getProductsV2({
        outletId: localStorage.getItem('outletGuid'),
        is_inventory: 1
      })
      setProducts(response.data || [])
    } catch (error) {
      notifier.show({
        message: 'Gagal memuat data produk',
        description: error.response?.data?.message || 'Terjadi kesalahan saat memuat produk.',
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchProducts: false }))
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleOrderChange = (index, field, value) => {
    setFormData((prev) => {
      const items = [...prev.items]
      const currentItem = items[index]
      const nextItem = {
        ...currentItem,
        [field]: value
      }

      if (field === 'stock' || field === 'actual') {
        const stock = Number(field === 'stock' ? value : nextItem.stock) || 0
        const actual = Number(field === 'actual' ? value : nextItem.actual) || 0
        nextItem.selisih = Math.max(stock - actual, 0)
      }

      items[index] = nextItem
      return {
        ...prev,
        items
      }
    })
  }

  const handleSelectProduct = (index, product) => {
    const defaultUnit = product?.product_satuan?.[0] || null

    setFormData((prev) => {
      const items = [...prev.items]
      items[index] = {
        ...items[index],
        product_id: product?.guid || '',
        stock: defaultUnit?.stock ?? product?.stock ?? 0,
        actual: '',
        selisih: 0,
        satuan: defaultUnit?.satuan?.name ?? product?.satuan ?? '',
        product_satuan: product?.product_satuan ?? [],
        product_satuan_id: defaultUnit?.guid ?? ''
      }

      return {
        ...prev,
        items
      }
    })
  }

  const handleSelectUnit = (index, selectedUnit) => {
    setFormData((prev) => {
      const items = [...prev.items]
      const currentActual = Number(items[index].actual) || 0
      const stock = selectedUnit?.stock ?? 0
      items[index] = {
        ...items[index],
        satuan: selectedUnit?.satuan?.name ?? '',
        product_satuan_id: selectedUnit?.guid ?? '',
        stock,
        selisih: Math.max(stock - currentActual, 0)
      }

      return {
        ...prev,
        items
      }
    })
  }

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, getInitialItem()]
    }))
  }

  const handleDeleteItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index)
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const payload = {
      outlet_id: formData.outlet_id,
      no_facture: formData.nomor,
      category: 'opname',
      date: formData.date,
      notes: formData.notes,
      products: formData.items.map((item) => {
        const stock = Number(item.stock) || 0
        const actual = Number(item.actual) || 0
        const difference = actual - stock

        return {
          guid: item.product_id,
          qty: difference >= 0 ? difference : Math.abs(difference),
          type: difference >= 0 ? 'IN' : 'OUT',
          product_satuan_id: item.product_satuan_id || undefined
        }
      }),
      ...(attachmentUrl ? { receipt: attachmentUrl } : {})
    }

    try {
      setLoading((prev) => ({ ...prev, submitData: true }))
      const result = await stockOpnameService.createStockOpname(payload)
      console.log('Create Stock Opname Result:', result)
      if (result.status === 'ok') {
        notifier.show({
          message: 'Stok opname berhasil ditambah',
          description: 'Data stok opname telah berhasil disimpan.',
          severity: 'success'
        })
        navigate(-1)
      }
    } catch (error) {
      notifier.show({
        message: 'Gagal menambah stok opname',
        description:
          error.response?.data?.message || 'Terjadi kesalahan saat menyimpan stok opname.',
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, submitData: false }))
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return {
    formData,
    products,
    uploadImage,
    loading,
    handleChange,
    handleOrderChange,
    handleSelectProduct,
    handleSelectUnit,
    handleAddItem,
    handleDeleteItem,
    handleSubmit,
    getRootProps,
    getInputProps
  }
}
