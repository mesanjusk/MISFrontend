import PropTypes from 'prop-types';
import { toast } from '../../Components';
import { whatsappCloudService } from '../../services/whatsappCloudService';
import { parseApiError } from '../../utils/parseApiError';

export default function WhatsAppAccountsPanel({ accounts, loading, error, selectedAccountId, onSelectAccount, onReload }) {
  const disconnectAccount = async (accountId) => {
    if (!window.confirm('Disconnect this WhatsApp account?')) return;

    try {
      await whatsappCloudService.disconnectAccount(accountId);
      toast.success('Account disconnected.');
      onReload?.();
    } catch (err) {
      toast.error(parseApiError(err, 'Unable to disconnect account.'));
    }
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">WhatsApp Accounts</h3>
        <button type="button" onClick={onReload} className="text-sm text-blue-600 font-medium">
          Refresh
        </button>
      </div>

      {loading ? <p className="text-sm text-gray-500 mt-3">Loading accounts...</p> : null}
      {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}

      <div className="mt-4 space-y-3">
        {accounts.map((account) => (
          <article
            key={account.id || account.phoneNumberId}
            className={`rounded-lg border p-3 ${
              selectedAccountId === (account.id || account.phoneNumberId) ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-gray-800">{account.displayName || account.phoneNumber || 'Unknown number'}</p>
                <p className="text-sm text-gray-600">Number: {account.phoneNumber || '--'}</p>
                <p className="text-xs text-gray-500">Status: {account.status || 'Unknown'}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectAccount(account.id || account.phoneNumberId)}
                  className="rounded-md border border-blue-600 text-blue-600 px-3 py-1.5 text-sm"
                >
                  Use
                </button>
                <button
                  type="button"
                  onClick={() => disconnectAccount(account.id || account.phoneNumberId)}
                  className="rounded-md border border-red-600 text-red-600 px-3 py-1.5 text-sm"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </article>
        ))}

        {!loading && accounts.length === 0 ? (
          <p className="text-sm text-gray-500">No connected WhatsApp Business number found.</p>
        ) : null}
      </div>
    </section>
  );
}

WhatsAppAccountsPanel.propTypes = {
  accounts: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.string,
  selectedAccountId: PropTypes.string,
  onSelectAccount: PropTypes.func.isRequired,
  onReload: PropTypes.func,
};
