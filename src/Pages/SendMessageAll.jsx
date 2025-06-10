

// Redesigned WhatsApp Web-like UI using Tailwind CSS
// Includes: avatars, pinned chats placeholder, dark/light mode toggle (simple state-based), responsive design

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { io } from 'socket.io-client';
import axios from 'axios';
import normalizeWhatsAppNumber from '../utils/normalizeNumber';

export default function WhatsAppClient() {
  const navigate = useNavigate();
  const location = useLocation();
  const chatRef = useRef(null);

  const [darkMode, setDarkMode] = useState(false);
  const [status, setStatus] = useState('🕓 Checking WhatsApp status...');
  const [isReady, setIsReady] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [lastMessageMap, setLastMessageMap] = useState({});

  const socket = useMemo(() => io('https://misbackend-e078.onrender.com', {
    transports: ['websocket'],
  }), []);

  useEffect(() => {
    const user = location.state?.id || localStorage.getItem('User_name');
    if (!user) navigate("/");
  }, [location.state, navigate]);

  useEffect(() => {
    const handleReady = () => {
      setStatus('✅ WhatsApp is ready');
      setIsReady(true);
    };

    const handleMessage = (data) => {
      const normalized = normalizeWhatsAppNumber(selectedCustomer?.Mobile_number);
      if (data.number === normalized) {
        const newMsg = { from: 'them', text: data.message, time: new Date() };
        setMessages(prev => [...prev, newMsg]);
        setLastMessageMap(prev => ({
          ...prev,
          [selectedCustomer._id]: Date.now()
        }));
      }
    };

    socket.on('ready', handleReady);
    socket.on('message', handleMessage);

    fetch('https://misbackend-e078.onrender.com/whatsapp-status')
      .then(res => res.json())
      .then(data => {
        setStatus(data.status === 'connected' ? '✅ WhatsApp is ready' : '🕓 Waiting for QR');
        setIsReady(data.status === 'connected');
      })
      .catch(() => setStatus('❌ Failed to check status'));

    return () => {
      socket.off('ready', handleReady);
      socket.off('message', handleMessage);
      socket.disconnect();
    };
  }, [socket, selectedCustomer]);

  useEffect(() => {
    axios.get('/customer/GetCustomersList').then(res => {
      if (res.data.success) {
        setCustomers(res.data.result);
      }
    });
  }, []);

  const filteredCustomers = customers
    .filter(c =>
      c.Customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.Mobile_number?.toString().includes(search)
    )
    .sort((a, b) => {
      const t1 = lastMessageMap[b._id] || 0;
      const t2 = lastMessageMap[a._id] || 0;
      return t1 - t2;
    });

  const sendMessage = async () => {
    if (!selectedCustomer || !message || !isReady) return;

    const norm = normalizeWhatsAppNumber(selectedCustomer.Mobile_number);
    const personalized = message.replace(/{name}/gi, selectedCustomer.Customer_name);
    const msgObj = { from: 'me', text: personalized, time: new Date() };

    setSending(true);
    try {
      const res = await fetch('https://misbackend-e078.onrender.com/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: norm, message: personalized }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, msgObj]);
        setLastMessageMap(prev => ({
          ...prev,
          [selectedCustomer._id]: Date.now()
        }));
        setMessage('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-[#111b21]' : 'bg-gray-100'} transition-colors`}>
      {/* Sidebar */}
      <div className={`${darkMode ? 'bg-[#202c33]' : 'bg-white'} w-80 border-r flex flex-col`}>
        <div className="p-4 flex justify-between items-center border-b">
          <div className="text-lg font-bold text-green-600">WhatsApp</div>
          <button onClick={() => setDarkMode(!darkMode)} className="text-sm text-gray-500">{darkMode ? '🌞' : '🌙'}</button>
        </div>
        <div className="p-2">
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md text-sm"
            placeholder="Search or start new chat"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {filteredCustomers.map(c => (
            <div
              key={c._id}
              onClick={() => {
                setSelectedCustomer(c);
                axios.get(`/messages/${normalizeWhatsAppNumber(c.Mobile_number)}`).then(res => {
                  if (res.data.success) setMessages(res.data.messages);
                });
              }}
              className={`flex items-center p-3 hover:bg-gray-100 cursor-pointer ${selectedCustomer?._id === c._id ? 'bg-gray-200' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                {c.Customer_name[0]}
              </div>
              <div className="ml-3">
                <div className="font-semibold text-sm">{c.Customer_name}</div>
                <div className="text-xs text-gray-500">{c.Mobile_number}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        <div className={`${darkMode ? 'bg-[#202c33]' : 'bg-white'} p-4 border-b flex items-center justify-between`}>
          {selectedCustomer ? (
            <>
              <div>
                <div className="font-bold text-sm">{selectedCustomer.Customer_name}</div>
                <div className="text-xs text-gray-500">{selectedCustomer.Mobile_number}</div>
              </div>
              <div className="text-sm text-gray-400">{status}</div>
            </>
          ) : (
            <div className="text-gray-500">Select a chat</div>
          )}
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('/whatsapp-bg.png')] bg-cover">
          {selectedCustomer && messages.length ? messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-sm px-4 py-2 rounded-lg text-sm ${msg.from === 'me' ? 'bg-green-100 ml-auto' : 'bg-white'} shadow-sm`}
            >
              <div>{msg.text}</div>
              <div className="text-right text-xs text-gray-400 mt-1">
                {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )) : (
            <div className="text-center text-gray-400 mt-10">No messages yet</div>
          )}
        </div>

        {selectedCustomer && (
          <div className={`${darkMode ? 'bg-[#2a3942]' : 'bg-white'} p-3 flex items-center gap-2 border-t`}>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-full text-sm"
              placeholder="Type a message"
            />
            <button
              onClick={sendMessage}
              disabled={sending}
              className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 text-sm"
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
