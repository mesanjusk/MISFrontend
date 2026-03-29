import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from '../../Components';
import { parseApiError } from '../../utils/parseApiError';
import { whatsappCloudService } from '../../services/whatsappCloudService';
import WhatsAppLayout from './WhatsAppLayout';
import ConversationList from './ConversationList';
import ChatHeader from './ChatHeader';
import ChatWindow from './ChatWindow';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE ||
  window.location.origin;

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dadcprflr';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'mern-images';

const getMessageText = (message) => {
  if (typeof message?.body === 'string' && message.body.trim()) return message.body;
  if (typeof message?.text === 'string' && message.text.trim()) return message.text;
  if (typeof message?.text?.body === 'string' && message.text.body.trim()) return message.text.body;
  if (typeof message?.message === 'string' && message.message.trim()) return message.message;
  if (message?.messageType && message.messageType !== 'text') return `[${message.messageType}]`;
  return 'Unsupported message payload';
};

const getMessageType = (message) => {
  const rawType = String(message?.messageType || message?.payloadType || message?.contentType || message?.type || 'text').toLowerCase();

  if (['image', 'video', 'document', 'audio', 'sticker', 'text'].includes(rawType)) return rawType;
  if (rawType.includes('image')) return 'image';
  if (rawType.includes('video')) return 'video';
  if (rawType.includes('document') || rawType.includes('file')) return 'document';
  if (rawType.includes('audio')) return 'audio';
  if (rawType.includes('sticker')) return 'sticker';

  return 'text';
};

const getMessageDirection = (message) => {
  const direction = String(
    message?.direction ?? message?.type ?? message?.messageType ?? '',
  ).toLowerCase();

  if (direction.includes('out')) return 'outgoing';
  if (direction.includes('in')) return 'incoming';

  if (message?.fromMe || message?.isOutbound) return 'outgoing';
  return 'incoming';
};

const getTimestampRaw = (message) => message?.timestamp ?? message?.createdAt ?? message?.time;

const normalizeMessages = (payload) => {
  const candidateLists = [
    payload,
    payload?.messages,
    payload?.items,
    payload?.data,
    payload?.data?.messages,
    payload?.data?.items,
  ];

  const matchedList = candidateLists.find(Array.isArray);
  return matchedList ? matchedList.filter(Boolean) : [];
};

const normalizeIncomingMessage = (message) => {
  if (!message || typeof message !== 'object') return null;

  if (message?.data && typeof message.data === 'object' && !Array.isArray(message.data)) {
    return message.data;
  }

  if (message?.message && typeof message.message === 'object' && !Array.isArray(message.message)) {
    return message.message;
  }

  return message;
};

const getMessageIdentity = (message) => (
  message?.id
  ?? message?._id
  ?? message?.messageId
  ?? message?.wamid
  ?? [
    getTimestampRaw(message) ?? 'no-time',
    message?.from ?? message?.sender ?? 'unknown-from',
    message?.to ?? message?.recipient ?? 'unknown-to',
    getMessageText(message),
  ].join('-')
);

const getContactForMessage = (message) => {
  const direction = getMessageDirection(message);
  return direction === 'outgoing'
    ? String(message?.to ?? message?.recipient ?? 'Unknown')
    : String(message?.from ?? message?.sender ?? 'Unknown');
};

const isUnreadMessage = (message) => {
  const status = String(message?.status ?? '').toLowerCase();
  return getMessageDirection(message) === 'incoming' && !['read', 'seen'].includes(status);
};

const getInitials = (value) => {
  const source = String(value || '').trim();
  if (!source) return 'NA';

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
};

const isWindowOpen = (conversation) => {
  if (typeof conversation?.windowOpen === 'boolean') return conversation.windowOpen;
  if (typeof conversation?.isWindowOpen === 'boolean') return conversation.isWindowOpen;
  if (!conversation?.lastTimestamp) return false;
  const lastTs = new Date(conversation.lastTimestamp).getTime();
  if (Number.isNaN(lastTs)) return false;

  return Date.now() - lastTs <= 24 * 60 * 60 * 1000;
};

