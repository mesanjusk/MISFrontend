import { useMemo, useState } from 'react';
import MetaEmbeddedSignupCard from '../components/whatsappCloud/MetaEmbeddedSignupCard';
import SendMessagePanel from '../components/whatsappCloud/SendMessagePanel';
import TemplatesPanel from '../components/whatsappCloud/TemplatesPanel';
import WebhookLogsPanel from '../components/whatsappCloud/WebhookLogsPanel';
import WhatsAppAccountsPanel from '../components/whatsappCloud/WhatsAppAccountsPanel';
import { WhatsAppCloudProvider, useWhatsAppCloudState } from '../context/WhatsAppCloudContext';
import { useWhatsAppCloudData } from '../hooks/useWhatsAppCloudData';

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
          Manage Embedded Signup, messaging, templates, and webhook statuses in one admin console.
        </p>
        <p className="text-xs text-gray-500 mt-2">Selected Account: {selectedAccount?.phoneNumber || 'None selected'}</p>
      </header>

      <MetaEmbeddedSignupCard onConnected={reloadAccounts} />

      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'accounts' ? (
        <WhatsAppAccountsPanel
          accounts={accounts}
          loading={loading.accounts}
          error={error.accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          onReload={reloadAccounts}
        />
      ) : null}

      {activeTab === 'send' ? (
        <SendMessagePanel
          selectedAccountId={selectedAccountId}
          selectedTemplateName={selectedTemplateName}
          templateVariables={templateVariables}
          onMessageSent={setLastMessageResult}
        />
      ) : null}

      {activeTab === 'templates' ? (
        <TemplatesPanel
          templates={templates}
          loading={loading.templates}
          error={error.templates}
          selectedTemplateName={selectedTemplateName}
          onTemplateChange={handleTemplateChange}
          onReload={reloadTemplates}
        />
      ) : null}

      {activeTab === 'logs' ? (
        <WebhookLogsPanel logs={logs} loading={loading.logs} error={error.logs} onRefresh={reloadLogs} />
      ) : null}
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
