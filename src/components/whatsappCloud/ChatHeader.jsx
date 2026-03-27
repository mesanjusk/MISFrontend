export default function ChatHeader({ conversation, isLoading, onRefresh }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {conversation?.displayName || 'Select a conversation'}
        </p>
        <p className="text-xs text-gray-500">{conversation?.contact || 'No contact selected'}</p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
      >
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
}
