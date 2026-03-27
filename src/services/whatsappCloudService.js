import apiClient from '../apiClient';

export const buildTemplatePayload = ({ to, template }) => {
  const parameters = Array.isArray(template?.parameters) ? template.parameters : [];

  return {
    to,
    template_name: template?.name,
    language: template?.language,
    components: [
      {
        type: 'body',
        parameters: parameters.map((value) => ({
          type: 'text',
          text: String(value ?? ''),
        })),
      },
    ],
  };
};

export const whatsappCloudService = {
  sendTextMessage: (payload) => apiClient.post('/api/whatsapp/send-text', payload),
  sendTemplateMessage: (payload) => apiClient.post('/api/whatsapp/send-template', payload),
  getMessages: () => apiClient.get('/api/whatsapp/messages'),
  getTemplates: () => apiClient.get('/api/whatsapp/templates'),
};
