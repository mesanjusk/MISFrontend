import axios from '../apiClient.js';

export const fetchSessions = () => axios.get('/whatsapp/sessions');
export const sendTestMessage = (payload) => axios.post('/whatsapp/send-test', payload);
