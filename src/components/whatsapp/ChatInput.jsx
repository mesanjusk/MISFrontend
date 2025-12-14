import React from 'react';

const ChatInput = ({
  darkMode,
  selectedCustomer,
  message,
  onChange,
  onSend,
  sending,
}) => {
  if (!selectedCustomer) return null;

  return (
    <div className={`${darkMode ? 'bg-[#2a3942]' : 'bg-white'} p-3 flex items-center gap-2 border-t`}>
      <input
        type="text"
        value={message}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-4 py-2 border rounded-full text-sm"
        placeholder="Type a message"
      />
      <button
        onClick={onSend}
        disabled={sending}
        className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 text-sm"
      >
        {sending ? '...' : 'Send'}
      </button>
    </div>
  );
};

export default ChatInput;
