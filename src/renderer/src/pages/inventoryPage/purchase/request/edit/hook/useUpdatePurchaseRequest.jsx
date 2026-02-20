import { useNotifier } from '@renderer/components/core/NotificationProvider'
import ProductService from '@renderer/services/productService'
import PurchaseService from '@renderer/services/purchaseService'
import { useEffect } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export const UseUpdatePurchaseRequest = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const notifier = useNotifier()
  const purchaseService = PurchaseService()
  const productService = ProductService()

  const [formData, setFormData] = useState({
    outlet_id: localStorage.getItem('outletGuid'),
    nomor: '',
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
  const [detailData, setDetailData] = useState()
  const [products, setProducts] = useState([])
  const [units, setUnits] = useState([])

  const [loading, setLoading] = useState({
    submitData: false,
    fetchProducts: false,
    fetchSatuan: false,
    fetchDetailData: false
  })

  useEffect(() => {
    if (!id) return
    const fetchDetailData = async () => {
      setLoading((prev) => ({ ...prev, fetchDetailData: true }))
      try {
        const response = await purchaseService.getDetailPreOrder(id)
        setDetailData(response.data)
        setFormData({
          outlet_id: localStorage.getItem('outletGuid'),
          nomor: response.data.nomor,
          date: response.data.date,
          notes: response.data.notes,
          status: response.data.status,
          items: response.data.items.map((x) => ({
            name: x.product.product_name,
            stock: x.product.stock,
            product_id: x.product.guid,
            qty: x.qty,
            satuan: x.satuan,
            notes: x.notes
          }))
        })
      } catch (error) {
        console.error('Error fetching transactions:', error)
        notifier.show({
          message: 'Gagal memuat data permintaan pembelian. Silakan coba lagi.',
          description:
            error.response?.data?.message ||
            'Terjadi kesalahan saat memuat data permintaan pembelian.',
          severity: 'error'
        })
      } finally {
        setLoading((prev) => ({ ...prev, fetchDetailData: false }))
      }
    }
    fetchDetailData()
  }, [])

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
      const response = await purchaseService.updatePreOrders(id, JSON.stringify(apiPayload))

      const result = await response.data
      notifier.show({
        message: 'Permintaan Pembelian berhasil diperbarui',
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
      console.error('Error updating invoice:', error)

      notifier.show({
        message: 'Gagal memperbarui Permintaan Pembelian',
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
    handleSubmit,
    detailData
  }
}
