import apiClient from '../apiClient';

export const whatsappCloudService = {
  exchangeEmbeddedSignupCode: (payload) =>
    apiClient.post('/api/whatsapp/embedded-signup/exchange-code', payload),

  getAccounts: () => apiClient.get('/api/whatsapp/accounts'),

  disconnectAccount: (accountId) =>
    apiClient.delete(`/api/whatsapp/accounts/${accountId}`),

  getTemplates: (accountId) =>
    apiClient.get('/api/whatsapp/templates', {
      params: accountId ? { accountId } : {}
    }),

  sendMessage: (payload) =>
    apiClient.post('/api/whatsapp/messages/send', payload),

  getWebhookLogs: (accountId) =>
    apiClient.get('/api/whatsapp/webhook-logs', {
      params: accountId ? { accountId } : {}
    }),
};
