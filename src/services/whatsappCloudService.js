import apiClient from '../apiClient';

export const whatsappCloudService = {
  sendTextMessage: (payload) => apiClient.post('/api/whatsapp/send-text', payload),
  getMessages: () => apiClient.get('/api/whatsapp/messages'),
};
