import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { fetchWhatsAppStatus } from '../services/whatsappService';
import LoadingSkeleton from '../components/whatsappCloud/LoadingSkeleton';
import { parseApiError } from '../utils/parseApiError';

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
    if (activeTab === 'inbox') return <MessagesPanel search={search} />;
    if (activeTab === 'templates') return <SendMessagePanel />;
    if (activeTab === 'campaigns') return <BulkSender />;
    if (activeTab === 'autoReply') return <AutoReplyManagementPanel />;
    if (activeTab === 'analytics') return <AnalyticsDashboard />;
    return <Alert severity="info">Settings panel is ready for configuration controls.</Alert>;
  }, [activeTab, search]);

  const connectionChipColor = connectionState === 'connected'
    ? 'success'
    : connectionState === 'loading'
      ? 'warning'
      : 'error';

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 5rem)', borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, bgcolor: '#f5f7fb', overflow: 'hidden' }}>
      <Box sx={{ width: 260, borderRight: (theme) => `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', p: 2, display: { xs: 'none', md: 'block' } }}>
        <Typography variant="h6" fontWeight={700}>Cloud Inbox</Typography>
        <Typography variant="caption" color="text.secondary">WhatsApp workspace</Typography>
        <Stack spacing={0.75} sx={{ mt: 2.5 }}>
          {navItems.map((item) => (
            <Button
              key={item.key}
              variant={activeTab === item.key ? 'contained' : 'text'}
              color={activeTab === item.key ? 'success' : 'inherit'}
              onClick={() => setActiveTab(item.key)}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 600 }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
      </Box>

      <Stack sx={{ minWidth: 0, flex: 1 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5, bgcolor: 'background.paper' }}
        >
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations, templates, campaigns"
            size="small"
            sx={{ minWidth: { xs: '100%', sm: 340 } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
            }}
          />

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
            <Chip
              color={connectionChipColor}
              label={
                connectionState === 'loading' ? (
                  <Stack direction="row" alignItems="center" spacing={0.75}><CircularProgress size={12} color="inherit" /><span>WhatsApp {connectionStatus}</span></Stack>
                ) : `WhatsApp ${connectionStatus}`
              }
            />
            <Typography variant="caption" color="text.secondary">
              {lastCheckedAt ? `Last checked ${lastCheckedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Checking status...'}
            </Typography>
            {statusError ? (
              <Button size="small" startIcon={<RefreshRoundedIcon fontSize="small" />} onClick={() => setStatusTick((prev) => prev + 1)}>
                Retry
              </Button>
            ) : null}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ display: { xs: 'flex', md: 'none' }, overflowX: 'auto', pb: 0.25 }}>
            {navItems.map((item) => (
              <Button key={item.key} size="small" variant={activeTab === item.key ? 'contained' : 'outlined'} onClick={() => setActiveTab(item.key)} sx={{ whiteSpace: 'nowrap', textTransform: 'none' }}>
                {item.label}
              </Button>
            ))}
          </Stack>
        </Stack>

        {statusError ? <Alert severity="error" sx={{ mx: 2, mt: 1 }}>{statusError}</Alert> : null}
        <Divider />

        <Box sx={{ minHeight: 0, flex: 1, p: { xs: 1, md: 2 }, overflow: 'auto' }}>
          <Suspense fallback={<LoadingSkeleton lines={8} />}>
            {renderSection}
          </Suspense>
        </Box>
      </Stack>
    </Box>
  );
}
