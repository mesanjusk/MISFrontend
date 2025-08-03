import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import normalizeWhatsAppNumber from '../utils/normalizeNumber';

const BASE_URL = 'https://misbackend-e078.onrender.com';

const WhatsAppSession = () => {
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!number || !message) {
      toast.error("Please fill all fields");
      return;
    }

    setSending(true);
    try {
      const normalized = normalizeWhatsAppNumber(number);
      const res = await axios.post(`${BASE_URL}/whatsapp/send-test`, {
        number: normalized,
        message,
      });
      toast.success(`✅ Sent! ID: ${res.data.id}`);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-center">📲 Send WhatsApp Message</h2>

        <form onSubmit={handleSend} className="space-y-4">
          <input
            type="text"
            placeholder="Phone number (e.g., 91XXXXXXXXXX)"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            rows="4"
            placeholder="Enter your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={sending}
            className={`w-full py-2 rounded text-white ${
              sending ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default WhatsAppSession;
