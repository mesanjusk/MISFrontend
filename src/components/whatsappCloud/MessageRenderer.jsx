const getTextFromMessage = (msg) => {
  if (typeof msg?.body === 'string' && msg.body.trim()) return msg.body;
  if (typeof msg?.text === 'string' && msg.text.trim()) return msg.text;
  if (typeof msg?.text?.body === 'string' && msg.text.body.trim()) return msg.text.body;
  if (typeof msg?.message === 'string' && msg.message.trim()) return msg.message;
  return '';
};

const getMediaUrl = (msg) => msg?.mediaUrl || msg?.url || msg?.link || msg?.media?.url || msg?.image?.link || msg?.video?.link || msg?.audio?.link || msg?.document?.link;

const getFilename = (msg) => msg?.filename || msg?.fileName || msg?.document?.filename || msg?.document?.name || 'Download file';

export default function MessageRenderer({ message, type }) {
  const safeType = String(type || '').toLowerCase();
  const text = getTextFromMessage(message);
  const mediaUrl = getMediaUrl(message);

  if (safeType === 'image') {
    return (
      <div className="space-y-2">
        {mediaUrl ? (
          <img
            src={mediaUrl}
            alt="Shared media"
            loading="lazy"
            className="max-h-80 w-full rounded-xl object-cover"
          />
        ) : (
          <p className="text-sm italic opacity-80">Image unavailable</p>
        )}
        {text ? <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{text}</p> : null}
      </div>
    );
  }

  if (safeType === 'video') {
    return (
      <div className="space-y-2">
        {mediaUrl ? (
          <video controls preload="metadata" className="max-h-80 w-full rounded-xl bg-black">
            <source src={mediaUrl} />
            Your browser does not support video playback.
          </video>
        ) : (
          <p className="text-sm italic opacity-80">Video unavailable</p>
        )}
        {text ? <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{text}</p> : null}
      </div>
    );
  }

  if (safeType === 'audio') {
    return mediaUrl ? (
      <audio controls preload="none" className="w-full">
        <source src={mediaUrl} />
        Your browser does not support audio playback.
      </audio>
    ) : (
      <p className="text-sm italic opacity-80">Audio unavailable</p>
    );
  }

  if (safeType === 'document') {
    return mediaUrl ? (
      <a
        href={mediaUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-black/10 px-3 py-2 text-sm font-medium underline-offset-2 hover:underline"
      >
        📄 {getFilename(message)}
      </a>
    ) : (
      <p className="text-sm italic opacity-80">Document unavailable</p>
    );
  }

  if (safeType === 'sticker') {
    return mediaUrl ? (
      <img
        src={mediaUrl}
        alt="Sticker"
        loading="lazy"
        className="h-28 w-28 rounded-xl object-contain"
      />
    ) : (
      <p className="text-sm italic opacity-80">Sticker unavailable</p>
    );
  }

  return <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{text || 'Unsupported message payload'}</p>;
}
