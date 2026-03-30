import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import { toast } from '../../Components';
import { buildTemplatePayload, whatsappCloudService } from '../../services/whatsappCloudService';

const STORAGE_KEY = 'wa_auto_reply_config_v3';

const initialFormState = {
  keyword: '',
  matchType: 'contains',
  replyMode: 'text',
  replyText: '',
  templateName: '',
  templateLanguage: 'en',
  active: true,
};

const matchesRule = (rule, input) => {
  const text = String(input || '').trim().toLowerCase();
  const keyword = String(rule?.keyword || '').trim().toLowerCase();
  if (!text || !keyword || !rule?.active) return false;
  if (rule.matchType === 'exact') return text === keyword;
  if (rule.matchType === 'starts_with') return text.startsWith(keyword);
  return text.includes(keyword);
};

const normalizeIncomingBody = (message) => message?.body || message?.text?.body || message?.text || message?.message || '';

export default function AutoReplyManagementPanel() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('simple');
  const [rules, setRules] = useState([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [fallbackReply, setFallbackReply] = useState('Thanks for your message. Our team will reply shortly.');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState('');
  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState(0);
  const [isSavingRule, setIsSavingRule] = useState(false);

  const normalizeRules = useCallback((list) => (
    (Array.isArray(list) ? list : []).map((rule) => ({
      ...rule,
      id: rule?.id || rule?._id || crypto.randomUUID(),
      active: typeof rule?.active === 'boolean' ? rule.active : Boolean(rule?.isActive),
      isActive: typeof rule?.isActive === 'boolean' ? rule.isActive : Boolean(rule?.active),
    }))
  ), []);

  const loadAutoReplyRules = useCallback(async ({ shouldUpdateState = true } = {}) => {
    const response = await whatsappCloudService.getAutoReplyRules();
    const list = response?.data?.data?.rules || response?.data?.rules || response?.data?.data || response?.data || [];
    const normalizedRules = normalizeRules(list);

    console.log('Auto reply rules fetched:', normalizedRules);
    if (shouldUpdateState) setRules(normalizedRules);
    return normalizedRules;
  }, [normalizeRules]);

  useEffect(() => {
    let mounted = true;

    const hydrateAutoReplyState = async () => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (Array.isArray(saved.rules) && mounted) setRules(saved.rules);
        if (typeof saved.isEnabled === 'boolean' && mounted) setIsEnabled(saved.isEnabled);
        if (typeof saved.fallbackReply === 'string' && mounted) setFallbackReply(saved.fallbackReply);
      } catch {
        // no-op
      }

      try {
        const normalizedRules = await loadAutoReplyRules({ shouldUpdateState: false });
        if (mounted && normalizedRules.length) setRules(normalizedRules);
      } catch (error) {
        console.error('Auto reply rules fetch failed; using local cache.', error);
      }
    };

    hydrateAutoReplyState();

    return () => {
      mounted = false;
    };
  }, [loadAutoReplyRules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rules, isEnabled, fallbackReply }));
  }, [rules, isEnabled, fallbackReply]);

  const editingRule = useMemo(() => rules.find((rule) => rule.id === editingRuleId) || null, [editingRuleId, rules]);

  useEffect(() => {
    if (!isEnabled || mode !== 'simple') return undefined;

    const runAutoReply = async () => {
      try {
        const response = await whatsappCloudService.getMessages();
        const list = response?.data?.data?.messages || response?.data?.messages || response?.data?.data || response?.data || [];
        const messages = Array.isArray(list) ? list : [];
        const incoming = messages
          .filter((message) => !message?.fromMe)
          .sort((a, b) => new Date(a?.timestamp || a?.createdAt || 0) - new Date(b?.timestamp || b?.createdAt || 0));

        const newest = incoming[incoming.length - 1];
        if (!newest) return;

        const timestamp = new Date(newest?.timestamp || newest?.createdAt || 0).getTime();
        if (!timestamp || timestamp <= lastProcessedTimestamp) return;

        const body = normalizeIncomingBody(newest);
        const to = newest?.from || newest?.sender;
        if (!to) return;

        const matchedRule = rules.find((rule) => matchesRule(rule, body));
        if (matchedRule) {
          if (matchedRule.replyMode === 'template' && matchedRule.templateName) {
            await whatsappCloudService.sendTemplateMessage(
              buildTemplatePayload({
                to,
                template: {
                  name: matchedRule.templateName,
                  language: matchedRule.templateLanguage || 'en',
                  parameters: [],
                },
              }),
            );
          } else if (matchedRule.replyText?.trim()) {
            await whatsappCloudService.sendTextMessage({ to, body: matchedRule.replyText.trim() });
          }
          setLastProcessedTimestamp(timestamp);
          toast.success('Auto reply triggered.');
          return;
        }

        if (fallbackReply.trim()) {
          await whatsappCloudService.sendTextMessage({ to, body: fallbackReply.trim() });
          setLastProcessedTimestamp(timestamp);
          toast.success('Fallback auto reply sent.');
        }
      } catch {
        // avoid breaking UI when polling fails
      }
    };

    const interval = setInterval(runAutoReply, 8000);
    return () => clearInterval(interval);
  }, [fallbackReply, isEnabled, lastProcessedTimestamp, mode, rules]);

  const openAddModal = () => {
    setEditingRuleId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRuleId(rule.id);
    setFormData({ ...initialFormState, ...rule });
    setIsModalOpen(true);
  };

  const handleSaveRule = async (event) => {
    event.preventDefault();
    const keyword = formData.keyword.trim();
    const replyText = formData.replyText.trim();
    const templateName = formData.templateName.trim();

    if (!keyword) {
      toast.error('Keyword is required.');
      return;
    }

    if (formData.replyMode === 'text' && !replyText) {
      toast.error('Reply text is required for text mode.');
      return;
    }

    if (formData.replyMode === 'template' && !templateName) {
      toast.error('Template name is required for template mode.');
      return;
    }

    const payload = {
      ...formData,
      keyword,
      replyText: formData.replyMode === 'text' ? replyText : '',
      templateName: formData.replyMode === 'template' ? templateName : '',
      isActive: Boolean(formData.active),
      active: Boolean(formData.active),
      updatedAt: new Date().toISOString(),
    };

    const sanitizedPayload = {
      ...payload,
      keyword: payload.keyword || '',
      replyText: payload.replyText || '',
      templateName: payload.templateName || '',
      templateLanguage: payload.templateLanguage || 'en',
      isActive: Boolean(payload.isActive),
      active: Boolean(payload.active),
    };

    console.log('Submitting Auto Reply:', sanitizedPayload);

    setIsSavingRule(true);

    try {
      const response = await whatsappCloudService.createAutoReplyRule(sanitizedPayload);
      console.log('Auto reply save response:', response?.data);

      const serverRule = response?.data?.data?.rule || response?.data?.rule || response?.data?.data || response?.data || null;
      const mergedRule = {
        ...(serverRule || sanitizedPayload),
        id: serverRule?.id || serverRule?._id || editingRule?.id || crypto.randomUUID(),
        active: typeof serverRule?.active === 'boolean' ? serverRule.active : Boolean(serverRule?.isActive ?? sanitizedPayload.active),
        isActive: typeof serverRule?.isActive === 'boolean' ? serverRule.isActive : Boolean(serverRule?.active ?? sanitizedPayload.isActive),
      };

      if (editingRule) {
        setRules((prev) => prev.map((rule) => (rule.id === editingRule.id ? mergedRule : rule)));
        toast.success('Rule updated.');
      } else {
        setRules((prev) => [mergedRule, ...prev]);
        toast.success('Rule added.');
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
      setEditingRuleId(null);
      await loadAutoReplyRules();
    } catch (error) {
      console.error('Auto reply save failed:', error);
      const fallbackRule = {
        ...sanitizedPayload,
        id: editingRule?.id || crypto.randomUUID(),
      };
      if (editingRule) {
        setRules((prev) => prev.map((rule) => (rule.id === editingRule.id ? fallbackRule : rule)));
      } else {
        setRules((prev) => [fallbackRule, ...prev]);
      }
      toast.error('Server save failed, rule stored locally as fallback.');
      setIsModalOpen(false);
      setFormData(initialFormState);
      setEditingRuleId(null);
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleTest = () => {
    const matchedRule = rules.find((rule) => matchesRule(rule, testInput));
    if (matchedRule) {
      setTestResult(matchedRule.replyMode === 'template' ? `Template: ${matchedRule.templateName} (${matchedRule.templateLanguage || 'en'})` : matchedRule.replyText);
      return;
    }
    setTestResult(fallbackReply.trim() || 'No reply would be sent.');
  };

  const handleModeChange = (value) => {
    setMode(value);
    if (value === 'flow') navigate('/flow-builder');
  };

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button type="button" onClick={() => handleModeChange('simple')} className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'simple' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Simple Auto Reply</button>
        <button type="button" onClick={() => handleModeChange('flow')} className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'flow' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Flow Builder</button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Auto Reply</h3>
          <p className="text-sm text-gray-500">Keyword based replies with case-insensitive matching.</p>
        </div>
        <button type="button" onClick={() => setIsEnabled((prev) => !prev)} className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${isEnabled ? 'bg-emerald-600' : 'bg-gray-500'}`}>{isEnabled ? 'ON' : 'OFF'}</button>
      </div>

      <label className="block text-sm text-gray-700">Default fallback reply
        <textarea value={fallbackReply} onChange={(event) => setFallbackReply(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
      </label>

      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-sm font-semibold text-gray-800">Test Auto Reply</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input value={testInput} onChange={(event) => setTestInput(event.target.value)} placeholder="Simulate incoming message" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <button type="button" onClick={handleTest} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Test</button>
        </div>
        {testResult ? <p className="mt-2 rounded bg-gray-50 px-3 py-2 text-sm text-gray-700">Reply: {testResult}</p> : null}
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={openAddModal} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Add Rule</button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left font-semibold text-gray-600">Keyword</th><th className="px-4 py-3 text-left font-semibold text-gray-600">Reply</th><th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th><th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rules.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">No auto-reply rules configured.</td></tr> : rules.map((rule) => (
              <tr key={rule.id}>
                <td className="px-4 py-3 font-medium text-gray-800">{rule.keyword} <span className="ml-1 text-xs text-gray-500">({rule.matchType})</span></td>
                <td className="max-w-md truncate px-4 py-3 text-gray-600" title={rule.replyMode === 'template' ? rule.templateName : rule.replyText}>{rule.replyMode === 'template' ? `Template: ${rule.templateName}` : rule.replyText}</td>
                <td className="px-4 py-3"><button type="button" onClick={() => setRules((prev) => prev.map((item) => (item.id === rule.id ? { ...item, active: !item.active } : item)))} className={`rounded-full px-2.5 py-1 text-xs font-medium ${rule.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{rule.active ? 'Active' : 'Inactive'}</button></td>
                <td className="px-4 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={() => openEditModal(rule)} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700">Edit</button><button type="button" onClick={() => setRules((prev) => prev.filter((item) => item.id !== rule.id))} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700">Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <Modal onClose={() => setIsModalOpen(false)} title={editingRule ? 'Edit Rule' : 'Add Rule'}>
          <form onSubmit={handleSaveRule} className="space-y-4">
            <label className="block text-sm text-gray-700">Keyword<input value={formData.keyword} onChange={(event) => setFormData((prev) => ({ ...prev, keyword: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
            <label className="block text-sm text-gray-700">Match Type<select value={formData.matchType} onChange={(event) => setFormData((prev) => ({ ...prev, matchType: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"><option value="contains">Contains</option><option value="exact">Exact</option><option value="starts_with">Starts with</option></select></label>
            <label className="block text-sm text-gray-700">Reply Mode<select value={formData.replyMode} onChange={(event) => setFormData((prev) => ({ ...prev, replyMode: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"><option value="text">Reply Text</option><option value="template">Reply Template</option></select></label>
            {formData.replyMode === 'text' ? (
              <label className="block text-sm text-gray-700">Reply<textarea rows={3} value={formData.replyText} onChange={(event) => setFormData((prev) => ({ ...prev, replyText: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm text-gray-700">Template Name<input value={formData.templateName} onChange={(event) => setFormData((prev) => ({ ...prev, templateName: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
                <label className="block text-sm text-gray-700">Language<input value={formData.templateLanguage} onChange={(event) => setFormData((prev) => ({ ...prev, templateLanguage: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
              </div>
            )}
            <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={formData.active} onChange={(event) => setFormData((prev) => ({ ...prev, active: event.target.checked }))} />Active</label>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={isSavingRule} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{isSavingRule ? 'Saving...' : 'Save'}</button></div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
