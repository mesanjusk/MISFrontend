import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('https://misbackend-e078.onrender.com'); // Replace with your backend URL

export default function WhatsAppMessenger() {
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [clientStatus, setClientStatus] = useState('Waiting for WhatsApp...');
  const [qrCode, setQrCode] = useState(null);
  const [qrSessionId, setQrSessionId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    socket.on('qr', (data) => {
      setQrCode(data);
      setIsModalOpen(true);
      setClientStatus('Scan the QR code with your WhatsApp');
      setQrSessionId(data.sessionId); // Assuming the sessionId is sent with the QR data
    });

    socket.on('ready', () => {
      setClientStatus('WhatsApp Client is ready!');
      setQrCode(null);
      setIsModalOpen(false);
    });

    socket.on('authenticated', () => {
      setClientStatus('WhatsApp authenticated!');
    });

    socket.on('auth_failure', (msg) => {
      setError(`Auth Failed: ${msg}`);
      setClientStatus('Authentication failed');
    });

    socket.on('disconnected', (reason) => {
      setError(`Disconnected: ${reason}`);
      setClientStatus('Disconnected from WhatsApp');
    });

    return () => {
      socket.off('qr');
      socket.off('ready');
      socket.off('authenticated');
      socket.off('auth_failure');
      socket.off('disconnected');
    };
  }, []);

  const sendMessage = async () => {
    try {
      // Send the message and save it to MongoDB via backend
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

  const saveQrSession = async () => {
    try {
      // Save the QR session to MongoDB via backend
      const res = await axios.post('https://misbackend-e078.onrender.com/save-qr-session', {
        qrSessionId,
      });
      setStatus(res.data.message || 'QR session saved successfully');
    } catch (err) {
      console.error('Error saving QR session:', err.response ? err.response.data : err.message);
      setStatus('Error saving QR session');
    }
  };

  const closeModal = () => setIsModalOpen(false);
  const retryConnection = () => {
    setError(null);
    socket.connect();
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4 relative">
      <h2 className="text-xl font-semibold text-center">WhatsApp Messenger</h2>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded">
          <p>{error}</p>
          <button onClick={retryConnection} className="mt-2 bg-blue-600 text-white px-3 py-1 rounded">
            Retry
          </button>
        </div>
      )}

      {qrCode && isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-lg font-bold mb-3">Scan this QR Code</h2>
            <img src={qrCode} alt="WhatsApp QR Code" className="mb-4" />
            <button onClick={closeModal} className="bg-blue-500 text-white px-4 py-2 rounded">
              Close
            </button>
            <button onClick={saveQrSession} className="bg-green-500 text-white px-4 py-2 rounded mt-2">
              Save QR Session
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block mb-1">Phone Number</label>
        <input
          type="text"
          placeholder="e.g. 919876543210"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block mb-1">Message</label>
        <textarea
          placeholder="Your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <button
        onClick={sendMessage}
        className="bg-green-500 text-white px-4 py-2 rounded w-full"
        disabled={clientStatus !== 'WhatsApp Client is ready!'}
      >
        Send Message
      </button>

      <p className="text-sm text-gray-700 mt-2">Status: {clientStatus}</p>
      {status && <p className="text-sm text-blue-600">{status}</p>}
    </div>
  );
}
