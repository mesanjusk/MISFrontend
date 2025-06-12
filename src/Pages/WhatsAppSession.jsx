import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import QRCode from 'qrcode.react';

const socket = io('https://misbackend-e078.onrender.com'); // Updated to your backend URL

export default function WhatsAppClient() {
  const [sessions, setSessions] = useState({});
  const [selectedSession, setSelectedSession] = useState('default');
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState('Connecting...');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Connected to WhatsApp backend');
      setStatus('Connected. Waiting for QR...');
    });

    socket.on('qr', ({ sessionId, qr }) => {
      if (sessionId === selectedSession) {
        setQr(qr);
        setStatus('Scan the QR Code');
      }
    });

    socket.on('authenticated', (sessionId) => {
      if (sessionId === selectedSession) {
        setStatus('Authenticated. Please wait...');
        setQr(null);
      }
    });

    socket.on('ready', (sessionId) => {
      if (sessionId === selectedSession) {
        setStatus('✅ WhatsApp is Ready');
        setQr(null);
      }
    });

    socket.on('auth_failure', ({ sessionId, msg }) => {
      if (sessionId === selectedSession) {
        setStatus(`❌ Auth failed: ${msg}`);
      }
    });

    socket.on('message', ({ sessionId, number, message, time }) => {
      if (sessionId === selectedSession) {
        setMessages((prev) => [...prev, { number, message, time }]);
      }
    });

    return () => {
      socket.off('qr');
      socket.off('authenticated');
      socket.off('ready');
      socket.off('auth_failure');
      socket.off('message');
    };
  }, [selectedSession]);

  const handleSessionChange = (e) => {
    const sessionId = e.target.value;
    setSelectedSession(sessionId);
    setMessages([]);
    setStatus('Switching session...');
    setQr(null);
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-4">📱 WhatsApp Session Manager</h2>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Select Session</label>
        <select
          value={selectedSession}
          onChange={handleSessionChange}
          className="border border-gray-300 px-3 py-2 rounded w-full"
        >
          <option value="default">Default</option>
          <option value="admin">Admin</option>
          <option value="staff1">Staff 1</option>
        </select>
      </div>

      <div className="mb-4">
        <p className="text-gray-700">Status: <strong>{status}</strong></p>
      </div>

      {qr && (
        <div className="mb-4">
          <p className="text-sm text-gray-500">Scan this QR with WhatsApp Web:</p>
          <QRCode value={qr} size={256} />
        </div>
      )}

      {messages.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">📩 Incoming Messages:</h3>
          <div className="bg-gray-100 p-3 rounded h-64 overflow-y-auto text-sm">
            {messages.map((msg, idx) => (
              <div key={idx} className="mb-2">
                <strong>{msg.number}:</strong> {msg.message}
                <div className="text-gray-400 text-xs">{new Date(msg.time).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
