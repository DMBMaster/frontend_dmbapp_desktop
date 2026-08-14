/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  Drawer,
  Chip,
  Tooltip,
  InputAdornment,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import RefreshIcon from '@mui/icons-material/Refresh'
import SettingsIcon from '@mui/icons-material/Settings'
import SearchIcon from '@mui/icons-material/Search'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import KeyIcon from '@mui/icons-material/Key'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import HistoryIcon from '@mui/icons-material/History'
import CloudIcon from '@mui/icons-material/Cloud'

const STAFF_PASSWORD = '222003'

const RECORD_TYPES = {
  1: 'App (Bluetooth)',
  2: 'Passcode / Password',
  3: 'Sidik Jari',
  4: 'Kartu IC',
  7: 'Kunci Fisik',
  8: 'Gateway (Remote)',
  10: 'Auto Lock',
  11: 'Terkunci Manual',
  12: 'Terbuka Manual'
}

function fmtTs(ts) {
  const n = Number(ts)
  if (!n) return '-'
  return new Date(n).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function recordTypeLabel(type) {
  return RECORD_TYPES[type] || `Metode Lain (${type})`
}

const TWO_WEEKS = 14 * 24 * 3600 * 1000
const DRAWER_WIDTH = 430

function toInputDate(ms) {
  const d = new Date(ms)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function SetupDrawer({ open, onClose, state, handlers, loading }) {
  const {
    dllLoaded,
    dllPath,
    ports,
    selectedPort,
    connected,
    encoderReady,
    scienerHost,
    tokenHost,
    clientId,
    clientSecret,
    username,
    password,
    accessToken,
    hotelInfo,
    showSecret
  } = state

  const {
    setScienerHost,
    setTokenHost,
    setClientId,
    setClientSecret,
    setUsername,
    setPassword,
    setHotelInfo,
    setShowSecret,
    setSelectedPort,
    loadDll,
    refreshPorts,
    handleConnect,
    handleDisconnect,
    handleInitEncoder,
    handleInitCard,
    handleDeinitCard,
    handleOauth,
    handleSaveCredentials,
    handleFetchLocks
  } = handlers

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: { sx: { width: { xs: '100%', sm: DRAWER_WIDTH } } }
      }}
    >
      <Box sx={{ p: 3, mt: 5, height: '100%', overflow: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Konfigurasi Lock Card
          </Typography>
          <IconButton onClick={onClose} size="small">
            <KeyIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Kredensial Sciener */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, mt: 1 }}>
          Kredensial Sciener (TTLock)
        </Typography>
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Server Host"
            size="small"
            value={scienerHost}
            onChange={(e) => setScienerHost(e.target.value)}
            placeholder="https://cnapi.ttlock.com"
          />
          <FormControl fullWidth size="small">
            <InputLabel>Region Token</InputLabel>
            <Select
              value={tokenHost}
              onChange={(e) => setTokenHost(e.target.value)}
              label="Region Token"
            >
              <MenuItem value="https://euapi.ttlock.com">EU — euapi.ttlock.com</MenuItem>
              <MenuItem value="https://cnapi.ttlock.com">CN — cnapi.ttlock.com</MenuItem>
              <MenuItem value="https://api.sciener.com">Global — api.sciener.com</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              label="Client ID"
              size="small"
              type={showSecret ? 'text' : 'password'}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
            <IconButton onClick={() => setShowSecret(!showSecret)} size="small">
              {showSecret ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
          </Stack>
          <TextField
            fullWidth
            label="Client Secret"
            size="small"
            type={showSecret ? 'text' : 'password'}
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
          />
          <TextField
            fullWidth
            label="Username (TTLock App)"
            size="small"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="+62..."
          />
          <TextField
            fullWidth
            label="Password (TTLock App)"
            size="small"
            type={showSecret ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" size="small" fullWidth onClick={handleOauth}>
              Ambil Token
            </Button>
            <Button variant="outlined" size="small" onClick={handleSaveCredentials}>
              Simpan
            </Button>
          </Stack>
          {accessToken && (
            <Alert severity="success" size="small">
              Token Terhubung
            </Alert>
          )}
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Koneksi Reader */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Koneksi Reader & Encoder
        </Typography>
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2">DLL: {dllLoaded ? 'Loaded' : 'Not Loaded'}</Typography>
            {!dllLoaded && (
              <Button variant="outlined" size="small" onClick={loadDll}>
                Load DLL
              </Button>
            )}
          </Stack>
          {dllLoaded && (
            <Typography variant="caption" color="text.secondary" display="block">
              {dllPath}
            </Typography>
          )}

          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl fullWidth size="small">
              <InputLabel>COM Port</InputLabel>
              <Select
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                label="COM Port"
                disabled={connected}
              >
                {ports.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton onClick={refreshPorts} disabled={connected} size="small">
              <RefreshIcon />
            </IconButton>
          </Stack>

          {!connected ? (
            <Button
              fullWidth
              variant="contained"
              onClick={handleConnect}
              disabled={!selectedPort || loading}
            >
              Hubungkan Reader
            </Button>
          ) : (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={handleDisconnect}
              disabled={loading}
            >
              Putuskan Koneksi
            </Button>
          )}

          <TextField
            fullWidth
            label="Hotel Info (Hex/Token)"
            size="small"
            value={hotelInfo}
            onChange={(e) => setHotelInfo(e.target.value)}
            placeholder="Otomatis terisi saat ambil token"
          />

          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleInitEncoder}
              disabled={!connected || !hotelInfo || loading}
            >
              Init Encoder
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleInitCard}
              disabled={!connected || !hotelInfo || loading}
            >
              Init Kartu Blank
            </Button>
          </Stack>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={handleDeinitCard}
            disabled={!connected || !hotelInfo || loading}
          >
            Kembalikan ke Blank
          </Button>

          <Alert severity={encoderReady ? 'success' : 'info'} size="small">
            {encoderReady ? 'Encoder siap untuk menulis kartu' : 'Encoder belum di-inisialisasi'}
          </Alert>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Daftar Lock */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Daftar Lock Pintu
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleFetchLocks}
          disabled={!accessToken || loading}
          startIcon={<RefreshIcon />}
        >
          Muat Daftar Lock dari Cloud
        </Button>
      </Box>
    </Drawer>
  )
}

