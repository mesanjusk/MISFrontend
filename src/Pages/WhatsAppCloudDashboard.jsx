import { useMemo, useState } from 'react';
import MetaEmbeddedSignupCard from '../components/whatsappCloud/MetaEmbeddedSignupCard';
import SendMessagePanel from '../components/whatsappCloud/SendMessagePanel';
import TemplatesPanel from '../components/whatsappCloud/TemplatesPanel';
import WebhookLogsPanel from '../components/whatsappCloud/WebhookLogsPanel';
import WhatsAppAccountsPanel from '../components/whatsappCloud/WhatsAppAccountsPanel';
import { WhatsAppCloudProvider, useWhatsAppCloudState } from '../context/WhatsAppCloudContext';
import { useWhatsAppCloudData } from '../hooks/useWhatsAppCloudData';
import axios from 'axios';

const tabs = [
  { key: 'accounts', label: 'WhatsApp Accounts' },
  { key: 'send', label: 'Send Message' },
  { key: 'templates', label: 'Templates' },
  { key: 'logs', label: 'Webhook Logs' },
];

function WhatsAppCloudDashboardContent() {
  const {
    selectedAccountId,
    selectedTemplateName,
    setSelectedAccountId,
    setSelectedTemplateName,
    setLastMessageResult,
  } = useWhatsAppCloudState();

  const [activeTab, setActiveTab] = useState('accounts');
  const [templateVariables, setTemplateVariables] = useState({});
  const [showManualModal, setShowManualModal] = useState(false);

  const { accounts, templates, logs, loading, error, reloadAccounts, reloadTemplates, reloadLogs } =
    useWhatsAppCloudData(selectedAccountId);

  const selectedAccount = useMemo(
    () => accounts.find((account) => (account.id || account.phoneNumberId) === selectedAccountId),
    [accounts, selectedAccountId],
  );

  const handleTemplateChange = (templateName, variables) => {
    setSelectedTemplateName(templateName);
    setTemplateVariables(variables || {});
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <header className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Business Cloud</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage WhatsApp onboarding, messaging, templates, and webhook statuses in one admin console.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Selected Account: {selectedAccount?.phoneNumber || 'None selected'}
        </p>
      </header>

      {/* Embedded + Manual Connect Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <MetaEmbeddedSignupCard onConnected={reloadAccounts} />

        <div className="flex justify-end">
          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2 rounded-xl bg-gray-800 text-white text-sm font-medium hover:bg-gray-900"
          >
            Manual Connect (Temporary)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'accounts' && (
        <WhatsAppAccountsPanel
          accounts={accounts}
          loading={loading.accounts}
          error={error.accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          onReload={reloadAccounts}
        />
      )}

      {activeTab === 'send' && (
        <SendMessagePanel
          selectedAccountId={selectedAccountId}
          selectedTemplateName={selectedTemplateName}
          templateVariables={templateVariables}
          onMessageSent={setLastMessageResult}
        />
      )}

      {activeTab === 'templates' && (
        <TemplatesPanel
          templates={templates}
          loading={loading.templates}
          error={error.templates}
          selectedTemplateName={selectedTemplateName}
          onTemplateChange={handleTemplateChange}
        />
      )}

      {activeTab === 'logs' && (
        <WebhookLogsPanel
          logs={logs}
          loading={loading.logs}
          error={error.logs}
          onRefresh={reloadLogs}
        />
      )}

      {showManualModal && (
        <ManualConnectModal
          onClose={() => setShowManualModal(false)}
          onSuccess={() => {
            setShowManualModal(false);
            reloadAccounts();
          }}
        />
      )}
    </div>
  );
}

/* -------------------- Manual Connect Modal -------------------- */

function ManualConnectModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    accessToken: '',
    phoneNumberId: '',
    wabaId: '',
    displayName: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      await axios.post('/api/whatsapp/manual-connect', form);

      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Manual WhatsApp Connection</h2>

        <input
          name="displayName"
          placeholder="Business Display Name"
          value={form.displayName}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />

        <input
          name="wabaId"
          placeholder="WABA ID"
          value={form.wabaId}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />

        <input
          name="phoneNumberId"
          placeholder="Phone Number ID"
          value={form.phoneNumberId}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />

        <textarea
          name="accessToken"
          placeholder="Permanent Access Token"
          value={form.accessToken}
          onChange={handleChange}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-sm"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
          >
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppCloudDashboard() {
  return (
    <WhatsAppCloudProvider>
      <WhatsAppCloudDashboardContent />
    </WhatsAppCloudProvider>
  );
}
