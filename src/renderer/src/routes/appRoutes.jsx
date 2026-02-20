import {
  LoginPage,
  InfoAppPage,
  HomePage,
  ExpensesPage,
  DetailExpensesPage,
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
  UpdatePurchaseRequestPage
} from '@renderer/pages'

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
  }
  // #endregion
  // { path: '*', element: <NotFoundPage />, active: true, protected: false }
]
