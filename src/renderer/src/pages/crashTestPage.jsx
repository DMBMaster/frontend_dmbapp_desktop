/**
 * CrashTestPage.jsx
 * Halaman khusus testing crash logger
 * Taruh di: src/renderer/src/pages/CrashTestPage.jsx
 *
 * Akses via route: /crash-test
 * (tambahkan ke appRoutes dengan protected: false supaya bisa diakses tanpa login)
 */

import { useState } from 'react'

// ── Komponen yang sengaja crash saat dirender ─────────────────────────────────
const BombComponent = () => {
  throw new Error('💣 Ini error dari React component — sengaja dilempar untuk test Error Boundary!')
}

// ── Komponen utama ────────────────────────────────────────────────────────────
export const CrashTestPage = () => {
  const [renderBomb, setRenderBomb] = useState(false)
  const [, setLastTriggered] = useState(null)
  const [log, setLog] = useState([])

  const addLog = (msg) =>
    setLog((prev) => [`[${new Date().toLocaleTimeString('id-ID')}] ${msg}`, ...prev.slice(0, 9)])

  // ── 1. React component crash → Error Boundary ─────────────────────────────
  const triggerReactCrash = () => {
    addLog('Memicu React component crash...')
    setLastTriggered('react')
    setRenderBomb(true)
  }

  // ── 2. window.onerror — uncaught JS error ─────────────────────────────────
  const triggerWindowError = () => {
    addLog('Memicu window.onerror...')
    setLastTriggered('window')
    setTimeout(() => {
      throw new Error('🔴 Test window.onerror — uncaught JS error dari CrashTestPage')
    }, 0)
  }

  // ── 3. Unhandled Promise rejection ────────────────────────────────────────
  const triggerPromiseRejection = () => {
    addLog('Memicu unhandledrejection...')
    setLastTriggered('promise')
    // Sengaja tidak pakai .catch()
    Promise.reject(
      new Error('🔴 Test unhandledrejection — Promise tanpa .catch() dari CrashTestPage')
    )
  }

  // ── 4. Manual Discord log (tanpa crash) ───────────────────────────────────
  const triggerManualLog = () => {
    addLog('Mengirim manual log ke Discord...')
    setLastTriggered('manual')
    try {
      window.electron?.ipcRenderer?.send('discord:log', {
        level: 'warn',
        title: '🟠 Manual Test Log — CrashTestPage',
        fields: [
          {
            name: '📋 Info',
            value: 'Ini adalah manual log test, bukan crash sebenarnya.',
            inline: false
          },
          {
            name: '🖥️ Halaman',
            value: `**Route:** \`crash-test\`\n**Waktu:** \`${new Date().toISOString()}\``,
            inline: false
          }
        ]
      })
      addLog('✅ Manual log terkirim via IPC')
    } catch (err) {
      addLog(`❌ IPC gagal: ${err.message}`)
    }
  }

  if (renderBomb) return <BombComponent />

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>🧪 Crash Logger — Test Panel</h1>
        <p style={s.subtitle}>
          Halaman ini untuk menguji apakah setiap jenis crash terkirim ke Discord.
          <br />
          Buka Discord kamu dan lihat notifikasi masuk setelah menekan tombol.
        </p>
      </div>

      <div style={s.grid}>
        {/* Card 1 — React Error Boundary */}
        <div style={s.card}>
          <div style={{ ...s.badge, background: '#e74c3c22', color: '#e74c3c' }}>
            Error Boundary
          </div>
          <h3 style={s.cardTitle}>React Component Crash</h3>
          <p style={s.cardDesc}>
            Me-render komponen yang langsung <code style={s.code}>throw new Error()</code>. Akan
            ditangkap oleh <code style={s.code}>AppErrorBoundary</code> dan dikirim ke Discord.
          </p>
          <div style={s.pill}>
            📨 Dikirim via: <strong>IPC → main → Discord</strong>
          </div>
          <button style={{ ...s.btn, background: '#e74c3c' }} onClick={triggerReactCrash}>
            💣 Trigger React Crash
          </button>
          <p style={s.note}>⚠️ Halaman akan ganti ke UI error. Reload untuk kembali.</p>
        </div>

        {/* Card 2 — window.onerror */}
        <div style={s.card}>
          <div style={{ ...s.badge, background: '#e67e2222', color: '#e67e22' }}>
            window.onerror
          </div>
          <h3 style={s.cardTitle}>Uncaught JS Error</h3>
          <p style={s.cardDesc}>
            Melempar error di luar React tree via <code style={s.code}>setTimeout()</code>, sehingga
            tidak tertangkap Error Boundary — jatuh ke <code style={s.code}>window.onerror</code>.
          </p>
          <div style={s.pill}>
            📨 Dikirim via: <strong>IPC → main → Discord</strong>
          </div>
          <button style={{ ...s.btn, background: '#e67e22' }} onClick={triggerWindowError}>
            🔴 Trigger Window Error
          </button>
          <p style={s.note}>ℹ️ Halaman tidak reload, cek console + Discord.</p>
        </div>

        {/* Card 3 — unhandledrejection */}
        <div style={s.card}>
          <div style={{ ...s.badge, background: '#9b59b622', color: '#9b59b6' }}>
            unhandledrejection
          </div>
          <h3 style={s.cardTitle}>Unhandled Promise Rejection</h3>
          <p style={s.cardDesc}>
            Membuat Promise yang di-<code style={s.code}>reject()</code> tanpa
            <code style={s.code}>.catch()</code> — ditangkap oleh
            <code style={s.code}>window.onunhandledrejection</code>.
          </p>
          <div style={s.pill}>
            📨 Dikirim via: <strong>IPC → main → Discord</strong>
          </div>
          <button style={{ ...s.btn, background: '#9b59b6' }} onClick={triggerPromiseRejection}>
            🟣 Trigger Promise Rejection
          </button>
          <p style={s.note}>ℹ️ Halaman tidak reload, cek console + Discord.</p>
        </div>

        {/* Card 4 — Manual log */}
        <div style={s.card}>
          <div style={{ ...s.badge, background: '#3498db22', color: '#3498db' }}>Manual Log</div>
          <h3 style={s.cardTitle}>Kirim Log Manual</h3>
          <p style={s.cardDesc}>
            Mengirim log langsung ke Discord via IPC tanpa ada crash. Berguna untuk verifikasi bahwa
            jalur IPC
            <code style={s.code}>discord:log</code> berfungsi.
          </p>
          <div style={s.pill}>
            📨 Dikirim via: <strong>IPC → main → Discord</strong>
          </div>
          <button style={{ ...s.btn, background: '#3498db' }} onClick={triggerManualLog}>
            🔵 Kirim Manual Log
          </button>
          <p style={s.note}>✅ Aman — tidak ada crash, cek Discord.</p>
        </div>
      </div>

      {/* Log output */}
      {log.length > 0 && (
        <div style={s.logBox}>
          <p style={s.logTitle}>📋 Activity log</p>
          {log.map((entry, i) => (
            <div key={i} style={s.logEntry}>
              {entry}
            </div>
          ))}
        </div>
      )}

      <p style={s.footer}>
        File ini hanya untuk development/testing. Hapus atau sembunyikan route ini sebelum release
        ke production.
      </p>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    padding: '32px',
    maxWidth: '960px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  header: { marginBottom: '32px' },
  title: {
    fontSize: '22px',
    fontWeight: 600,
    margin: '0 0 8px',
    color: 'var(--color-text-primary, #fff)'
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-text-secondary, #888)',
    lineHeight: '1.6',
    margin: 0
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  card: {
    background: 'var(--color-background-secondary, #1a1a1a)',
    border: '1px solid var(--color-border-tertiary, #2a2a2a)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  badge: {
    display: 'inline-block',
    alignSelf: 'flex-start',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.5px'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
    color: 'var(--color-text-primary, #fff)'
  },
  cardDesc: {
    fontSize: '13px',
    color: 'var(--color-text-secondary, #888)',
    lineHeight: '1.6',
    margin: 0
  },
  code: {
    background: 'var(--color-background-tertiary, #111)',
    padding: '1px 5px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace'
  },
  pill: {
    fontSize: '12px',
    color: 'var(--color-text-tertiary, #666)',
    background: 'var(--color-background-tertiary, #111)',
    padding: '6px 10px',
    borderRadius: '6px'
  },
  btn: {
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: 'auto'
  },
  note: { fontSize: '12px', color: 'var(--color-text-tertiary, #555)', margin: 0 },
  logBox: {
    background: 'var(--color-background-secondary, #111)',
    border: '1px solid var(--color-border-tertiary, #2a2a2a)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px'
  },
  logTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-text-secondary, #888)',
    margin: '0 0 8px'
  },
  logEntry: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: 'var(--color-text-primary, #ccc)',
    padding: '3px 0',
    borderBottom: '1px solid var(--color-border-tertiary, #222)'
  },
  footer: {
    fontSize: '12px',
    color: 'var(--color-text-tertiary, #555)',
    textAlign: 'center',
    marginTop: '8px'
  }
}
