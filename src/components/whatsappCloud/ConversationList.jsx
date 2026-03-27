const formatConversationTime = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  const isToday = new Date().toDateString() === date.toDateString();
  if (isToday) {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  search,
  onSearch,
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search name or number"
          className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:bg-white"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">No conversations found.</p>
        ) : (
          conversations.map((conversation) => {
            const isActive = activeConversationId === conversation.id;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelectConversation(conversation.id)}
                className={`flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50 ${
                  isActive ? 'bg-green-50' : 'bg-white'
                }`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
                  {conversation.displayName.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {conversation.displayName}
                    </p>
                    <span className="shrink-0 text-xs text-gray-500">
                      {formatConversationTime(conversation.lastTimestamp)}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-xs text-gray-600">
                    {conversation.lastMessage}
                  </p>
                </div>

                {conversation.unreadCount > 0 ? (
                  <span className="mt-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-green-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    {conversation.unreadCount}
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
