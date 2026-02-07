import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './store/providers'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>
)
