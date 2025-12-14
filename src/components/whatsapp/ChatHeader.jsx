import React from 'react';

const ChatHeader = ({ selectedCustomer, status, darkMode }) => (
  <div className={`${darkMode ? 'bg-[#202c33]' : 'bg-white'} p-4 border-b flex items-center justify-between`}>
    {selectedCustomer ? (
      <>
        <div>
          <div className="font-bold text-sm">{selectedCustomer.Customer_name}</div>
          <div className="text-xs text-gray-500">{selectedCustomer.Mobile_number}</div>
        </div>
        <div className="text-sm text-gray-400">{status}</div>
      </>
    ) : (
      <div className="text-gray-500">Select a chat</div>
    )}
  </div>
);

export default ChatHeader;
