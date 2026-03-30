import { useMemo, useState } from 'react';
import Modal from '../common/Modal';

const deriveImageUrl = (message) => message?.mediaUrl || message?.url || message?.link || message?.image?.link || message?.media?.url || '';

export default function ImageMessage({ message }) {
  const [isOpen, setIsOpen] = useState(false);
  const imageUrl = useMemo(() => deriveImageUrl(message), [message]);

  if (!imageUrl) {
    return <p className="text-sm italic opacity-80">Image unavailable</p>;
  }

  return (
    <>
      <img
        src={imageUrl}
        alt="Shared media"
        loading="lazy"
        onClick={() => setIsOpen(true)}
        className="max-h-72 max-w-xs cursor-pointer rounded-lg object-cover shadow"
      />

      <div className="mt-2 flex gap-2">
        <a
          href={imageUrl}
          download
          className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700"
        >
          Download
        </a>
        <a
          href={imageUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
        >
          Open
        </a>
      </div>

      {isOpen ? (
        <Modal onClose={() => setIsOpen(false)} title="Image Preview">
          <div className="space-y-3">
            <img src={imageUrl} alt="Full preview" className="max-h-[70vh] w-full rounded-lg object-contain" />
            <div className="flex justify-end gap-2">
              <a href={imageUrl} download className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white">
                Download
              </a>
              <a href={imageUrl} target="_blank" rel="noreferrer" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700">
                Open in new tab
              </a>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
