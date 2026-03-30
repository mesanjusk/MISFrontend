const getFileUrl = (message) => message?.mediaUrl || message?.url || message?.link || message?.document?.link || message?.media?.url || '';

const getFilename = (message) => message?.filename || message?.fileName || message?.document?.filename || message?.document?.name || 'Attachment';

export default function FileMessage({ message }) {
  const url = getFileUrl(message);
  const name = getFilename(message);

  if (!url) return <p className="text-sm italic opacity-80">Document unavailable</p>;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/80 p-3 text-gray-900">
      <span className="text-lg">📎</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-gray-500">Tap to download</p>
      </div>
      <a href={url} download className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">Download</a>
    </div>
  );
}
