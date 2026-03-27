const getStatusLabel = (status) => {
  if (!status) return 'sent';
  return String(status).toLowerCase();
};

const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function MessageBubble({ message, isOutgoing, text, timestamp, onRetry }) {
  const status = getStatusLabel(message?.status);
  const canRetry = isOutgoing && ['failed', 'error', 'undelivered'].includes(status);

  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
      <article
        className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%] ${
          isOutgoing ? 'rounded-br-md bg-green-600 text-white' : 'rounded-bl-md bg-white text-gray-900'
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{text}</p>

        <div className={`mt-2 flex items-center justify-end gap-2 text-[11px] ${isOutgoing ? 'text-green-100' : 'text-gray-500'}`}>
          <span>{formatMessageTime(timestamp)}</span>
          <span className="capitalize">{status}</span>
        </div>

        {canRetry ? (
          <button
            type="button"
            onClick={() => onRetry?.(message)}
            className="mt-2 rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-red-600"
          >
            Retry
          </button>
        ) : null}
      </article>
    </div>
  );
}
