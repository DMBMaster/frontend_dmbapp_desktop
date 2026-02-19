import React, { useEffect, useState, useCallback } from 'react'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert from '@mui/material/Alert'
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

// eslint-disable-next-line react/prop-types
export const TitleBar = ({ username, theme = 'light', onLogout, showUpdateButton = false }) => {
  const { config } = useConfigStore.getState()
  // OUTLET LOGIC
  const userStr = localStorage.getItem('userLogin')
  const user = userStr ? JSON.parse(userStr) : null

  // Get current outlet from localStorage or default to first outlet
  const savedOutletId = localStorage.getItem('outletId')
  const initialOutlet =
    user?.outlets.find((o) => String(o.id) === savedOutletId) || user?.outlets[0] || null

  const [currentOutlet, setCurrentOutlet] = useState(initialOutlet)
  const [outlets, setOutlets] = useState([])
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('')
  const [openCloseDialog, setOpenCloseDialog] = useState(false)
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
  const [updateInfoOpen, setUpdateInfoOpen] = useState(false)
  const [updateInfoMsg, setUpdateInfoMsg] = useState('')
  const [updateInfoSeverity, setUpdateInfoSeverity] = useState(
    'success' | 'warning' | 'error' | 'info'
  )

  React.useEffect(() => {
    try {
      if (userStr && user) {
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
      setUpdateInfoMsg(message)
      setUpdateInfoSeverity(severity)
      setUpdateInfoOpen(true)
    })

    return () => {
      unsubProgress()
      unsubNotification()
    }
  }, [])

  const handleCheckUpdates = () => {
    try {
      setUpdateInfoMsg('Memeriksa pembaruan...')
      setUpdateInfoSeverity('info')
      setUpdateInfoOpen(true)

      window.api.checkForUpdates()
    } catch (e) {
      console.error('Failed to request update check', e)
      setUpdateInfoMsg('Gagal memeriksa pembaruan')
      setUpdateInfoSeverity('error')
      setUpdateInfoOpen(true)
    }
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
      console.log('printt')

      try {
        // 1. Test koneksi dulu
        const testResult = await window.api.testThermalPrinter({
          printerIp: config.printer_ip,
          printerPort: config.printer_port
        })
        console.log('Koneksi printer:', testResult)

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
            {/* Update button (optional) - shown when `showUpdateButton` is true */}
            {showUpdateButton && (
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
          <>
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
          </>
        )}

        {/* Menu Items */}
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
      <Snackbar
        open={updateInfoOpen}
        autoHideDuration={3500}
        onClose={() => setUpdateInfoOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setUpdateInfoOpen(false)}
          severity={updateInfoSeverity}
        >
          {updateInfoMsg}
        </MuiAlert>
      </Snackbar>
    </>
  )
}
