import { useEffect } from 'react'
import {
  MemoryRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom'
import { Box, ThemeProvider } from '@mui/material'
import { appRoutes } from './routes/appRoutes'
import { NotificationProvider } from './components/core/NotificationProvider'
import { TitleBar } from './components/core/titlebar'
import { Sidebar } from './components/core/sidebar'
import { useConfigStore } from './store/configProvider'
import SidebarService from './services/sidebarService'
import { ThemeSettings } from './utils/theme/Theme'
import { NotFoundPage } from './pages'

const getToken = () => localStorage.getItem('token')

// eslint-disable-next-line react/prop-types
const LoginOnlyLayout = ({ children }) => {
  const token = getToken()
  const navigate = useNavigate()
  useEffect(() => {
    const handleKeyDown = (e) => {
      const { key, altKey, ctrlKey } = e

      if (key === 'F4' && altKey) e.preventDefault()
      if (key === 'F5') e.preventDefault()
      if (key === 'f' && altKey) e.preventDefault()
      if (key === 'F11') e.preventDefault()
      if ((key === 'r' || key === 'R') && ctrlKey) {
        e.preventDefault()
        window.location.reload()
      }
      if (key === 'i' && ctrlKey) {
        e.preventDefault()
        navigate('/xyz/info')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      <div className="flex-shrink-0">
        <TitleBar username="" showUpdateButton />
      </div>
      <main className="p-0 m-0 flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-900 overflow-auto">
        <div className="w-full h-full flex items-center justify-center">{children}</div>
      </main>
    </div>
  )
}

// eslint-disable-next-line react/prop-types
const ProtectedLayout = ({ children }) => {
  const location = useLocation()
  const token = getToken()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

// eslint-disable-next-line react/prop-types
const SidebarLayout = ({ children }) => {
  const userLogin = localStorage.getItem('userLogin')
  const userData = userLogin ? JSON.parse(userLogin) : null
  const { assetsPathConfig } = useConfigStore()
  const sidebarService = SidebarService()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userLogin')
    window.location.reload()
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <TitleBar username={userData?.user.full_name || ''} onLogout={handleLogout} />

      <Sidebar
        logo={`${assetsPathConfig}\\images\\logo.png`}
        onLogout={handleLogout}
        sidebarService={sidebarService}
        appRoutes={appRoutes}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: 'grey.50',
          overflow: 'auto',
          mt: '40px'
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

// eslint-disable-next-line react/prop-types
const SidebarLogLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, bgcolor: 'grey.100', p: 3, overflow: 'auto' }}>{children}</Box>
    </Box>
  )
}

const renderRoute = (route, key) => {
  const { element, protected: isProtected, path } = route

  if (!isProtected && (path === '/login' || path === '/xyz/info')) {
    return <Route key={key} path={path} element={<LoginOnlyLayout>{element}</LoginOnlyLayout>} />
  }

  if (!isProtected) {
    return <Route key={key} path={path} element={<SidebarLogLayout>{element}</SidebarLogLayout>} />
  }

  return (
    <Route
      key={key}
      path={path}
      element={
        <ProtectedLayout>
          <SidebarLayout>{element}</SidebarLayout>
        </ProtectedLayout>
      }
    />
  )
}

const App = () => {
  const { fetchConfig, isLoading } = useConfigStore()
  const theme = ThemeSettings()
  useEffect(() => {
    fetchConfig()
  }, [])

  if (isLoading) return <p>Loading...</p>

  return (
    <ThemeProvider theme={theme}>
      <NotificationProvider>
        <Router>
          <Routes>
            {appRoutes.filter((r) => r.active).map((route, i) => renderRoute(route, i))}
            {/* 404 */}
            <Route
              path="*"
              element={
                <SidebarLayout>
                  <NotFoundPage />
                </SidebarLayout>
              }
            />
          </Routes>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  )
}

export default App
