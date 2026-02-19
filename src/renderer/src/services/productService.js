import { useAxiosInstance } from '@renderer/api/axiosInstance'
import { localdb } from '@renderer/config/localdb'
import { useNetworkStore } from '@renderer/store/networkStore'

const isOnline = () => useNetworkStore.getState().isOnline

const ProductService = () => {
  const axiosInstance = useAxiosInstance()
  const getOutletGuid = () => localStorage.getItem('outletGuid')

  const getProducts = async (params) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading products from cache directly')
      return getProductsFromCache(outletGuid)
    }

    try {
      const res = await axiosInstance.get('/product-service/products', { params })
      const responseData = res.data

      if (Array.isArray(responseData?.data)) {
        await localdb.products.where({ outlet_guid: outletGuid }).delete()
        await localdb.products.bulkAdd(
          responseData.data.map((product) => ({
            outlet_guid: outletGuid,
            product_guid: product.guid,
            data: product,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading products from cache')
      return getProductsFromCache(outletGuid, error)
    }
  }

  const getProductsV2 = async (params) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading products from cache directly')
      return getProductsFromCache(outletGuid)
    }

    try {
      const res = await axiosInstance.get('/product-service/v2/products', { params })
      const responseData = res.data

      if (Array.isArray(responseData?.data)) {
        await localdb.products.where({ outlet_guid: outletGuid }).delete()
        await localdb.products.bulkAdd(
          responseData.data.map((product) => ({
            outlet_guid: outletGuid,
            product_guid: product.guid,
            data: product,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading products from cache')
      return getProductsFromCache(outletGuid, error)
    }
  }

  const getProductsFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.products.where({ outlet_guid: outletGuid }).toArray()

    if (!cached?.length) {
      if (originalError) throw originalError
      return {
        status: 'ok',
        status_code: 200,
        message: 'Tidak ada data cache',
        error: '',
        data: [],
        offline: true
      }
    }

    return {
      status: 'ok',
      status_code: 200,
      message: 'Data dari cache offline',
      error: '',
      data: cached.map((c) => c.data),
      offline: true
    }
  }

  const getProductDetail = async (guid) => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading product detail from cache directly')
      return getProductDetailFromCache(guid)
    }

    try {
      const res = await axiosInstance.get(`/product-service/product-detail/${guid}`)
      const detail = res.data?.data

      if (detail) {
        await localdb.productDetails.put({
          guid: detail.guid,
          outlet_guid: outletGuid,
          data: detail,
          updated_at: new Date().toISOString()
        })
      }

      return res.data
    } catch (error) {
      console.warn('⚠️ API failed → Loading product detail from cache')
      return getProductDetailFromCache(guid, error)
    }
  }

  const getProductDetailFromCache = async (guid, originalError) => {
    const cached = await localdb.productDetails.get(guid)

    if (!cached) {
      if (originalError) throw originalError
      throw new Error('Data tidak ditemukan di cache')
    }

    return {
      status: 'ok',
      status_code: 200,
      message: 'Data dari cache offline',
      error: '',
      data: cached.data,
      offline: true
    }
  }

  const createProduct = async (payload) => {
    const outletGuid = getOutletGuid()

    if (isOnline()) {
      try {
        const res = await axiosInstance.post('/product-service/product', payload)
        return res.data
      } catch (err) {
        console.warn('⚠️ Create failed → Saving to offline queue', err)
        await saveToPendingQueue(outletGuid, payload)

        return {
          status: 'ok',
          status_code: 200,
          message: 'Produk disimpan offline. Akan disinkronkan saat online.',
          error: '',
          offline: true,
          pending: true
        }
      }
    } else {
      await saveToPendingQueue(outletGuid, payload)

      return {
        status: 'ok',
        status_code: 200,
        message: 'Produk disimpan offline. Akan disinkronkan saat online.',
        error: '',
        offline: true,
        pending: true
      }
    }
  }

  const getUnitsProducts = async () => {
    const outletGuid = getOutletGuid()

    if (!isOnline()) {
      console.log('📴 Offline detected → Loading units from cache directly')
      return getUnitsFromCache(outletGuid)
    }

    try {
      const response = await axiosInstance.get('/product-service/satuan')
      const responseData = response.data

      if (Array.isArray(responseData?.data)) {
        await localdb.units.where({ outlet_guid: outletGuid }).delete()
        await localdb.units.bulkAdd(
          responseData.data.map((unit) => ({
            outlet_guid: outletGuid,
            unit_id: unit.guid || unit.id,
            data: unit,
            updated_at: new Date().toISOString()
          }))
        )
      }

      return responseData
    } catch (error) {
      console.warn('⚠️ API failed → Loading units from cache')
      return getUnitsFromCache(outletGuid, error)
    }
  }

  const getMultiSatuanProducts = async (params) => {
    try {
      const response = await axiosInstance.get(`/product-service/product-satuan`, { params })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const getMultiHarga = async (params) => {
    try {
      const response = await axiosInstance.get(`/product-service/product-price-level`, { params })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const getProductions = async (id) => {
    try {
      const response = await axiosInstance.get(`/product-service/stock-production/${id}/product`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const createProductSatuan = async (data) => {
    try {
      const response = await axiosInstance.post(`/product-service/product-satuan`, data)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const deleteProductSatuan = async (id) => {
    try {
      const response = await axiosInstance.delete(`/product-service/product-satuan/${id}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const createProductPriceLevel = async (data) => {
    try {
      const response = await axiosInstance.post(`/product-service/product-price-level`, data)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const deleteProductPriceLevel = async (id) => {
    try {
      const response = await axiosInstance.delete(`/product-service/product-price-level/${id}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  const createStockProduction = async (data) => {
    try {
      const response = await axiosInstance.post(`/product-service/stock-production`, data)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  const updateStockProduction = async (id, data) => {
    try {
      const response = await axiosInstance.put(`/product-service/stock-production/${id}`, data)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const saveToPendingQueue = async (outletGuid, payload) => {
    await localdb.pendingProducts.add({
      outlet_guid: outletGuid,
      payload: payload,
      created_at: new Date().toISOString(),
      synced: false
    })
  }

  const updateProduct = async (guid, payload) => {
    try {
      const res = await axiosInstance.post(`/product-service/product/${guid}`, payload)

      const cached = await localdb.productDetails.get(guid)
      if (cached && cached.data) {
        const existingData = cached.data
        await localdb.productDetails.update(guid, {
          data: { ...existingData, ...payload },
          updated_at: new Date().toISOString()
        })
      }

      return res.data
    } catch (err) {
      console.error('Error updating product:', err)
      throw err
    }
  }

  const deleteProduct = async (guid) => {
    const outletGuid = getOutletGuid()

    if (isOnline()) {
      try {
        const res = await axiosInstance.delete(`/product-service/products/${guid}`)

        await localdb.products.where({ product_guid: guid }).delete()
        await localdb.productDetails.delete(guid)

        return res.data
      } catch (err) {
        console.warn('⚠️ Delete failed → Saving to offline queue', err)
        await localdb.pendingDeletes.add({
          outlet_guid: outletGuid,
          entity_type: 'product',
          entity_guid: guid,
          created_at: new Date().toISOString(),
          synced: false
        })

        await localdb.products.where({ product_guid: guid }).delete()
        await localdb.productDetails.delete(guid)

        return {
          status: 'ok',
          status_code: 200,
          message: 'Penghapusan akan disinkronkan saat online.',
          error: '',
          offline: true,
          pending: true
        }
      }
    } else {
      await localdb.pendingDeletes.add({
        outlet_guid: outletGuid,
        entity_type: 'product',
        entity_guid: guid,
        created_at: new Date().toISOString(),
        synced: false
      })

      await localdb.products.where({ product_guid: guid }).delete()
      await localdb.productDetails.delete(guid)

      return {
        status: 'ok',
        status_code: 200,
        message: 'Penghapusan akan disinkronkan saat online.',
        error: '',
        offline: true,
        pending: true
      }
    }
  }

  const syncPendingProducts = async () => {
    let synced = 0
    let failed = 0

    const allPendingProducts = await localdb.pendingProducts.toArray()
    const pendingCreates = allPendingProducts.filter((p) => p.synced === false)

    for (const item of pendingCreates) {
      try {
        await axiosInstance.post('/product-service/products', item.payload)
        await localdb.pendingProducts.delete(item.id)
        synced++
      } catch (err) {
        console.error('Failed to sync pending product:', err)
        failed++
      }
    }

    const allPendingDeletes = await localdb.pendingDeletes.toArray()
    const pendingDeletes = allPendingDeletes.filter(
      (p) => p.entity_type === 'product' && p.synced === false
    )

    for (const item of pendingDeletes) {
      try {
        await axiosInstance.delete(`/product-service/products/${item.entity_guid}`)
        await localdb.pendingDeletes.delete(item.id)
        synced++
      } catch (err) {
        console.error('Failed to sync pending delete:', err)
        failed++
      }
    }

    return { synced, failed }
  }

  const getPendingCount = async () => {
    const outletGuid = getOutletGuid()

    const [allPendingProducts, allPendingDeletes] = await Promise.all([
      localdb.pendingProducts.toArray(),
      localdb.pendingDeletes.toArray()
    ])

    const creates = allPendingProducts.filter(
      (p) => p.outlet_guid === outletGuid && p.synced === false
    ).length
    const deletes = allPendingDeletes.filter(
      (p) => p.outlet_guid === outletGuid && p.entity_type === 'product' && p.synced === false
    ).length

    return creates + deletes
  }

  const clearCache = async () => {
    const outletGuid = getOutletGuid()
    if (outletGuid) {
      await Promise.all([
        localdb.products.where({ outlet_guid: outletGuid }).delete(),
        localdb.productDetails.where({ outlet_guid: outletGuid }).delete()
      ])
    }
  }

  const getUnitsFromCache = async (outletGuid, originalError) => {
    const cached = await localdb.units.where({ outlet_guid: outletGuid }).toArray()

    if (!cached?.length) {
      if (originalError) throw originalError
      return {
        status: 'ok',
        status_code: 200,
        message: 'Tidak ada data cache',
        error: '',
        data: [],
        offline: true
      }
    }

    return {
      status: 'ok',
      status_code: 200,
      message: 'Data dari cache offline',
      error: '',
      data: cached.map((c) => c.data),
      offline: true
    }
  }

  return {
    getProducts,
    getProductsV2,
    getProductDetail,
    createProduct,
    updateProduct,
    deleteProduct,
    syncPendingProducts,
    getPendingCount,
    clearCache,
    getUnitsProducts,
    getMultiSatuanProducts,
    getMultiHarga,
    getProductions,
    createProductSatuan,
    deleteProductSatuan,
    createProductPriceLevel,
    deleteProductPriceLevel,
    createStockProduction,
    updateStockProduction
  }
}

export default ProductService
