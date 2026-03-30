import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from '../../Components';
import { parseApiError } from '../../utils/parseApiError';
import { isOutside24hWindow } from '../../utils/whatsappWindow';
import { whatsappCloudService } from '../../services/whatsappCloudService';
import ConversationList from './ConversationList';
import ChatHeader from './ChatHeader';
import ChatWindow from './ChatWindow';
import EmptyState from './EmptyState';
import LoadingSkeleton from './LoadingSkeleton';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE || window.location.origin;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dadcprflr';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'mern-images';

const getMessageText = (message) => message?.body || message?.text?.body || message?.text || message?.message || 'Unsupported message payload';
const getTimestampRaw = (message) => message?.timestamp ?? message?.createdAt ?? message?.time;
const getMessageIdentity = (message) => message?.id || message?._id || message?.messageId || message?.wamid || `${getTimestampRaw(message)}-${message?.from}-${message?.to}-${getMessageText(message)}`;
const normalizeIncomingMessage = (message) => message?.data || message?.message || message;
const getMessageDirection = (message) => {
  const direction = String(message?.direction ?? message?.type ?? '').toLowerCase();
  if (direction.includes('out')) return 'outgoing';
  if (direction.includes('in')) return 'incoming';
  if (message?.fromMe || message?.isOutbound) return 'outgoing';
  return 'incoming';
};
const getContactForMessage = (message) => (getMessageDirection(message) === 'outgoing' ? String(message?.to ?? message?.recipient ?? 'Unknown') : String(message?.from ?? message?.sender ?? 'Unknown'));

const normalizeMessages = (payload) => {
  const list = [payload, payload?.messages, payload?.items, payload?.data, payload?.data?.messages, payload?.data?.items].find(Array.isArray);
  return list ? list.filter(Boolean) : [];
};

const isUnreadMessage = (message) => {
  const status = String(message?.status ?? '').toLowerCase();
  return getMessageDirection(message) === 'incoming' && !['read', 'seen'].includes(status);
};

