import crypto from 'crypto'

const DEFAULT_HOST = 'https://cnapi.ttlock.com'

async function post(host, path, params) {
  const base = (host || DEFAULT_HOST).replace(/\/+$/, '')
  const body = new URLSearchParams(params)
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString()
  })
  const raw = await res.text()
  let json = null
  try {
    json = JSON.parse(raw)
  } catch {
    json = null
  }
  return { httpStatus: res.status, json, raw }
}

function fail(r) {
  const code = r.json && r.json.errcode !== undefined ? r.json.errcode : r.httpStatus
  const msg = (r.json && (r.json.errmsg || r.json.err_message)) || r.raw.slice(0, 300)
  return { ok: false, message: `errcode ${code}: ${msg}` }
}

function ok(r) {
  if (r.httpStatus !== 200 || !r.json) return false
  return r.json.errcode === 0 || r.json.errcode === undefined
}

export async function getHotelInfo({ clientId, clientSecret, host }) {
  const r = await post(host, '/v3/hotel/getInfo', {
    clientId,
    clientSecret,
    date: String(Date.now())
  })
  if (!ok(r)) return fail(r)
  return { ok: true, hotelInfo: r.json.hotelInfo, raw: r.raw }
}

const TOKEN_HOSTS = [
  'https://euapi.ttlock.com',
  'https://api.sciener.com',
  'https://cnapi.ttlock.com'
]

export async function oauthToken({ clientId, clientSecret, username, password, host }) {
  let md5Password = password || ''
  if (md5Password && md5Password.length !== 32) {
    md5Password = crypto.createHash('md5').update(md5Password).digest('hex')
  }
  const candidates = [...new Set([...(host ? [host] : []), ...TOKEN_HOSTS])]
  let last = null
  for (const h of candidates) {
    const r = await post(h, '/oauth2/token', {
      clientId,
      clientSecret,
      username: username || '',
      password: md5Password
    })
    if (r.json && r.json.access_token) {
      const expiresIn = Number(r.json.expires_in) || 7776000
      return {
        ok: true,
        accessToken: r.json.access_token,
        refreshToken: r.json.refresh_token || '',
        expiresAt: String(Date.now() + expiresIn * 1000),
        host: h,
        raw: r.raw
      }
    }
    last = r
    if (r.json && r.json.errcode === 10010) break
  }
  return fail(last || {})
}

export async function refreshToken({ clientId, clientSecret, refreshToken, host }) {
  const target = (host || TOKEN_HOSTS[0]).replace(/\/+$/, '')
  const r = await post(target, '/oauth2/token', {
    clientId,
    clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  })
  if (r.json && r.json.access_token) {
    const expiresIn = Number(r.json.expires_in) || 7776000
    return {
      ok: true,
      accessToken: r.json.access_token,
      refreshToken: r.json.refresh_token || refreshToken,
      expiresAt: String(Date.now() + expiresIn * 1000),
      host: target,
      raw: r.raw
    }
  }
  return fail(r)
}

export async function ensureToken(settings) {
  const { clientId, clientSecret, accessToken, refreshToken, expiresAt } = settings
  if (!clientId || !accessToken) {
    return fail({ json: { errcode: 10003, errmsg: 'Belum ada sesi — login dulu' } })
  }
  const exp = Number(expiresAt) || 0
  const stale = exp === 0 || exp - Date.now() < 5 * 60 * 1000
  if (!stale) {
    return { ok: true, accessToken, refreshToken, expiresAt, host: settings.host }
  }
  if (!refreshToken) {
    return fail({ json: { errcode: 10004, errmsg: 'Token habis & tidak ada refresh token' } })
  }
  return refreshToken({ clientId, clientSecret, refreshToken, host: settings.host })
}

