import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const formatDateLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  const now = new Date();
  const today = startOfDay(now);
  const target = startOfDay(date);
  const yesterday = today - 24 * 60 * 60 * 1000;

  if (target === today) return 'Today';
  if (target === yesterday) return 'Yesterday';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export default function ChatWindow({
  messages,
  getMessageIdentity,
  getMessageText,
  getMessageDirection,
  getTimestampRaw,
  scrollRef,
  canSend,
  onSend,
  onRetry,
}) {
  let lastDateLabel = null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#efeae2]">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.04)_1px,transparent_0)] bg-[size:24px_24px] p-4"
      >
        {messages.length === 0 ? (
          <p className="pt-8 text-center text-sm text-gray-500">No messages for this conversation.</p>
        ) : null}

        {messages.map((message) => {
          const timestamp = getTimestampRaw(message);
          const dateLabel = formatDateLabel(timestamp);
          const showDateSeparator = dateLabel !== lastDateLabel;
          lastDateLabel = dateLabel;

          const direction = getMessageDirection(message);
          const isOutgoing = direction === 'outgoing';

          return (
            <div key={getMessageIdentity(message)} className="space-y-2">
              {showDateSeparator ? (
                <div className="flex justify-center">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-gray-600 shadow-sm">
                    {dateLabel}
                  </span>
                </div>
              ) : null}

              <MessageBubble
                message={message}
                isOutgoing={isOutgoing}
                text={getMessageText(message)}
                timestamp={timestamp}
                onRetry={onRetry}
              />
            </div>
          );
        })}
      </div>

      <MessageInput disabled={!canSend} onSend={onSend} />
    </div>
  );
}
