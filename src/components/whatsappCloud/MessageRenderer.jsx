import ImageMessage from './ImageMessage';
import FileMessage from './FileMessage';

const getTextFromMessage = (msg) => {
  if (typeof msg?.body === 'string' && msg.body.trim()) return msg.body;
  if (typeof msg?.text === 'string' && msg.text.trim()) return msg.text;
  if (typeof msg?.text?.body === 'string' && msg.text.body.trim()) return msg.text.body;
  if (typeof msg?.message === 'string' && msg.message.trim()) return msg.message;
  return '';
};

export default function MessageRenderer({ message, type }) {
  const safeType = String(type || '').toLowerCase();
  const text = getTextFromMessage(message);

  if (safeType === 'image') {
    return (
      <div className="space-y-2">
        <ImageMessage message={message} />
        {text ? <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{text}</p> : null}
      </div>
    );
  }

  if (safeType === 'document') {
    return (
      <div className="space-y-2">
        <FileMessage message={message} />
        {text ? <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{text}</p> : null}
      </div>
    );
  }

  if (safeType === 'video') {
    const mediaUrl = message?.mediaUrl || message?.video?.link || message?.url;
    return mediaUrl ? <video controls className="max-h-80 w-full rounded-xl bg-black"><source src={mediaUrl} /></video> : <p className="text-sm italic opacity-80">Video unavailable</p>;
  }

  if (safeType === 'audio') {
    const mediaUrl = message?.mediaUrl || message?.audio?.link || message?.url;
    return mediaUrl ? <audio controls className="w-full"><source src={mediaUrl} /></audio> : <p className="text-sm italic opacity-80">Audio unavailable</p>;
  }

  return <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{text || 'Unsupported message payload'}</p>;
}
