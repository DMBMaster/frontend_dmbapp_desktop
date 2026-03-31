import React, { useEffect, useState, useCallback } from 'react'
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip
} from '@mui/material'
import {
  Minimize,
  CropSquare,
  Close,
  Store,
  PointOfSale,
  Settings,
  Logout,
  KeyboardArrowDown,
  Warning,
  Check,
  Search,
  Wifi,
  WifiOff
} from '@mui/icons-material'
import { Update as UpdateIcon } from '@mui/icons-material'
import { useNetworkStore, initNetworkListeners } from '@renderer/store/networkStore'
import { localdb } from '@renderer/config/localdb'
import { useConfigStore } from '@renderer/store/configProvider'
import { useNavigate } from 'react-router-dom'
import { IconReload } from '@tabler/icons-react'
import { formatRupiah } from '@renderer/utils/myFunctions'
import ConfigService from '@renderer/services/configService'
import { useNotifier } from './NotificationProvider'
import { testingRoutes } from '@renderer/utils/config'

// eslint-disable-next-line react/prop-types
export const TitleBar = ({ username, theme = 'light', onLogout, showUpdateButton = true }) => {
  const navigate = useNavigate()
  const configService = ConfigService()
  const notifier = useNotifier()

  const { config } = useConfigStore.getState()
  // OUTLET LOGIC
  const userStr = localStorage.getItem('userLogin')
  const user = userStr ? JSON.parse(userStr) : null

  // Get current outlet from localStorage or default to first outlet
  const savedOutletId = localStorage.getItem('outletId')
  const initialOutlet =
    user?.outlets.find((o) => String(o.id) === savedOutletId) || user?.outlets[0] || null

  const [currentOutlet, setCurrentOutlet] = useState(initialOutlet)
  const [deviceId, setDeviceId] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [deviceBrand, setDeviceBrand] = useState('')
  const [deviceInfo, setDeviceInfo] = useState({
    hostname: '',
    platform: '',
    arch: '',
    osVersion: '',
    cpu: '',
    cpuCores: null,
    totalRam: null,
    freeRam: null,
    uptime: null,
    ipAddress: '',
    macAddress: '',
    username: ''
  })
  const [outlets, setOutlets] = useState([])
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('')
  const [openCloseDialog, setOpenCloseDialog] = useState(false)
  const [openCashierDialog, setOpenCashierDialog] = useState(false)
  const [openCloseCashierDialog, setOpenCloseCashierDialog] = useState(false)
  const [openCloseCashierPinDialog, setOpenCloseCashierPinDialog] = useState(false)
  const [openDeviceDialog, setOpenDeviceDialog] = useState(false)
  const [openingBalance, setOpeningBalance] = useState('0')
  const [cashierPin, setCashierPin] = useState('')
  const [closeCashierPin, setCloseCashierPin] = useState('')
  const [cashierSession, setCashierSession] = useState(null)
  const [isCheckingCashierSession, setIsCheckingCashierSession] = useState(false)
  const [isOpeningCashier, setIsOpeningCashier] = useState(false)
  const [isClosingCashier, setIsClosingCashier] = useState(false)
  const [hasUpdateAvailable, setHasUpdateAvailable] = useState(false)
  const [openedProgress, setOpenedProgress] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // PROFILE MENU
  const [anchorEl, setAnchorEl] = useState(null)
  const openProfileMenu = Boolean(anchorEl)

  // OUTLET SEARCH
  const [outletSearch, setOutletSearch] = useState('')

  // Filter outlets based on search
  const filteredOutlets = outlets.filter(
    (outlet) =>
      outlet.name.toLowerCase().includes(outletSearch.toLowerCase()) ||
      (outlet.address && outlet.address.toLowerCase().includes(outletSearch.toLowerCase()))
  )

  // Snackbar untuk update info
  const showNotification = (message, severity = 'info', description = '') => {
    notifier.show({
      message,
      severity,
      ...(description ? { description } : {})
    })
  }

  const getCurrentUserId = () => localStorage.getItem('userId') || user?.user?.uid || ''

  const mapSessionData = (response) => {
    if (!response || typeof response !== 'object') return null

    if (response.message === 404) return null
    if (typeof response.data === 'string' && response.data.toLowerCase().includes('not found')) {
      return null
    }

    if (response?.data?.is_open && response?.data?.outlet_session) {
      return response.data.outlet_session
    }

    return null
  }

  const formatSessionDate = (dateValue) => {
    if (!dateValue) return '-'

    const rawDate = typeof dateValue === 'object' ? dateValue.date : dateValue
    if (!rawDate) return '-'

    const normalized = rawDate.replace(' ', 'T').split('.')[0]
    const parsedDate = new Date(normalized)
    if (Number.isNaN(parsedDate.getTime())) return '-'

    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(parsedDate)
  }

  const formatMoney = (value) => `Rp ${formatRupiah(String(Number(value) || 0), 0)}`

  const handleCheckSessionCashier = async ({ silent = false } = {}) => {
    try {
      const outletGuid = localStorage.getItem('outletGuid')
      const userId = getCurrentUserId()

      if (!outletGuid || !userId) {
        setCashierSession(null)
        return null
      }

      setIsCheckingCashierSession(true)
      const response = await configService.checkSessionCashier(outletGuid, userId)
      const activeSession = mapSessionData(response)
      setCashierSession(activeSession)
      return activeSession
    } catch (error) {
      setCashierSession(null)
      if (!silent) {
        notifier.show({
          message: 'Terjadi Kesalahan',
          description:
            error?.response?.data?.message || error.message || 'Gagal memeriksa sesi kasir',
          severity: 'error'
        })
      }
      console.error('Failed to check cashier session', error)
      return null
    } finally {
      setIsCheckingCashierSession(false)
    }
  }

  React.useEffect(() => {
    try {
      if (userStr && user) {
        // Check cashier session immediately after login context is available.
        handleCheckSessionCashier({ silent: true })
        setOutlets(user.outlets || [])
        setUserEmail(user.user.email || '')
        setUserRole('User')

        // Set current outlet from localStorage or first outlet
        const savedOutletId = localStorage.getItem('outletId')
        const savedOutlet = user.outlets.find((o) => String(o.id) === savedOutletId)
        if (savedOutlet) {
          setCurrentOutlet(savedOutlet)
        } else if (user.outlets.length > 0) {
          // Set default outlet if not saved
          const defaultOutlet = user.outlets[0]
          setCurrentOutlet(defaultOutlet)
          localStorage.setItem('outletId', String(defaultOutlet.id))
          localStorage.setItem('outletGuid', defaultOutlet.guid || '')
          localStorage.setItem('outletName', defaultOutlet.name)
          localStorage.setItem('outletPhone', defaultOutlet.phone)
          localStorage.setItem('outletAddress', defaultOutlet.address)
          localStorage.setItem('outletCategoryId', defaultOutlet.category_id)
        }
      }
    } catch (error) {
      console.log(error)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      const { key, altKey, ctrlKey } = e

      if (key === 'F4' && altKey) e.preventDefault()
      if (key === 'F5') e.preventDefault()
      if (key === 'f' && altKey) e.preventDefault()
      if (key === 'F11') e.preventDefault()
      if ((key === 'r' || key === 'R') && ctrlKey) {
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

  const getDeviceUuid = async () => {
    try {
      const res = await window.api.device.deviceUuid()
      if (res) {
        setDeviceId(res)
      }
    } catch (error) {
      console.error('Failed to get device uuid', error)
    }
  }

  const getDeviceName = async () => {
    try {
      const res = await window.api.device.deviceName()
      if (res?.hostname) {
        const label = `${res.hostname} (${res.platform})`
        setDeviceName(label)
      }
    } catch (error) {
      console.error('Failed to get device name', error)
    }
  }
  const getDeviceBrand = async () => {
    try {
      const res = await window.api.device.deviceBrand()
      if (res?.manufacturer || res?.model) {
        setDeviceBrand(`${res.manufacturer} ${res.model}`.trim())
      }
    } catch (error) {
      console.error('Failed to get device brand', error)
    }
  }

  const getDeviceInfo = async () => {
    try {
      const res = await window.api.device.deviceInfo()
      setDeviceInfo(res)
    } catch (error) {
      console.error('Failed to get device info', error)
    }
  }

  useEffect(() => {
    getDeviceName()
    getDeviceUuid()
    getDeviceInfo()
    getDeviceBrand()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F12') {
        e.preventDefault()
        setOpenDeviceDialog((prev) => !prev)
      }
      if ((e.key === 'r' || e.key === 'R') && e.ctrlKey) {
        window.location.reload()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleChangeOutlet = (outlet) => {
    try {
      // Update current outlet state
      setCurrentOutlet(outlet)

      // Save to localStorage
      localStorage.setItem('outletId', String(outlet.id))
      localStorage.setItem('selectedOutlet', JSON.stringify(outlet))
      localStorage.setItem('outletGuid', outlet.guid || '')
      localStorage.setItem('outletName', outlet.name)
      localStorage.setItem('outletPhone', outlet.phone)
      localStorage.setItem('outletAddress', outlet.address)
      localStorage.setItem('outletCategoryId', outlet.category_id)

      // Update userLogin with currentOutlet
      const userStr = localStorage.getItem('userLogin')
      if (userStr) {
        const userData = JSON.parse(userStr)
        userData.currentOutlet = outlet
        localStorage.setItem('userLogin', JSON.stringify(userData))
      }

      // Clear sidebar cache so it refetches for new outlet
      localStorage.removeItem('sidebar_cache')

      // Close menu
      handleProfileMenuClose()

      // Refresh current page (not redirect to home)
      window.location.reload()
    } catch (error) {
      console.log(error)
    }
  }

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
    setOutletSearch('') // Clear search when menu closes
  }

  const handleSettings = () => {
    handleProfileMenuClose()
    // Navigate to settings page
    console.log('Navigate to settings')
  }

  useEffect(() => {
    // Subscribe to update progress
    const unsubProgress = window.api.onUpdateProgress((percent) => {
      setDownloadProgress(percent)
      setOpenedProgress(true)
      if (percent >= 100) {
        setTimeout(() => setOpenedProgress(false), 2000)
      }
    })

    // Subscribe to update notifications
    const unsubNotification = window.api.onUpdateNotification((message, severity) => {
      notifier.show({ message, severity })
    })

    return () => {
      unsubProgress()
      unsubNotification()
    }
  }, [notifier])

  useEffect(() => {
    const unsubscribe = window.api.onUpdateAvailability((hasUpdate) => {
      setHasUpdateAvailable(hasUpdate)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    // Silent background check on app load.
    window.api.checkForUpdates()
  }, [])

  const handleCheckUpdates = () => {
    try {
      showNotification('Memeriksa pembaruan...', 'info')

      window.api.checkForUpdates()
    } catch (e) {
      console.error('Failed to request update check', e)
      showNotification('Gagal memeriksa pembaruan', 'error')
    }
  }

  const handleCheckUpdatesFromMenu = () => {
    handleProfileMenuClose()
    handleCheckUpdates()
  }

  const handleMinimize = () => {
    window.electron?.ipcRenderer.send('window-minimize')
  }

  const handleMaximize = () => {
    window.electron?.ipcRenderer.send('window-maximize')
  }

  const handleCloseClick = () => {
    setOpenCloseDialog(true)
  }

  const handleCloseConfirm = () => {
    setOpenCloseDialog(false)
    window.electron?.ipcRenderer.send('window-close')
  }

  const handleCloseCancel = () => {
    setOpenCloseDialog(false)
  }

  const handleOpenCashierDialog = async () => {
    const activeSession = await handleCheckSessionCashier()

    if (activeSession) {
      setOpenCloseCashierDialog(true)
      return
    }

    setOpenCashierDialog(true)
  }

  const handleCloseCashierDialog = () => {
    setOpenCashierDialog(false)
    setCashierPin('')
  }

  const handleCloseCashierReportDialog = () => {
    setOpenCloseCashierDialog(false)
  }

  const handleOpenCloseCashierPinDialog = () => {
    setOpenCloseCashierPinDialog(true)
  }

  const handleCloseCloseCashierPinDialog = () => {
    setOpenCloseCashierPinDialog(false)
    setCloseCashierPin('')
  }

  const handleSubmitOpenCashier = async () => {
    const parsedBalance = Number(openingBalance)
    const safePin = cashierPin.trim()

    if (!Number.isFinite(parsedBalance) || parsedBalance < 0) {
      showNotification('Saldo awal tidak valid', 'warning')
      return
    }

    if (!safePin) {
      showNotification('PIN wajib diisi', 'warning')
      return
    }

    try {
      setIsOpeningCashier(true)

      const payload = {
        pin: safePin,
        outlet_id: localStorage.getItem('outletGuid') || '',
        cash_first: parsedBalance,
        user_id: localStorage.getItem('userId') || ''
      }

      await configService.openCashier(payload)
      setCashierPin('')
      setOpenCashierDialog(false)
      showNotification('Kasir berhasil dibuka', 'success')

      // Ensure state in title bar remains synced with server.
      await handleCheckSessionCashier({ silent: true })
    } catch (error) {
      console.error('Failed to open cashier', error)
      showNotification(
        error?.response?.data?.message || error?.message || 'Gagal membuka kasir',
        'error'
      )
    } finally {
      setIsOpeningCashier(false)
    }
  }

  const handleSubmitCloseCashier = async () => {
    const safePin = closeCashierPin.trim()

    if (!safePin) {
      showNotification('PIN wajib diisi untuk tutup kasir', 'warning')
      return
    }

    try {
      setIsClosingCashier(true)

      const payload = {
        pin: safePin,
        outlet_id: localStorage.getItem('outletGuid') || ''
      }

      const response = await configService.closeCashier(payload)
      const closedSession = response?.data || null

      if (!closedSession?.closed_time) {
        throw new Error(response?.message || 'Respon tutup kasir tidak valid')
      }

      // Session is closed in backend, reset local UI state.
      setCashierSession(null)
      setCloseCashierPin('')
      setOpenCloseCashierPinDialog(false)
      setOpenCloseCashierDialog(false)

      showNotification('Kasir berhasil ditutup', 'success')

      // Refresh session state from server to keep button state in sync.
      await handleCheckSessionCashier({ silent: true })
    } catch (error) {
      console.error('Failed to close cashier', error)
      showNotification(
        error?.response?.data?.message || error?.message || 'Gagal menutup kasir',
        'error'
      )
    } finally {
      setIsClosingCashier(false)
    }
  }

  const cashFirst = Number(cashierSession?.cash_first || 0)
  const cashIn = Number(cashierSession?.cash_in || 0)
  const cashEnd = Number(cashierSession?.cash_end || cashFirst + cashIn)
  const unpaidTransaction = Number(cashierSession?.unpaid_transaction || 0)

  // Get initials from username
  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Network status from global store
  const isOnline = useNetworkStore((state) => state.isOnline)

  // Debug: log when isOnline changes
  useEffect(() => {
    console.log('🔄 TitleBar: isOnline changed to:', isOnline)
  }, [isOnline])

  // Pending data count
  const [, setPendingCount] = useState({
    expenses: 0,
    expenseCategories: 0,
    deletes: 0,
    total: 0
  })

  // Fetch pending count from localdb
  const fetchPendingCount = useCallback(async () => {
    try {
      const outletGuid = localStorage.getItem('outletGuid') || ''

      // Use filter for reliable boolean comparison
      const [allPendingExpenses, allPendingCategories, allPendingDeletes] = await Promise.all([
        localdb.pendingExpenses.where('outlet_guid').equals(outletGuid).toArray(),
        localdb.pendingExpenseCategories.where('outlet_guid').equals(outletGuid).toArray(),
        localdb.pendingDeletes.where('outlet_guid').equals(outletGuid).toArray()
      ])

      // Filter by synced === false (boolean)
      const expensesCount = allPendingExpenses.filter((p) => p.synced === false).length
      const categoriesCount = allPendingCategories.filter((p) => p.synced === false).length
      const deletesCount = allPendingDeletes.filter((p) => p.synced === false).length

      console.log('📊 Pending expenses:', expensesCount, 'of', allPendingExpenses.length)
      console.log('📊 Pending categories:', categoriesCount, 'of', allPendingCategories.length)
      console.log('📊 Pending deletes:', deletesCount, 'of', allPendingDeletes.length)

      setPendingCount({
        expenses: expensesCount,
        expenseCategories: categoriesCount,
        deletes: deletesCount,
        total: expensesCount + categoriesCount + deletesCount
      })
    } catch (error) {
      console.error('Error fetching pending count:', error)
    }
  }, [])

  // Initialize network listeners
  useEffect(() => {
    const cleanup = initNetworkListeners()
    return cleanup
  }, [])

  // Fetch pending count on mount and when online status changes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPendingCount()
    }, 5000) // every 5 seconds

    return () => clearInterval(interval)
  }, [isOnline, fetchPendingCount])

  // Subscribe to sync results to refresh pending count
  useEffect(() => {
    const unsubscribe = useNetworkStore.subscribe((state, prevState) => {
      // If sync just finished, refresh pending count
      if (prevState.isSyncing && !state.isSyncing) {
        fetchPendingCount()
      }
    })
    return () => unsubscribe()
  }, [fetchPendingCount])

  useEffect(() => {
    const testAndPrint = async () => {
      try {
        // 1. Test koneksi dulu
        const testResult = await window.api.testThermalPrinter({
          printerIp: config.printer_ip,
          printerPort: config.printer_port
        })
        if (!testResult.connected) {
          console.error('Printer tidak terhubung:', testResult.error)
          return
        }

        // 2. Kalau connected, langsung print
        const result = await window.api.printThermalLan({
          printerIp: config.printer_ip,
          printerPort: config.printer_port,

          header1: 'NAMA TOKO',
          header2: 'Jl. Alamat No. 1',
          header3: 'Telp: 08123456789',

          orderNumber: 'ORD-001',
          date: '19/02/2025 10:30',
          cashierName: 'Budi',

          items: [
            { name: 'Nasi Goreng', qty: 2, price: 'Rp15.000', subtotal: 'Rp30.000' },
            { name: 'Es Teh', qty: 1, price: 'Rp5.000', subtotal: 'Rp5.000' }
          ],

          subtotal: 'Rp35.000',
          tax: 'Rp3.500',
          total: 'Rp38.500',
          cash: 'Rp50.000',
          change: 'Rp11.500',

          footer1: 'Terima Kasih!',
          footer2: 'Selamat Datang Kembali'
        })

        if (result.success) {
          console.log('✅ Print berhasil!')
        } else {
          console.error('❌ Print gagal:', result.error)
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }

    testAndPrint()
  }, [])

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          height: 40,
          top: 0,
          left: 0,
          right: 0,
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: 'primary.main',
          borderBottom: 1,
          borderColor: theme === 'dark' ? 'grey.800' : 'grey.300',
          WebkitAppRegion: 'drag'
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 40, px: 2 }}>
          {/* LEFT - Current Outlet Display */}
          <Box display="flex" alignItems="center" gap={1}>
            {currentOutlet && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  WebkitAppRegion: 'no-drag'
                }}
              >
                <Store fontSize="small" sx={{ color: 'white' }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.8rem'
                  }}
                >
                  {currentOutlet.name}
                </Typography>
              </Box>
            )}

            {user && (
              <Button
                size="small"
                variant="contained"
                startIcon={<PointOfSale fontSize="small" />}
                onClick={handleOpenCashierDialog}
                disabled={isCheckingCashierSession}
                sx={{
                  minHeight: 26,
                  px: 1.2,
                  py: 0.25,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'white',
                  bgcolor: cashierSession ? '#C24B4B' : '#2E9E6F',
                  WebkitAppRegion: 'no-drag',
                  transition: 'background-color 0.2s ease',
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(255,255,255,0.25)',
                    color: 'rgba(255,255,255,0.85)'
                  },
                  '&:hover': {
                    bgcolor: cashierSession ? '#AF3E3E' : '#278A61'
                  }
                }}
              >
                {isCheckingCashierSession
                  ? 'Memeriksa...'
                  : cashierSession
                    ? 'Tutup Kasir'
                    : 'Buka Kasir'}
              </Button>
            )}

            {/* Network Status Indicator */}
            <Tooltip title={isOnline ? 'Online' : 'Offline - Data disimpan lokal'} arrow>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: isOnline ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)',
                  WebkitAppRegion: 'no-drag',
                  cursor: 'default'
                }}
              >
                {isOnline ? (
                  <Wifi sx={{ color: '#81C784', fontSize: 16 }} />
                ) : (
                  <WifiOff sx={{ color: '#E57373', fontSize: 16 }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase'
                  }}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Typography>
              </Box>
            </Tooltip>
          </Box>

          {/* CENTER - Spacer */}
          <Box flex={1} />

          {/* RIGHT - User Profile & Window Controls */}
          <Box display="flex" alignItems="center" gap={1} sx={{ WebkitAppRegion: 'no-drag' }}>
            {/* Update button is shown only when update is available */}
            {showUpdateButton && hasUpdateAvailable && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<UpdateIcon />}
                onClick={handleCheckUpdates}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.18)',
                  minWidth: 36,
                  py: 0.5,
                  px: 1,
                  textTransform: 'none',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.28)' }
                }}
              >
                Update
              </Button>
            )}
            {/* User Profile Button */}
            {username && (
              <Box
                onClick={handleProfileMenuOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.25)'
                  }
                }}
              >
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: 'white',
                    color: '#DD5070',
                    fontWeight: 700
                  }}
                >
                  {getInitials(username)}
                </Avatar>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.8rem'
                  }}
                >
                  {username}
                </Typography>
                <KeyboardArrowDown sx={{ color: 'white', fontSize: 18 }} />
              </Box>
            )}

            {/* Window Control Buttons */}
            <Box display="flex" alignItems="center" sx={{ ml: 1 }}>
              <IconButton
                size="small"
                onClick={handleMinimize}
                sx={{
                  borderRadius: 0,
                  width: 36,
                  height: 36,
                  p: 0,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.12)'
                  }
                }}
                aria-label="Minimize"
              >
                <Minimize sx={{ color: 'white', fontSize: 18, mb: '12px' }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleMaximize}
                sx={{
                  borderRadius: 0,
                  width: 36,
                  height: 36,
                  p: 0,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.12)'
                  }
                }}
                aria-label="Maximize"
              >
                <CropSquare sx={{ color: 'white', fontSize: 18 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleCloseClick}
                sx={{
                  borderRadius: 0,
                  width: 36,
                  height: 36,
                  p: 0,
                  '&:hover': {
                    bgcolor: 'error.main'
                  }
                }}
                aria-label="Close"
              >
                <Close sx={{ color: 'white', fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu Dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={openProfileMenu}
        onClose={handleProfileMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 280,
            mt: 1,
            borderRadius: 2,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                fontWeight: 700
              }}
            >
              {getInitials(username || '')}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {userEmail || userRole}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* Outlet Selector Section */}
        {outlets.length > 0 && (
          <Box>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                PILIH OUTLET
              </Typography>
            </Box>

            {/* Search Outlet */}
            {outlets.length > 3 && (
              <Box sx={{ px: 2, pb: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Cari outlet..."
                  value={outletSearch}
                  onChange={(e) => setOutletSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: 13,
                      borderRadius: 2,
                      bgcolor: 'grey.100',
                      '& fieldset': { border: 'none' }
                    }
                  }}
                />
              </Box>
            )}

            <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {filteredOutlets.length > 0 ? (
                filteredOutlets.map((outlet) => (
                  <MenuItem
                    key={outlet.id}
                    onClick={() => handleChangeOutlet(outlet)}
                    sx={{
                      py: 1,
                      px: 2,
                      bgcolor: currentOutlet?.id === outlet.id ? 'primary.light' : 'transparent',
                      '&:hover': {
                        bgcolor: currentOutlet?.id === outlet.id ? 'primary.light' : 'action.hover'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, alignSelf: 'flex-start', mt: 0.5 }}>
                      <Store
                        fontSize="small"
                        sx={{
                          color: currentOutlet?.id === outlet.id ? 'primary.main' : 'text.secondary'
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={outlet.name}
                      secondary={outlet.address || '-'}
                      primaryTypographyProps={{
                        fontSize: 13,
                        fontWeight: currentOutlet?.id === outlet.id ? 600 : 400,
                        color: currentOutlet?.id === outlet.id ? 'primary.main' : 'text.primary'
                      }}
                      secondaryTypographyProps={{
                        fontSize: 11,
                        color: 'text.secondary',
                        noWrap: true,
                        sx: { maxWidth: 180 }
                      }}
                    />
                    {currentOutlet?.id === outlet.id && (
                      <Check
                        fontSize="small"
                        sx={{ color: 'primary.main', ml: 1, alignSelf: 'center' }}
                      />
                    )}
                  </MenuItem>
                ))
              ) : (
                <Box sx={{ px: 2, py: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Outlet tidak ditemukan
                  </Typography>
                </Box>
              )}
            </Box>
            <Divider sx={{ my: 1 }} />
          </Box>
        )}

        {/* Menu Items */}
        <MenuItem onClick={() => window.location.reload()} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <IconReload fontSize="small" />
          </ListItemIcon>
          <ListItemText>Refresh</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCheckUpdatesFromMenu} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <UpdateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Update</ListItemText>
        </MenuItem>
        {testingRoutes &&
          testingRoutes.map((route, index) => (
            <MenuItem key={index} onClick={() => navigate(route)} sx={{ py: 1.5 }}>
              <ListItemIcon>
                <IconReload fontSize="small" />
              </ListItemIcon>
              <ListItemText>Testing {index + 1}</ListItemText>
            </MenuItem>
          ))}
        <MenuItem onClick={handleSettings} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>

        {onLogout && (
          <MenuItem onClick={onLogout} sx={{ py: 1.5, color: 'error.main' }}>
            <ListItemIcon>
              <Logout fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Dialog
        open={openCloseDialog}
        onClose={handleCloseCancel}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                bgcolor: 'warning.light',
                color: 'warning.main',
                width: 48,
                height: 48
              }}
            >
              <Warning />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Close Application?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Are you sure you want to exit?
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            All unsaved changes will be lost. Make sure you have saved your work before closing the
            application.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={handleCloseCancel}
            variant="outlined"
            sx={{
              textTransform: 'none',
              borderColor: 'grey.300',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'grey.400',
                bgcolor: 'grey.50'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCloseConfirm}
            variant="contained"
            color="error"
            sx={{
              textTransform: 'none',
              minWidth: 120
            }}
          >
            Close App
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openCashierDialog}
        onClose={handleCloseCashierDialog}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 520,
            maxWidth: '92vw'
          }
        }}
      >
        <DialogTitle sx={{ pb: 2.5, pt: 3 }}>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2 }}
              >
                Buka Kasir - {username || '-'}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1.5, fontSize: '0.8rem' }}
              >
                Masukkan Saldo Awal &amp; PIN untuk Buka Kasir
              </Typography>
            </Box>
            <IconButton onClick={handleCloseCashierDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Saldo Awal"
              value={formatRupiah(openingBalance, 0)}
              onChange={(e) => {
                const onlyNumber = e.target.value.replace(/\D/g, '')

                if (onlyNumber === '') {
                  setOpeningBalance('0')
                  return
                }

                // Prevent leading zero while typing (e.g. 01000 -> 1000)
                const normalizedNumber = onlyNumber.replace(/^0+(?=\d)/, '')
                setOpeningBalance(normalizedNumber)
              }}
              onKeyPress={(event) => {
                if (!/[0-9]/.test(event.key)) event.preventDefault()
              }}
              sx={{ marginTop: 1 }}
              InputProps={{
                sx: {
                  borderRadius: 2,
                  fontSize: '1.25rem',
                  fontWeight: 500
                }
              }}
            />

            <TextField
              fullWidth
              label="PIN"
              type="password"
              value={cashierPin}
              onChange={(e) => setCashierPin(e.target.value)}
              inputProps={{ maxLength: 12 }}
              InputProps={{
                sx: {
                  borderRadius: 2,
                  fontSize: '1.25rem',
                  fontWeight: 500
                }
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={handleSubmitOpenCashier}
            variant="contained"
            color="primary"
            disabled={isOpeningCashier}
            sx={{
              textTransform: 'none',
              minWidth: 180,
              borderRadius: 2
            }}
          >
            {isOpeningCashier ? 'Memproses...' : 'Buka Kasir'}
          </Button>
          <Button
            onClick={handleCloseCashierDialog}
            variant="outlined"
            color="primary"
            disabled={isOpeningCashier}
            sx={{
              textTransform: 'none',
              minWidth: 120,
              borderRadius: 2
            }}
          >
            Batal
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openCloseCashierDialog}
        onClose={handleCloseCashierReportDialog}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 700,
            maxWidth: '95vw'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1.5, pt: 3 }}>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2 }}>
              Laporan Tutup Kasir - {username || '-'}
            </Typography>
            <IconButton onClick={handleCloseCashierReportDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              mb: 4
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                Waktu Buka Kasir
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                {formatSessionDate(cashierSession?.open_time)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                Waktu Tutup Kasir
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                {formatSessionDate(new Date().toISOString())}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                Modal Awal
              </Typography>
              <Typography variant="h5">{formatMoney(cashFirst)}</Typography>
            </Box>

            <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                Tunai
              </Typography>
              <Typography variant="h5">{formatMoney(cashIn)}</Typography>
            </Box>

            <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                EDC
              </Typography>
              <Typography variant="h5">{formatMoney(cashierSession?.edc || 0)}</Typography>
            </Box>

            <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                Bank Transfer
              </Typography>
              <Typography variant="h5">
                {formatMoney(cashierSession?.bank_transfer || 0)}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                Saldo Akhir
              </Typography>
              <Typography variant="h5">{formatMoney(cashEnd)}</Typography>
            </Box>

            <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                Transaksi Belum Terbayar
              </Typography>
              <Typography variant="h5">{formatMoney(unpaidTransaction)}</Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleOpenCloseCashierPinDialog}
            variant="contained"
            color="primary"
            sx={{
              textTransform: 'none',
              minWidth: 180,
              borderRadius: 2
            }}
          >
            Tutup Kasir
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openCloseCashierPinDialog}
        onClose={handleCloseCloseCashierPinDialog}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 440,
            maxWidth: '92vw'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1.5, pt: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1rem' }}>
            Masukkan PIN untuk Tutup Kasir
          </Typography>
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="PIN"
            type="password"
            value={closeCashierPin}
            onChange={(e) => setCloseCashierPin(e.target.value)}
            inputProps={{ maxLength: 12 }}
            sx={{ mt: 1 }}
            InputProps={{
              sx: {
                borderRadius: 2,
                fontSize: '1.25rem',
                fontWeight: 500
              }
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={handleSubmitCloseCashier}
            variant="contained"
            color="primary"
            disabled={isClosingCashier}
            sx={{
              textTransform: 'none',
              minWidth: 180,
              borderRadius: 2
            }}
          >
            {isClosingCashier ? 'Memproses...' : 'Tutup Kasir'}
          </Button>
          <Button
            onClick={handleCloseCloseCashierPinDialog}
            variant="outlined"
            color="primary"
            disabled={isClosingCashier}
            sx={{
              textTransform: 'none',
              minWidth: 120,
              borderRadius: 2
            }}
          >
            Batal
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openedProgress}
        onClose={() => setOpenedProgress(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 340,
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <UpdateIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Mengunduh Pembaruan...
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Update sedang diunduh...
          </Typography>
          <Box sx={{ width: '100%', mb: 1 }}>
            <LinearProgress variant="determinate" value={downloadProgress} />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {downloadProgress.toFixed(1)}%
          </Typography>
        </DialogContent>
      </Dialog>
      <Dialog
        open={openDeviceDialog}
        onClose={() => setOpenDeviceDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                bgcolor: 'info.light',
                color: 'info.main',
                width: 48,
                height: 48
              }}
            >
              <Settings />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Informasi Perangkat
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Detail identifikasi perangkat ini
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                DEVICE ID
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  p: 1.5,
                  bgcolor: 'grey.100',
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}
              >
                {deviceId || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                DEVICE NAME
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  p: 1.5,
                  bgcolor: 'grey.100',
                  borderRadius: 2,
                  fontFamily: 'monospace'
                }}
              >
                {deviceName || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                DEVICE BRAND
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  p: 1.5,
                  bgcolor: 'grey.100',
                  borderRadius: 2,
                  fontFamily: 'monospace'
                }}
              >
                {deviceBrand || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                IP ADDRESS
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  p: 1.5,
                  bgcolor: 'grey.100',
                  borderRadius: 2,
                  fontFamily: 'monospace'
                }}
              >
                {deviceInfo?.ipAddress || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                MAC ADDRESS
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  p: 1.5,
                  bgcolor: 'grey.100',
                  borderRadius: 2,
                  fontFamily: 'monospace'
                }}
              >
                {deviceInfo?.macAddress || '-'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setOpenDeviceDialog(false)}
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
