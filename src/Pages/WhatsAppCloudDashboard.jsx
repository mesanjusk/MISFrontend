import { useState } from 'react';
import SendMessagePanel from '../components/whatsappCloud/SendMessagePanel';
import MessagesPanel from '../components/whatsappCloud/MessagesPanel';
import AutoReplyManagementPanel from '../components/whatsappCloud/AutoReplyManagementPanel';
import AnalyticsDashboard from '../components/whatsappCloud/AnalyticsDashboard';

const tabs = [
  { key: 'send', label: 'Send Message' },
  { key: 'inbox', label: 'Inbox' },
  { key: 'autoReply', label: 'Auto Replies' },
  { key: 'analytics', label: 'Analytics' },
];

export default function WhatsAppCloudDashboard() {
  const [activeTab, setActiveTab] = useState('send');

  return (
    <div className="p-4 md:p-6 space-y-5">
      <header className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          WhatsApp Business Cloud
        </h1>

        <p className="text-sm text-gray-600 mt-1">
          Connected Business: <strong>Sanju Sk Digital</strong>
        </p>

        <p className="text-xs text-gray-500 mt-2">
          Single Business Mode Active
        </p>
      </header>

      <nav className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
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

      {activeTab === 'send' ? <SendMessagePanel /> : null}
      {activeTab === 'inbox' ? <MessagesPanel /> : null}
      {activeTab === 'autoReply' ? <AutoReplyManagementPanel /> : null}
      {activeTab === 'analytics' ? <AnalyticsDashboard /> : null}
    </div>
  );
}
