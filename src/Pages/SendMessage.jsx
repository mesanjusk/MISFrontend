import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function WhatsAppClient() {
  const [status, setStatus] = useState('Connecting...');
  const [isReady, setIsReady] = useState(false);
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const socket = React.useMemo(() => io('https://misbackend-e078.onrender.com', {
    transports: ['websocket'],
  }), []);

  useEffect(() => {
    socket.on('connect', () => {
      setStatus('Connected to WhatsApp service');
    });

    socket.on('authenticated', () => {
      setStatus('🔐 WhatsApp authenticated');
      setIsReady(true);
    });

    socket.on('ready', () => {
      setStatus('✅ WhatsApp is ready');
      setIsReady(true);
    });

    socket.on('auth_failure', () => {
      setStatus('❌ Authentication failed');
      setIsReady(false);
    });

    socket.on('disconnected', () => {
      setStatus('⚠️ Disconnected');
      setIsReady(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const sendMessage = async () => {
    if (!number || !message) {
      alert('Please enter both number and message');
      return;
    }

    if (!isReady) {
      alert('Please scan the QR code first from backend to authenticate WhatsApp.');
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('https://misbackend-e078.onrender.com/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, message }),
      });

      const data = await res.json();
      if (data.success) {
        setSendResult('✅ Message sent successfully!');
      } else {
        setSendResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setSendResult(`❌ Network error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>WhatsApp Web.js Client</h2>
      <p>Status: <b>{status}</b></p>

      {isReady && (
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
