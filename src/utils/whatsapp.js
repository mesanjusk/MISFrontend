export const extractPhoneNumber = (data = {}) =>
  data?.Mobile_number || data?.mobile || data?.phone || '';

export const normalizeWhatsAppPhone = (phone) => {
  let cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }
  return cleanPhone;
};

export const sendWhatsAppText = async ({ axiosInstance, phone, message }) => {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  return axiosInstance.post('/api/whatsapp/send-text', {
    to: cleanPhone,
    body: message,
  });
};

export const sendWhatsAppTemplate = async ({
  axiosInstance,
  phone,
  templateName,
  language = 'en_US',
  bodyParameters = [],
}) => {
  const cleanPhone = normalizeWhatsAppPhone(phone);

  const payload = {
    to: cleanPhone,
    template_name: templateName,
    language,
  };

  if (Array.isArray(bodyParameters) && bodyParameters.length > 0) {
    payload.components = [
      {
        type: 'body',
        parameters: bodyParameters.map((value) => ({
          type: 'text',
          text: String(value ?? ''),
        })),
      },
    ];
  }

  return axiosInstance.post('/api/whatsapp/send-template', payload);
};

export const sendTemplateWithTextFallback = async ({
  axiosInstance,
  phone,
  templateName,
  bodyParameters = [],
  fallbackMessage,
  language = 'en_US',
}) => {
  try {
    return await sendWhatsAppTemplate({
      axiosInstance,
      phone,
      templateName,
      bodyParameters,
      language,
    });
  } catch (error) {
    if (!fallbackMessage) throw error;

    return sendWhatsAppText({
      axiosInstance,
      phone,
      message: fallbackMessage,
    });
  }
};