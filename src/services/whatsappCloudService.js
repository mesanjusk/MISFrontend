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

const getCloudinaryResourceType = ({ type, fileType }) => {
  const normalizedType = String(type || '').toLowerCase();
  const normalizedFileType = String(fileType || '').toLowerCase();

  if (normalizedType === 'image' || normalizedType.startsWith('image/') || normalizedFileType.startsWith('image/')) return 'image';
  if (normalizedType === 'video' || normalizedType.startsWith('video/') || normalizedFileType.startsWith('video/')) return 'video';
  return 'raw';
};

export const whatsappCloudService = {
  sendTextMessage: (payload) => apiClient.post('/api/whatsapp/send-text', payload),
  sendTemplateMessage: (payload) => apiClient.post('/api/whatsapp/send-template', payload),
  sendMediaMessage: (payload) => apiClient.post('/api/whatsapp/send-media', payload),
  getMessages: () => apiClient.get('/api/whatsapp/messages'),
  getTemplates: () => apiClient.get('/api/whatsapp/templates'),

  getAutoReplyRules: async () => {
    const candidates = ['/api/whatsapp/auto-replies', '/api/whatsapp/auto-reply-rules', '/api/whatsapp/auto-reply'];
    let lastError = null;

    for (const endpoint of candidates) {
      try {
        const response = await apiClient.get(endpoint);
        return response;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  },
  createAutoReplyRule: async (payload) => {
    const candidates = ['/api/whatsapp/auto-replies', '/api/whatsapp/auto-reply-rules', '/api/whatsapp/auto-reply'];
    let lastError = null;

    for (const endpoint of candidates) {
      try {
        const response = await apiClient.post(endpoint, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        return response;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  },
  uploadToCloudinary: async ({ file, type, cloudName, uploadPreset }) => {
    const resolvedCloudName = cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dadcprflr';
    const resolvedUploadPreset = uploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'mern-images';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', resolvedUploadPreset);

    const resourceType = getCloudinaryResourceType({ type, fileType: file?.type });
    const endpoint = `https://api.cloudinary.com/v1_1/${resolvedCloudName}/${resourceType}/upload`;

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    let data = {};
    try {
      data = await response.json();
    } catch (parseError) {
      data = { error: { message: 'Invalid Cloudinary response payload' } };
      console.error('Cloudinary response parse failed:', parseError);
    }

    if (!response.ok) {
      console.error('Cloudinary upload failed:', {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        resourceType,
        fileType: file?.type,
        uploadPreset: resolvedUploadPreset,
        response: data,
      });
      throw new Error(data?.error?.message || 'Cloudinary upload failed.');
    }

    return data?.secure_url || '';
  },
};
