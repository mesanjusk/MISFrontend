export default function ChatHeader({ conversation, isLoading, onRefresh, windowOpen }) {
  const isWindowOpen = Boolean(windowOpen);

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {conversation?.displayName || 'Select a conversation'}
        </p>
        <p className="text-xs text-gray-500">{conversation?.contact || 'No contact selected'}</p>

        {conversation ? (
          <span
            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isWindowOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {isWindowOpen ? 'Active (24h open)' : 'Outside 24h window'}
          </span>
        ) : null}
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
