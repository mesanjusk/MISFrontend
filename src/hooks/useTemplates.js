import { useCallback, useEffect, useState } from 'react';
import { whatsappCloudService } from '../services/whatsappCloudService';

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

const normalizeTemplates = (response) => {
  const candidates = [
    response,
    response?.templates,
    response?.items,
    response?.data,
    response?.data?.templates,
    response?.data?.items,
    response?.data?.data,
    response?.data?.data?.templates,
    response?.data?.data?.items,
  ];

  const list = candidates.find(Array.isArray) || [];

  return (list || [])
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
          (typeof template?.language === 'string' ? template.language : template?.language?.code) ||
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

let templatesCache = null;
let inFlightPromise = null;
let cacheUsesFallback = false;

export function useTemplates() {
  const [templates, setTemplates] = useState(Array.isArray(templatesCache) ? templatesCache : []);
  const [isLoading, setIsLoading] = useState(!Array.isArray(templatesCache));
  const [usingFallback, setUsingFallback] = useState(cacheUsesFallback);

  const fetchTemplates = useCallback(async ({ force = false } = {}) => {
    if (!force && Array.isArray(templatesCache)) {
      setTemplates(templatesCache);
      setUsingFallback(cacheUsesFallback);
      setIsLoading(false);
      return templatesCache;
    }

    if (inFlightPromise) {
      setIsLoading(true);
      const pendingTemplates = await inFlightPromise;
      setTemplates(pendingTemplates);
      setIsLoading(false);
      return pendingTemplates;
    }

    setIsLoading(true);
    console.log('Fetching templates...');

    inFlightPromise = (async () => {
      try {
        const response = await whatsappCloudService.getTemplates();
        console.log('Templates API response:', response?.data);
        const normalized = normalizeTemplates(response);

        if (normalized.length > 0) {
          templatesCache = normalized;
          cacheUsesFallback = false;
          setUsingFallback(false);
          return normalized;
        }

        templatesCache = fallbackTemplates;
        cacheUsesFallback = true;
        setUsingFallback(true);
        return fallbackTemplates;
      } catch (error) {
        console.error('Templates fetch failed:', error);
        templatesCache = fallbackTemplates;
        cacheUsesFallback = true;
        setUsingFallback(true);
        return fallbackTemplates;
      } finally {
        inFlightPromise = null;
      }
    })();

    const nextTemplates = await inFlightPromise;
    setTemplates(nextTemplates);
    setIsLoading(false);
    return nextTemplates;
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    isLoading,
    usingFallback,
    isEmpty: !isLoading && templates.length === 0,
    refetchTemplates: () => fetchTemplates({ force: true }),
  };
}
