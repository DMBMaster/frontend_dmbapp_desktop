import { useNotifier } from '@renderer/components/core/NotificationProvider'
import ProductService from '@renderer/services/productService'
import PurchaseService from '@renderer/services/purchaseService'
import { useEffect } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const UseCreatePurchaseRequest = () => {
  const navigate = useNavigate()
  const notifier = useNotifier()
  const purchaseService = PurchaseService()
  const productService = ProductService()

  const [formData, setFormData] = useState({
    outlet_id: localStorage.getItem('outletGuid'),
    nomor: generateNumber(),
    date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [
      {
        product_id: '',
        qty: 1,
        satuan: '',
        notes: ''
      }
    ]
  })
  const [products, setProducts] = useState([])
  const [units, setUnits] = useState([])

  const [loading, setLoading] = useState({
    submitData: false,
    fetchProducts: false,
    fetchSatuan: false
  })

  const generateNumber = () => {
    const prefix = 'PR'
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomPart = Math.floor(1000 + Math.random() * 9000)

    return `${prefix}-${datePart}-${randomPart}`
  }

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
      nomor: formData.nomor,
      date: formData.date,
      notes: formData.notes,
      items: formData.items
    }

    console.log(JSON.stringify(apiPayload), 'apiPayload')
    try {
      const response = await purchaseService.createPreOrders(apiPayload)

      const result = await response.data
      console.log('Employee data submitted successfully:', result)
      notifier.show({
        message: 'Permintaan Pembelian berhasil ditambah',
        description: result.data || 'Data permintaan pembelian telah berhasil disimpan.',
        severity: 'success'
      })
      setFormData({
        outlet_id: localStorage.getItem('outletGuid'),
        nomor: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        status: 0,
        items: [
          {
            product_id: '',
            qty: 1,
            satuan: '',
            notes: ''
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
  }, [])

  return {
    formData,
    setFormData,
    loading,
    handleChange,
    handleAddItem,
    products,
    handleOrderChange,
    units,
    handleDeleteItem,
    handleSubmit
  }
}
