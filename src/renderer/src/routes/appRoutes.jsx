import {
  LoginPage,
  InfoAppPage,
  HomePage,
  RatePlanPage,
  ExpensesPage,
  DetailExpensesPage,
  ExpensesCategoryPage,
  HistoryTransactionPage,
  InstoreTransactionPage,
  DetailTransactionPage,
  FrontOfficeDashboardPage,
  ProductPage,
  AddProductPage,
  EditProductPage,
  CreateTransactionPage,
  DetailProductPage,
  ListEmployeePage,
  ShiftEmployeePage,
  CalenderShiftEmployeePage,
  ScheduleEmployeePage,
  PurchaseRequestPage,
  CreatePurchaseRequestPage,
  UpdatePurchaseRequestPage,
  PurchaseOrderPage,
  StockOpnamePage,
  CreateStockOpnamePage,
  CreatePurchaseOrderPage,
  SupplierPage,
  StockRotationPage,
  StockMovementPage,
  CreateStockMovementPage,
  ProductCategoryPage,
  TransactionActivityPage,
  RoomActivityPage,
  SettingReceiptPage,
  UnitPage,
  ReportFarmPage,
  ReportExpensesPage,
  ReportCategoryPage,
  ReportTransactionPage,
  ReportCashierPage,
  ReportInvoicePage,
  ReportIncomeCustomerPage,
  ReportSalesPage,
  ReportDeliveryOrderPage,
  ReportPresensiPage,
  ReportProfitPage,
  ReportCommissionPage,
  ReportVisitPage
} from '@renderer/pages'
import { CrashTestPage } from '@renderer/pages/crashTestPage'

export const appRoutes = [
  // =============== PUBLIC ROUTES ===============
  { path: '/login', element: <LoginPage />, active: true, protected: false },
  { path: '/xyz/info', element: <InfoAppPage />, active: true, protected: false },

  // =============== PROTECTED ROUTES ===============

  // #region - DASHBOARD
  {
    path: '/',
    element: <HomePage />,
    // element: <ExpensesPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/dashboard/frontoffice',
    element: <FrontOfficeDashboardPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  // #endregion

  //#region - EXPENSES
  {
    path: '/expenses',
    element: <ExpensesPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/expenses/detail/:id',
    element: <DetailExpensesPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/expenses/category',
    element: <ExpensesCategoryPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  // #endregion

  // #region - TRANSACTIONS
  {
    path: '/transaction/history',
    element: <HistoryTransactionPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/transaction/create',
    element: <CreateTransactionPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/transaction/instore',
    element: <InstoreTransactionPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/transaction/detail/:id',
    element: <DetailTransactionPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  // #endregion

  // #region - PRODUCTS
  {
    path: '/product/list',
    element: <ProductPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/product/add',
    element: <AddProductPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/product/edit/:id',
    element: <EditProductPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/product/detail/:id',
    element: <DetailProductPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/product/category',
    element: <ProductCategoryPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/product/rate-plan',
    element: <RatePlanPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  // #endregion

  // #region - EMPLOYEES
  {
    path: '/employee/list',
    element: <ListEmployeePage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/employee/shift',
    element: <ShiftEmployeePage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/employee/shift/calendar',
    element: <CalenderShiftEmployeePage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/employee/schedule',
    element: <ScheduleEmployeePage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  // #endregion

  // #region - INVENTORY
  {
    path: '/inventory/purchase/request',
    element: <PurchaseRequestPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/inventory/purchase/request/create',
    element: <CreatePurchaseRequestPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/inventory/purchase/request/edit/:id',
    element: <UpdatePurchaseRequestPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/inventory/purchase',
    element: <PurchaseOrderPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/inventory/purchase/create',
    element: <CreatePurchaseOrderPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/inventory/opname',
    element: <StockOpnamePage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/inventory/opname/create',
    element: <CreateStockOpnamePage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/inventory/supplier',
    element: <SupplierPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/inventory/stock',
    element: <StockRotationPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/inventory/movement',
    element: <StockMovementPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/inventory/movement/create',
    element: <CreateStockMovementPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  // #endregion

  // #region - SETTING
  {
    path: '/setting/rooms/activity',
    element: <RoomActivityPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/setting/receipt',
    element: <SettingReceiptPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },

  // #endregion

  // #region - REPORT
  {
    path: '/report/farm',
    element: <ReportFarmPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/report/expenses',
    element: <ReportExpensesPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/report/category',
    element: <ReportCategoryPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/report/transaction',
    element: <ReportTransactionPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/report/cashier',
    element: <ReportCashierPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/report/invoice',
    element: <ReportInvoicePage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/report/income-customer',
    element: <ReportIncomeCustomerPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/report/sales',
    element: <ReportSalesPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/report/do',
    element: <ReportDeliveryOrderPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/report/presensi',
    element: <ReportPresensiPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/report/profit',
    element: <ReportProfitPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/report/commission',
    element: <ReportCommissionPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/report/visit',
    element: <ReportVisitPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  // #endregion

  // #region - OTHER
  {
    path: '/other/transaction/activity',
    element: <TransactionActivityPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/other/satuan',
    element: <UnitPage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  },
  {
    path: '/crash-test',
    element: <CrashTestPage />,
    protected: false,
    active: true
  }
  // #endregion

  // { path: '*', element: <NotFoundPage />, active: true, protected: false }
]
