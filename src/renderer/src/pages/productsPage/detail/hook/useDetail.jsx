import { useNotifier } from '@renderer/components/core/NotificationProvider'
import ProductService from '@renderer/services/productService'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export const UseDetail = () => {
  const { id } = useParams()
  const notifier = useNotifier()
  const productService = ProductService()

  const [detailData, setDetailData] = useState(null)
  const [multiSatuan, setMultiSatuan] = useState([])
  const [multiHarga, setMultiHarga] = useState([])
  const [productions, setProductions] = useState([])
  const [units, setUnits] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)

  const [multiSatuanData, setMultiSatuanData] = useState({
    satuan_id: '',
    product_id: id,
    value: '',
    qty: 0,
    stock: null,
    amount: 0
  })

  const [multiHargaData, setMultiHargaData] = useState({
    product_id: id,
    min_quantity: null,
    max_quantity: null,
    price: null
  })

  const [loading, setLoading] = useState({
    fetchDetail: false,
    fetchDataMultiSatuan: false,
    fetchDataMultiHarga: false,
    fetchDataUnit: false,
    fetchDataProduction: false,
    submit: false
  })

  const [openDialog, setOpenDialog] = useState({
    addMultiSatuan: false,
    deleteMultiSatuan: false,
    addMultiHarga: false,
    deleteMultiHarga: false,
    addProduction: false
  })

  const [error, setError] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  const showError = (title, error) => {
    const message = error?.response?.data?.message || 'Terjadi kesalahan pada server!'
    notifier.show({ message: title, description: message, severity: 'error' })
  }

  const resetMultiSatuanData = (price = '') => {
    setMultiSatuanData({
      satuan_id: '',
      product_id: id,
      value: price,
      qty: 0,
      stock: null,
      amount: 0
    })
  }

  const resetMultiHargaData = () => {
    setMultiHargaData({ product_id: '', min_quantity: null, max_quantity: null, price: null })
  }

  const fetchDetail = async () => {
    if (!id) return
    try {
      setLoading((prev) => ({ ...prev, fetchDetail: true }))
      const response = await productService.getProductDetail(id)
      const product = response.product
      setDetailData(product)

      setMultiSatuanData((prev) => ({ ...prev, value: product?.price_walkin ?? '' }))
    } catch (error) {
      showError('Gagal Mengambil Detail Produk', error)
    } finally {
      setLoading((prev) => ({ ...prev, fetchDetail: false }))
    }
  }

  const fetchDataMultiSatuan = async () => {
    try {
      setLoading((prev) => ({ ...prev, fetchDataMultiSatuan: true }))
      const response = await productService.getMultiSatuan(id)
      setMultiSatuan(response.data || [])
    } catch (error) {
      showError('Gagal Mengambil Data Multi Satuan', error)
    } finally {
      setLoading((prev) => ({ ...prev, fetchDataMultiSatuan: false }))
    }
  }

  const fetchDataMultiHarga = async (productId) => {
    try {
      setLoading((prev) => ({ ...prev, fetchDataMultiHarga: true }))
      const response = await productService.getMultiHarga(productId)
      setMultiHarga(response.data || [])
    } catch (error) {
      showError('Gagal Mengambil Data Multi Harga', error)
    } finally {
      setLoading((prev) => ({ ...prev, fetchDataMultiHarga: false }))
    }
  }

  const fetchDataUnit = async () => {
    try {
      setLoading((prev) => ({ ...prev, fetchDataUnit: true }))
      const response = await productService.getUnits()
      setUnits(response.data || [])
    } catch (error) {
      showError('Gagal Mengambil Data Satuan', error)
    } finally {
      setLoading((prev) => ({ ...prev, fetchDataUnit: false }))
    }
  }

  const fetchDataProduction = async () => {
    try {
      setLoading((prev) => ({ ...prev, fetchDataProduction: true }))
      const response = await productService.getProductions(id)
      setProductions(response.data || [])
    } catch (error) {
      showError('Gagal Mengambil Data Produksi/Resep', error)
    } finally {
      setLoading((prev) => ({ ...prev, fetchDataProduction: false }))
    }
  }

  useEffect(() => {
    fetchDetail()
    fetchDataMultiSatuan()
    fetchDataUnit()
    fetchDataProduction()
  }, [id])

  useEffect(() => {
    if (detailData?.id) {
      fetchDataMultiHarga(detailData.id)
    }
  }, [detailData])

  const handleChangeMultiSatuan = (e) => {
    const { name, value } = e.target
    setMultiSatuanData((prev) => {
      const updated = { ...prev, [name]: value }
      if (name === 'qty') updated.amount = value * updated.value
      if (name === 'value') updated.amount = value * updated.qty
      return updated
    })
  }

  const handleSubmitMultiSatuan = async (e) => {
    e?.preventDefault()
    setError('')

    if (
      !multiSatuanData.satuan_id ||
      !multiSatuanData.value ||
      !multiSatuanData.qty ||
      !multiSatuanData.amount
    ) {
      setError('Harap isi semua field yang diperlukan.')
      return
    }

    try {
      setLoading((prev) => ({ ...prev, submit: true }))
      await productService.createProductSatuan(multiSatuanData)
      showSnackbar('Multi Satuan berhasil ditambahkan!')
      setOpenDialog((prev) => ({ ...prev, addMultiSatuan: false }))
      resetMultiSatuanData(detailData?.price_walkin)
      fetchDataMultiSatuan()
    } catch (error) {
      showError('Gagal Tambah Multi Satuan', error)
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }))
    }
  }

  const handleDeleteMultiSatuan = (row) => {
    setSelectedRow(row)
    setOpenDialog((prev) => ({ ...prev, deleteMultiSatuan: true }))
  }

  const handleConfirmDeleteMultiSatuan = async () => {
    try {
      setLoading((prev) => ({ ...prev, submit: true }))
      await productService.deleteProductSatuan(selectedRow.guid)
      showSnackbar('Multi Satuan berhasil dihapus!')
      setOpenDialog((prev) => ({ ...prev, deleteMultiSatuan: false }))
      setSelectedRow(null)
      fetchDataMultiSatuan()
    } catch (error) {
      showError('Gagal Hapus Multi Satuan', error)
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }))
    }
  }

  const handleCancelDeleteMultiSatuan = () => {
    setSelectedRow(null)
    setOpenDialog((prev) => ({ ...prev, deleteMultiSatuan: false }))
  }

  const handleChangeMultiHarga = (e) => {
    const { name, value } = e.target
    setMultiHargaData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitMultiHarga = async (e) => {
    e?.preventDefault()
    setError('')

    const payload = { ...multiHargaData, product_id: detailData?.guid }

    if (!payload.product_id || !payload.max_quantity || !payload.min_quantity || !payload.price) {
      setError('Harap isi semua field yang diperlukan.')
      return
    }

    try {
      setLoading((prev) => ({ ...prev, submit: true }))
      await productService.createProductPriceLevel(payload)
      showSnackbar('Multi Harga berhasil ditambahkan!')
      setOpenDialog((prev) => ({ ...prev, addMultiHarga: false }))
      resetMultiHargaData()
      fetchDataMultiHarga(detailData?.id)
    } catch (error) {
      showError('Gagal Tambah Multi Harga', error)
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }))
    }
  }

  const handleDeleteMultiHarga = (row) => {
    setSelectedRow(row)
    setOpenDialog((prev) => ({ ...prev, deleteMultiHarga: true }))
  }

  const handleConfirmDeleteMultiHarga = async () => {
    try {
      setLoading((prev) => ({ ...prev, submit: true }))
      await productService.deleteProductPriceLevel(selectedRow.guid)
      showSnackbar('Multi Harga berhasil dihapus!')
      setOpenDialog((prev) => ({ ...prev, deleteMultiHarga: false }))
      setSelectedRow(null)
      fetchDataMultiHarga(detailData?.id)
    } catch (error) {
      showError('Gagal Hapus Multi Harga', error)
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }))
    }
  }

  const handleCancelDeleteMultiHarga = () => {
    setSelectedRow(null)
    setOpenDialog((prev) => ({ ...prev, deleteMultiHarga: false }))
  }

  const generateRandomCode = () => {
    const randomNumber = Math.floor(Math.random() * 900000) + 100000
    return `X/${randomNumber}`
  }

  const handleUpdateProduction = async (updatedData) => {
    const transformedData = {
      outlet_id: updatedData.outlet.guid,
      no_production: updatedData.no_production,
      notes: updatedData.notes,
      products: [
        ...updatedData.items.map((item) => ({
          product_id: item.product.guid,
          qty: item.qty,
          type: item.type
        })),
        {
          product_id: id,
          qty: 1,
          type: 'result'
        }
      ]
    }

    try {
      setLoading((prev) => ({ ...prev, submit: true }))
      if (updatedData.new === true) {
        await productService.createStockProduction(transformedData)
      } else {
        await productService.updateStockProduction(updatedData.guid, transformedData)
      }
      showSnackbar('Data resep berhasil disimpan!')
      fetchDataProduction()
    } catch (error) {
      showError('Gagal Simpan Data Resep', error)
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }))
    }
  }

  const handleDeleteProductionItem = (item) => {
    const updatedProductions = productions.map((production) => {
      if (production.id === item.stock_production_id) {
        return {
          ...production,
          items: production.items.filter((i) => i.id !== item.id)
        }
      }
      return production
    })
    handleUpdateProduction(updatedProductions[0])
  }

  return {
    detailData,
    multiSatuan,
    multiHarga,
    productions,
    units,
    selectedRow,

    multiSatuanData,
    setMultiSatuanData,
    multiHargaData,
    setMultiHargaData,

    loading,
    openDialog,
    setOpenDialog,
    error,
    snackbar,
    closeSnackbar,

    handleChangeMultiSatuan,
    handleSubmitMultiSatuan,
    handleDeleteMultiSatuan,
    handleConfirmDeleteMultiSatuan,
    handleCancelDeleteMultiSatuan,

    handleChangeMultiHarga,
    handleSubmitMultiHarga,
    handleDeleteMultiHarga,
    handleConfirmDeleteMultiHarga,
    handleCancelDeleteMultiHarga,

    handleUpdateProduction,
    handleDeleteProductionItem,
    generateRandomCode
  }
}
