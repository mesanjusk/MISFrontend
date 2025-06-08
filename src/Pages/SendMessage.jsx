import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SESSION_ID = 'user123'; // generate or get this per user/session dynamically

export default function WhatsAppClient() {
  const [status, setStatus] = useState('Connecting...');
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const socket = React.useMemo(() => io('https://whatsappbackapi-production.up.railway.app', {
    query: { sessionId: SESSION_ID },
    transports: ['websocket'],
  }), []);

  useEffect(() => {
    socket.on('connect', () => {
      setStatus('Connected to WhatsApp service');
    });

    socket.on('ready', () => {
      setStatus('✅ WhatsApp is ready');
    });

    socket.on('authenticated', () => {
      setStatus('🔐 Authenticated');
    });

    socket.on('auth_failure', () => {
      setStatus('❌ Authentication failed');
    });

    socket.on('disconnected', () => {
      setStatus('⚠️ Disconnected');
    });

    socket.on('message-sent', ({ success, error }) => {
      if (success) {
        setSendResult('✅ Message sent successfully!');
      } else {
        setSendResult(`❌ Error: ${error}`);
      }
      setSending(false);
    });

    socket.on('logged-out', () => {
      setStatus('🚪 Logged out');
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const sendMessage = () => {
    if (!number || !message) {
      alert('Please enter both number and message');
      return;
    }
    setSending(true);
    setSendResult(null);
    socket.emit('send-message', { number, message });
  };

  const logout = () => {
    socket.emit('logout');
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>WhatsApp Web.js Client</h2>

      <p>Status: <b>{status}</b></p>

      {status.includes('ready') && (
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

          <button
            onClick={logout}
            style={{
              marginTop: 10,
              padding: '8px 15px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              borderRadius: 4,
              float: 'right',
            }}
          >
            Logout
          </button>

          {sendResult && (
            <p style={{ marginTop: 15 }}>{sendResult}</p>
          )}
        </>
      )}
    </div>
  );
}
