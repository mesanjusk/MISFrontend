import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { fetchWhatsAppStatus } from '../services/whatsappService';
import { parseApiError } from '../utils/parseApiError';
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

const getFriendlyStatusError = (error) => {
  const statusCode = error?.response?.status;
  if (statusCode === 401 || statusCode === 403) return 'Token expired. Please sign in again.';
  if (!error?.response) return 'Network issue. Please check your internet connection.';
  if (statusCode >= 500) return 'Server error while checking WhatsApp status.';
  return parseApiError(error, 'Unable to check WhatsApp status right now.');
};

export default function WhatsAppCloudDashboard() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [search, setSearch] = useState('');
  const [connectionState, setConnectionState] = useState('loading');
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [statusError, setStatusError] = useState('');
  const [lastCheckedAt, setLastCheckedAt] = useState(null);

  const [statusTick, setStatusTick] = useState(0);

  useEffect(() => {
    let active = true;

    const refreshConnectionStatus = async () => {
      if (!active) return;

      setConnectionState((prev) => (prev === 'connected' || prev === 'disconnected' ? prev : 'loading'));
      setStatusError('');

      try {
        const res = await fetchWhatsAppStatus();
        const data = res?.data;
        const isConnected = data?.status === 'connected' || (Array.isArray(data?.data) && data.data.some((acc) => acc?.status === 'connected'));

        if (!active) return;
        setConnectionState(isConnected ? 'connected' : 'disconnected');
        setConnectionStatus(isConnected ? 'Connected' : 'Disconnected');
      } catch (error) {
        if (!active) return;
        setConnectionState('error');
        setConnectionStatus('Unavailable');
        setStatusError(getFriendlyStatusError(error));
      } finally {
        if (active) setLastCheckedAt(new Date());
      }
    };

    refreshConnectionStatus();
    const interval = setInterval(refreshConnectionStatus, 12000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [statusTick]);

  const renderSection = useMemo(() => {
    if (activeTab === 'inbox') return <MessagesPanel />;
    if (activeTab === 'templates') return <SendMessagePanel />;
    if (activeTab === 'campaigns') return <BulkSender />;
    if (activeTab === 'autoReply') return <AutoReplyManagementPanel />;
    if (activeTab === 'analytics') return <AnalyticsDashboard />;
    return <section className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">Settings panel is ready for configuration controls.</section>;
  }, [activeTab]);

  const connectionChipClass = connectionState === 'connected'
    ? 'bg-emerald-50 text-emerald-700'
    : connectionState === 'loading'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-red-50 text-red-700';

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
            <div className="text-right">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${connectionChipClass}`}>WhatsApp {connectionStatus}</span>
              <p className="mt-1 text-[11px] text-gray-500">{lastCheckedAt ? `Last checked ${lastCheckedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Checking status...'}</p>
              {statusError ? <p className="mt-1 text-[11px] text-red-500">{statusError}</p> : null}
              {statusError ? <button type="button" onClick={() => setStatusTick((prev) => prev + 1)} className="mt-1 text-[11px] font-semibold text-blue-600">Retry now</button> : null}
            </div>
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
