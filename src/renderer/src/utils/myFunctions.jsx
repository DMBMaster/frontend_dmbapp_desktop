import { useConfigStore } from '@renderer/store/configProvider'
import moment from 'moment/min/moment-with-locales'
moment.locale('id')

export const formatDate = (dateString) => {
  const date = new Date(dateString)
  const options = new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  })
  return options.format(date)
}

export const formatTime = (isoString) => {
  const date = new Date(isoString)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export const formatDateTime = (dateString) => {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }

  const date = new Date(dateString)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const formattedDate = date.toLocaleDateString('id-ID', options).replace(/,/, '')
  const formattedTime = `${hours}:${minutes}`
  return `${formattedDate} ${formattedTime} WIB`
}

export const formatGender = (gender) => {
  switch (gender) {
    case 'L':
      return 'Laki-laki'
    case 'P':
      return 'Perempuan'
    default:
      return ''
  }
}

export const decodeToken = (token) => {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('')
  )
  return JSON.parse(jsonPayload)
}

export const getDayNow = () => moment().format('dddd')
export const getDayMonth = () => moment().format('MMMM')

export const toolbarOptions = [
  [{ header: '1' }, { header: '2' }, { font: [] }],
  [{ size: ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike', 'blockquote'],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  ['link', 'image', 'video'],
  [{ align: [] }, { color: [] }, { background: [] }],
  ['clean']
]

export const formatRupiah = (angka, valas = 1) => {
  if (angka === null || angka === undefined || angka === '') {
    return '0'
  }

  const reverse = angka.toString().split('').reverse().join('')
  const ribuan = reverse.match(/\d{1,3}/g)
  const formatted = ribuan?.join('.').split('').reverse().join('') || '0'

  return valas === 0 ? formatted : 'Rp ' + formatted
}

export const parseCurrencyToNumber = (currencyStr) => {
  if (!currencyStr) return 0
  const cleanedString = currencyStr.replace(/[^0-9]/g, '')
  return parseInt(cleanedString, 10) || 0
}

export const formatTitleUrl = (text) => {
  return text
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .toLowerCase()
}

export const getCurrentTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

const now = new Date()
const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

export const formatDateTimeLocal = (date) => {
  const pad = (num) => num.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export const defaultTimeReservation = formatDateTimeLocal(oneHourLater)

export const toPlus62 = (phone) => {
  if (!phone || typeof phone !== 'string') return null
  const digits = phone.replace(/\D+/g, '')
  if (!digits) return null

  if (digits.startsWith('0')) return '+62' + digits.slice(1)
  if (digits.startsWith('62')) return '+' + digits
  if (digits.startsWith('8')) return '+62' + digits

  const stripped = digits.replace(/^0+/, '')
  if (stripped !== digits) {
    if (stripped.startsWith('62')) return '+' + stripped
    if (stripped.startsWith('8')) return '+62' + stripped
  }

  return '+' + digits
}

export const getStartOfCurrentMonth = () => moment().startOf('month').format('YYYY-MM-DD')
export const getEndOfCurrentMonth = () => moment().endOf('month').format('YYYY-MM-DD')

const today = new Date()
export const fullDate = today.toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})
const { config } = useConfigStore.getState()
const baseURL = config?.API_URL || 'https://api.dmbapp.cloud'
export const getImgUrl = (path) => {
  return `${baseURL}${path}`
}

export const generatePRNumber = () => {
  const prefix = 'PR'
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const randomPart = Math.floor(1000 + Math.random() * 9000)

  return `${prefix}-${datePart}-${randomPart}`
}
