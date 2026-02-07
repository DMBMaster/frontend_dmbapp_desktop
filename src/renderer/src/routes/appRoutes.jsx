import {
  LoginPage,
  InfoAppPage,
  HomePage,
  ExpensesPage,
  DetailExpensesPage,
  HistoryTransactionPage,
  InstoreTransactionPage,
  DetailTransactionPage
} from '@renderer/pages'
import { CreateTransactionPage } from '@renderer/pages/transactionPage/create'

export const appRoutes = [
  // =============== PUBLIC ROUTES ===============
  { path: '/login', element: <LoginPage />, active: true, protected: false },
  { path: '/xyz/info', element: <InfoAppPage />, active: true, protected: false },

  // =============== PROTECTED ROUTES ===============
  {
    path: '/',
    // element: <HomePage />,
    element: <ExpensesPage />,
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
  }

  // { path: '*', element: <NotFoundPage />, active: true, protected: false }
]
