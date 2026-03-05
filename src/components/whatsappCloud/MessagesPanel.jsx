import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from '../../Components';
import { parseApiError } from '../../utils/parseApiError';
import { whatsappCloudService } from '../../services/whatsappCloudService';

const getMessageText = (message) => {
  if (typeof message.body === 'string') return message.body;
  if (typeof message.text === 'string') return message.text;
  if (typeof message.message === 'string') return message.message;
  return 'Unsupported message payload';
};

const getMessageDirection = (message) => {
  const direction = String(
    message.direction ?? message.type ?? message.messageType ?? '',
  ).toLowerCase();

  if (direction.includes('out')) return 'outgoing';
  if (direction.includes('in')) return 'incoming';

  if (message.fromMe || message.isOutbound) return 'outgoing';
  return 'incoming';
};

const getTimestamp = (message) => {
  const raw = message.timestamp ?? message.createdAt ?? message.time;
  if (!raw) return 'Unknown time';

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return String(raw);

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export default function MessagesPanel() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await whatsappCloudService.getMessages();
      const payload = response?.data?.data ?? response?.data ?? [];
      setMessages(Array.isArray(payload) ? payload : []);
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to load inbox messages.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const orderedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.timestamp ?? a.createdAt ?? 0) - new Date(b.timestamp ?? b.createdAt ?? 0)),
    [messages],
  );

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-800">Inbox</h3>
        <button
          type="button"
          onClick={loadMessages}
          disabled={isLoading}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mt-4 max-h-[500px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
        {orderedMessages.length === 0 && !isLoading ? (
          <p className="text-sm text-gray-500">No messages found.</p>
        ) : null}

        <div className="space-y-3">
          {orderedMessages.map((message) => {
            const direction = getMessageDirection(message);
            const isOutgoing = direction === 'outgoing';
            const status = message.status ?? 'unknown';
            const sender = message.from ?? message.sender ?? 'Unknown';
            const receiver = message.to ?? message.recipient ?? 'Unknown';

            return (
              <article
                key={message.id ?? message._id ?? `${message.timestamp}-${message.from}-${message.to}`}
                className={`max-w-[85%] rounded-xl px-3 py-2 shadow-sm ${
                  isOutgoing
                    ? 'ml-auto bg-blue-600 text-white'
                    : 'mr-auto bg-gray-200 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm">{getMessageText(message)}</p>

                <div className={`mt-2 text-xs ${isOutgoing ? 'text-blue-100' : 'text-gray-600'}`}>
                  <p>{isOutgoing ? `To: ${receiver}` : `From: ${sender}`}</p>
                  <p>{getTimestamp(message)}</p>
                  <p className="capitalize">Status: {status}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