const getInitials = (value) => {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'NA';
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

export default function MessagesPanel() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [search, setSearch] = useState('');
  const [activeConversationId, setActiveConversationId] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);
  const messagesContainerRef = useRef(null);

  const appendMessage = useCallback((incomingMessage) => {
    const message = normalizeIncomingMessage(incomingMessage);
    if (!message) return;
    setMessages((prev) => {
      const nextId = getMessageIdentity(message);
      const exists = prev.some((item) => getMessageIdentity(item) === nextId);
      if (exists) return prev.map((item) => (getMessageIdentity(item) === nextId ? { ...item, ...message, isUploading: false } : item));
      return [...prev, message];
    });
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await whatsappCloudService.getMessages();
      const payload = response?.data?.data ?? response?.data ?? [];
      setMessages(normalizeMessages(payload));
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to load inbox messages.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!SOCKET_URL || typeof io !== 'function') return undefined;
    const socket = io(SOCKET_URL, { transports: ['polling'], reconnection: true, reconnectionAttempts: 5, reconnectionDelay: 2000 });
    socket.on('new_message', appendMessage);
    return () => socket.disconnect();
  }, [appendMessage]);

  useEffect(() => {
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const orderedMessages = useMemo(() => [...messages].sort((a, b) => new Date(getTimestampRaw(a) ?? 0) - new Date(getTimestampRaw(b) ?? 0)), [messages]);

  const conversations = useMemo(() => {
    const map = new Map();
    orderedMessages.forEach((message) => {
      const contact = getContactForMessage(message);
      const existing = map.get(contact) || { id: contact, contact, displayName: message?.profileName || message?.name || contact, lastMessage: '', lastTimestamp: null, lastUserMessageAt: null, unreadCount: 0 };
      const timestamp = getTimestampRaw(message);
      if (!existing.lastTimestamp || new Date(timestamp) >= new Date(existing.lastTimestamp)) {
        existing.lastTimestamp = timestamp;
        existing.lastMessage = getMessageText(message);
      }
      if (isUnreadMessage(message)) existing.unreadCount += 1;
      if (getMessageDirection(message) === 'incoming') {
        const currentTs = new Date(timestamp ?? 0).getTime();
        const previousTs = new Date(existing.lastUserMessageAt ?? 0).getTime();
        if (!existing.lastUserMessageAt || currentTs >= previousTs) existing.lastUserMessageAt = timestamp;
      }
      map.set(contact, existing);
    });
    return [...map.values()].sort((a, b) => new Date(b.lastTimestamp ?? 0) - new Date(a.lastTimestamp ?? 0));
  }, [orderedMessages]);

  const filteredConversations = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    if (!searchValue) return conversations;
    return conversations.filter((conversation) => `${conversation.displayName} ${conversation.contact}`.toLowerCase().includes(searchValue));
  }, [conversations, search]);

  useEffect(() => {
    if (!filteredConversations.length) {
      setActiveConversationId('');
      return;
    }
    if (!filteredConversations.some((item) => item.id === activeConversationId)) {
      setActiveConversationId(filteredConversations[0].id);
    }
  }, [filteredConversations, activeConversationId]);

  const activeConversation = useMemo(() => filteredConversations.find((item) => item.id === activeConversationId) || null, [filteredConversations, activeConversationId]);
  const activeMessages = useMemo(() => (!activeConversation?.contact ? [] : orderedMessages.filter((message) => getContactForMessage(message) === activeConversation.contact)), [orderedMessages, activeConversation]);
  const is24hExpired = useMemo(() => isOutside24hWindow(activeConversation?.lastUserMessageAt), [activeConversation?.lastUserMessageAt]);
  const conversationWindowOpen = !is24hExpired;

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [activeMessages]);

  const handleSend = useCallback(async (body) => {
    if (!activeConversation?.contact) return false;
    if (!conversationWindowOpen) {
      toast.error('24-hour session is closed. Use template messages only.');
      return false;
    }
    try {
      setIsSending(true);
      await whatsappCloudService.sendTextMessage({ to: activeConversation.contact, body });
      loadMessages();
      return true;
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to send message.'));
      return false;
    } finally {
      setIsSending(false);
    }
  }, [activeConversation, conversationWindowOpen, loadMessages]);

  const handleSendAttachment = useCallback(async ({ file, type, caption }) => {
    if (!activeConversation?.contact || !conversationWindowOpen) return false;
    const optimisticId = `optimistic-${Date.now()}-${file.name}`;
    try {
      setIsSending(true);
      setMessages((prev) => [...prev, { id: optimisticId, to: activeConversation.contact, fromMe: true, status: 'sending', messageType: type, body: caption || '', filename: file.name, timestamp: new Date().toISOString(), isUploading: true }]);
      const mediaUrl = await whatsappCloudService.uploadToCloudinary({ file, type, cloudName: CLOUDINARY_CLOUD_NAME, uploadPreset: CLOUDINARY_UPLOAD_PRESET });
      setMessages((prev) => prev.map((item) => (item.id === optimisticId ? { ...item, mediaUrl, isUploading: false } : item)));
      const isImageType = String(type || '').toLowerCase().includes('image');
      await whatsappCloudService.sendMediaMessage(isImageType ? { to: activeConversation.contact, type: 'image', image: { link: mediaUrl }, mediaUrl, filename: file.name, caption } : { to: activeConversation.contact, type, mediaUrl, filename: file.name, caption });
      loadMessages();
      return true;
    } catch (error) {
      setMessages((prev) => prev.filter((item) => item?.id !== optimisticId));
      toast.error(parseApiError(error, 'Failed to send attachment.'));
      return false;
    } finally {
      setIsSending(false);
    }
  }, [activeConversation, conversationWindowOpen, loadMessages]);

  const handleRetry = useCallback(async (message) => {
    try {
      setIsSending(true);
      await whatsappCloudService.sendTextMessage({ to: getContactForMessage(message), body: getMessageText(message) });
      loadMessages();
      return true;
    } catch {
      toast.error('Retry failed. Please try again.');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [loadMessages]);

  const rightPanel = activeConversation ? (
    <div className="hidden h-full min-h-0 flex-col bg-white p-5 xl:flex">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-xl font-semibold text-green-700">{getInitials(activeConversation.displayName || activeConversation.contact)}</div>
      <p className="mt-3 text-center text-sm font-semibold text-gray-900">{activeConversation.displayName}</p>
      <p className="text-center text-xs text-gray-500">{activeConversation.contact}</p>
      <div className="mt-6 space-y-3 text-sm text-gray-700">
        <p><span className="font-medium">Phone:</span> {activeConversation.contact}</p>
        <p><span className="font-medium">24h Window:</span> {conversationWindowOpen ? 'Active' : 'Expired'}</p>
      </div>
    </div>
  ) : null;

  const renderChatArea = () => {
    if (!activeConversation) {
      return <EmptyState title="Select a conversation" description="Choose a chat from the left panel to start messaging." />;
    }

    return (
      <div className="flex h-full min-h-0 flex-col">
        <ChatHeader
          conversation={activeConversation}
          isLoading={isLoading}
          onRefresh={loadMessages}
          windowOpen={conversationWindowOpen}
          onBack={() => setShowConversationList(true)}
        />
        <ChatWindow
          messages={activeMessages}
          getMessageIdentity={getMessageIdentity}
          getMessageDirection={getMessageDirection}
          getTimestampRaw={getTimestampRaw}
          scrollRef={messagesContainerRef}
          canSend={Boolean(activeConversation) && !isSending && conversationWindowOpen}
          canSendTemplateOnly={is24hExpired}
          recipient={activeConversation?.contact || ''}
          onSend={handleSend}
          onSendAttachment={handleSendAttachment}
          onRetry={handleRetry}
        />
      </div>
    );
  };

  if (isLoading && !messages.length) {
    return <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><LoadingSkeleton lines={8} /></section>;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="grid h-[calc(100vh-13rem)] min-h-[580px] grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_280px]">
        <aside className={`${showConversationList ? 'block' : 'hidden'} border-r border-gray-200 lg:block`}>
          <ConversationList
            conversations={filteredConversations}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => {
              setActiveConversationId(id);
              setShowConversationList(false);
            }}
            search={search}
            onSearch={setSearch}
          />
        </aside>

        <main className={`${showConversationList ? 'hidden' : 'block'} min-h-0 lg:block`}>{renderChatArea()}</main>
        {rightPanel}
      </div>
    </section>
  );
}
