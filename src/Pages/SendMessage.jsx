// SendMessage.js
import React, { useState } from 'react';
import axios from 'axios';

export default function SendMessage() {
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const sendMessage = async () => {
    try {
      const res = await axios.post('https://whatsappbackapi.onrender.com/send-message', {
        number,
        message,
      });
      setStatus(res.data.message);
    } catch (err) {
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
      >
        Send
      </button>
      {status && <p className="text-sm text-gray-700">{status}</p>}
    </div>
  );
}
