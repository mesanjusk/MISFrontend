import { useRef } from 'react';

const ACCEPTED = {
  image: 'image/*',
  video: 'video/*',
  document: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv',
};

export default function AttachmentUpload({ disabled, onSelectFile }) {
  const inputRef = useRef(null);

  const openPicker = (type) => {
    if (disabled || !inputRef.current) return;
    inputRef.current.value = '';
    inputRef.current.accept = ACCEPTED[type];
    inputRef.current.dataset.attachmentType = type;
    inputRef.current.click();
  };

  const onFileChange = async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    const requestedType = event.target.dataset.attachmentType;
    const inferredType = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : requestedType || 'document';

    await onSelectFile?.(file, inferredType);
  };

  return (
    <div className="relative">
      <input ref={inputRef} type="file" onChange={onFileChange} className="hidden" />

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => openPicker('image')}
          disabled={disabled}
          className="rounded-lg px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          title="Upload image"
        >
          🖼️
        </button>
        <button
          type="button"
          onClick={() => openPicker('video')}
          disabled={disabled}
          className="rounded-lg px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          title="Upload video"
        >
          🎬
        </button>
        <button
          type="button"
          onClick={() => openPicker('document')}
          disabled={disabled}
          className="rounded-lg px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          title="Upload document"
        >
          📎
        </button>
      </div>
    </div>
  );
}
