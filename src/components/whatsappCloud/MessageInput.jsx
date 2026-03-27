import { useState } from 'react';

export default function MessageInput({ disabled, onSend }) {
  const [value, setValue] = useState('');

  const submit = async () => {
    const body = value.trim();
    if (!body || disabled) return;

    const didSend = await onSend(body);
    if (didSend) setValue('');
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="sticky bottom-0 border-t border-gray-200 bg-white p-3">
      <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2">
        <textarea
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message"
          className="max-h-28 min-h-[40px] flex-1 resize-y border-0 bg-transparent px-2 py-1 text-sm text-gray-900 outline-none"
          disabled={disabled}
        />

        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
