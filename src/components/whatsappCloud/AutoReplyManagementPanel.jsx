import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import { toast } from '../../Components';
import { whatsappCloudService } from '../../services/whatsappCloudService';
import { parseApiError } from '../../utils/parseApiError';

const initialFormState = {
  keyword: '',
  matchType: 'contains',
  replyMode: 'text',
  replyText: '',
  templateName: '',
  templateLanguage: 'en_US',
  active: true,
  delaySeconds: '',
};

const matchesRule = (rule, input) => {
  const text = String(input || '').trim().toLowerCase();
  const keyword = String(rule?.keyword || '').trim().toLowerCase();

  if (!text || !keyword || !rule?.active) return false;
  if (rule.matchType === 'exact') return text === keyword;
  if (rule.matchType === 'starts_with') return text.startsWith(keyword);
  return text.includes(keyword);
};

const normalizeRules = (list) =>
  (Array.isArray(list) ? list : []).map((rule) => {
    const replyType = String(rule?.replyType || rule?.replyMode || 'text').toLowerCase();
    const active =
      typeof rule?.active === 'boolean' ? rule.active : Boolean(rule?.isActive);
    const templateLanguage = String(
      rule?.templateLanguage || rule?.language || 'en_US'
    );

    return {
      ...rule,
      id: rule?.id || rule?._id || `${rule?.keyword || 'rule'}-${Math.random()}`,
      active,
      isActive: active,
      replyMode: replyType,
      replyText:
        replyType === 'text' ? String(rule?.reply || rule?.replyText || '') : '',
      templateName:
        replyType === 'template'
          ? String(rule?.reply || rule?.templateName || '')
          : '',
      templateLanguage,
    };
  });

