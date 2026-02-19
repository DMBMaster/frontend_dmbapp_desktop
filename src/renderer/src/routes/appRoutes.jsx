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
  ListEmployeePage
} from '@renderer/pages'

export const appRoutes = [
  // =============== PUBLIC ROUTES ===============
  { path: '/login', element: <LoginPage />, active: true, protected: false },
  { path: '/xyz/info', element: <InfoAppPage />, active: true, protected: false },

  // =============== PROTECTED ROUTES ===============
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
    path: '/employee/list',
    element: <ListEmployeePage />,
    active: true,
    protected: true,
    redirectTo: '/login'
  }

  // { path: '*', element: <NotFoundPage />, active: true, protected: false }
]
