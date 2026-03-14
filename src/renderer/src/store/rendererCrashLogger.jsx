/**
 * rendererCrashLogger.jsx  (Renderer Process)
 * Taruh di: src/renderer/src/services/rendererCrashLogger.jsx
 *
 * Ekspor:
 *   initRendererCrashLogger()  — panggil di main.jsx SEBELUM createRoot()
 *   <AppErrorBoundary>         — wrap di main.jsx sekeliling <App />
 */

import React from 'react'

// ─── Kirim ke main process via IPC ───────────────────────────────────────────
function sendToMain(payload) {
  try {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('discord:log', payload)
    } else {
      console.warn('[CrashLogger] window.electron.ipcRenderer tidak tersedia')
    }
  } catch (err) {
    console.warn('[CrashLogger] IPC send failed:', err.message)
  }
}

function trunc(val, max = 1024) {
  if (val == null) return '—'
  const s = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)
  return s.length > max ? s.slice(0, max - 3) + '...' : s
}

function fmtStack(stack, max = 900) {
  if (!stack) return null
  const s = stack.replace(/\r/g, '').trim()
  return s.length > max ? s.slice(0, max - 3) + '...' : s
}

function pageInfo() {
  const loc = window.location.hash || window.location.pathname || ''
  return {
    path: loc,
    route: loc.replace('#', '').replace(/^\//, '').split('/').filter(Boolean).join(' → ') || 'Home',
    timestamp: new Date().toISOString()
  }
}

// ─── Deduplication — cegah spam kirim error yang sama ────────────────────────
const _seen = new Set()
function isDuplicate(key) {
  if (_seen.has(key)) return true
  _seen.add(key)
  setTimeout(() => _seen.delete(key), 2000)
  return false
}

// ─── Handler: error event ─────────────────────────────────────────────────────
// Dipasang via addEventListener('error') — TIDAK bisa di-overwrite Vite/Electron
function handleErrorEvent(event) {
  const msg = event.message || String(event.error) || 'Unknown error'
  if (isDuplicate(`err:${msg}`)) return

  console.error('[CrashLogger] window error:', msg)
  const page = pageInfo()
  const stack = fmtStack(event.error?.stack)

  sendToMain({
    level: 'crash',
    title: '💥 Uncaught JS Error — Renderer',
    fields: [
      { name: '❌ Error', value: `\`\`\`\n${trunc(msg, 600)}\n\`\`\``, inline: false },
      {
        name: '📍 Lokasi',
        value: `**File:** \`${event.filename || '—'}\`\n**Line:** \`${event.lineno ?? '—'}:${event.colno ?? '—'}\``,
        inline: true
      },
      {
        name: '🖥️ Halaman',
        value: `**Route:** \`${page.route}\`\n**Path:** \`${page.path}\``,
        inline: true
      },
      ...(stack
        ? [{ name: '📋 Stack Trace', value: `\`\`\`\n${stack}\n\`\`\``, inline: false }]
        : [])
    ]
  })
}

// ─── Handler: unhandledrejection event ───────────────────────────────────────
// Dipasang via addEventListener('unhandledrejection') — ini SATU-SATUNYA cara yang benar
// window.onunhandledrejection BUKAN property standar browser — tidak akan pernah terpanggil
function handleUnhandledRejection(event) {
  const reason = event.reason
  const msg = reason instanceof Error ? reason.message : String(reason ?? 'Unknown rejection')
  if (isDuplicate(`rej:${msg}`)) return

  console.error('[CrashLogger] unhandledrejection:', msg)
  const page = pageInfo()
  const stack = reason instanceof Error ? fmtStack(reason.stack) : null

  sendToMain({
    level: 'crash',
    title: '💥 Unhandled Promise Rejection — Renderer',
    fields: [
      { name: '❌ Reason', value: `\`\`\`\n${trunc(msg, 600)}\n\`\`\``, inline: false },
      {
        name: '🖥️ Halaman',
        value: `**Route:** \`${page.route}\`\n**Path:** \`${page.path}\``,
        inline: false
      },
      ...(stack
        ? [{ name: '📋 Stack Trace', value: `\`\`\`\n${stack}\n\`\`\``, inline: false }]
        : [])
    ]
  })
}

// ─── Init ─────────────────────────────────────────────────────────────────────
// WAJIB dipanggil di main.jsx SEBELUM createRoot()
export function initRendererCrashLogger() {
  // ✅ addEventListener — tidak bisa di-overwrite, tidak konflik dengan Vite/Electron
  // ❌ JANGAN pakai: window.onerror = fn  (bisa di-overwrite)
  // ❌ JANGAN pakai: window.onunhandledrejection = fn  (property ini tidak standar, tidak jalan)
  window.addEventListener('error', handleErrorEvent)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)
  console.log('[CrashLogger] Renderer initialized ✅')
}

// ─── Cleanup (untuk hot reload dev) ──────────────────────────────────────────
export function destroyRendererCrashLogger() {
  window.removeEventListener('error', handleErrorEvent)
  window.removeEventListener('unhandledrejection', handleUnhandledRejection)
}

// ─── React Error Boundary ─────────────────────────────────────────────────────
export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[CrashLogger] React Error Boundary:', error, errorInfo)
    const page = pageInfo()
    const stack = fmtStack(error?.stack)
    const cstack = errorInfo?.componentStack ? fmtStack(errorInfo.componentStack, 600) : null

    sendToMain({
      level: 'crash',
      title: '💥 React Component Crash — Error Boundary',
      fields: [
        {
          name: '❌ Error',
          value: `**${trunc(error?.name, 80)}:** ${trunc(error?.message, 400)}`,
          inline: false
        },
        {
          name: '🖥️ Halaman',
          value: `**Route:** \`${page.route}\`\n**Path:** \`${page.path}\``,
          inline: false
        },
        ...(stack
          ? [{ name: '📋 Error Stack', value: `\`\`\`\n${stack}\n\`\`\``, inline: false }]
          : []),
        ...(cstack
          ? [{ name: '🧩 Component Stack', value: `\`\`\`\n${cstack}\n\`\`\``, inline: false }]
          : [])
      ]
    })
  }

  render() {
    // eslint-disable-next-line react/prop-types
    if (!this.state.hasError) return this.props.children

    return (
      <div style={s.wrap}>
        <div style={s.card}>
          <div style={s.icon}>💥</div>
          <h2 style={s.title}>Terjadi Kesalahan</h2>
          <p style={s.sub}>
            Aplikasi mengalami error yang tidak terduga.
            <br />
            Tim kami sudah mendapat notifikasi otomatis.
          </p>
          <div style={s.box}>
            <code style={s.code}>{this.state.error?.message || 'Unknown error'}</code>
          </div>
          <button style={s.btn} onClick={() => window.location.reload()}>
            🔄&nbsp; Muat Ulang Aplikasi
          </button>
        </div>
      </div>
    )
  }
}

const s = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    background: '#0f0f0f',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '480px',
    width: '90%',
    textAlign: 'center'
  },
  icon: { fontSize: '44px', marginBottom: '16px' },
  title: { color: '#fff', fontSize: '20px', fontWeight: 600, margin: '0 0 8px' },
  sub: { color: '#888', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px' },
  box: {
    background: '#2a1a1a',
    border: '1px solid #4a2a2a',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '24px',
    textAlign: 'left'
  },
  code: { color: '#e74c3c', fontSize: '12px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' },
  btn: {
    background: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer'
  }
}
