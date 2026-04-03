/* eslint-disable react/prop-types */
import { Box, Chip } from '@mui/material';
import ChatBubble from './ChatBubble';
import EmptyState from './EmptyState';
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
  getMessageDirection,
  getTimestampRaw,
  scrollRef,
  canSend,
  canSendTemplateOnly,
  recipient,
  onSend,
  onSendAttachment,
  onRetry,
}) {
  let lastDateLabel = null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, bgcolor: '#F0F2F5' }}>
      <Box
        ref={scrollRef}
        sx={{
          minHeight: 0,
          flex: 1,
          overflowY: 'auto',
          p: 1.5,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      >
        {messages.length === 0 ? (
          <EmptyState title="No messages yet" description="Start the conversation by sending a message." />
        ) : null}

        {messages.map((message) => {
          const timestamp = getTimestampRaw(message);
          const dateLabel = formatDateLabel(timestamp);
          const showDateSeparator = dateLabel !== lastDateLabel;
          lastDateLabel = dateLabel;

          const direction = getMessageDirection(message);
          const isOutgoing = direction === 'outgoing';

          return (
            <Box key={getMessageIdentity(message)} sx={{ mb: 1.25 }}>
              {showDateSeparator ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <Chip label={dateLabel} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.95)' }} />
                </Box>
              ) : null}

              <ChatBubble
                message={message}
                isOutgoing={isOutgoing}
                timestamp={timestamp}
                onRetry={onRetry}
              />
            </Box>
          );
        })}
      </Box>

      <MessageInput
        disabled={!canSend}
        canSendTemplateOnly={canSendTemplateOnly}
        recipient={recipient}
        onSend={onSend}
        onSendAttachment={onSendAttachment}
      />
    </Box>
  );
}
