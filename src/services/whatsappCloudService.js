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

const getCloudinaryResourceType = (type) => {
  if (type === 'image' || type === 'video') return type;
  return 'raw';
};

export const whatsappCloudService = {
  sendTextMessage: (payload) => apiClient.post('/api/whatsapp/send-text', payload),
  sendTemplateMessage: (payload) => apiClient.post('/api/whatsapp/send-template', payload),
  sendMediaMessage: (payload) => apiClient.post('/api/whatsapp/send-media', payload),
  getMessages: () => apiClient.get('/api/whatsapp/messages'),
  getTemplates: () => apiClient.get('/api/whatsapp/templates'),
  uploadToCloudinary: async ({ file, type, cloudName, uploadPreset }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const resourceType = getCloudinaryResourceType(type);
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Cloudinary upload failed.');
    }

    return response.json();
  },
};
