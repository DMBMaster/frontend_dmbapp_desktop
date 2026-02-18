//INI KODE BARU
import { useNotifier } from '@renderer/components/core/NotificationProvider'
import MediaService from '@renderer/services/mediaService'
import ProductCategoryService from '@renderer/services/productCategoryService'
import ProductService from '@renderer/services/productService'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const UseAddProduct = () => {
  const navigate = useNavigate()
  const notifier = useNotifier()
  const productService = ProductService()
  const mediaService = MediaService()
  const productCategoryService = ProductCategoryService()

  const [formData, setFormData] = useState({
    category_id: '',
    description: '',
    product_code: '',
    product_name: '',
    price: '',
    price_walkin: '',
    stock: '',
    published: '',
    status: '',
    images: '',
    base_price: '',
    satuan_id: '',
    is_book_engine: '',
    is_minibar: '',
    app: '',
    is_inventory: '',
    sale: '',
    instore: '',
    outlet_id: ''
  })
  const [formOption, setFormOption] = useState({
    inStore: true,
    bookingEngine: false,
    miniBar: false,
    isDMBEnabled: false,
    isInventory: false,
    sale: false
  })
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [units, setUnits] = useState([])
  const [selectedUnit, setSelectedUnit] = useState(null)

  const [loading, setLoading] = useState({
    fetchCategories: false,
    fetchUnitsProducts: false,
    submitData: false
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading((prev) => ({ ...prev, submitData: true }))
      let uploadedImageUrl = ''

      if (formData.images) {
        try {
          const result = await mediaService.uploadReceipt(formData.images)
          uploadedImageUrl = result.url
          notifier.show({
            message: 'File uploaded successfully',
            description: 'Image uploaded successfully',
            severity: 'success'
          })
        } catch (error) {
          notifier.show({
            message: 'Error uploading file',
            description: `There was an error uploading the image. ${error.message}`,
            severity: 'error'
          })
        }
      }
      const payload = {
        ...formData,
        category_id: selectedCategory?.guid || '',
        satuan_id: selectedUnit?.id || '',
        is_book_engine: formOption.bookingEngine,
        is_minibar: formOption.miniBar,
        app: formOption.isDMBEnabled,
        is_inventory: formOption.isInventory,
        sale: formOption.sale,
        instore: formOption.inStore,
        outlet_id: localStorage.getItem('outletGuid'),
        price: parseFloat(formData.price) || 0,
        price_walkin: parseFloat(formData.price_walkin) || 0,
        base_price: parseFloat(formData.base_price) || 0,
        stock: parseInt(formData.stock) || 0,
        published: true,
        status: 1,
        images: uploadedImageUrl
      }
      const response = await productService.createProduct(payload)
      notifier.show({
        message: 'Produk Berhasil Ditambahkan',
        description: `Produk berhasil ditambahkan!`,
        severity: 'success'
      })
      navigate(-1)
      return response.data
    } catch (error) {
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Menambahkan Produk',
        description: message,
        severity: 'error'
      })
      console.error('Error submitting product data:', error)
      throw error
    } finally {
      setLoading((prev) => ({ ...prev, submitData: false }))
    }
  }

  const fetchCategories = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchCategories: true }))
    try {
      const outlet_id = localStorage.getItem('outletGuid')
      const response = await productCategoryService.getCategoriesByOutlet(outlet_id)
      setCategories(response.data || [])
    } catch (error) {
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Mengambil Data Kategori',
        description: message,
        severity: 'error'
      })
      console.error('Error fetching categories:', error)
    } finally {
      setLoading((prev) => ({ ...prev, fetchCategories: false }))
    }
  }, [productCategoryService])

  const fetchUnitsProducts = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchUnitsProducts: true }))
    try {
      const response = await productService.getUnitsProducts()
      setUnits(response.data || [])
    } catch (error) {
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Mengambil Data Satuan Produk',
        description: message,
        severity: 'error'
      })
      console.error('Error fetching units products:', error)
    } finally {
      setLoading((prev) => ({ ...prev, fetchUnitsProducts: false }))
    }
  }, [productService])

  useEffect(() => {
    fetchCategories()
    fetchUnitsProducts()
  }, [])

  return {
    categories,
    units,
    loading,
    handleChange,
    handleSubmit,
    setFormData,
    formData,
    formOption,
    setFormOption,
    selectedCategory,
    setSelectedCategory,
    selectedUnit,
    setSelectedUnit
  }
}
