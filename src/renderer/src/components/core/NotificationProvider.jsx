import { createContext, useContext, useState } from 'react'
import { Snackbar, Alert } from '@mui/material'

// type Severity = 'success' | 'info' | 'warning' | 'error'

const NotificationContext = createContext({
  show: (opts) => {
    console.log(opts)
  }
})

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifier = () => useContext(NotificationContext)

// eslint-disable-next-line react/prop-types
export const NotificationProvider = ({ children }) => {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState({
    message: '',
    severity: 'info',
    duration: 4000
  })

  const show = (opts) => {
    setOptions((prev) => ({ ...prev, ...opts }))
    setOpen(true)
  }

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return
    setOpen(false)
  }

  return (
    <NotificationContext.Provider value={{ show }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={options.duration ?? 4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity={options.severity ?? 'info'} sx={{ width: '100%' }}>
          <div style={{ fontWeight: 700 }}>{options.message}</div>
          {options.description && (
            <div style={{ fontSize: 13, opacity: 0.9 }}>{options.description}</div>
          )}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  )
}

export default NotificationProvider
