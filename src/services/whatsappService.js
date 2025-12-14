import axios from '../apiClient.js';

export const fetchSessions = () => axios.get('/whatsapp/sessions');
export const sendTestMessage = (payload) => axios.post('/whatsapp/send-test', payload);
export const resetSession = (sessionId) => axios.post('/whatsapp/reset-session', { sessionId });
export const startSession = (sessionId) => axios.post('/whatsapp/start-session', { sessionId });
export const fetchSessionQr = (sessionId) => axios.get(`/whatsapp/session/${sessionId}/qr`);
