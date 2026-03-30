import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { fetchWhatsAppStatus } from '../services/whatsappService';
import LoadingSkeleton from '../components/whatsappCloud/LoadingSkeleton';

const MessagesPanel = lazy(() => import('../components/whatsappCloud/MessagesPanel'));
const SendMessagePanel = lazy(() => import('../components/whatsappCloud/SendMessagePanel'));
const BulkSender = lazy(() => import('../components/whatsappCloud/BulkSender'));
const AutoReplyManagementPanel = lazy(() => import('../components/whatsappCloud/AutoReplyManagementPanel'));
const AnalyticsDashboard = lazy(() => import('../components/whatsappCloud/AnalyticsDashboard'));

const navItems = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'templates', label: 'Templates' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'autoReply', label: 'Auto Reply' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'settings', label: 'Settings' },
];

export default function WhatsAppCloudDashboard() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [search, setSearch] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Checking...');

  useEffect(() => {
    fetchWhatsAppStatus()
      .then((res) => setConnectionStatus(res?.data?.status === 'connected' ? 'Connected' : 'Disconnected'))
      .catch(() => setConnectionStatus('Disconnected'));
  }, []);

  const renderSection = useMemo(() => {
    if (activeTab === 'inbox') return <MessagesPanel />;
    if (activeTab === 'templates') return <SendMessagePanel />;
    if (activeTab === 'campaigns') return <BulkSender />;
    if (activeTab === 'autoReply') return <AutoReplyManagementPanel />;
    if (activeTab === 'analytics') return <AnalyticsDashboard />;
    return <section className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">Settings panel is ready for configuration controls.</section>;
  }, [activeTab]);

  return (
    <div className="flex min-h-[calc(100vh-5rem)] rounded-2xl border border-gray-200 bg-[#f8fafc] shadow-sm">
      <aside className="hidden w-64 border-r border-gray-200 bg-white p-4 md:block">
        <h1 className="text-lg font-bold text-gray-900">WhatsApp Cloud CRM</h1>
        <p className="mt-1 text-xs text-gray-500">BSP-style workspace</p>
        <nav className="mt-6 space-y-1" aria-label="WhatsApp cloud sections">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${activeTab === item.key ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex min-w-[240px] flex-1 items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations, templates, campaigns"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${connectionStatus === 'Connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>WhatsApp {connectionStatus}</span>
            <button type="button" className="rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white">Profile</button>
          </div>
          <div className="flex w-full gap-2 overflow-x-auto md:hidden">
            {navItems.map((item) => (
              <button key={item.key} type="button" onClick={() => setActiveTab(item.key)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${activeTab === item.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{item.label}</button>
            ))}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto p-3 md:p-5">
          <Suspense fallback={<LoadingSkeleton lines={8} />}>
            {renderSection}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
