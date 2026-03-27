import { useMemo, useState } from 'react';
import Modal from '../common/Modal';
import { toast } from '../../Components';
import { useNavigate } from 'react-router-dom';

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

const formatMatchType = (value) =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatDateTime = (value) => {
  if (!value) return '--';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return '--';

  return parsedDate.toLocaleString();
};

function DeleteRuleModal({ rule, onClose, onConfirm }) {
  if (!rule) return null;

  return (
    <Modal onClose={onClose} title="Delete Auto-Reply Rule">
      <p className="text-sm text-gray-700">
        Are you sure you want to delete the rule for keyword{' '}
        <strong className="text-gray-900">"{rule.keyword}"</strong>?
      </p>
      <p className="mt-2 text-xs text-gray-500">This action cannot be undone.</p>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Delete Rule
        </button>
      </div>
    </Modal>
  );
}

export default function AutoReplyManagementPanel() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('simple');
  const [rules, setRules] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [deletingRuleId, setDeletingRuleId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  const editingRule = useMemo(
    () => rules.find((rule) => rule.id === editingRuleId) || null,
    [editingRuleId, rules],
  );

  const deletingRule = useMemo(
    () => rules.find((rule) => rule.id === deletingRuleId) || null,
    [deletingRuleId, rules],
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

  const handleDelete = () => {
    if (!deletingRuleId) return;

    setRules((prev) => prev.filter((rule) => rule.id !== deletingRuleId));
    setDeletingRuleId(null);
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
    setFormData((prev) => {
      if (key === 'replyMode') {
        return {
          ...prev,
          replyMode: value,
          replyText: value === 'text' ? prev.replyText : '',
          templateName: value === 'template' ? prev.templateName : '',
        };
      }

      return { ...prev, [key]: value };
    });
  };

  const handleSaveRule = (event) => {
    event.preventDefault();

    const keyword = formData.keyword.trim();
    const replyText = formData.replyText.trim();
    const templateName = formData.templateName.trim();

    if (!keyword) {
      toast.error('Keyword is required.');
      return;
    }

    if (formData.replyMode === 'text' && !replyText) {
      toast.error('Reply text is required when reply mode is text.');
      return;
    }

    if (formData.replyMode === 'template' && !templateName) {
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
                keyword,
                replyText: formData.replyMode === 'text' ? replyText : '',
                templateName: formData.replyMode === 'template' ? templateName : '',
                updatedAt: new Date().toISOString(),
              }
            : rule,
        ),
      );
      toast.success('Auto-reply rule updated.');
    } else {
      setRules((prev) => [
        {
          id: crypto.randomUUID(),
          ...formData,
          keyword,
          replyText: formData.replyMode === 'text' ? replyText : '',
          templateName: formData.replyMode === 'template' ? templateName : '',
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast.success('Auto-reply rule added.');
    }

    closeModal();
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'flow') {
      navigate('/flow-builder');
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => handleModeChange('simple')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === 'simple' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Simple Auto Reply
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('flow')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === 'flow' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Flow Builder
        </button>
      </div>

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
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Updated</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {rules.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
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
                      <span className="max-w-[26rem] block truncate" title={rule.replyText}>
                        {rule.replyText}
                      </span>
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
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(rule.updatedAt)}</td>
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
                        onClick={() => setDeletingRuleId(rule.id)}
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

      {deletingRule ? (
        <DeleteRuleModal
          rule={deletingRule}
          onClose={() => setDeletingRuleId(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </section>
  );
}
