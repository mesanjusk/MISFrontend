import { useEffect, useMemo, useState } from 'react';
import { whatsappCloudService } from '../../services/whatsappCloudService';

const fallbackTemplates = [
  {
    name: 'order_update',
    language: 'en',
    category: 'utility',
    body: 'Hi {{1}}, your order {{2}} is now {{3}}.',
  },
  {
    name: 'promo_offer',
    language: 'en',
    category: 'marketing',
    body: 'Hello {{1}}, enjoy {{2}}% off with code {{3}}.',
  },
  {
    name: 'otp_auth',
    language: 'en',
    category: 'auth',
    body: 'Your OTP for login is {{1}}. It expires in {{2}} minutes.',
  },
];

const normalizeTemplates = (payload) => {
  const lists = [
    payload,
    payload?.templates,
    payload?.items,
    payload?.data,
    payload?.data?.templates,
    payload?.data?.items,
  ];

  const list = lists.find(Array.isArray);
  if (!list?.length) return [];

  return list
    .filter(Boolean)
    .map((template) => {
      const components = Array.isArray(template?.components) ? template.components : [];
      const bodyComponent = components.find((component) =>
        String(component?.type || '').toUpperCase() === 'BODY'
      );

      return {
        ...template,
        name: template?.name || template?.templateName || 'unnamed_template',
        language:
          (typeof template?.language === 'string'
            ? template.language
            : template?.language?.code) ||
          template?.lang ||
          template?.languageCode ||
          'en',
        category: String(template?.category || 'utility').toLowerCase(),
        body:
          template?.body ||
          template?.content ||
          bodyComponent?.text ||
          'Template preview unavailable.',
      };
    });
};

const getVariableCount = (body) => {
  const matches = String(body || '').match(/\{\{\d+\}\}/g) || [];
  const numbers = matches
    .map((token) => Number(token.replace(/\D/g, '')))
    .filter((value) => Number.isFinite(value));

  if (!numbers.length) return 0;
  return Math.max(...numbers);
};

export default function TemplateSelector({ selectedTemplate, onTemplateChange, disabled = false }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await whatsappCloudService.getTemplates();
        const normalized = normalizeTemplates(response?.data?.data ?? response?.data ?? []);

        if (!mounted) return;

        if (normalized.length > 0) {
          setTemplates(normalized);
          setUsingFallback(false);
          return;
        }

        setTemplates(fallbackTemplates);
        setUsingFallback(true);
      } catch (error) {
        if (!mounted) return;
        setTemplates(fallbackTemplates);
        setUsingFallback(true);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadTemplates();

    return () => {
      mounted = false;
    };
  }, []);

  const resolvedSelectedTemplate = useMemo(() => {
    if (!selectedTemplate?.name) return null;

    return templates.find(
      (template) =>
        template.name === selectedTemplate.name &&
        template.language === selectedTemplate.language
    ) || selectedTemplate;
  }, [templates, selectedTemplate]);

  const variableCount = getVariableCount(resolvedSelectedTemplate?.body);
  const parameters = Array.from({ length: variableCount }).map((_, index) => selectedTemplate?.parameters?.[index] || '');

  const preview = useMemo(() => {
    if (!resolvedSelectedTemplate?.body) return '';

    return parameters.reduce(
      (text, param, index) => text.replaceAll(`{{${index + 1}}}`, param || `{{${index + 1}}}`),
      resolvedSelectedTemplate.body
    );
  }, [resolvedSelectedTemplate, parameters]);

  const handleSelect = (value) => {
    if (!value) {
      onTemplateChange(null);
      return;
    }

    const parsed = JSON.parse(value);
    const template = templates.find(
      (item) => item.name === parsed.name && item.language === parsed.language
    );

    if (!template) return;

    onTemplateChange({
      ...template,
      parameters: Array.from({ length: getVariableCount(template.body) }).map(() => ''),
    });
  };

  const updateParameter = (index, value) => {
    onTemplateChange({
      ...(resolvedSelectedTemplate || {}),
      parameters: parameters.map((param, currentIndex) =>
        currentIndex === index ? value : param
      ),
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-gray-900">Template Selector</h4>
        {usingFallback ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            Local templates
          </span>
        ) : null}
      </div>

      <label className="mt-3 block text-sm text-gray-700">
        Choose Template
        <select
          disabled={disabled || isLoading}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
          value={resolvedSelectedTemplate ? JSON.stringify({ name: resolvedSelectedTemplate.name, language: resolvedSelectedTemplate.language }) : ''}
          onChange={(event) => handleSelect(event.target.value)}
        >
          <option value="">Select template</option>
          {templates.map((template) => (
            <option
              key={`${template.name}-${template.language}`}
              value={JSON.stringify({ name: template.name, language: template.language })}
            >
              {template.name} ({template.language}) • {template.category}
            </option>
          ))}
        </select>
      </label>

      {resolvedSelectedTemplate ? (
        <>
          {parameters.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {parameters.map((value, index) => (
                <label key={index} className="text-sm text-gray-700">
                  Variable {index + 1}
                  <input
                    value={value}
                    disabled={disabled}
                    onChange={(event) => updateParameter(index, event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder={`Enter value for {{${index + 1}}}`}
                  />
                </label>
              ))}
            </div>
          ) : null}

          <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Preview</p>
            <p className="mt-1 whitespace-pre-wrap">{preview || resolvedSelectedTemplate.body}</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
