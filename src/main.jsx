import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { toast } from './Components';
import { initOfflineQueue } from './utils/offlineQueue.js';
import './apiClient.js';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppThemeProvider } from './context/ThemeConfigContext.jsx';

const nativeAlert = window.alert.bind(window);

window.alert = (msg) => {
  if (typeof msg === 'string' && msg.trim()) {
    toast(msg);
    return;
  }
  nativeAlert(msg);
};

initOfflineQueue();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppThemeProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      console.warn('Service worker registration failed');
    });
  });
}
