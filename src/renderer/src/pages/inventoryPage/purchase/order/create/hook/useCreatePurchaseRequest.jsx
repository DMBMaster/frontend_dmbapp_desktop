import { useNotifier } from '@renderer/components/core/NotificationProvider'
import ProductService from '@renderer/services/productService'
import PurchaseService from '@renderer/services/purchaseService'
import { selectedOutlet } from '@renderer/utils/config'
import { generatePONumber } from '@renderer/utils/myFunctions'
import { useEffect } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import MediaService from '@renderer/services/mediaService'
import SupplierService from '@renderer/services/supplierService'

export const UseCreatePurchaseRequest = () => {
  const navigate = useNavigate()
  const notifier = useNotifier()
  const purchaseService = PurchaseService()
  const productService = ProductService()
  const supplierService = SupplierService()
  const mediaService = MediaService()

  const [formData, setFormData] = useState({
    outlet_id: localStorage.getItem('outletGuid'),
    nomor: generatePONumber(),
    date: new Date().toISOString().split('T')[0],
    notes: '',
    supplier_id: '',
    pre_order_id: '',
    items: [
      {
        product_id: '',
        qty: 1,
        satuan: '',
        notes: '',
        unitPrice: 0,
        unitTotalPrice: 0
      }
    ]
  })
  const [attatchmentUrl, setAttachmentUrl] = useState('')
  const [uploadImage, setUploadImage] = useState(null)
  const [products, setProducts] = useState([])
  const [units, setUnits] = useState([])
  const [suplier, setSuplier] = useState([])
  const [preOrders, setPreOrders] = useState([])
  const [selectedPreOrder, setSelectedPreOrder] = useState(null)

  const [loading, setLoading] = useState({
    submitData: false,
    fetchProducts: false,
    fetchSatuan: false,
    fetchSupplier: false,
    fetchPreOrders: false
  })

  const { getRootProps, getInputProps } = useDropzone({
    accept: 'image/*',
    onDrop: async (acceptedFiles) => {
      setUploadImage(acceptedFiles[0])
      const formData = new FormData()
      acceptedFiles.forEach((file) => {
        formData.append('files', file)
      })

      try {
        const response = await mediaService.uploadReceipt(acceptedFiles[0])
        setAttachmentUrl(response.url)
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }
  })

  const fetchSatuan = async () => {
    try {
      setLoading((prev) => ({ ...prev, fetchSatuan: true }))
      const response = await productService.getUnitsProducts()
      setUnits(response.data || [])
    } catch (error) {
      notifier.show({
        message: 'Gagal memuat data satuan. Silakan coba lagi.',
        description:
          error.response?.data?.message || 'Terjadi kesalahan saat memuat data multi satuan.',
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchSatuan: false }))
    }
  }

  const fetchPreOrders = async () => {
    setLoading((prev) => ({ ...prev, fetchPreOrders: true }))
    try {
      const params = { status: 'Approve' }
      const response = await purchaseService.getPreOrdersByOutlet(
        selectedOutlet?.guid || localStorage.getItem('outletGuid'),
        params
      )
      setPreOrders(response.data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading((prev) => ({ ...prev, fetchPreOrders: false }))
    }
  }

  const fetchSupplier = async () => {
    setLoading((prev) => ({ ...prev, fetchSupplier: true }))
    try {
      const response = await supplierService.getSuplierByOutlet(
        selectedOutlet?.guid || localStorage.getItem('outletGuid')
      )
      setSuplier(response.data)
    } catch (error) {
      notifier.show({
        message: 'Gagal memuat data supplier. Silakan coba lagi.',
        description:
          error.response?.data?.message || 'Terjadi kesalahan saat memuat data supplier.',
        severity: 'error'
      })
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading((prev) => ({ ...prev, fetchSupplier: false }))
    }
  }

  const fetchProducts = async () => {
    setLoading((prev) => ({ ...prev, fetchProducts: true }))
    try {
      const params = {
        outletId: localStorage.getItem('outletGuid'),
        is_inventory: 1
      }
      const response = await productService.getProductsV2(params)
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
      notifier.show({
        message: 'Gagal memuat data produk. Silakan coba lagi.',
        description: error.response?.data?.message || 'Terjadi kesalahan saat memuat data produk.',
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchProducts: false }))
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => {
      const newFormData = { ...prevData, [name]: value }
      return {
        ...newFormData
      }
    })
  }

  const handleOrderChange = (index, field, value) => {
    setFormData((prevData) => {
      const updatedOrders = [...prevData.items]
      console.log(updatedOrders, 'update orderrr')
      updatedOrders[index] = {
        ...updatedOrders[index],
        [field]: value
      }
      return {
        ...prevData,
        items: updatedOrders
      }
    })
  }

  const handleAddItem = () => {
    setFormData((prevData) => {
      const updatedOrders = [
        ...prevData.items,
        {
          product_id: '',
          qty: 1,
          satuan: '',
          notes: ''
        }
      ]

      return {
        ...prevData,
        items: updatedOrders
      }
    })
  }

  const calculateTotals = (orders, vatValue) => {
    let subtotal = 0
    orders.forEach((order) => {
      const unitPrice = parseFloat(order.unitPrice) || 0
      const totalCost = unitPrice
      subtotal += totalCost
      order.unitTotalPrice = totalCost
    })

    const vatPercentage = parseFloat(vatValue) || 0
    const vat = subtotal * (vatPercentage / 100)
    const grandTotal = subtotal + vat
    return { subtotal, vat, grandTotal }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const apiPayload = {
      outlet_id: formData.outlet_id,
      no_facture: formData.nomor,
      date: formData.date,
      notes: formData.notes,
      products: formData.items.map(({ unitPrice, product_id, ...rest }) => ({
        ...rest,
        guid: product_id,
        price: unitPrice,
        type: 'IN'
      })),
      category: 'buy',
      suplier_id: formData.supplier_id,
      transaction_type: 'IN',
      pre_order_id: formData.pre_order_id === '' ? null : formData.pre_order_id,
      ...(attatchmentUrl ? { receipt: attatchmentUrl } : {})
    }
    try {
      const response = await purchaseService.createPurchaseOrder(apiPayload)

      const result = await response.data
      notifier.show({
        message: 'Permintaan Pembelian berhasil ditambah',
        description: result.data || 'Data permintaan pembelian telah berhasil disimpan.',
        severity: 'success'
      })
      setFormData({
        outlet_id: selectedOutlet?.guid || localStorage.getItem('outletGuid'),
        nomor: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        supplier_id: '',
        pre_order_id: '',
        items: [
          {
            product_id: '',
            qty: 1,
            satuan: '',
            notes: '',
            unitPrice: 0,
            unitTotalPrice: 0
          }
        ]
      })
      navigate(-1)
    } catch (error) {
      console.error('Error adding invoice:', error)

      notifier.show({
        message: 'Gagal menambah Permintaan Pembelian',
        description:
          error.response?.data?.message ||
          'Terjadi kesalahan saat menyimpan data permintaan pembelian.',
        severity: 'error'
      })
    }
  }

  const handleDeleteItem = (index) => {
    setFormData((prevData) => {
      const updatedOrders = prevData.items.filter((_, i) => i !== index)
      const totals = calculateTotals(updatedOrders, prevData.vatValue)
      return {
        ...prevData,
        items: updatedOrders,
        ...totals
      }
    })
  }

  useEffect(() => {
    fetchSatuan()
    fetchProducts()
    fetchSupplier()
    fetchPreOrders()
  }, [])

  return {
    formData,
    handleChange,
    handleAddItem,
    products,
    handleOrderChange,
    units,
    handleDeleteItem,
    loading,
    handleSubmit,
    suplier,
    setFormData,
    preOrders,
    selectedPreOrder,
    setSelectedPreOrder,
    uploadImage,
    getRootProps,
    getInputProps
  }
}
