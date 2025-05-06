import React, { useState } from 'react';
import axios from 'axios';

export default function SendMessage() {
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const sendMessage = async () => {
    try {
      const res = await axios.post('https://misbackend-e078.onrender.com/send-message', {
        number,
        message,
      });

      // Check if there's a message in the response
      setStatus(res.data.message || 'Message sent successfully');
    } catch (err) {
      console.error('Error sending message:', err.response ? err.response.data : err.message);
      
      // Show specific error messages based on error type
      if (err.response && err.response.data.error === 'WhatsApp client is not ready') {
        setStatus('WhatsApp client is not ready. Please try again later.');
      } else {
        setStatus('Error sending message. Please try again.');
      }
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
