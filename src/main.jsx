// src/main.jsx (or src/index.jsx)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme } from './theme.js';
import './index.css';
import { toast } from './Components';
import { initOfflineQueue } from './utils/offlineQueue.js';
import axios from 'axios';

// ---------- Global alert -> toast ----------
window.alert = (msg) => toast(msg);

// ---------- Offline queue bootstrap ----------
initOfflineQueue();

// ---------- Axios global config ----------
// Prefer env override, else default to '/api' (works with Vite proxy and prod reverse proxy)
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
// If you rely on httpOnly cookie auth, keep credentials
// axios.defaults.withCredentials = true;

// Attach bearer token automatically if stored
const tokenKeys = ['token', 'authToken', 'access_token', 'ACCESS_TOKEN'];
const getToken = () => tokenKeys.map((k) => localStorage.getItem(k)).find(Boolean);

axios.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Optional: centralized 401 handling
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      toast('Login expired. Please sign in again.');
      // e.g., redirect if you have a router:
      // window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

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
