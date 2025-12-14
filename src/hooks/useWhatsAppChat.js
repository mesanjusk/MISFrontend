import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import normalizeWhatsAppNumber from '../utils/normalizeNumber.js';
import { apiBasePromise } from '../apiClient.js';
import {
  fetchChatList,
  fetchCustomerByNumber,
  fetchCustomers,
  fetchMessagesByNumber,
  fetchWhatsAppStatus,
  sendWhatsAppMessage,
} from '../services/whatsappService.js';

const buildMessageObject = (message) => ({
  from: message.from,
  text: message.text,
  time: new Date(message.time),
});

export const useWhatsAppChat = () => {
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
  const selectedCustomerRef = useRef(null);

  useEffect(() => {
    apiBasePromise.then((base) => {
      const socketInstance = io(base, { transports: ['websocket', 'polling'] });
      setSocket(socketInstance);
    });
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleReady = () => {
      setStatus('✅ WhatsApp is ready');
      setIsReady(true);
    };

    const handleIncomingMessage = async (data) => {
      const senderNumber = normalizeWhatsAppNumber(data.number || '');
      const currentCustomer = selectedCustomerRef.current;
      const currentNumber = currentCustomer
        ? normalizeWhatsAppNumber(currentCustomer.Mobile_number)
        : null;

      if (currentCustomer && senderNumber === currentNumber) {
        setMessages((prev) => [
          ...prev,
          {
            from: 'them',
            text: data.message,
            time: new Date(data.time || Date.now()),
          },
        ]);
      }

      try {
        const res = await fetchCustomerByNumber(senderNumber);
        if (res.data.success) {
          const customer = res.data.customer;
          setRecentChats((prev) => {
            const exists = prev.find((c) => c.Mobile_number === customer.Mobile_number);
            if (exists) {
              return [customer, ...prev.filter((c) => c.Mobile_number !== customer.Mobile_number)];
            }
            return [customer, ...prev];
          });

          setLastMessageMap((prev) => ({
            ...prev,
            [customer._id]: Date.now(),
          }));
        }
      } catch (err) {
        console.error('Incoming message fetch failed:', err);
      }
    };

    socket.on('ready', handleReady);
    socket.on('message', handleIncomingMessage);

    fetchWhatsAppStatus()
      .then((res) => {
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
  }, [socket]);

  useEffect(() => {
    fetchChatList().then((res) => {
      if (res.data.success) setRecentChats(res.data.list);
    });

    fetchCustomers().then((res) => {
      if (res.data.success) setContactList(res.data.result);
    });
  }, []);

  useEffect(() => {
    selectedCustomerRef.current = selectedCustomer;
  }, [selectedCustomer]);

  const openChat = async (customer) => {
    setSelectedCustomer(customer);
    selectedCustomerRef.current = customer;
    setMessages([]);
    const number = normalizeWhatsAppNumber(customer.Mobile_number);
    const res = await fetchMessagesByNumber(number);
    if (res.data.success) {
      setMessages(res.data.messages.map((msg) => buildMessageObject(msg)));
    }
  };

  const sendMessage = async () => {
    const currentCustomer = selectedCustomerRef.current;
    if (!currentCustomer || !message || !isReady) return;
    const norm = normalizeWhatsAppNumber(currentCustomer.Mobile_number);
    const personalized = message.replace(/\{name\}/gi, currentCustomer.Customer_name || norm);
    const msgObj = { from: 'me', text: personalized, time: new Date() };

    setSending(true);
    try {
      const res = await sendWhatsAppMessage({ number: norm, message: personalized });
      if (res.data.success) {
        setMessages((prev) => [...prev, msgObj]);
        setLastMessageMap((prev) => ({
          ...prev,
          [currentCustomer._id]: Date.now(),
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

  const filteredList = useMemo(() => {
    if (search) {
      return contactList.filter(
        (c) =>
          c.Customer_name?.toLowerCase().includes(search.toLowerCase()) ||
          c.Mobile_number?.includes(search),
      );
    }

    return [...recentChats].sort((a, b) => (lastMessageMap[b._id] || 0) - (lastMessageMap[a._id] || 0));
  }, [contactList, lastMessageMap, recentChats, search]);

  const handleSearchNumber = () => {
    if (search && !filteredList.find((c) => c.Mobile_number === search)) {
      const normalized = normalizeWhatsAppNumber(search);
      const newCustomer = {
        _id: 'custom-number',
        Customer_name: `+${normalized}`,
        Mobile_number: normalized,
      };
      setSelectedCustomer(newCustomer);
      selectedCustomerRef.current = newCustomer;
      setMessages([]);
    }
  };

  return {
    chatRef,
    darkMode,
    filteredList,
    handleSearchNumber,
    isReady,
    lastMessageMap,
    message,
    messages,
    openChat,
    search,
    selectedCustomer,
    sendMessage,
    sending,
    setDarkMode,
    setMessage,
    setSearch,
    status,
  };
};

export default useWhatsAppChat;
