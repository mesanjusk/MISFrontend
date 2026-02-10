import { useCallback, useEffect, useMemo, useState } from 'react';
import { whatsappCloudService } from '../services/whatsappCloudService';
import { parseApiError } from '../utils/parseApiError';

export function useWhatsAppCloudData(selectedAccountId) {
  const [accounts, setAccounts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState({ accounts: false, templates: false, logs: false });
  const [error, setError] = useState({ accounts: '', templates: '', logs: '' });

  const loadAccounts = useCallback(async () => {
    setLoading((s) => ({ ...s, accounts: true }));
    setError((s) => ({ ...s, accounts: '' }));
    try {
      const response = await whatsappCloudService.getAccounts();
      setAccounts(response.data?.data || response.data || []);
    } catch (err) {
      setError((s) => ({ ...s, accounts: parseApiError(err, 'Unable to fetch WhatsApp accounts.') }));
    } finally {
      setLoading((s) => ({ ...s, accounts: false }));
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    if (!selectedAccountId) {
      setTemplates([]);
      return;
    }
    setLoading((s) => ({ ...s, templates: true }));
    setError((s) => ({ ...s, templates: '' }));
    try {
      const response = await whatsappCloudService.getTemplates(selectedAccountId);
      setTemplates(response.data?.data || response.data || []);
    } catch (err) {
      setError((s) => ({ ...s, templates: parseApiError(err, 'Unable to fetch templates.') }));
    } finally {
      setLoading((s) => ({ ...s, templates: false }));
    }
  }, [selectedAccountId]);

  const loadLogs = useCallback(async () => {
    if (!selectedAccountId) {
      setLogs([]);
      return;
    }
    setLoading((s) => ({ ...s, logs: true }));
    setError((s) => ({ ...s, logs: '' }));
    try {
      const response = await whatsappCloudService.getWebhookLogs(selectedAccountId);
      setLogs(response.data?.data || response.data || []);
    } catch (err) {
      setError((s) => ({ ...s, logs: parseApiError(err, 'Unable to fetch webhook logs.') }));
    } finally {
      setLoading((s) => ({ ...s, logs: false }));
    }
  }, [selectedAccountId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    loadTemplates();
    loadLogs();

    if (!selectedAccountId) return undefined;
    const polling = setInterval(() => {
      loadLogs();
    }, 8000);

    return () => clearInterval(polling);
  }, [selectedAccountId, loadTemplates, loadLogs]);

  return useMemo(
    () => ({
      accounts,
      templates,
      logs,
      loading,
      error,
      reloadAccounts: loadAccounts,
      reloadTemplates: loadTemplates,
      reloadLogs: loadLogs,
    }),
    [accounts, templates, logs, loading, error, loadAccounts, loadTemplates, loadLogs],
  );
}