export default function MessagesPanel() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [search, setSearch] = useState('');
  const [activeConversationId, setActiveConversationId] = useState('');
  const messagesContainerRef = useRef(null);

  const appendMessage = useCallback((incomingMessage) => {
    const message = normalizeIncomingMessage(incomingMessage);
    if (!message) return;

    setMessages((prev) => {
      const nextId = getMessageIdentity(message);
      const exists = prev.some((item) => getMessageIdentity(item) === nextId);

      if (exists) {
        return prev.map((item) =>
          getMessageIdentity(item) === nextId ? { ...item, ...message, isUploading: false } : item
        );
      }

      return [...prev, message];
    });
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await whatsappCloudService.getMessages();

      const payload =
        response?.data?.data ??
        response?.data ??
        [];

      setMessages(normalizeMessages(payload));
    } catch (error) {
      console.error(error);
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

    const socket = io(SOCKET_URL, {
      transports: ['polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

    socket.on('new_message', (msg) => {
      appendMessage(msg);
    });

    return () => {
      socket.disconnect();
    };
  }, [appendMessage]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadMessages]);

  const orderedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(getTimestampRaw(a) ?? 0) -
          new Date(getTimestampRaw(b) ?? 0)
      ),
    [messages],
  );

  const conversations = useMemo(() => {
    const map = new Map();

    orderedMessages.forEach((message) => {
      const contact = getContactForMessage(message);
      const existing = map.get(contact) || {
        id: contact,
        contact,
        displayName: message?.profileName || message?.name || contact,
        lastMessage: '',
        lastMessageType: 'text',
        lastTimestamp: null,
        unreadCount: 0,
      };

      const timestamp = getTimestampRaw(message);
      if (!existing.lastTimestamp || new Date(timestamp) >= new Date(existing.lastTimestamp)) {
        existing.lastTimestamp = timestamp;
        existing.lastMessage = getMessageText(message);
        existing.lastMessageType = getMessageType(message);
      }

      if (isUnreadMessage(message)) {
        existing.unreadCount += 1;
      }

      if (!existing.displayName || existing.displayName === existing.contact) {
        existing.displayName = message?.profileName || message?.name || contact;
      }

      map.set(contact, existing);
    });

    return [...map.values()].sort(
      (a, b) => new Date(b.lastTimestamp ?? 0) - new Date(a.lastTimestamp ?? 0),
    );
  }, [orderedMessages]);

  const filteredConversations = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    if (!searchValue) return conversations;

    return conversations.filter((conversation) =>
      `${conversation.displayName} ${conversation.contact}`.toLowerCase().includes(searchValue)
    );
  }, [conversations, search]);

  useEffect(() => {
    if (!filteredConversations.length) {
      setActiveConversationId('');
      return;
    }

    const exists = filteredConversations.some((item) => item.id === activeConversationId);
    if (!exists) {
      setActiveConversationId(filteredConversations[0].id);
    }
  }, [filteredConversations, activeConversationId]);

  const activeConversation = useMemo(
    () => filteredConversations.find((item) => item.id === activeConversationId) || null,
    [filteredConversations, activeConversationId],
  );

  const activeMessages = useMemo(() => {
    if (!activeConversation?.contact) return [];

    return orderedMessages.filter((message) => getContactForMessage(message) === activeConversation.contact);
  }, [orderedMessages, activeConversation]);

  const conversationWindowOpen = useMemo(() => isWindowOpen(activeConversation), [activeConversation]);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [activeMessages]);

  const handleSend = useCallback(async (body) => {
    if (!activeConversation?.contact) {
      toast.error('Please select a conversation first.');
      return false;
    }

    if (!conversationWindowOpen) {
      toast.error('24-hour session is closed. Use template messages only.');
      return false;
    }

    try {
      setIsSending(true);
      await whatsappCloudService.sendTextMessage({
        to: activeConversation.contact,
        body,
      });
      toast.success('Message sent successfully.');
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
    if (!activeConversation?.contact) {
      toast.error('Please select a conversation first.');
      return false;
    }

    const optimisticId = `optimistic-${Date.now()}-${file.name}`;

    try {
      setIsSending(true);
      const optimisticMessage = {
        id: optimisticId,
        to: activeConversation.contact,
        fromMe: true,
        status: 'sending',
        messageType: type,
        body: caption || '',
        filename: file.name,
        timestamp: new Date().toISOString(),
        isUploading: true,
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      const uploaded = await whatsappCloudService.uploadToCloudinary({ file, type, cloudName: CLOUDINARY_CLOUD_NAME, uploadPreset: CLOUDINARY_UPLOAD_PRESET });
      const mediaUrl = typeof uploaded === 'string'
        ? uploaded
        : (uploaded?.secure_url || uploaded?.url || '');
      setMessages((prev) => prev.map((item) => (
        item.id === optimisticId
          ? { ...item, mediaUrl, isUploading: false }
          : item
      )));

      const mediaPayload = type === 'image'
        ? {
          to: activeConversation.contact,
          type: 'image',
          image: { link: mediaUrl },
          mediaUrl,
          filename: file.name,
          caption,
        }
        : {
          to: activeConversation.contact,
          type,
          mediaUrl,
          filename: file.name,
          caption,
        };

      await whatsappCloudService.sendMediaMessage(mediaPayload);
      toast.success('Attachment sent successfully.');
      loadMessages();
      return true;
    } catch (error) {
      setMessages((prev) => prev.filter((item) => item?.id !== optimisticId));
      toast.error(parseApiError(error, 'Failed to send attachment.'));
      return false;
    } finally {
      setIsSending(false);
    }
  }, [activeConversation, loadMessages]);

  const handleRetry = useCallback(async (message) => {
    const body = getMessageText(message);
    const targetContact = getContactForMessage(message);

    if (!body || body === 'Unsupported message payload' || !targetContact) {
      toast.error('Unable to retry this message.');
      return false;
    }

    try {
      setIsSending(true);
      await whatsappCloudService.sendTextMessage({
        to: targetContact,
        body,
      });
      toast.success('Message retried successfully.');
      loadMessages();
      return true;
    } catch (error) {
      toast.error(parseApiError(error, 'Retry failed. Please try again.'));
      return false;
    } finally {
      setIsSending(false);
    }
  }, [loadMessages]);

  const rightPanel = activeConversation ? (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b border-gray-200 p-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-xl font-semibold text-green-700">
          {getInitials(activeConversation.displayName || activeConversation.contact)}
        </div>
        <p className="mt-3 text-sm font-semibold text-gray-900">{activeConversation.displayName}</p>
        <p className="text-xs text-gray-500">{activeConversation.contact}</p>
      </div>

      <div className="space-y-4 p-5 text-sm text-gray-700">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</p>
          <p className="mt-1">{activeConversation.contact}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Last Message</p>
          <p className="mt-1 break-words">{activeConversation.lastMessage || '-'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Open Status</p>
          <p className="mt-1">{conversationWindowOpen ? 'Active (24h open)' : 'Outside 24h window'}</p>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex h-full items-center justify-center p-6 text-sm text-gray-500">
      Select a conversation to see details.
    </div>
  );

  return (
    <WhatsAppLayout
      sidebar={(
        <ConversationList
          conversations={filteredConversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          search={search}
          onSearch={setSearch}
        />
      )}
      main={(
        <div className="flex h-full min-h-0 flex-col">
          <ChatHeader
            conversation={activeConversation}
            isLoading={isLoading}
            onRefresh={loadMessages}
            windowOpen={conversationWindowOpen}
          />
          <ChatWindow
            messages={activeMessages}
            getMessageIdentity={getMessageIdentity}
            getMessageDirection={getMessageDirection}
            getTimestampRaw={getTimestampRaw}
            scrollRef={messagesContainerRef}
            canSend={Boolean(activeConversation) && !isSending && conversationWindowOpen}
            canSendTemplateOnly={!conversationWindowOpen}
            onSend={handleSend}
            onSendAttachment={handleSendAttachment}
            onRetry={handleRetry}
          />
        </div>
      )}
      details={rightPanel}
    />
  );
}
