import axios from '../apiClient.js';

export const fetchUsers = () => axios.get('/user/GetUserList');
