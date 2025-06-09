import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import normalizeWhatsAppNumber from '../utils/normalizeNumber';

export default function WhatsAppClient() {
  const [status, setStatus] = useState('Connecting...');
  const [isReady, setIsReady] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [selectAll, setSelectAll] = useState(false);

  const socket = React.useMemo(() => io('https://misbackend-e078.onrender.com', {
    transports: ['websocket'],
  }), []);

  useEffect(() => {
    socket.on('connect', () => setStatus('Connected to WhatsApp service'));
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

    fetch('https://misbackend-e078.onrender.com/whatsapp-status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'connected') {
          setStatus('✅ WhatsApp is ready');
          setIsReady(true);
        } else {
          setStatus('🕓 Waiting for QR scan');
        }
      })
      .catch(() => setStatus('❌ Failed to fetch status'));

    return () => socket.disconnect();
  }, [socket]);

  useEffect(() => {
    axios.get('/customer/GetCustomersList')
      .then(res => {
        if (res.data.success) {
          setCustomers(res.data.result);
          setFilteredCustomers(res.data.result);
        }
      })
      .catch(err => console.error('Error loading customers:', err));
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    setFilteredCustomers(
      customers.filter(c =>
        c.Customer_name?.toLowerCase().includes(term) ||
        c.Mobile_number?.toString().includes(term)
      )
    );
  }, [search, customers]);

  const toggleSelectNumber = (mobile) => {
    const norm = normalizeWhatsAppNumber(mobile);
    setSelectedNumbers(prev =>
      prev.includes(norm) ? prev.filter(n => n !== norm) : [...prev, norm]
    );
  };

  const handleSelectAll = () => {
    if (!selectAll) {
      const all = filteredCustomers.map(c => normalizeWhatsAppNumber(c.Mobile_number));
      setSelectedNumbers(all);
    } else {
      setSelectedNumbers([]);
    }
    setSelectAll(!selectAll);
  };

  const generatePreview = () => {
    return filteredCustomers
      .filter(c => selectedNumbers.includes(normalizeWhatsAppNumber(c.Mobile_number)))
      .map(c => {
        const msg = message.replace(/\{name\}/gi, c.Customer_name || '');
        return `\u2022 ${c.Customer_name} (${c.Mobile_number}): ${msg}`;
      })
      .join('\n');
  };

  const sendMessage = async () => {
    if (!selectedNumbers.length || !message) {
      alert('Please select at least one customer and enter a message.');
      return;
    }

    if (!isReady) {
      alert('Please scan the QR code to authenticate WhatsApp.');
      return;
    }

    const personalizedMessages = filteredCustomers
      .filter(c => selectedNumbers.includes(normalizeWhatsAppNumber(c.Mobile_number)))
      .map(c => ({
        number: normalizeWhatsAppNumber(c.Mobile_number),
        message: message.replace(/\{name\}/gi, c.Customer_name || '')
      }));

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('https://misbackend-e078.onrender.com/send-bulk-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: personalizedMessages }),
      });

      const data = await res.json();
      if (data.success) {
        setSendResult('✅ Message sent to all selected contacts!');
        setSelectedNumbers([]);
        setSelectAll(false);
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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md font-sans">
      <h2 className="text-2xl font-semibold mb-2">WhatsApp Web.js Client</h2>
      <p className="mb-4 text-gray-600">Status: <b>{status}</b></p>

      {isReady && (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name or number"
            className="w-full p-2 mb-4 border border-gray-300 rounded-md"
          />

          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="mr-2"
            />
            <label>Select All</label>
          </div>

          <div className="max-h-64 overflow-y-auto border rounded-md mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Select</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Mobile</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => {
                  const norm = normalizeWhatsAppNumber(c.Mobile_number);
                  return (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedNumbers.includes(norm)}
                          onChange={() => toggleSelectNumber(c.Mobile_number)}
                        />
                      </td>
                      <td className="p-2">{c.Customer_name}</td>
                      <td className="p-2">{c.Mobile_number}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Type your message. Use {name} to personalize."
            className="w-full p-2 border border-gray-300 rounded-md"
          />

          <div className="mt-3 text-sm text-gray-600">
            <strong>Preview:</strong>
            <pre className="mt-1 bg-gray-100 p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">{generatePreview()}</pre>
          </div>

          <button
            onClick={sendMessage}
            disabled={sending}
            className={`mt-4 w-full py-2 font-bold rounded-md text-white ${sending ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {sending ? 'Sending...' : `Send to ${selectedNumbers.length} Contact(s)`}
          </button>

          {sendResult && (
            <p className="mt-3 text-center text-sm font-medium">{sendResult}</p>
          )}
        </>
      )}
    </div>
  );
}