export default function AutoReplyManagementPanel() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('simple');
  const [rules, setRules] = useState([]);
  const [fallbackReply, setFallbackReply] = useState(
    'Thanks for your message. Our team will reply shortly.'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState('');
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadAutoReplyRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await whatsappCloudService.getAutoReplyRules();
      const list =
        response?.data?.data?.rules ||
        response?.data?.rules ||
        response?.data?.data ||
        response?.data ||
        [];
      const normalized = normalizeRules(list);
      setRules(normalized);
      return normalized;
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to load auto-reply rules.'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAutoReplyRules();
  }, [loadAutoReplyRules]);

  const editingRule = useMemo(
    () => rules.find((rule) => rule.id === editingRuleId) || null,
    [editingRuleId, rules]
  );

  const openAddModal = () => {
    setEditingRuleId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRuleId(rule.id);
    setFormData({
      ...initialFormState,
      keyword: rule.keyword || '',
      matchType: rule.matchType || 'contains',
      replyMode: rule.replyMode || 'text',
      replyText: rule.replyText || '',
      templateName: rule.templateName || '',
      templateLanguage: rule.templateLanguage || 'en_US',
      active: rule.active,
      delaySeconds: rule.delaySeconds ?? '',
    });
    setIsModalOpen(true);
  };

  const buildRulePayload = () => ({
    keyword: formData.keyword.trim(),
    matchType: formData.matchType,
    replyType: formData.replyMode,
    reply:
      formData.replyMode === 'text'
        ? formData.replyText.trim()
        : formData.templateName.trim(),
    templateLanguage:
      formData.replyMode === 'template'
        ? String(formData.templateLanguage || 'en_US').trim() || 'en_US'
        : undefined,
    isActive: Boolean(formData.active),
    delaySeconds:
      formData.delaySeconds === '' ? null : Number(formData.delaySeconds),
  });

  const handleSaveRule = async (event) => {
    event.preventDefault();
    const payload = buildRulePayload();

    if (!payload.keyword) {
      toast.error('Keyword is required.');
      return;
    }

    if (payload.replyType === 'text' && !payload.reply) {
      toast.error('Reply text is required for text mode.');
      return;
    }

    if (payload.replyType === 'template' && !payload.reply) {
      toast.error('Template name is required for template mode.');
      return;
    }

    setIsSavingRule(true);

    try {
      if (editingRuleId) {
        await whatsappCloudService.updateAutoReplyRule(editingRuleId, payload);
        toast.success('Rule updated.');
      } else {
        await whatsappCloudService.createAutoReplyRule(payload);
        toast.success('Rule added.');
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
      setEditingRuleId(null);
      await loadAutoReplyRules();
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to save rule.'));
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleDelete = async (ruleId) => {
    try {
      await whatsappCloudService.deleteAutoReplyRule(ruleId);
      await loadAutoReplyRules();
      toast.success('Rule deleted.');
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to delete rule.'));
    }
  };

  const handleToggle = async (ruleId) => {
    try {
      const response = await whatsappCloudService.toggleAutoReplyRule(ruleId);
      const updatedRule = normalizeRules([response?.data?.data || response?.data])[0];
      setRules((prev) =>
        prev.map((item) => (item.id === ruleId ? updatedRule : item))
      );
      toast.success('Rule updated.');
    } catch (error) {
      toast.error(parseApiError(error, 'Failed to toggle rule.'));
    }
  };

  const handleTest = () => {
    const matchedRule = rules.find((rule) => matchesRule(rule, testInput));

    if (matchedRule) {
      setTestResult(
        matchedRule.replyMode === 'template'
          ? `Template: ${matchedRule.templateName} (${matchedRule.templateLanguage || 'en_US'})`
          : matchedRule.replyText
      );
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
        <button
          type="button"
          onClick={() => handleModeChange('simple')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            mode === 'simple' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
          }`}
        >
          Simple Auto Reply
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('flow')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            mode === 'flow' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
          }`}
        >
          Flow Builder
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Auto Reply</h3>
          <p className="text-sm text-gray-500">
            Rules are stored on the backend and executed from webhook events.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAutoReplyRules}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
        >
          Refresh
        </button>
      </div>

      <label className="block text-sm text-gray-700">
        Fallback reply preview
        <textarea
          value={fallbackReply}
          onChange={(event) => setFallbackReply(event.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <span className="mt-1 block text-xs text-gray-500">
          This preview is for testing only. Your actual webhook fallback still comes
          from backend env/config.
        </span>
      </label>

      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-sm font-semibold text-gray-800">Test Auto Reply</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={testInput}
            onChange={(event) => setTestInput(event.target.value)}
            placeholder="Simulate incoming message"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleTest}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            Test
          </button>
        </div>
        {testResult ? (
          <p className="mt-2 rounded bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Reply: {testResult}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={openAddModal}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Add Rule
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Keyword
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Reply
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Status
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  Loading rules...
                </td>
              </tr>
            ) : null}

            {!isLoading && rules.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  No auto-reply rules configured.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {rule.keyword}
                    <span className="ml-1 text-xs text-gray-500">
                      ({rule.matchType})
                    </span>
                  </td>
                  <td
                    className="max-w-md truncate px-4 py-3 text-gray-600"
                    title={rule.replyMode === 'template' ? rule.templateName : rule.replyText}
                  >
                    {rule.replyMode === 'template'
                      ? `Template: ${rule.templateName} · ${rule.templateLanguage}`
                      : rule.replyText}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggle(rule.id)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        rule.active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {rule.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(rule)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rule.id)}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <Modal
          onClose={() => setIsModalOpen(false)}
          title={editingRule ? 'Edit Rule' : 'Add Rule'}
        >
          <form onSubmit={handleSaveRule} className="space-y-4">
            <label className="block text-sm text-gray-700">
              Keyword
              <input
                value={formData.keyword}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, keyword: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm text-gray-700">
              Match Type
              <select
                value={formData.matchType}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, matchType: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="contains">Contains</option>
                <option value="exact">Exact</option>
                <option value="starts_with">Starts with</option>
              </select>
            </label>

            <label className="block text-sm text-gray-700">
              Reply Mode
              <select
                value={formData.replyMode}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, replyMode: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="text">Reply Text</option>
                <option value="template">Reply Template</option>
              </select>
            </label>

            {formData.replyMode === 'text' ? (
              <label className="block text-sm text-gray-700">
                Reply
                <textarea
                  rows={3}
                  value={formData.replyText}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, replyText: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Template Name
                  <input
                    value={formData.templateName}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        templateName: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </label>

                <label className="block text-sm text-gray-700">
                  Language
                  <input
                    value={formData.templateLanguage}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        templateLanguage: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </label>
              </div>
            )}

            <label className="block text-sm text-gray-700">
              Delay Seconds
              <input
                type="number"
                min="0"
                max="30"
                value={formData.delaySeconds}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    delaySeconds: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, active: event.target.checked }))
                }
              />
              Active
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingRule}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingRule ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}