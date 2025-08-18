import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { lightTheme } from './theme.js'
import './index.css'
import { toast } from './Components'

window.alert = (msg) => toast(msg)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      console.warn('Service worker registration failed');
    });
  });
}