export function LockCardPage() {
  const [activeTab, setActiveTab] = useState(0) // 0: Single, 1: Multi, 2: Staff, 3: Cancel
  const [setupOpen, setSetupOpen] = useState(false)

  // Setup states
  const [ports, setPorts] = useState([])
  const [selectedPort, setSelectedPort] = useState('')
  const [connected, setConnected] = useState(false)
  const [dllLoaded, setDllLoaded] = useState(false)
  const [dllPath, setDllPath] = useState('')
  const [encoderReady, setEncoderReady] = useState(false)

  // Sciener credentials (stored in localStorage)
  const [scienerHost, setScienerHost] = useState('https://cnapi.ttlock.com')
  const [tokenHost, setTokenHost] = useState('https://euapi.ttlock.com')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [hotelInfo, setHotelInfo] = useState('')
  const [showSecret, setShowSecret] = useState(false)

  // Lock devices list from cloud
  const [locks, setLocks] = useState([])
  const [selectedLockIds, setSelectedLockIds] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  // Card Writer States
  const [buildNo, setBuildNo] = useState(1)
  const [floorNo, setFloorNo] = useState(1)
  const [mac, setMac] = useState('')
  const [allowLockOut, setAllowLockOut] = useState(true)
  const [startDate, setStartDate] = useState(toInputDate(Date.now()))
  const [expiry, setExpiry] = useState(toInputDate(Date.now() + TWO_WEEKS))

  // Multi-lock states
  const [multiMacs, setMultiMacs] = useState('')

  // Staff card states
  const [staffCardType, setStaffCardType] = useState('master')
  const [staffUnlocked, setStaffUnlocked] = useState(false)
  const [staffDialogOpen, setStaffDialogOpen] = useState(false)
  const [staffPassword, setStaffPassword] = useState('')
  const [staffPasswordError, setStaffPasswordError] = useState(false)

  // Cancel card states
  const [cancelCardNo, setCancelCardNo] = useState('')

  // Cloud registration states
  const [cardName, setCardName] = useState('')
  const [regReversed, setRegReversed] = useState(false)
  const [regPermanent, setRegPermanent] = useState(false)

  // Single-Lock sub-tab (0: Tulis Kartu, 1: Cloud)
  const [singleSubTab, setSingleSubTab] = useState(0)

  // Cloud cards (Daftar Kartu Cloud)
  const [cloudCards, setCloudCards] = useState(null)
  const [cloudCardsLoading, setCloudCardsLoading] = useState(false)

  // Tambah kartu via cloud (tanpa menulis fisik)
  const [cloudCardNumber, setCloudCardNumber] = useState('')
  const [cloudRegDate, setCloudRegDate] = useState(() => toInputDate(Date.now()))
  const [cloudRegExpiry, setCloudRegExpiry] = useState(() => toInputDate(Date.now() + TWO_WEEKS))

  // Reading / Status States
  const [cardNo, setCardNo] = useState('')
  const [cardData, setCardData] = useState(null)

  // Lock records (History)
  const [records, setRecords] = useState(null)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordPage, setRecordPage] = useState(0)
  const [recordPageSize, setRecordPageSize] = useState(25)
  const [selRecordIds, setSelRecordIds] = useState([])

  // Notification States
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' })
  const [loading, setLoading] = useState(false)

  const showToast = (message, severity = 'info') => {
    setToast({ open: true, message, severity })
  }

  const filteredLocks = useMemo(() => {
    if (!searchTerm.trim()) return locks
    const q = searchTerm.toLowerCase()
    return locks.filter((l) => {
      const alias = (l.lockAlias || l.lockName || String(l.lockId)).toLowerCase()
      const m = (l.lockMac || '').toLowerCase()
      return alias.includes(q) || m.includes(q)
    })
  }, [locks, searchTerm])

  // Load DLL & credentials on mount
  useEffect(() => {
    const saved = localStorage.getItem('dmb_sciener_creds')
    if (saved) {
      try {
        const creds = JSON.parse(saved)
        if (creds.scienerHost) setScienerHost(creds.scienerHost)
        if (creds.tokenHost) setTokenHost(creds.tokenHost)
        if (creds.clientId) setClientId(creds.clientId)
        if (creds.clientSecret) setClientSecret(creds.clientSecret)
        if (creds.username) setUsername(creds.username)
        if (creds.password) setPassword(creds.password)
        if (creds.accessToken) setAccessToken(creds.accessToken)
        if (creds.hotelInfo) setHotelInfo(creds.hotelInfo)
      } catch (e) {
        console.error(e)
      }
    }

    loadDll()
    refreshPorts()
  }, [])

  const loadDll = async () => {
    setLoading(true)
    try {
      const res = await window.api.ce.load()
      if (res.ok) {
        setDllLoaded(true)
        setDllPath(res.path)
        showToast('CardEncoder.dll berhasil dimuat!', 'success')
      } else {
        showToast(`Gagal memuat DLL: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const refreshPorts = async () => {
    try {
      const list = await window.api.com.listPorts()
      setPorts(list)
      if (list.length > 0 && !selectedPort) {
        setSelectedPort(list[0])
      }
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleConnect = async () => {
    if (!selectedPort) {
      showToast('Pilih port COM terlebih dahulu', 'warning')
      return
    }
    setLoading(true)
    try {
      const res = await window.api.ce.connect(selectedPort)
      if (res.ok) {
        setConnected(true)
        showToast(`Berhasil terhubung ke ${selectedPort}`, 'success')
      } else {
        showToast(`Koneksi gagal: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      const res = await window.api.ce.disconnect()
      if (res.ok) {
        setConnected(false)
        setEncoderReady(false)
        showToast('Koneksi encoder diputuskan', 'info')
      } else {
        showToast(`Gagal memutuskan koneksi: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCredentials = () => {
    const creds = {
      scienerHost,
      tokenHost,
      clientId,
      clientSecret,
      username,
      password,
      accessToken,
      hotelInfo
    }
    localStorage.setItem('dmb_sciener_creds', JSON.stringify(creds))
    showToast('Kredensial Sciener disimpan secara lokal!', 'success')
  }

  const handleOauth = async () => {
    if (!clientId || !clientSecret || !username || !password) {
      showToast('Client ID, Secret, Username, dan Password TTLock wajib diisi', 'warning')
      return
    }
    setLoading(true)
    try {
      const res = await window.api.sciener.token({
        host: tokenHost,
        clientId,
        clientSecret,
        username,
        password
      })
      if (res.ok) {
        setAccessToken(res.accessToken)
        showToast('Berhasil mendapatkan access token dari Sciener!', 'success')

        const hr = await window.api.sciener.getHotelInfo({
          host: scienerHost,
          clientId,
          clientSecret
        })
        if (hr.ok) {
          setHotelInfo(hr.hotelInfo)
          showToast('Access Token & Hotel Info didapatkan!', 'success')
          const creds = {
            scienerHost,
            tokenHost,
            clientId,
            clientSecret,
            username,
            password,
            accessToken: res.accessToken,
            hotelInfo: hr.hotelInfo
          }
          localStorage.setItem('dmb_sciener_creds', JSON.stringify(creds))
        } else {
          showToast(`Gagal mengambil Hotel Info: ${hr.message}`, 'error')
        }
      } else {
        showToast(`Oauth Gagal: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchLocks = async () => {
    if (!accessToken) {
      showToast('Harap login / ambil token Sciener terlebih dahulu', 'warning')
      return
    }
    setLoading(true)
    try {
      const res = await window.api.sciener.lockList({
        host: scienerHost,
        clientId,
        accessToken
      })
      if (res.ok) {
        setLocks(res.list)
        showToast(`Berhasil memuat ${res.list.length} lock pintu!`, 'success')
      } else {
        showToast(`Gagal memuat list lock: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const isSelected = (lockId) => selectedLockIds.includes(String(lockId))

  const toggleLockSelection = (lock) => {
    const id = String(lock.lockId)
    setSelectedLockIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      return [...prev, id]
    })
    // If single-lock mode, only allow one
    if (activeTab !== 1) {
      setSelectedLockIds([id])
      setMac(lock.lockMac || '')
      setBuildNo(lock.building || buildNo)
      setFloorNo(lock.floor || floorNo)
    }
  }

  const selectedLocks = locks.filter((l) => selectedLockIds.includes(String(l.lockId)))
  const hasGateway = selectedLocks[0]?.hasGateway === 1

  const handleInitEncoder = async () => {
    if (!hotelInfo) {
      showToast('Harap isi Hotel Info terlebih dahulu', 'warning')
      return
    }
    setLoading(true)
    try {
      const res = await window.api.ce.initEncoder(hotelInfo)
      if (res.ok) {
        setEncoderReady(true)
        showToast('Inisialisasi Encoder Berhasil!', 'success')
      } else {
        showToast(`Inisialisasi Encoder Gagal: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInitCard = async () => {
    if (!hotelInfo) {
      showToast('Harap isi Hotel Info terlebih dahulu', 'warning')
      return
    }
    setLoading(true)
    try {
      const res = await window.api.ce.initCard(hotelInfo)
      if (res.ok) {
        showToast('Inisialisasi Kartu Berhasil (Kartu siap digunakan)', 'success')
      } else {
        showToast(`Inisialisasi Kartu Gagal: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleWriteCard = async () => {
    if (!hotelInfo) {
      showToast('Harap isi Hotel Info terlebih dahulu', 'warning')
      return
    }
    if (!mac && selectedLocks.length === 0) {
      showToast('Harap pilih lock pintu terlebih dahulu', 'warning')
      return
    }
    setLoading(true)
    try {
      const expiryTimestamp = allowLockOut
        ? Math.floor((Date.now() + 5 * 365 * 24 * 3600 * 1000) / 1000)
        : Math.floor(new Date(expiry).getTime() / 1000)

      const writeMac = mac || selectedLocks[0].lockMac

      const res = await window.api.ce.writeCard({
        hotelInfo,
        buildNo: Number(buildNo) || 0,
        floorNo: Number(floorNo) || 0,
        mac: writeMac,
        timestamp: expiryTimestamp,
        allowLockOut
      })

      if (res.ok) {
        showToast('Berhasil menulis kartu Single-Lock!', 'success')
        await handleBeep()

        const numRes = await window.api.ce.cardNo()
        if (numRes.ok) {
          setCardNo(numRes.cardNo)
        }

        await handleReadCard()
      } else {
        showToast(`Gagal menulis kartu: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleWriteMultiCard = async () => {
    if (!hotelInfo) {
      showToast('Harap isi Hotel Info terlebih dahulu', 'warning')
      return
    }
    const macs = multiMacs
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (macs.length < 2) {
      showToast('Harap pilih minimal 2 lock / masukkan minimal 2 MAC address', 'warning')
      return
    }
    setLoading(true)
    try {
      const expiryTimestamp = allowLockOut
        ? Math.floor((Date.now() + 5 * 365 * 24 * 3600 * 1000) / 1000)
        : Math.floor(new Date(expiry).getTime() / 1000)

      const res = await window.api.ce.writeMultipleLocks({
        hotelInfo,
        buildNo: Number(buildNo) || 0,
        floorNo: Number(floorNo) || 0,
        macs,
        timestamp: expiryTimestamp,
        allowLockOut
      })

      if (res.ok) {
        showToast('Berhasil menulis kartu Multi-Lock!', 'success')
        await handleBeep()
        await handleReadCard()
      } else {
        showToast(`Gagal menulis multi-lock: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStaffUnlock = () => {
    if (staffPassword === STAFF_PASSWORD) {
      setStaffUnlocked(true)
      setStaffDialogOpen(false)
      setStaffPassword('')
      setStaffPasswordError(false)
      setActiveTab(2)
      showToast('Kartu Staff terbuka!', 'success')
    } else {
      setStaffPasswordError(true)
    }
  }

  const handleWriteStaffCard = async () => {
    if (!hotelInfo) {
      showToast('Harap isi Hotel Info terlebih dahulu', 'warning')
      return
    }
    setLoading(true)
    try {
      const expiryTimestamp = allowLockOut
        ? Math.floor((Date.now() + 5 * 365 * 24 * 3600 * 1000) / 1000)
        : Math.floor(new Date(expiry).getTime() / 1000)

      const res = await window.api.ce.writeMasterCard({
        hotelInfo,
        type: staffCardType,
        buildNo: Number(buildNo) || 0,
        floorNo: Number(floorNo) || 0,
        timestamp: expiryTimestamp,
        allowLockOut
      })

      if (res.ok) {
        showToast(`Berhasil menulis kartu staff tipe: ${staffCardType}!`, 'success')
        await handleBeep()
        await handleReadCard()
      } else {
        showToast(`Gagal menulis kartu staff: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelCard = async () => {
    if (!hotelInfo) {
      showToast('Harap isi Hotel Info terlebih dahulu', 'warning')
      return
    }
    if (!cancelCardNo) {
      showToast('Harap masukkan nomor kartu yang akan di-cancel', 'warning')
      return
    }
    setLoading(true)
    try {
      const cancelTimestamp = Math.floor((Date.now() + 5 * 365 * 24 * 3600 * 1000) / 1000)
      const res = await window.api.ce.cancelCard({
        hotelInfo,
        cardNo: cancelCardNo,
        timestamp: cancelTimestamp
      })

      if (res.ok) {
        showToast('Kartu berhasil di-cancel / ditangguhkan!', 'success')
        await handleBeep()
      } else {
        showToast(`Gagal melakukan cancel kartu: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReadCard = async () => {
    if (!hotelInfo) {
      showToast('Harap isi Hotel Info untuk membaca kartu', 'warning')
      return
    }
    setLoading(true)
    try {
      const res = await window.api.ce.readCard(hotelInfo)
      if (res.ok) {
        try {
          const parsed = JSON.parse(res.data)
          setCardData(parsed)
        } catch {
          setCardData({ raw: res.data })
        }
        showToast('Berhasil membaca data kartu', 'success')
      } else {
        showToast(`Gagal membaca kartu: ${res.message}`, 'error')
      }

      const numRes = await window.api.ce.cardNo()
      if (numRes.ok) {
        setCardNo(numRes.cardNo)
        if (activeTab === 3) {
          setCancelCardNo(numRes.cardNo)
        }
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClearCard = async () => {
    if (!hotelInfo) {
      showToast('Harap isi Hotel Info untuk mengosongkan kartu', 'warning')
      return
    }
    setLoading(true)
    try {
      const res = await window.api.ce.clearCard(hotelInfo)
      if (res.ok) {
        showToast('Kartu berhasil dikosongkan', 'success')
        setCardData(null)
        setCardNo('')
      } else {
        showToast(`Gagal mengosongkan kartu: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeinitCard = async () => {
    if (!hotelInfo) {
      showToast('Harap isi Hotel Info untuk mengembalikan kartu ke blank', 'warning')
      return
    }
    setLoading(true)
    try {
      const res = await window.api.ce.deinitCard(hotelInfo)
      if (res.ok) {
        showToast('Kartu berhasil dikembalikan ke blank', 'success')
        setCardData(null)
        setCardNo('')
      } else {
        showToast(`Gagal mengembalikan kartu ke blank: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBeep = async () => {
    try {
      await window.api.ce.beep()
    } catch (err) {
      console.error(err)
    }
  }

  const fetchLockRecords = async (lockId = selectedLocks[0]?.lockId) => {
    if (!lockId) return
    if (!accessToken) {
      showToast('Harap login cloud terlebih dahulu untuk memuat log', 'warning')
      return
    }
    setRecordsLoading(true)
    try {
      const res = await window.api.sciener.lockRecordList({
        host: scienerHost,
        accessToken,
        clientId,
        lockId,
        pageNo: recordPage + 1,
        pageSize: recordPageSize
      })
      if (res.ok) {
        setRecords(res)
        if (!res.list.length) showToast('Belum ada catatan aktivitas untuk lock ini', 'info')
      } else {
        showToast(`Gagal memuat log: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(`Error memuat log: ${err.message}`, 'error')
    } finally {
      setRecordsLoading(false)
    }
  }

  // Auto-fetch records when Log tab opened or selected lock changes while on Log tab
  useEffect(() => {
    if (activeTab === 4 && selectedLocks[0]) {
      fetchLockRecords(selectedLocks[0].lockId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedLockIds, recordPage, recordPageSize])

  const clearAllRecords = async () => {
    const target = selectedLocks[0]
    if (!target) return
    if (!window.confirm('Hapus SEMUA riwayat unlock lock ini dari cloud?')) return
    setRecordsLoading(true)
    try {
      const res = await window.api.sciener.lockRecordClear({
        host: scienerHost,
        accessToken,
        clientId,
        lockId: Number(target.lockId)
      })
      if (res.ok) {
        showToast('Semua riwayat dihapus dari cloud', 'success')
        setSelRecordIds([])
        fetchLockRecords(target.lockId)
      } else {
        showToast(`Hapus semua gagal: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(`Error hapus semua: ${err.message}`, 'error')
    } finally {
      setRecordsLoading(false)
    }
  }

  const deleteSelectedRecords = async () => {
    const target = selectedLocks[0]
    if (!target || selRecordIds.length === 0) return
    if (!window.confirm(`Hapus ${selRecordIds.length} record terpilih dari cloud?`)) return
    setRecordsLoading(true)
    try {
      const res = await window.api.sciener.lockRecordDelete({
        host: scienerHost,
        accessToken,
        clientId,
        lockId: Number(target.lockId),
        recordIdList: selRecordIds
      })
      if (res.ok) {
        showToast(`${selRecordIds.length} record dihapus`, 'success')
        setSelRecordIds([])
        fetchLockRecords(target.lockId)
      } else {
        showToast(`Hapus record gagal: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(`Error hapus record: ${err.message}`, 'error')
    } finally {
      setRecordsLoading(false)
    }
  }

  const toggleRecord = (rid) => {
    setSelRecordIds((prev) => (prev.includes(rid) ? prev.filter((x) => x !== rid) : [...prev, rid]))
  }

  const fetchCloudCards = async (lockId = selectedLocks[0]?.lockId, silent = false) => {
    if (!lockId) return
    if (!accessToken) {
      showToast('Harap login cloud terlebih dahulu untuk memuat kartu', 'warning')
      return
    }
    setCloudCardsLoading(true)
    try {
      const res = await window.api.sciener.cardList({
        host: scienerHost,
        accessToken,
        clientId,
        lockId
      })
      if (res.ok) {
        setCloudCards(res)
        if (!res.list.length && !silent)
          showToast('Belum ada kartu terdaftar untuk lock ini', 'info')
      } else {
        showToast(`Gagal memuat daftar kartu: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(`Error memuat daftar kartu: ${err.message}`, 'error')
    } finally {
      setCloudCardsLoading(false)
    }
  }

  const deleteCloudCard = async (card) => {
    const target = selectedLocks[0]
    if (!target || !card?.cardId) return
    if (!window.confirm(`Hapus kartu "${card.cardName || ''}" (${card.cardNumber || ''})?`)) return
    setCloudCardsLoading(true)
    try {
      const res = await window.api.sciener.cardDelete({
        host: scienerHost,
        accessToken,
        clientId,
        lockId: Number(target.lockId),
        cardId: card.cardId,
        deleteType: 2
      })
      if (res.ok) {
        showToast(
          'Kartu dihapus dari cloud. Penghapusan dari memori lock tidak dijamin via gateway.',
          'success'
        )
        fetchCloudCards(Number(target.lockId), true)
      } else {
        showToast(`Hapus kartu gagal: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(`Error hapus kartu: ${err.message}`, 'error')
    } finally {
      setCloudCardsLoading(false)
    }
  }

  const addCloudCard = async () => {
    const target = selectedLocks[0]
    if (!target) {
      showToast('Pilih lock pintu cloud terlebih dahulu', 'warning')
      return
    }
    if (!cloudCardNumber) {
      showToast('Masukkan nomor kartu terlebih dahulu', 'warning')
      return
    }
    setCloudCardsLoading(true)
    try {
      const startMs = regPermanent ? 0 : new Date(cloudRegDate).getTime()
      const endMs = regPermanent ? 0 : new Date(cloudRegExpiry).getTime()
      const params = {
        host: scienerHost,
        accessToken,
        clientId,
        lockId: Number(target.lockId),
        cardNumber: cloudCardNumber,
        cardName: cardName || 'Tamu DMB',
        startDate: startMs,
        endDate: endMs,
        addType: '2'
      }
      const res = regReversed
        ? await window.api.sciener.cardRegister(params)
        : await window.api.sciener.cardRegisterNormal(params)
      if (res.ok) {
        showToast(`Kartu berhasil didaftarkan ke Cloud! Card ID: ${res.cardId}`, 'success')
        setCloudCardNumber('')
        fetchCloudCards(Number(target.lockId), true)
      } else {
        showToast(`Registrasi cloud gagal: ${res.message}`, 'error')
      }
    } catch (err) {
      showToast(`Error registrasi cloud: ${err.message}`, 'error')
    } finally {
      setCloudCardsLoading(false)
    }
  }

  const handleReadCardForCloud = async () => {
    if (!connected) {
      showToast('Hubungkan reader terlebih dahulu', 'warning')
      return
    }
    setLoading(true)
    try {
      const numRes = await window.api.ce.cardNo()
      if (numRes.ok) {
        setCloudCardNumber(numRes.cardNo)
        showToast(`Nomor kartu terbaca: ${numRes.cardNo}`, 'success')
      } else {
        showToast(`Gagal membaca kartu: ${numRes.message}`, 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch cloud cards when Cloud Cards tab opened or selected lock changes
  useEffect(() => {
    if (activeTab === 5 && selectedLocks[0]) {
      fetchCloudCards(selectedLocks[0].lockId, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedLockIds])

  const setupState = {
    dllLoaded,
    dllPath,
    ports,
    selectedPort,
    connected,
    encoderReady,
    scienerHost,
    tokenHost,
    clientId,
    clientSecret,
    username,
    password,
    accessToken,
    hotelInfo,
    showSecret
  }

  const setupHandlers = {
    setScienerHost,
    setTokenHost,
    setClientId,
    setClientSecret,
    setUsername,
    setPassword,
    setHotelInfo,
    setShowSecret,
    setSelectedPort,
    loadDll,
    refreshPorts,
    handleConnect,
    handleDisconnect,
    handleInitEncoder,
    handleInitCard,
    handleDeinitCard,
    handleOauth,
    handleSaveCredentials,
    handleFetchLocks
  }

  const showLockCardGrid = activeTab === 0 || activeTab === 1

  return (
    <Box
      sx={{
        p: 1,
        height: 'calc(100vh - 90px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
      >
        <Box>
          <Typography variant="h4" color="text.secondary">
            Lock Card Reader / Writer
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Tandatangani kartu akses pintu kamar langsung di front office
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            color={connected ? 'success' : 'default'}
            size="small"
            label={`Reader: ${connected ? selectedPort : 'Belum konek'}`}
          />
          <Chip
            color={encoderReady ? 'success' : 'default'}
            size="small"
            label={`Encoder: ${encoderReady ? 'Siap' : 'Belum init'}`}
          />
          <Button
            variant="outlined"
            onClick={() => setSetupOpen(true)}
            startIcon={<SettingsIcon />}
          >
            Konfigurasi
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* LEFT: Lock Room Cards */}
        <Grid
          size={{ xs: 12, md: 7 }}
          sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  fullWidth
                  size="small"
                  placeholder={showLockCardGrid ? 'Cari kamar atau MAC...' : 'Cari lock...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
                <Tooltip title="Muat ulang daftar lock dari cloud">
                  <span>
                    <IconButton onClick={handleFetchLocks} disabled={!accessToken} size="small">
                      <RefreshIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </CardContent>
          </Card>

          {locks.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', bgcolor: 'grey.50' }}>
              <MeetingRoomIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Belum ada lock pintu terdaftar
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Buka menu Konfigurasi, pastikan sudah login cloud, lalu muat daftar lock.
              </Typography>
              <Button
                variant="contained"
                startIcon={<SettingsIcon />}
                onClick={() => setSetupOpen(true)}
              >
                Buka Konfigurasi
              </Button>
            </Paper>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, flexShrink: 0 }}>
                {filteredLocks.length} kamar tersedia
                {activeTab === 1 && selectedLocks.length > 0
                  ? ` · ${selectedLocks.length} dipilih untuk multi-lock`
                  : ''}
              </Typography>
              <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, pr: 1, pb: 1 }}>
                <Grid container spacing={1.5}>
                  {filteredLocks.map((l) => {
                    const selected = isSelected(l.lockId)
                    const alias = l.lockAlias || l.lockName || `Lock ${l.lockId}`
                    return (
                      <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={l.lockId}>
                        <Card
                          variant="outlined"
                          onClick={() => toggleLockSelection(l)}
                          sx={{
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.15s ease',
                            borderColor: selected ? 'primary.main' : 'divider',
                            borderWidth: selected ? 2 : 1,
                            bgcolor: selected ? 'primary.50' : 'background.paper',
                            '&:hover': {
                              borderColor: selected ? 'primary.main' : 'primary.light',
                              boxShadow: 1
                            }
                          }}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: selected ? 'primary.main' : 'grey.300',
                                  fontSize: 18
                                }}
                              >
                                <MeetingRoomIcon fontSize="small" />
                              </Avatar>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                sx={{
                                  flex: 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {alias}
                              </Typography>
                              {selected && <CheckCircleIcon color="primary" fontSize="small" />}
                            </Stack>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: 'monospace', display: 'block', mb: 0.5 }}
                            >
                              {l.lockMac || 'MAC: -'}
                            </Typography>
                            <Chip size="small" variant="outlined" label={`ID: ${l.lockId}`} />
                          </CardContent>
                        </Card>
                      </Grid>
                    )
                  })}
                </Grid>
              </Box>
            </>
          )}
        </Grid>

        {/* RIGHT: Operation Panel */}
        <Grid
          size={{ xs: 12, md: 5 }}
          sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          <Card
            variant="outlined"
            sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={(_e, val) => {
                  if (val !== 2 && staffUnlocked) {
                    setStaffUnlocked(false)
                    setStaffPassword('')
                  }
                  setActiveTab(val)
                  if (val !== 1)
                    setSelectedLockIds((prev) => (prev.length > 1 ? prev.slice(0, 1) : prev))
                }}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Single-Lock" />
                <Tab label="Multi-Lock" />
                <Tab iconPosition="start" label="Staff" />
                <Tab label="Cancel" />
                <Tab label="History" />
                <Tab label="Kartu Cloud" />
              </Tabs>
            </Box>
            <CardContent
              sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            >
              {/* TAB 0: SINGLE LOCK */}
              {activeTab === 0 && (
                <>
                  <Tabs
                    value={singleSubTab}
                    onChange={(_e, v) => setSingleSubTab(v)}
                    variant="fullWidth"
                    sx={{ mb: 2, minHeight: 36 }}
                  >
                    <Tab
                      label="Tulis Kartu"
                      icon={<CreditCardIcon fontSize="small" />}
                      iconPosition="start"
                      sx={{ minHeight: 36, py: 0.5 }}
                    />
                    <Tab
                      label="Cloud"
                      icon={<CloudIcon fontSize="small" />}
                      iconPosition="start"
                      sx={{ minHeight: 36, py: 0.5 }}
                    />
                  </Tabs>

                  {singleSubTab === 0 && (
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Tulis Kartu Akses Kamar
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Pilih kamar di sebelah kiri, lalu isi masa berlaku.
                        </Typography>
                      </Box>

                      {selectedLocks[0] && (
                        <Alert
                          severity="info"
                          size="small"
                          icon={<MeetingRoomIcon fontSize="inherit" />}
                        >
                          <strong>{selectedLocks[0].lockAlias || selectedLocks[0].lockName}</strong>
                          <Box component="span" sx={{ fontFamily: 'monospace', display: 'block' }}>
                            {selectedLocks[0].lockMac}
                          </Box>
                        </Alert>
                      )}

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Building No"
                            type="number"
                            size="small"
                            value={buildNo}
                            onChange={(e) => setBuildNo(e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Floor No"
                            type="number"
                            size="small"
                            value={floorNo}
                            onChange={(e) => setFloorNo(e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            label="MAC Lock Pintu"
                            size="small"
                            value={mac || (selectedLocks[0] && selectedLocks[0].lockMac) || ''}
                            onChange={(e) => setMac(e.target.value)}
                            placeholder="Otomatis dari kamar yang dipilih"
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Berlaku Mulai"
                            type="datetime-local"
                            size="small"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Berlaku Sampai"
                            type="datetime-local"
                            size="small"
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            disabled={allowLockOut}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={allowLockOut}
                                onChange={(e) => setAllowLockOut(e.target.checked)}
                              />
                            }
                            label="Allow Lockout (Aktif Selamanya)"
                          />
                        </Grid>
                      </Grid>

                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<CreditCardIcon />}
                        onClick={handleWriteCard}
                        disabled={!connected || !hotelInfo || loading}
                      >
                        Tulis Data ke Kartu
                      </Button>
                    </Stack>
                  )}

                  {singleSubTab === 1 && (
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Tambah Kartu via Cloud
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Cukup masukkan nomor kartu (UID). Tidak perlu menulis kartu lewat reader.
                          Metode: addType 2 - Gateway.
                        </Typography>
                      </Box>

                      {selectedLocks.length === 0 ? (
                        <Box
                          sx={{
                            py: 5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            textAlign: 'center'
                          }}
                        >
                          <CloudIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                          <Typography variant="body2" color="text.secondary">
                            Pilih kamar di sebelah kiri terlebih dahulu.
                          </Typography>
                        </Box>
                      ) : (
                        <>
                          {!hasGateway && (
                            <Alert severity="warning" size="small">
                              Lock ini tidak terhubung ke gateway. Pendaftaran kartu cloud
                              (addType=2) tidak akan memprogram lock. Gunakan kartu hotel offline
                              lewat reader, atau sambungkan lock ke gateway terlebih dahulu.
                            </Alert>
                          )}

                          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Grid container spacing={1.5}>
                              <Grid size={{ xs: 12 }}>
                                <Stack direction="row" spacing={1}>
                                  <TextField
                                    fullWidth
                                    label="Nomor Kartu (UID)"
                                    size="small"
                                    value={cloudCardNumber}
                                    onChange={(e) => setCloudCardNumber(e.target.value)}
                                    placeholder="Contoh: 1234567890"
                                  />
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleReadCardForCloud}
                                    disabled={!connected || loading}
                                    sx={{ whiteSpace: 'nowrap' }}
                                  >
                                    Baca UID
                                  </Button>
                                </Stack>
                              </Grid>
                              <Grid size={{ xs: 12 }}>
                                <TextField
                                  fullWidth
                                  label="Nama Kartu / Tamu"
                                  size="small"
                                  value={cardName}
                                  onChange={(e) => setCardName(e.target.value)}
                                  placeholder="Contoh: Budi Kamar 102"
                                />
                              </Grid>
                              <Grid size={{ xs: 12 }}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Byte Order</InputLabel>
                                  <Select
                                    value={regReversed ? 'reversed' : 'normal'}
                                    onChange={(e) => setRegReversed(e.target.value === 'reversed')}
                                    label="Byte Order"
                                  >
                                    <MenuItem value="normal">Normal (add)</MenuItem>
                                    <MenuItem value="reversed">
                                      Reversed (addForReversedCardNumber)
                                    </MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid size={{ xs: 12 }}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={regPermanent}
                                      onChange={(e) => setRegPermanent(e.target.checked)}
                                    />
                                  }
                                  label="Kartu Permanen (tanpa batas waktu)"
                                />
                              </Grid>
                              {!regPermanent && (
                                <>
                                  <Grid size={{ xs: 6 }}>
                                    <TextField
                                      fullWidth
                                      label="Berlaku Mulai"
                                      type="datetime-local"
                                      size="small"
                                      value={cloudRegDate}
                                      onChange={(e) => setCloudRegDate(e.target.value)}
                                      InputLabelProps={{ shrink: true }}
                                    />
                                  </Grid>
                                  <Grid size={{ xs: 6 }}>
                                    <TextField
                                      fullWidth
                                      label="Berlaku Sampai"
                                      type="datetime-local"
                                      size="small"
                                      value={cloudRegExpiry}
                                      onChange={(e) => setCloudRegExpiry(e.target.value)}
                                      InputLabelProps={{ shrink: true }}
                                    />
                                  </Grid>
                                </>
                              )}
                              <Grid size={{ xs: 12 }}>
                                <Button
                                  fullWidth
                                  variant="contained"
                                  color="primary"
                                  startIcon={<CloudIcon />}
                                  onClick={addCloudCard}
                                  disabled={!accessToken || cloudCardsLoading || !hasGateway}
                                >
                                  Daftarkan ke Cloud
                                </Button>
                              </Grid>
                            </Grid>
                          </Paper>
                        </>
                      )}
                    </Stack>
                  )}
                </>
              )}

              {/* TAB 1: MULTI LOCK */}
              {activeTab === 1 && (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Multi-Lock Satu Kartu
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Klik beberapa kamar di kiri untuk ditumpuk ke satu kartu.
                    </Typography>
                  </Box>

                  {selectedLocks.length > 0 && (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {selectedLocks.map((l) => (
                        <Chip
                          key={l.lockId}
                          label={l.lockAlias || l.lockName || `Lock ${l.lockId}`}
                          onDelete={() => toggleLockSelection(l)}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  )}

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Daftar MAC (otomatis dari pilihan / manual)"
                    value={multiMacs}
                    onChange={(e) => setMultiMacs(e.target.value)}
                    placeholder="Klik kamar di kiri atau ketik MAC, pisahkan dengan koma/enter"
                    InputProps={{
                      startAdornment: selectedLocks.length > 0 && (
                        <InputAdornment position="start">
                          <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                            {selectedLocks.length} dipilih
                          </Typography>
                        </InputAdornment>
                      )
                    }}
                  />

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        label="Building No"
                        type="number"
                        size="small"
                        value={buildNo}
                        onChange={(e) => setBuildNo(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        label="Floor No"
                        type="number"
                        size="small"
                        value={floorNo}
                        onChange={(e) => setFloorNo(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        label="Berlaku Mulai"
                        type="datetime-local"
                        size="small"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        label="Berlaku Sampai"
                        type="datetime-local"
                        size="small"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        disabled={allowLockOut}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allowLockOut}
                            onChange={(e) => setAllowLockOut(e.target.checked)}
                          />
                        }
                        label="Allow Lockout (Aktif Selamanya)"
                      />
                    </Grid>
                  </Grid>

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<CreditCardIcon />}
                    onClick={handleWriteMultiCard}
                    disabled={!connected || !hotelInfo || loading}
                  >
                    Tulis Multi-Lock ke Kartu
                  </Button>
                </Stack>
              )}

              {/* TAB 2: STAFF */}
              {activeTab === 2 && (
                <Box sx={{ position: 'relative' }}>
                  <Stack
                    spacing={2}
                    sx={{
                      opacity: staffUnlocked ? 1 : 0.45,
                      pointerEvents: staffUnlocked ? 'auto' : 'none',
                      transition: 'opacity 0.2s ease',
                      userSelect: staffUnlocked ? 'auto' : 'none'
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Tulis Kartu Staff
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Master / Building / Floor untuk staf hotel.
                        </Typography>
                      </Box>
                      {staffUnlocked && (
                        <Button
                          variant="text"
                          size="small"
                          color="warning"
                          startIcon={<LockIcon fontSize="small" />}
                          onClick={() => {
                            setStaffUnlocked(false)
                            setStaffPassword('')
                          }}
                        >
                          Kunci
                        </Button>
                      )}
                    </Stack>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipe Kartu Staff</InputLabel>
                      <Select
                        value={staffCardType}
                        onChange={(e) => setStaffCardType(e.target.value)}
                        label="Tipe Kartu Staff"
                        disabled={!staffUnlocked}
                      >
                        <MenuItem value="master">Master (Seluruh Hotel)</MenuItem>
                        <MenuItem value="building">Building (Gedung)</MenuItem>
                        <MenuItem value="floor">Floor (Lantai)</MenuItem>
                      </Select>
                    </FormControl>

                    {staffCardType !== 'master' && (
                      <TextField
                        fullWidth
                        label="Building No"
                        type="number"
                        size="small"
                        value={buildNo}
                        onChange={(e) => setBuildNo(e.target.value)}
                        disabled={!staffUnlocked}
                      />
                    )}
                    {staffCardType === 'floor' && (
                      <TextField
                        fullWidth
                        label="Floor No"
                        type="number"
                        size="small"
                        value={floorNo}
                        onChange={(e) => setFloorNo(e.target.value)}
                        disabled={!staffUnlocked}
                      />
                    )}

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          fullWidth
                          label="Berlaku Mulai"
                          type="datetime-local"
                          size="small"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          disabled={!staffUnlocked}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          fullWidth
                          label="Berlaku Sampai"
                          type="datetime-local"
                          size="small"
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          disabled={!staffUnlocked || allowLockOut}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={allowLockOut}
                              onChange={(e) => setAllowLockOut(e.target.checked)}
                              disabled={!staffUnlocked}
                            />
                          }
                          label="Allow Lockout (Aktif Selamanya)"
                        />
                      </Grid>
                    </Grid>

                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={<KeyIcon />}
                      onClick={handleWriteStaffCard}
                      disabled={!staffUnlocked || !connected || !hotelInfo || loading}
                    >
                      Tulis Kartu Staff
                    </Button>
                  </Stack>

                  {!staffUnlocked && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        textAlign: 'center',
                        zIndex: 2
                      }}
                    >
                      <Avatar
                        sx={{ width: 48, height: 48, bgcolor: 'grey.200', color: 'grey.600' }}
                      >
                        <LockIcon fontSize="medium" />
                      </Avatar>
                      <Button
                        variant="contained"
                        startIcon={<LockOpenIcon />}
                        onClick={() => {
                          setStaffDialogOpen(true)
                          setStaffPassword('')
                          setStaffPasswordError(false)
                        }}
                      >
                        Masukkan Password
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* TAB 3: CANCEL */}
              {activeTab === 3 && (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Cancel / Tangguhkan Kartu
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {`Letakkan kartu di reader, klik "Baca Data Kartu" untuk mengambil nomor kartu, lalu cancel.`}
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    label="Nomor Kartu (Card Number)"
                    value={cancelCardNo}
                    onChange={(e) => setCancelCardNo(e.target.value)}
                    placeholder="Contoh: 1234567890"
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    size="large"
                    onClick={handleCancelCard}
                    disabled={!connected || !hotelInfo || loading}
                  >
                    Cancel & Blokir Kartu
                  </Button>
                </Stack>
              )}

              {/* TAB 4: LOG AKTIVITAS */}
              {activeTab === 4 && (
                <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      History Buka Kunci
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Riwayat buka kunci pintu dari server Sciener/TTLock.
                    </Typography>
                  </Box>

                  {selectedLocks.length === 0 ? (
                    <Box
                      sx={{
                        py: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        textAlign: 'center'
                      }}
                    >
                      <Avatar
                        sx={{ width: 56, height: 56, bgcolor: 'grey.200', color: 'grey.500' }}
                      >
                        <HistoryIcon fontSize="large" />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Belum Ada Kamar Dipilih
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Silakan pilih salah satu kamar/lock di sebelah kiri terlebih dahulu untuk
                        memuat log aktivitas.
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Chip
                          size="small"
                          color="primary"
                          variant="outlined"
                          icon={<MeetingRoomIcon fontSize="small" />}
                          label={selectedLocks[0].lockAlias || selectedLocks[0].lockName}
                        />
                        <Stack direction="row" spacing={1}>
                          {selRecordIds.length > 0 && (
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              onClick={deleteSelectedRecords}
                              disabled={recordsLoading}
                            >
                              Hapus Terpilih ({selRecordIds.length})
                            </Button>
                          )}
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={clearAllRecords}
                            disabled={!records || records.list.length === 0 || recordsLoading}
                          >
                            Hapus Semua
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={() => fetchLockRecords(selectedLocks[0].lockId)}
                            disabled={!accessToken || recordsLoading}
                          >
                            Segarkan
                          </Button>
                        </Stack>
                      </Stack>

                      <Typography variant="caption" color="text.secondary">
                        Centang baris untuk hapus terpilih (hanya lock top admin). Hapus hanya
                        menghapus catatan di cloud.
                      </Typography>

                      {recordsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                          <CircularProgress />
                        </Box>
                      ) : records && records.list.length > 0 ? (
                        <>
                          <TableContainer
                            component={Paper}
                            variant="outlined"
                            sx={{ flex: 1, overflowY: 'auto' }}
                          >
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  <TableCell padding="checkbox">
                                    <Checkbox
                                      size="small"
                                      indeterminate={
                                        selRecordIds.length > 0 &&
                                        selRecordIds.length < records.list.length
                                      }
                                      checked={
                                        records.list.length > 0 &&
                                        selRecordIds.length === records.list.length
                                      }
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelRecordIds(
                                            records.list.map((r) =>
                                              String(r.recordId ?? r.lockDate)
                                            )
                                          )
                                        } else {
                                          setSelRecordIds([])
                                        }
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>Waktu</TableCell>
                                  <TableCell>Pengguna</TableCell>
                                  <TableCell align="center">Status</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {records.list.map((r, i) => {
                                  const rid = String(r.recordId ?? r.lockDate ?? i)
                                  return (
                                    <TableRow
                                      key={rid}
                                      hover
                                      selected={selRecordIds.includes(rid)}
                                      onClick={() => toggleRecord(rid)}
                                      sx={{ cursor: 'pointer' }}
                                    >
                                      <TableCell padding="checkbox">
                                        <Checkbox
                                          size="small"
                                          checked={selRecordIds.includes(rid)}
                                        />
                                      </TableCell>
                                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        <Box sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                                          {fmtTs(r.lockDate || r.serverDate || r.recordDate)}
                                        </Box>
                                        <Box
                                          sx={{
                                            fontSize: 12,
                                            color: 'text.secondary',
                                            mt: 0.5
                                          }}
                                        >
                                          {recordTypeLabel(r.recordType)}
                                        </Box>
                                      </TableCell>
                                      <TableCell>
                                        {r.username || r.keyName || '-'}
                                        {r.keyboardPwd ? (
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            display="block"
                                          >
                                            {r.keyboardPwd}
                                          </Typography>
                                        ) : null}
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip
                                          size="small"
                                          color={r.success === 1 ? 'success' : 'error'}
                                          variant="outlined"
                                          label={r.success === 1 ? 'Sukses' : 'Gagal'}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          <TablePagination
                            component="div"
                            count={records.total || records.list.length}
                            page={recordPage}
                            rowsPerPage={recordPageSize}
                            onPageChange={(_e, p) => setRecordPage(p)}
                            onRowsPerPageChange={(e) => {
                              setRecordPageSize(parseInt(e.target.value, 10))
                              setRecordPage(0)
                            }}
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            labelRowsPerPage="per halaman"
                          />
                        </>
                      ) : (
                        <Box
                          sx={{
                            py: 5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            textAlign: 'center'
                          }}
                        >
                          <HistoryIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                          <Typography variant="body2" color="text.secondary">
                            Belum ada catatan aktivitas untuk lock ini.
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Stack>
              )}

              {/* TAB 5: KARTU CLOUD */}
              {activeTab === 5 && (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Daftar Kartu Terdaftar di Cloud
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Kartu IC yang terdaftar pada lock pintu terpilih.
                    </Typography>
                  </Box>

                  {selectedLocks.length === 0 ? (
                    <Box
                      sx={{
                        py: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        textAlign: 'center'
                      }}
                    >
                      <Avatar
                        sx={{ width: 56, height: 56, bgcolor: 'grey.200', color: 'grey.500' }}
                      >
                        <CreditCardIcon fontSize="large" />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Belum Ada Kamar Dipilih
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Silakan pilih salah satu kamar/lock di sebelah kiri terlebih dahulu untuk
                        memuat daftar kartu.
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Chip
                          size="small"
                          color="primary"
                          variant="outlined"
                          icon={<MeetingRoomIcon fontSize="small" />}
                          label={selectedLocks[0].lockAlias || selectedLocks[0].lockName}
                        />
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={() => fetchCloudCards(selectedLocks[0].lockId)}
                            disabled={!accessToken || cloudCardsLoading || !hasGateway}
                          >
                            Segarkan
                          </Button>
                        </Stack>
                      </Stack>

                      {!hasGateway && (
                        <Alert severity="warning" size="small">
                          Lock ini tidak terhubung ke gateway. Daftar kartu cloud hanya bisa dilihat
                          / dikelola bila lock tersambung ke gateway.
                        </Alert>
                      )}

                      {cloudCardsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                          <CircularProgress />
                        </Box>
                      ) : cloudCards && cloudCards.list.length > 0 ? (
                        <>
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Nama</TableCell>
                                  <TableCell>Card ID</TableCell>
                                  <TableCell>Card Number</TableCell>
                                  <TableCell>Tipe</TableCell>
                                  <TableCell align="center">Status</TableCell>
                                  <TableCell align="center">Aksi</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {cloudCards.list.map((c) => (
                                  <TableRow key={c.cardId} hover>
                                    <TableCell>{c.cardName || '-'}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                                      {c.cardId}
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                                      {c.cardNumber}
                                    </TableCell>
                                    <TableCell>{c.cardType === 1 ? 'Tamu' : c.cardType}</TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        size="small"
                                        color={c.status === 1 ? 'success' : 'default'}
                                        variant="outlined"
                                        label={c.status === 1 ? 'Aktif' : c.status}
                                      />
                                    </TableCell>
                                    <TableCell align="center">
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        color="error"
                                        onClick={() => deleteCloudCard(c)}
                                        disabled={cloudCardsLoading || !hasGateway}
                                      >
                                        Hapus
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          <Typography variant="caption" color="text.secondary">
                            {cloudCards.total} kartu terdaftar. Hapus hanya membersihkan daftar
                            cloud; penghapusan dari memori lock tidak dijamin via gateway.
                          </Typography>
                        </>
                      ) : (
                        <Box
                          sx={{
                            py: 5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            textAlign: 'center'
                          }}
                        >
                          <CreditCardIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                          <Typography variant="body2" color="text.secondary">
                            Belum ada kartu terdaftar untuk lock ini.
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Stack>
              )}

              {activeTab !== 4 && activeTab !== 5 && (
                <>
                  <Divider sx={{ my: 2, flexShrink: 0 }} />

                  {/* Verification */}
                  <Stack spacing={1} sx={{ flexShrink: 0 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Verifikasi Kartu
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleReadCard}
                        disabled={!connected || !hotelInfo || loading}
                      >
                        Baca Kartu
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="warning"
                        onClick={handleClearCard}
                        disabled={!connected || !hotelInfo || loading}
                      >
                        Kosongkan
                      </Button>
                    </Stack>
                    {cardNo && (
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        <strong>No. Kartu:</strong> {cardNo}
                      </Typography>
                    )}
                    {cardData && (
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: 'grey.100',
                          borderRadius: 1,
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          maxHeight: '120px',
                          overflow: 'auto'
                        }}
                      >
                        <pre>{JSON.stringify(cardData, null, 2)}</pre>
                      </Box>
                    )}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Setup Drawer */}
      <SetupDrawer
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        state={setupState}
        handlers={setupHandlers}
        loading={loading}
      />

      {/* Staff Password Dialog */}
      <Dialog
        open={staffDialogOpen}
        onClose={() => setStaffDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LockIcon color="primary" />
            <Typography variant="h6">Akses Kartu Staff</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tab ini dikunci. Masukkan password untuk membuka akses kartu staff
            (master/building/floor).
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Password"
            type="password"
            size="small"
            value={staffPassword}
            onChange={(e) => {
              setStaffPassword(e.target.value)
              setStaffPasswordError(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleStaffUnlock()
            }}
            error={staffPasswordError}
            helperText={staffPasswordError ? 'Password salah!' : ''}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setStaffDialogOpen(false)}>Batal</Button>
          <Button variant="contained" startIcon={<LockOpenIcon />} onClick={handleStaffUnlock}>
            Buka
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loader Backdrop */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Toast Alert */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
