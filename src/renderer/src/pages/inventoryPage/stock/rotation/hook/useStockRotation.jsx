import { useNotifier } from '@renderer/components/core/NotificationProvider'
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
import { Chip, Typography } from '@mui/material'
import { usePermissions } from '@renderer/store/usePermission'
import PurchaseService from '@renderer/services/purchaseService'
import { getFirstDayOfCurrentMonth, getToday } from '@renderer/utils/myFunctions'
import ProductService from '@renderer/services/productService'
import ProductCategoryService from '@renderer/services/productCategoryService'

const columnHelper = createColumnHelper()

export const UseStockRotation = () => {
  const notifier = useNotifier()
  const purchaseService = PurchaseService()
  const productService = ProductService()
  const productCategoryService = ProductCategoryService()

  const [data, setData] = useState([])
  const permissions = usePermissions(userRole)
  const [openDialog, setOpenDialog] = useState({ delete: false, form: false })
  const [sorting, setSorting] = useState([])

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  const [loading, setLoading] = useState({
    fetchData: false,
    handleDelete: false,
    handleSubmit: false,
    fetchProducts: false,
    fetchDataCategory: false,
    exportData: false
  })

  const [pageParams, setPageParams] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    pageCount: 0,
    searchTerm: '',
    startDate: getFirstDayOfCurrentMonth(),
    endDate: getToday(),
    categoryId: '',
    productId: ''
  })
  const debouncedSearch = useDebounce(pageParams.searchTerm, 500)

  const exportData = async () => {
    if (!pageParams.startDate || !pageParams.endDate) {
      notifier.show({
        message: 'Tanggal tidak valid',
        description: 'Pastikan tanggal mulai dan tanggal akhir sudah diisi dengan benar.',
        severity: 'error'
      })
      return
    }

    const params = {
      start_date: pageParams.startDate,
      end_date: pageParams.endDate,
      outlet_id: localStorage.getItem('outletGuid')
    }

    if (pageParams.categoryId) {
      params.category_id = pageParams.categoryId
    }

    if (pageParams.productId) {
      params.product_id = pageParams.productId
    }

    if (!params.outlet_id) {
      notifier.show({
        message: 'Outlet ID tidak ditemukan',
        description: 'Pastikan Anda telah memilih outlet yang benar.',
        severity: 'error'
      })
      return
    }

    try {
      setLoading((prev) => ({ ...prev, exportData: true }))
      const response = await purchaseService.exportStockRotation(params)

      if (response.status === 200) {
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'stock_transactions.xlsx'
        link.click()
      } else {
        notifier.show({
          message: 'Gagal mengekspor data',
          description: 'Terjadi kesalahan saat mengekspor data.',
          severity: 'error'
        })
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      notifier.show({
        message: 'Gagal mengekspor data',
        description: error.response?.data?.message || 'Terjadi kesalahan saat mengekspor data.',
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, exportData: false }))
    }
  }

  const fetchData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetchData: true }))
    try {
      const params = {
        p: pageParams.page,
        ps: pageParams.pageSize,
        outletId: selectedOutlet?.guid || null,
        ...(pageParams.startDate && { start_date: pageParams.startDate }),
        ...(pageParams.endDate && { end_date: pageParams.endDate }),
        ...(pageParams.categoryId && { categoryId: pageParams.categoryId }),
        ...(pageParams.productId && { productId: pageParams.productId }),
        ...(debouncedSearch && { search: debouncedSearch })
      }

      const response = await purchaseService.getStockRotation(params)
      const data = response.data || []
      const meta = response.meta

      setData(data)
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
          pageCount: Math.ceil(data.length / prev.pageSize)
        }))
      }
    } catch (error) {
      console.log(error)
      const axiosError = error
      const message = axiosError.response?.data?.message || 'Terjadi kesalahan pada server!'
      notifier.show({
        message: 'Gagal Mengambil Data Supplier',
        description: message,
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchData: false }))
    }
  }, [purchaseService, pageParams.page, pageParams.pageSize, debouncedSearch])

  const fetchProducts = async () => {
    try {
      setLoading((prev) => ({ ...prev, fetchProducts: true }))
      const params = {
        outletId: selectedOutlet?.guid || localStorage.getItem('outletGuid'),
        stock: true
      }
      const response = await productService.getProducts(params)
      setProducts(response.data)
    } catch (error) {
      notifier.show({
        message: 'Gagal memuat data produk. Silakan coba lagi.',
        description: error.response?.data?.message || 'Terjadi kesalahan saat memuat data produk.',
        severity: 'error'
      })
      console.error('Error fetching room types:', error)
    } finally {
      setLoading((prev) => ({ ...prev, fetchProducts: false }))
    }
  }

  const fetchDataCategory = async () => {
    try {
      setLoading((prev) => ({ ...prev, fetchDataCategory: true }))
      const response = await productCategoryService.getCategoriesByOutlet(
        localStorage.getItem('outletGuid')
      )
      setCategories(response.data)
    } catch (err) {
      console.log(err, 'isi error')
      notifier.show({
        message: 'Gagal memuat data kategori. Silakan coba lagi.',
        description:
          err.response?.data?.message || 'Terjadi kesalahan saat memuat data kategori produk.',
        severity: 'error'
      })
    } finally {
      setLoading((prev) => ({ ...prev, fetchDataCategory: false }))
    }
  }

  const columns = [
    columnHelper.accessor('product.product_code', {
      header: () => 'Kode',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('product.product_name', {
      header: () => 'Nama',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('akhir', {
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
    columnHelper.accessor('awal', {
      header: () => 'Awal',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('masuk', {
      header: () => 'Masuk',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('terjual', {
      header: () => 'Terjual',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('opname_penambahan', {
      header: () => 'Opname +',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('opname_pengurangan', {
      header: () => 'Opname -',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('akhir', {
      header: () => 'Akhir',
      cell: (info) => <Typography variant="body1">{info.getValue()}</Typography>
    }),
    columnHelper.accessor('satuan', {
      header: () => 'Satuan',
      cell: (info) => (
        <Typography variant="body1">
          {info.row.original.product_satuan == null
            ? info.row.original.product?.satuan?.name
            : info.row.original.product_satuan?.satuan.name}
        </Typography>
      )
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
    fetchProducts()
    fetchDataCategory()
  }, [pageParams.page, pageParams.pageSize, debouncedSearch])

  return {
    data,
    loading,
    pageParams,
    setPageParams,
    table,
    permissions,
    openDialog,
    setOpenDialog,
    fetchData,
    products,
    categories,
    exportData
  }
}
