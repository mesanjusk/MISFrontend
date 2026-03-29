import React from 'react';

const ChatHeader = ({ selectedCustomer, status, darkMode }) => {
  const linkedOrders = selectedCustomer?.linkedOrders || selectedCustomer?.Orders || [];

  return (
    <div className={`${darkMode ? 'bg-[#202c33]' : 'bg-white'} p-4 border-b flex items-center justify-between gap-3`}>
      {selectedCustomer ? (
        <>
          <div>
            <div className="font-bold text-sm">{selectedCustomer?.Customer_name || 'Unknown Customer'}</div>
            <div className="text-xs text-gray-500">{selectedCustomer?.Mobile_number || '-'}</div>
            <div className="mt-1 text-[11px] text-gray-500">
              Linked Orders: {linkedOrders?.length || 0}
              {linkedOrders?.length ? ` • #${linkedOrders?.[0]?.Order_Number || linkedOrders?.[0]}` : ''}
            </div>
          </div>
          <div className="text-sm text-gray-400">{status}</div>
        </>
      ) : (
        <div className="text-gray-500">Select a chat</div>
      )}
    </div>
  );
};

export default ChatHeader;
