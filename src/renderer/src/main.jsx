import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './store/providers'
import App from './App'
import { AppErrorBoundary, initRendererCrashLogger } from './store/rendererCrashLogger'

initRendererCrashLogger()
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <Providers>
        <App />
      </Providers>
    </AppErrorBoundary>
  </StrictMode>
)
