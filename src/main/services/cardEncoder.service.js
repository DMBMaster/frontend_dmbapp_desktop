import { app } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import koffi from 'koffi'

let fns = null

const archDir = () => (process.arch === 'ia32' ? '32' : '64')

function resolveDllPath() {
  const arch = archDir()
  const candidates = [
    join(app.getAppPath(), 'resources', 'cardware', arch, 'CardEncoder.dll'),
    join(
      process.resourcesPath,
      'app.asar.unpacked',
      'resources',
      'cardware',
      arch,
      'CardEncoder.dll'
    ),
    join(process.resourcesPath, 'resources', 'cardware', arch, 'CardEncoder.dll'),
    join(process.resourcesPath, 'cardware', arch, 'CardEncoder.dll')
  ]
  return candidates.find((p) => existsSync(p)) || null
}

function requireLoaded() {
  if (!fns) {
    loadDll()
  }
  return fns
}

function loadDll() {
  const path = resolveDllPath()
  if (!path) throw new Error('CardEncoder.dll tidak ditemukan di resources/cardware/')
  const dll = koffi.load(path)
  fns = {
    CE_ConfigServer: dll.func('bool CE_ConfigServer(const char *url)'),
    CE_ConnectComm: dll.func('int CE_ConnectComm(const char *portName)'),
    CE_DisconnectComm: dll.func('int CE_DisconnectComm()'),
    CE_InitCardEncoder: dll.func('int CE_InitCardEncoder(const char *hotelInfo)'),
    CE_InitCard: dll.func('int CE_InitCard(const char *hotelInfo)'),
    CE_StopInitCard: dll.func('int CE_StopInitCard()'),
    CE_WriteCard: dll.func(
      'int CE_WriteCard(const char *hotelInfo, int buildNo, int floorNo, const char *mac, long timestamp, bool allowLockOut)'
    ),
    CE_ClearCard: dll.func('int CE_ClearCard(const char *hotelInfo)'),
    CE_ReadCard: dll.func('int CE_ReadCard(const char *hotelInfo, _Out_ const char **hotelArray)'),
    CE_GetCardNo: dll.func('int CE_GetCardNo(_Out_ const char **cardNumber)'),
    CE_Beep: dll.func('int CE_Beep(int voiceLen, int interval, int voiceCount)'),
    CE_GetVersion: dll.func('int CE_GetVersion(_Out_ const char **version)'),
    CE_InitConstructionCard: dll.func('int CE_InitConstructionCard()'),
    CE_DeInitCard: dll.func('int CE_DeInitCard(const char *hotelInfo)'),
    CE_CancelCard: dll.func(
      'int CE_CancelCard(const char *hotelInfo, const char *cardNumber, long timestamp)'
    ),
    CE_GetSectors: dll.func('int CE_GetSectors(_Out_ const char **sectorStr)'),
    CE_SetSectors: dll.func('int CE_SetSectors(const char *sectors)'),
    CE_SetLog: dll.func('int CE_SetLog(bool openLog, const char *logDir)')
  }
  return path
}

export function transformMAC(mac) {
  if (!mac) return null
  const cleaned = mac.replace(/:/g, '')
  if (!/^[0-9A-Fa-f]{12}$/.test(cleaned)) return null
  return cleaned.toUpperCase()
}

const ERROR_TEXT = {
  0: 'Berhasil',
  1: 'Gagal umum',
  2: 'Parameter salah',
  4: 'Kartu konstruksi tidak bisa dijadikan kartu hotel',
  11: 'HTTP request gagal',
  12: 'HTTP response tidak bisa diparse',
  16: 'Encoder tidak terhubung',
  102: 'Kesalahan sementara, coba sambungkan ulang encoder',
  106: 'Kartu bukan kartu hotel ini / sudah diinisialisasi hotel lain'
}

export function describeError(code) {
  return ERROR_TEXT[code] || `Kode error ${code}`
}

function result(code, message, extra = {}) {
  return { code, ok: code === 0, message, ...extra }
}

function readStr(v) {
  if (v == null) return null
  if (typeof v === 'string') return v
  if (Buffer.isBuffer(v)) return v.toString('utf8')
  try {
    return koffi.decode(v, 'char', -1)
  } catch {
    return String(v)
  }
}

export function configServer(url) {
  const ok = requireLoaded().CE_ConfigServer(url)
  return result(ok ? 0 : 1, ok ? 'Konfigurasi server berhasil' : 'Konfigurasi server gagal')
}

export function connectComm(port) {
  const code = requireLoaded().CE_ConnectComm(port)
  return result(code, code === 0 ? `Terhubung ke ${port}` : describeError(code), { port })
}

export function disconnectComm() {
  const code = requireLoaded().CE_DisconnectComm()
  return result(code, code === 0 ? 'Encoder terputus' : describeError(code))
}

export function initCardEncoder(hotelInfo) {
  const code = requireLoaded().CE_InitCardEncoder(hotelInfo)
  return result(code, code === 0 ? 'Inisialisasi encoder berhasil' : describeError(code))
}

export function getSectors() {
  const out = [null]
  const code = requireLoaded().CE_GetSectors(out)
  return result(code, code === 0 ? 'Baca sector berhasil' : describeError(code), {
    sectors: readStr(out[0])
  })
}

