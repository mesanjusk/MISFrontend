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
