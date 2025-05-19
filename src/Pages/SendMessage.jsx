import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://whatsappbackapi-production.up.railway.app', {
  transports: ['websocket'], // no polling to avoid timeout
});

export default function WhatsAppClient() {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState('Connecting...');
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    // DEBUG logs
    socket.on('connect', () => {
      console.log('✅ Connected:', socket.id);
      setStatus('Connected, waiting for QR...');
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Connection error:', err.message);
      setStatus('Connection error. Retrying...');
    });

    socket.on('qr', (qrCode) => {
      console.log('📸 QR received');
      setQr(qrCode);
      setStatus('Please scan the QR code');
    });

    socket.on('ready', () => {
      console.log('✅ WhatsApp ready');
      setQr(null);
      setStatus('WhatsApp is ready');
    });

    socket.on('authenticated', () => {
      console.log('🔐 Authenticated');
      setStatus('Authenticated!');
    });

    socket.on('auth_failure', () => {
      console.log('❌ Auth failure');
      setStatus('Authentication failed, please restart.');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected');
      setStatus('Disconnected');
      setQr(null);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('qr');
      socket.off('ready');
      socket.off('authenticated');
      socket.off('auth_failure');
      socket.off('disconnect');
    };
  }, []);

  const qrCodeToDataURL = (qrString) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}`;

  async function sendMessage() {
    if (!number || !message) {
      alert('Please enter both number and message');
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('https://whatsappbackapi-production.up.railway.app/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, message }),
      });
      const data = await res.json();

      if (res.ok) {
        setSendResult('✅ Message sent successfully!');
      } else {
        setSendResult('❌ Error: ' + (data.error || 'Failed to send message'));
      }
    } catch (err) {
      setSendResult('❌ Network error: ' + err.message);
    }

    setSending(false);
  }

  return (
    <div style={{ maxWidth: 400, margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>WhatsApp Web.js Client</h2>

      <p>Status: <b>{status}</b></p>

      {qr && (
        <div>
          <p>Scan this QR code with your WhatsApp:</p>
          <img src={qrCodeToDataURL(qr)} alt="QR Code" style={{ width: 200, height: 200 }} />
        </div>
      )}

      {status === 'WhatsApp is ready' && (
        <>
          <div style={{ marginTop: 20 }}>
            <label>
              Phone number (with country code):<br />
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="e.g. 919876543210"
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>
          </div>

          <div style={{ marginTop: 10 }}>
            <label>
              Message:<br />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Type your message"
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>
          </div>

          <button
            onClick={sendMessage}
            disabled={sending}
            style={{
              marginTop: 15,
              padding: '10px 20px',
              backgroundColor: sending ? '#999' : '#25D366',
              color: 'white',
              border: 'none',
              cursor: sending ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              borderRadius: 4,
            }}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>

          {sendResult && (
            <p style={{ marginTop: 15 }}>{sendResult}</p>
          )}
        </>
      )}
    </div>
  );
}