export async function cardRegister({
  host,
  accessToken,
  clientId,
  lockId,
  cardNumber,
  cardName,
  startDate,
  endDate,
  addType
}) {
  const params = {
    clientId,
    accessToken,
    lockId,
    cardNumber,
    date: String(Date.now())
  }
  if (cardName) params.cardName = cardName
  if (startDate) params.startDate = String(startDate)
  if (endDate) params.endDate = String(endDate)
  if (addType) params.addType = String(addType)
  const r = await post(host, '/v3/identityCard/addForReversedCardNumber', params)
  if (!ok(r)) return fail(r)
  return { ok: true, cardId: r.json.cardId, raw: r.raw }
}

export async function cardRegisterNormal({
  host,
  accessToken,
  clientId,
  lockId,
  cardNumber,
  cardName,
  startDate,
  endDate,
  addType
}) {
  const params = {
    clientId,
    accessToken,
    lockId,
    cardNumber,
    date: String(Date.now())
  }
  if (cardName) params.cardName = cardName
  if (startDate) params.startDate = String(startDate)
  if (endDate) params.endDate = String(endDate)
  if (addType) params.addType = String(addType)
  const r = await post(host, '/v3/identityCard/add', params)
  if (!ok(r)) return fail(r)
  return { ok: true, cardId: r.json.cardId, raw: r.raw }
}

export async function cardList({
  host,
  accessToken,
  clientId,
  lockId,
  pageNo = 1,
  pageSize = 100
}) {
  const r = await post(host, '/v3/identityCard/list', {
    clientId,
    accessToken,
    lockId: String(lockId),
    pageNo: String(pageNo),
    pageSize: String(pageSize),
    date: String(Date.now())
  })
  if (!ok(r)) return fail(r)
  return { ok: true, total: r.json.total, list: r.json.list || [], raw: r.raw }
}

export async function cardDelete({ host, accessToken, clientId, lockId, cardId, deleteType }) {
  const r = await post(host, '/v3/identityCard/delete', {
    clientId,
    accessToken,
    lockId: String(lockId),
    cardId: String(cardId),
    deleteType: String(deleteType || 2),
    date: String(Date.now())
  })
  if (!ok(r)) return fail(r)
  return { ok: true, raw: r.raw }
}

export async function lockRecordList({
  host,
  accessToken,
  clientId,
  lockId,
  pageNo = 1,
  pageSize = 100
}) {
  const r = await post(host, '/v3/lockRecord/list', {
    clientId,
    accessToken,
    lockId: String(lockId),
    startDate: '0',
    endDate: '0',
    pageNo: String(pageNo),
    pageSize: String(pageSize),
    date: String(Date.now())
  })
  if (!ok(r)) return fail(r)
  return { ok: true, list: r.json.list || [], total: r.json.total || 0, raw: r.raw }
}

export async function lockRecordClear({ host, accessToken, clientId, lockId }) {
  const r = await post(host, '/v3/lockRecord/clear', {
    clientId,
    accessToken,
    lockId: String(lockId),
    date: String(Date.now())
  })
  if (!ok(r)) return fail(r)
  return { ok: true, raw: r.raw }
}

export async function lockRecordDelete({ host, accessToken, clientId, lockId, recordIdList }) {
  const ids = (Array.isArray(recordIdList) ? recordIdList : [recordIdList]).map(
    (id) => Number(id) || id
  )
  const r = await post(host, '/v3/lockRecord/delete', {
    clientId,
    accessToken,
    lockId: String(lockId),
    recordIdList: JSON.stringify(ids),
    date: String(Date.now())
  })
  if (!ok(r)) return fail(r)
  return { ok: true, raw: r.raw }
}

export async function lockList({ host, accessToken, clientId, pageNo = 1, pageSize = 100 }) {
  const r = await post(host, '/v3/lock/list', {
    clientId,
    accessToken,
    pageNo: String(pageNo),
    pageSize: String(pageSize),
    date: String(Date.now())
  })
  if (!ok(r)) return fail(r)
  return { ok: true, list: r.json.list || [], total: r.json.total, raw: r.raw }
}
