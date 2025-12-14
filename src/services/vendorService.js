import axios from '../apiClient.js';

export const addVendor = (payload) => axios.post('/vendor/addVendor', payload);
