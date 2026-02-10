import { useMemo, useState } from 'react';

function extractVariables(template) {
  const body = template?.components?.find((item) => item.type === 'BODY');
  const matches = body?.text?.match(/\{\{\d+\}\}/g) || [];
  return [...new Set(matches)].map((token) => token.replace(/[{}]/g, ''));
}

export default function TemplatesPanel({ templates, loading, error, selectedTemplateName, onTemplateChange }) {
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.name === selectedTemplateName) || null,
    [templates, selectedTemplateName],
  );

  const [variables, setVariables] = useState({});

  const variableKeys = useMemo(() => extractVariables(selectedTemplate), [selectedTemplate]);

  const handleVariableInput = (key, value) => {
    const next = { ...variables, [key]: value };
    setVariables(next);
    onTemplateChange(selectedTemplateName, next);
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800">Approved Templates</h3>

      {loading ? <p className="text-sm text-gray-500 mt-3">Loading templates...</p> : null}
      {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}

      <label className="block text-sm text-gray-700 mt-4 mb-1">Template</label>
      <select
        value={selectedTemplateName}
        onChange={(event) => onTemplateChange(event.target.value, variables)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      >
        <option value="">Select template</option>
        {templates.map((template) => (
          <option key={template.id || template.name} value={template.name}>
            {template.name} ({template.language || 'en'})
          </option>
        ))}
      </select>

      {selectedTemplate ? (
        <div className="mt-4 rounded-lg border border-gray-200 p-3 bg-gray-50 space-y-3">
          <p className="text-sm text-gray-700">
            <strong>Category:</strong> {selectedTemplate.category || 'N/A'}
          </p>
          <div>
            <p className="text-sm font-medium text-gray-700">Structure Preview</p>
            <pre className="mt-1 text-xs bg-white border rounded p-2 overflow-x-auto">
              {JSON.stringify(selectedTemplate.components || [], null, 2)}
            </pre>
          </div>

          {variableKeys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {variableKeys.map((key) => (
                <label key={key} className="text-sm text-gray-700">
                  Variable {`{{${key}}}`}
                  <input
                    value={variables[key] || ''}
                    onChange={(event) => handleVariableInput(key, event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">This template has no body variables.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
