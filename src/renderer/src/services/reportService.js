import { useAxiosInstance } from '@renderer/api/axiosInstance'
import { useAxiosInstanceB } from '@renderer/api/axiosInstanceB'

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache'
}

const ReportService = () => {
  const axiosInstance = useAxiosInstance()
  const axiosInstanceB = useAxiosInstanceB()

  const getExpensesReport = async (params) => {
    const res = await axiosInstanceB.get('/expenses/report', { params, headers: defaultHeaders })
    return res.data
  }

  const getCategoryReport = async (params) => {
    const res = await axiosInstance.get('/trx-service/stats/by-group', {
      params,
      headers: defaultHeaders
    })
    return res.data
  }

  const getTransactionReport = async (params) => {
    const res = await axiosInstance.get('/trx-service/stats/by-sales', {
      params,
      headers: defaultHeaders
    })
    return res.data
  }

  const getCashierReport = async (params) => {
    const res = await axiosInstance.get('/trx-service/v2/outlet-session', {
      params,
      headers: defaultHeaders
    })
    return res.data
  }

  const getInvoiceReport = async (params) => {
    const res = await axiosInstance.get('/trx-service/invoice/report/total-bill', {
      params,
      headers: defaultHeaders
    })
    return res.data
  }

  const getIncomeCustomerReport = async (params) => {
    const res = await axiosInstance.get('/trx-service/invoice/report/total-by-customer', {
      params,
      headers: defaultHeaders
    })
    return res.data
  }

  const getSalesReport = async (params) => {
    const res = await axiosInstance.get('/trx-service/reports/group-by-employee', {
      params,
      headers: defaultHeaders
    })
    return res.data
  }

  const getDeliveryOrderReport = async (params) => {
    const res = await axiosInstance.get('/trx-service/delivery-order/report/total-bill', {
      params,
      headers: defaultHeaders
    })
    return res.data
  }

  const getPresensiReport = async (params) => {
    const res = await axiosInstance.get('/attendance/report', {
      params,
      headers: defaultHeaders
    })
    return res.data
  }

  const getCommissionReport = async (params) => {
    const res = await axiosInstance.get('/trx-service/group-commission-transaction', {
      params,
      headers: defaultHeaders
    })
    return res.data
  }

  const getVisitSalesReport = async (params) => {
    const res = await axiosInstance.get('/merchant/visit-sales/report', {
      params,
      headers: defaultHeaders
    })
    return res.data
  }

  return {
    getExpensesReport,
    getCategoryReport,
    getTransactionReport,
    getCashierReport,
    getInvoiceReport,
    getIncomeCustomerReport,
    getSalesReport,
    getDeliveryOrderReport,
    getPresensiReport,
    getCommissionReport,
    getVisitSalesReport
  }
}

export default ReportService