export function setSectors(mask) {
  const code = requireLoaded().CE_SetSectors(mask)
  return result(code, code === 0 ? 'Set sector berhasil' : describeError(code))
}

export function initCard(hotelInfo) {
  const code = requireLoaded().CE_InitCard(hotelInfo)
  return result(code, code === 0 ? 'Init kartu hotel berhasil' : describeError(code))
}

export function stopInitCard() {
  const code = requireLoaded().CE_StopInitCard()
  return result(code, code === 0 ? 'Stop init kartu berhasil' : describeError(code))
}

function toNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function writeCard({ hotelInfo, buildNo, floorNo, mac, timestamp, allowLockOut }) {
  const cleanMac = transformMAC(mac)
  if (!cleanMac) return result(-1, 'Format MAC salah (perlu 12 hex / format xx:xx:xx:xx:xx:xx)')
  const ts = toNumber(timestamp)
  if (ts === null) return result(-1, 'Timestamp tidak valid (harus angka)')
  const code = requireLoaded().CE_WriteCard(
    hotelInfo,
    buildNo,
    floorNo,
    cleanMac,
    ts,
    !!allowLockOut
  )
  return result(code, code === 0 ? 'Tulis data unlock berhasil' : describeError(code), {
    mac: cleanMac
  })
}

export function readCard(hotelInfo) {
  const out = [null]
  const code = requireLoaded().CE_ReadCard(hotelInfo, out)
  return result(code, code === 0 ? 'Baca kartu berhasil' : describeError(code), {
    data: readStr(out[0])
  })
}

export function getCardNo() {
  const out = [null]
  const code = requireLoaded().CE_GetCardNo(out)
  return result(code, code === 0 ? 'Baca nomor kartu berhasil' : describeError(code), {
    cardNo: readStr(out[0])
  })
}

export function clearCard(hotelInfo) {
  const code = requireLoaded().CE_ClearCard(hotelInfo)
  return result(code, code === 0 ? 'Kosongkan kartu berhasil' : describeError(code))
}

export function deInitCard(hotelInfo) {
  const code = requireLoaded().CE_DeInitCard(hotelInfo)
  return result(code, code === 0 ? 'Kartu kembali blank berhasil' : describeError(code))
}

export function beep() {
  const code = requireLoaded().CE_Beep(100, 100, 4)
  return result(code, code === 0 ? 'Beep berhasil' : describeError(code))
}

export function getVersion() {
  const out = [null]
  const code = requireLoaded().CE_GetVersion(out)
  return result(code, code === 0 ? 'Baca versi berhasil' : describeError(code), {
    version: readStr(out[0])
  })
}

export function writeMasterCard({ hotelInfo, type, buildNo, floorNo, timestamp, allowLockOut }) {
  const cleanMac = '000000000000'
  let b = Number(buildNo) || 0
  let f = Number(floorNo) || 0
  let label
  if (type === 'master') {
    b = 0
    f = 0
    label = 'Master (semua lock di hotel)'
  } else if (type === 'building') {
    f = 0
    label = `Building ${b}`
  } else if (type === 'floor') {
    label = `Building ${b} · Floor ${f}`
  } else {
    return result(-1, 'Tipe kartu tidak dikenal (master/building/floor)')
  }
  const ts = toNumber(timestamp)
  if (ts === null) return result(-1, 'Timestamp tidak valid (harus angka)')
  const code = requireLoaded().CE_WriteCard(hotelInfo, b, f, cleanMac, ts, !!allowLockOut)
  return result(code, code === 0 ? `Tulis ${label} berhasil` : describeError(code), {
    mac: cleanMac,
    buildNo: b,
    floorNo: f,
    type
  })
}

export function writeMultipleLocks({ hotelInfo, buildNo, floorNo, macs, timestamp, allowLockOut }) {
  if (!Array.isArray(macs) || macs.length === 0) {
    return result(-1, 'Daftar MAC kosong')
  }
  const cleaned = []
  for (const m of macs) {
    const c = transformMAC(m)
    if (!c) return result(-1, `MAC tidak valid: ${m}`)
    cleaned.push(c)
  }
  const ts = toNumber(timestamp)
  if (ts === null) return result(-1, 'Timestamp tidak valid (harus angka)')
  const dll = requireLoaded()
  const fails = []
  for (const c of cleaned) {
    const code = dll.CE_WriteCard(hotelInfo, buildNo, floorNo, c, ts, !!allowLockOut)
    if (code !== 0) fails.push({ mac: c, code, msg: describeError(code) })
  }
  if (fails.length > 0) {
    return result(
      -1,
      `Sebagian gagal (${fails.length}/${cleaned.length}): ${fails
        .map((f) => `${f.mac} (${f.code})`)
        .join(', ')}`,
      { ok: false, fails, macs: cleaned }
    )
  }
  return result(0, `Semua ${cleaned.length} lock ditulis ke satu kartu`, { macs: cleaned })
}

export function cancelCard({ hotelInfo, cardNo, timestamp }) {
  const code = requireLoaded().CE_CancelCard(hotelInfo, cardNo, timestamp)
  return result(code, code === 0 ? 'Kartu berhasil di-cancel' : describeError(code))
}

export function loadDllWrapper() {
  try {
    const path = loadDll()
    return { ok: true, path, arch: process.arch }
  } catch (err) {
    return { ok: false, message: err.message || String(err) }
  }
}
