import {
  DEFAULT_TEMPLATE_LANGUAGE,
  TEMPLATE_VARIABLE_COUNTS,
  buildTemplateBodyParameters,
} from '../constants/whatsappTemplates';

const ADMIN_ALERT_PHONE = '919372333633';

export const extractPhoneNumber = (data = {}) =>
  data?.Mobile_number || data?.mobile || data?.phone || data?.Phone || data?.User_mobile || '';

export const normalizeWhatsAppPhone = (phone) => {
  let cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
  return cleanPhone;
};

export const sendWhatsAppText = async ({ axiosInstance, phone, message }) => {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  return axiosInstance.post('/api/whatsapp/send-text', { to: cleanPhone, body: String(message || '').trim() });
};

export const sendTemplateMessage = async ({
  axiosInstance,
  phone,
  templateName,
  language = DEFAULT_TEMPLATE_LANGUAGE,
  bodyParameters = [],
}) => {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  const expectedCount = TEMPLATE_VARIABLE_COUNTS[templateName] ?? bodyParameters.length;
  const values = Array.isArray(bodyParameters)
    ? bodyParameters.slice(0, expectedCount).map((item) => (item == null ? '-' : String(item).trim() || '-'))
    : [];

  while (values.length < expectedCount) values.push('-');

  const payload = {
    to: cleanPhone,
    template_name: templateName,
    language,
    components: [{
      type: 'body',
      parameters: buildTemplateBodyParameters(templateName, values),
    }],
  };

  return axiosInstance.post('/api/whatsapp/send-template', payload);
};

export const sendTemplateWithTextFallback = async ({
  axiosInstance,
  phone,
  templateName,
  language = DEFAULT_TEMPLATE_LANGUAGE,
  bodyParameters = [],
  fallbackMessage = '',
}) => {
  try {
    return await sendTemplateMessage({ axiosInstance, phone, templateName, language, bodyParameters });
  } catch (error) {
    if (fallbackMessage) {
      try {
        return await sendWhatsAppText({ axiosInstance, phone, message: fallbackMessage });
      } catch {
        throw error;
      }
    }
    throw error;
  }
};

export const sendAdminAlertText = async ({ axiosInstance, message, phone = ADMIN_ALERT_PHONE }) => {
  if (!message) return null;
  try {
    return await sendWhatsAppText({ axiosInstance, phone, message });
  } catch {
    return null;
  }
};
