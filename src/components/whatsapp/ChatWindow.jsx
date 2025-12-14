import React from 'react';
import ChatHeader from './ChatHeader.jsx';
import ChatInput from './ChatInput.jsx';
import ChatMessages from './ChatMessages.jsx';

const ChatWindow = ({
  darkMode,
  selectedCustomer,
  status,
  messages,
  chatRef,
  message,
  onMessageChange,
  onSend,
  sending,
}) => (
  <div className="flex-1 flex flex-col">
    <ChatHeader selectedCustomer={selectedCustomer} status={status} darkMode={darkMode} />
    <ChatMessages selectedCustomer={selectedCustomer} messages={messages} chatRef={chatRef} />
    <ChatInput
      darkMode={darkMode}
      selectedCustomer={selectedCustomer}
      message={message}
      onChange={onMessageChange}
      onSend={onSend}
      sending={sending}
    />
  </div>
);

export default ChatWindow;
