import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('https://misbackend-e078.onrender.com');

export default function SendMessage() {
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [clientStatus, setClientStatus] = useState('Loading...');

  useEffect(() => {
    // Listen for WhatsApp client status updates
    socket.on('ready', () => {
      setClientStatus('WhatsApp Client is ready!');
    });

    socket.on('authenticated', () => {
      setClientStatus('WhatsApp authenticated!');
    });

    socket.on('auth_failure', (msg) => {
      setClientStatus(`Authentication failed: ${msg}`);
    });

    socket.on('disconnected', (reason) => {
      setClientStatus(`Disconnected: ${reason}`);
    });

    socket.on('qr', (qrData) => {
      // Show QR code image to user for scanning
      setStatus('Scan the QR code with WhatsApp');
    });

    return () => {
      socket.off('ready');
      socket.off('authenticated');
      socket.off('auth_failure');
      socket.off('disconnected');
      socket.off('qr');
    };
  }, []);

  const sendMessage = async () => {
    try {
      const res = await axios.post('https://misbackend-e078.onrender.com/send-message', {
        number,
        message,
      });
      setStatus(res.data.message || 'Message sent successfully');
    } catch (err) {
      console.error('Error sending message:', err.response ? err.response.data : err.message);
      setStatus('Error sending message');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-semibold">Send WhatsApp Message</h2>
      <input
        type="text"
        placeholder="Phone number (e.g., 919876543210)"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        className="w-full border p-2 rounded"
      />
      <textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full border p-2 rounded"
      />
      <button
        onClick={sendMessage}
        className="bg-green-500 text-white px-4 py-2 rounded"
        disabled={clientStatus !== 'WhatsApp Client is ready!'}
      >
        Send
      </button>
      <p className="text-sm text-gray-700">{clientStatus}</p>
      {status && <p className="text-sm text-gray-700">{status}</p>}
    </div>
  );
}
