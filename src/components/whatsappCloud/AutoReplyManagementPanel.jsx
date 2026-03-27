import { useMemo, useState } from 'react';
import Modal from '../common/Modal';
import { toast } from '../../Components';

const matchTypeOptions = [
  { value: 'contains', label: 'Contains' },
  { value: 'exact', label: 'Exact Match' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'regex', label: 'Regex' },
];

const replyModeOptions = [
  { value: 'text', label: 'Reply Text' },
  { value: 'template', label: 'Reply Template' },
];

const initialFormState = {
  keyword: '',
  matchType: 'contains',
  replyMode: 'text',
  replyText: '',
  templateName: '',
  active: true,
};

const starterRules = [
  {
    id: 1,
    keyword: 'pricing',
    matchType: 'contains',
    replyMode: 'text',
    replyText: 'Thanks for reaching out! Our team will share the latest pricing shortly.',
    templateName: '',
    active: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    keyword: 'order status',
    matchType: 'exact',
    replyMode: 'template',
    replyText: '',
    templateName: 'order_status_v1',
    active: false,
    updatedAt: new Date().toISOString(),
  },
];

const formatMatchType = (value) =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default function AutoReplyManagementPanel() {
  const [rules, setRules] = useState(starterRules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  const editingRule = useMemo(
    () => rules.find((rule) => rule.id === editingRuleId) || null,
    [editingRuleId, rules],
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRuleId(null);
    setFormData(initialFormState);
  };

  const openAddModal = () => {
    setEditingRuleId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRuleId(rule.id);
    setFormData({
      keyword: rule.keyword,
      matchType: rule.matchType,
      replyMode: rule.replyMode,
      replyText: rule.replyText,
      templateName: rule.templateName,
      active: rule.active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (ruleId) => {
    const targetRule = rules.find((rule) => rule.id === ruleId);
    if (!targetRule) return;

    const shouldDelete = window.confirm(
      `Delete auto-reply rule for "${targetRule.keyword}"? This action cannot be undone.`,
    );

    if (!shouldDelete) return;

    setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
    toast.success('Auto-reply rule deleted.');
  };

  const handleToggleStatus = (ruleId) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              active: !rule.active,
              updatedAt: new Date().toISOString(),
            }
          : rule,
      ),
    );
  };

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveRule = (event) => {
    event.preventDefault();

    if (!formData.keyword.trim()) {
      toast.error('Keyword is required.');
      return;
    }

    if (formData.replyMode === 'text' && !formData.replyText.trim()) {
      toast.error('Reply text is required when reply mode is text.');
      return;
    }

    if (formData.replyMode === 'template' && !formData.templateName.trim()) {
      toast.error('Template name is required when reply mode is template.');
      return;
    }

    if (editingRule) {
      setRules((prev) =>
        prev.map((rule) =>
          rule.id === editingRule.id
            ? {
                ...rule,
                ...formData,
                keyword: formData.keyword.trim(),
                replyText: formData.replyMode === 'text' ? formData.replyText.trim() : '',
                templateName: formData.replyMode === 'template' ? formData.templateName.trim() : '',
                updatedAt: new Date().toISOString(),
              }
            : rule,
        ),
      );
      toast.success('Auto-reply rule updated.');
    } else {
      setRules((prev) => [
        {
          id: Date.now(),
          ...formData,
          keyword: formData.keyword.trim(),
          replyText: formData.replyMode === 'text' ? formData.replyText.trim() : '',
          templateName: formData.replyMode === 'template' ? formData.templateName.trim() : '',
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast.success('Auto-reply rule added.');
    }

    closeModal();
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Auto-Reply Management</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure keyword-based auto-replies for incoming WhatsApp messages.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Rule
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Keyword</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Match Type</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Reply</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {rules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No auto-reply rules yet. Add your first rule to get started.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3 font-medium text-gray-800">{rule.keyword}</td>
                  <td className="px-4 py-3 text-gray-600">{formatMatchType(rule.matchType)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {rule.replyMode === 'template' ? (
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        Template: {rule.templateName}
                      </span>
                    ) : (
                      <span className="line-clamp-2 max-w-[26rem]">{rule.replyText}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(rule.id)}
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        rule.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {rule.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(rule)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rule.id)}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
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
        <Modal onClose={closeModal} title={editingRule ? 'Edit Auto-Reply Rule' : 'Add Auto-Reply Rule'}>
          <form onSubmit={handleSaveRule} className="space-y-4">
            <label className="block text-sm text-gray-700">
              Keyword
              <input
                value={formData.keyword}
                onChange={(event) => handleFieldChange('keyword', event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Enter keyword"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block text-sm text-gray-700">
                Match Type
                <select
                  value={formData.matchType}
                  onChange={(event) => handleFieldChange('matchType', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {matchTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-gray-700">
                Reply Type
                <select
                  value={formData.replyMode}
                  onChange={(event) => handleFieldChange('replyMode', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {replyModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {formData.replyMode === 'text' ? (
              <label className="block text-sm text-gray-700">
                Reply Text
                <textarea
                  rows={4}
                  value={formData.replyText}
                  onChange={(event) => handleFieldChange('replyText', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Type auto-reply message"
                />
              </label>
            ) : (
              <label className="block text-sm text-gray-700">
                Template Name
                <input
                  value={formData.templateName}
                  onChange={(event) => handleFieldChange('templateName', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="e.g. order_status_v1"
                />
              </label>
            )}

            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(event) => handleFieldChange('active', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              Rule is active
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {editingRule ? 'Update Rule' : 'Add Rule'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
