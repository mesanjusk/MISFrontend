import PropTypes from 'prop-types';

const statusClasses = {
  sent: 'bg-blue-100 text-blue-700',
  delivered: 'bg-amber-100 text-amber-700',
  read: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function WebhookLogsPanel({ logs, loading, error, onRefresh }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Webhook Logs / Message Status</h3>
        <button type="button" onClick={onRefresh} className="text-sm text-blue-600 font-medium">
          Refresh
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-1">Auto refresh every 8 seconds.</p>

      {loading ? <p className="text-sm text-gray-500 mt-3">Loading logs...</p> : null}
      {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-3 py-2">Message ID</th>
              <th className="text-left px-3 py-2">To</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Timestamp</th>
              <th className="text-left px-3 py-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((entry) => (
              <tr key={entry.id || entry.messageId} className="border-t">
                <td className="px-3 py-2">{entry.messageId || '--'}</td>
                <td className="px-3 py-2">{entry.to || '--'}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      statusClasses[entry.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {entry.status || 'unknown'}
                  </span>
                </td>
                <td className="px-3 py-2">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '--'}</td>
                <td className="px-3 py-2 text-red-600">{entry.errorMessage || '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && logs.length === 0 ? <p className="text-sm text-gray-500 mt-2">No webhook events yet.</p> : null}
      </div>
    </section>
  );
}

WebhookLogsPanel.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func,
};
