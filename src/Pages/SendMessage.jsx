import React, { useState, useEffect } from 'react';
import { io } from "socket.io-client";

const socket = io("https://whatsappbackapi-production.up.railway.app", {
  transports: ['websocket', 'polling'],
  withCredentials: true,
});

export default function WhatsAppClient() {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState('Connecting...');
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    socket.on('qr', (qrCode) => {
      setQr(qrCode);
      setStatus('Please scan the QR code');
    });

    socket.on('ready', () => {
      setQr(null);
      setStatus('✅ WhatsApp is ready');
    });

    socket.on('authenticated', () => {
      setStatus('🔒 Authenticated!');
    });

    socket.on('auth_failure', () => {
      setStatus('❌ Authentication failed, please restart the app.');
    });

    socket.on('disconnect', () => {
      setStatus('🔌 Disconnected');
      setQr(null);
    });

    socket.io.on('upgradeError', () => {
      setFallbackUsed(true);
      console.warn('⚠️ WebSocket upgrade failed. Using polling fallback.');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      socket.off('qr');
      socket.off('ready');
      socket.off('authenticated');
      socket.off('auth_failure');
      socket.off('disconnect');
      socket.io.off('upgradeError');
      socket.off('connect_error');
    };
  }, []);

  const qrCodeToDataURL = (qrString) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}`;
  };

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
      setSendResult('🌐 Network error: ' + err.message);
    }
    setSending(false);
  }

  return (
    <div style={{ maxWidth: 400, margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>WhatsApp Web.js Client</h2>

      <p>Status: <b>{status}</b></p>
      {fallbackUsed && (
        <p style={{ color: 'orange' }}>
          ⚠️ WebSocket not available, using polling fallback.
        </p>
      )}

      {qr && (
        <div>
          <p>Scan this QR code with your WhatsApp mobile app:</p>
          <img src={qrCodeToDataURL(qr)} alt="WhatsApp QR Code" style={{ width: 200, height: 200 }} />
        </div>
      )}

      {status === '✅ WhatsApp is ready' && (
        <>
          <div style={{ marginTop: 20 }}>
            <label>
              Phone number (with country code, e.g. 15551234567):<br />
              <input
                type="text"
                value={number}
                onChange={e => setNumber(e.target.value)}
                placeholder="Enter phone number"
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>
          </div>

          <div style={{ marginTop: 10 }}>
            <label>
              Message:<br />
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Enter your message"
                rows={4}
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
