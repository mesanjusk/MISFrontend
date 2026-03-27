import apiClient from '../apiClient';

export const whatsappCloudService = {
  sendTextMessage: (payload) => apiClient.post('/api/whatsapp/send-text', payload),
  sendTemplateMessage: (payload) => apiClient.post('/api/whatsapp/send-template', payload),
  getMessages: () => apiClient.get('/api/whatsapp/messages'),
  getTemplates: () => apiClient.get('/api/whatsapp/templates'),
};
