//INI KODE BARU
import { useNotifier } from '@renderer/components/core/NotificationProvider'
import MediaService from '@renderer/services/mediaService'
import ProductCategoryService from '@renderer/services/productCategoryService'
import ProductService from '@renderer/services/productService'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export const UseEditProduct = () => {
  const { id } = useParams()
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

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return
      try {
        const response = await productService.getProductDetail(id)
        const product = response.product
        setFormData({
          product_name: product.name,
          product_code: product.product_code,
          description: product.descriptions,
          price: product.price,
          category_id: product.category.id,
          stock: product.stock,
          published: product.published,
          status: product.status || 1,
          images: product.images,
          price_walkin: product.price_walkin,
          base_price: product.base_price,
          satuan_id: product.satuan_detail.id,
          is_book_engine: product.is_book_engine,
          is_minibar: product.is_minibar,
          app: product.app,
          is_inventory: product.is_inventory,
          instore: product.instore,
          sale: product.sale
        })
      } catch (error) {
        console.log(error)

        const axiosError = error
        const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
        notifier.show({
          message: 'Gagal Mengambil Detail Produk',
          description: message,
          severity: 'error'
        })
        console.error('Error fetching product detail:', error)
      }
    }
    fetchDetail()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading((prev) => ({ ...prev, submitData: true }))
      let uploadedImageUrl = ''

      if (formData.images && typeof formData.images !== 'string') {
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
        category_id: formData?.category_id || '',
        satuan_id: formData?.satuan_id || '',
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
        images: uploadedImageUrl || (typeof formData.images === 'string' ? formData.images : '')
      }
      const response = await productService.updateProduct(id, payload)
      notifier.show({
        message: 'Produk Berhasil Diubah',
        description: `Produk berhasil diubah!`,
        severity: 'success'
      })
      navigate(-1)
      return response.data
    } catch (error) {
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Mengubah Produk',
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
