// src/main.jsx (or src/index.jsx)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme } from './theme.js';
import './index.css';
import { toast } from './Components';
import { initOfflineQueue } from './utils/offlineQueue.js';
import './apiClient.js';

// ---------- Global alert -> toast ----------
window.alert = (msg) => toast(msg);

// ---------- Offline queue bootstrap ----------
initOfflineQueue();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);

// ---------- PWA service worker ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      console.warn('Service worker registration failed');
    });
  });
}
