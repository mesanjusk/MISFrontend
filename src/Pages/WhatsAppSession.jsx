import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const BASE_URL = 'https://misbackend-e078.onrender.com';
axios.defaults.baseURL = BASE_URL;

export default function WhatsAppSession() {
  const [status, setStatus] = useState('Checking session...');
  const [connected, setConnected] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    axios.get('/whatsapp-status')
      .then(res => {
        const isConnected = res.data.status === 'connected';
        setConnected(isConnected);
        setStatus(isConnected ? '✅ Connected' : '❌ Not connected');
      })
      .catch(() => {
        setStatus('❌ Failed to fetch status');
      });
  }, []);

  const startLogin = () => {
    const socket = io(BASE_URL);
    socket.on('qr', data => {
      setQrCode(data);
      setShowQR(true);
    });
    socket.on('ready', () => {
      setConnected(true);
      setStatus('✅ Connected');
      setShowQR(false);
      socket.disconnect();
    });
    socket.on('disconnect', () => socket.disconnect());
  };

  const logout = async () => {
    try {
      await axios.post('/whatsapp-logout');
      setConnected(false);
      setStatus('Logged out');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-bold mb-4">WhatsApp Session</h2>
      <p className="mb-6">{status}</p>
      {!connected && (
        <button onClick={startLogin} className="mb-4 bg-green-600 text-white px-4 py-2 rounded">
          Login with QR
        </button>
      )}
      {connected && (
        <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded">
          Logout
        </button>
      )}
      {showQR && qrCode && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow">
            <img src={qrCode} alt="QR Code" />
            <button onClick={() => setShowQR(false)} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
