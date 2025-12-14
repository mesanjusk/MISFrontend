import axios from '../apiClient.js';

export const fetchPriorities = () => axios.get('/priority/GetPriorityList');
export const deletePriority = (priorityId) => axios.delete(`/priority/Delete/${priorityId}`);
