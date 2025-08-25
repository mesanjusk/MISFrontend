import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { io } from 'socket.io-client';
import axios from 'axios';
import normalizeWhatsAppNumber from '../utils/normalizeNumber';
import { apiBasePromise } from '../apiClient.js';

export default function WhatsAppClient() {
  const navigate = useNavigate();
  const location = useLocation();
  const chatRef = useRef(null);

  const [darkMode, setDarkMode] = useState(false);
  const [status, setStatus] = useState('🕓 Checking WhatsApp status...');
  const [isReady, setIsReady] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [contactList, setContactList] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [lastMessageMap, setLastMessageMap] = useState({});

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    apiBasePromise.then(base => {
      const s = io(base, { transports: ['websocket', 'polling'] });
      setSocket(s);
    });
  }, []);

  useEffect(() => {
    const user = location.state?.id || localStorage.getItem('User_name');
    if (!user) navigate("/");
  }, [location.state, navigate]);

  useEffect(() => {
    if (!socket) return;
    const handleReady = () => {
      setStatus('✅ WhatsApp is ready');
      setIsReady(true);
    };

    const handleIncomingMessage = async (data) => {
      const senderNumber = normalizeWhatsAppNumber(data.number || '');
      const currentNumber = selectedCustomer ? normalizeWhatsAppNumber(selectedCustomer.Mobile_number) : null;

      if (selectedCustomer && senderNumber === currentNumber) {
        setMessages(prev => [...prev, {
          from: 'them',
          text: data.message,
          time: new Date(data.time || Date.now())
        }]);
      }

      try {
        const res = await axios.get(`/customer/by-number/${senderNumber}`);
        if (res.data.success) {
          const customer = res.data.customer;

          setRecentChats(prev => {
            const exists = prev.find(c => c.Mobile_number === customer.Mobile_number);
            if (exists) {
              return [customer, ...prev.filter(c => c.Mobile_number !== customer.Mobile_number)];
            }
            return [customer, ...prev];
          });

          setLastMessageMap(prev => ({
            ...prev,
            [customer._id]: Date.now()
          }));
        }
      } catch (err) {
        console.error('Incoming message fetch failed:', err);
      }
    };

    socket.on('ready', handleReady);
    socket.on('message', handleIncomingMessage);

    axios.get('/whatsapp-status')
      .then(res => {
        const data = res.data;
        setStatus(data.status === 'connected' ? '✅ WhatsApp is ready' : '🕓 Waiting for QR');
        setIsReady(data.status === 'connected');
      })
      .catch(() => setStatus('❌ Failed to check status'));

    return () => {
      socket.off('ready', handleReady);
      socket.off('message', handleIncomingMessage);
      socket.disconnect();
    };
  }, [socket, selectedCustomer]);

  useEffect(() => {
    axios.get('/chatlist').then(res => {
      if (res.data.success) setRecentChats(res.data.list);
    });

    axios.get('/customer/GetCustomersList').then(res => {
      if (res.data.success) setContactList(res.data.result);
    });
  }, []);

  const openChat = async (customer) => {
    setSelectedCustomer(customer);
    setMessages([]);
    const number = normalizeWhatsAppNumber(customer.Mobile_number);
    const res = await axios.get(`/messages/${number}`);
    if (res.data.success) {
      setMessages(res.data.messages.map(m => ({
        from: m.from,
        text: m.text,
        time: new Date(m.time)
      })));
    }
  };

  const sendMessage = async () => {
    if (!selectedCustomer || !message || !isReady) return;
    const norm = normalizeWhatsAppNumber(selectedCustomer.Mobile_number);
    const personalized = message.replace(/{name}/gi, selectedCustomer.Customer_name || norm);
    const msgObj = { from: 'me', text: personalized, time: new Date() };

    setSending(true);
    try {
      const res = await axios.post('/send-message', { number: norm, message: personalized });
      if (res.data.success) {
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
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const filteredList = search
    ? contactList.filter(c =>
        c.Customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.Mobile_number?.includes(search)
      )
    : [...recentChats].sort(
        (a, b) => (lastMessageMap[b._id] || 0) - (lastMessageMap[a._id] || 0)
      );

  const handleSearchNumber = () => {
    if (search && !filteredList.find(c => c.Mobile_number === search)) {
      const normalized = normalizeWhatsAppNumber(search);
      const newCustomer = {
        _id: 'custom-number',
        Customer_name: `+${normalized}`,
        Mobile_number: normalized
      };
      setSelectedCustomer(newCustomer);
      setMessages([]);
    }
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-[#111b21]' : 'bg-gray-100'} transition-colors flex-col md:flex-row`}>
      {/* Sidebar */}
      <div className={`${darkMode ? 'bg-[#202c33]' : 'bg-white'} md:w-80 w-full md:border-r border-b md:border-b-0 flex flex-col`}>
        <div className="p-4 flex justify-between items-center border-b">
          <div className="text-lg font-bold text-blue-600">WhatsApp</div>
          <button onClick={() => setDarkMode(!darkMode)} className="text-sm text-gray-500">{darkMode ? '🌞' : '🌙'}</button>
        </div>
        <div className="p-2 flex gap-2">
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md text-sm"
            placeholder="Search chat or number"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            onClick={handleSearchNumber}
            className="px-2 text-sm bg-blue-600 text-white rounded"
          >
            Go
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {filteredList.map(c => (
            <div
              key={c._id}
              onClick={() => openChat(c)}
              className={`flex items-center p-3 hover:bg-gray-100 cursor-pointer ${selectedCustomer?._id === c._id ? 'bg-gray-200' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                {c.Customer_name?.[0] || '+'}
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
              className={`max-w-sm px-4 py-2 rounded-lg text-sm ${msg.from === 'me' ? 'bg-blue-100 ml-auto' : 'bg-white'} shadow-sm`}
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
              className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 text-sm"
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
