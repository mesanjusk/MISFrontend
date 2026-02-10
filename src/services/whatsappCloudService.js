import apiClient from '../apiClient';

export const whatsappCloudService = {
  exchangeEmbeddedSignupCode: (payload) =>
    apiClient.post('/whatsapp-cloud/embedded-signup/exchange-code', payload),

  getAccounts: () => apiClient.get('/whatsapp-cloud/accounts'),
  disconnectAccount: (accountId) => apiClient.delete(`/whatsapp-cloud/accounts/${accountId}`),

  getTemplates: (accountId) =>
    apiClient.get('/whatsapp-cloud/templates', { params: accountId ? { accountId } : {} }),

  sendMessage: (payload) => apiClient.post('/whatsapp-cloud/messages/send', payload),

  getWebhookLogs: (accountId) =>
    apiClient.get('/whatsapp-cloud/webhook-logs', { params: accountId ? { accountId } : {} }),
};
