import React from 'react';

const ChatMessages = ({ selectedCustomer, messages, chatRef }) => (
  <div
    ref={chatRef}
    className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('/whatsapp-bg.png')] bg-cover"
  >
    {selectedCustomer && messages.length ? (
      messages.map((msg, i) => (
        <div
          key={i}
          className={`max-w-sm px-4 py-2 rounded-lg text-sm ${msg.from === 'me' ? 'bg-blue-100 ml-auto' : 'bg-white'} shadow-sm`}
        >
          <div>{msg.text}</div>
          <div className="text-right text-xs text-gray-400 mt-1">
            {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ))
    ) : (
      <div className="text-center text-gray-400 mt-10">No messages yet</div>
    )}
  </div>
);

export default ChatMessages;
