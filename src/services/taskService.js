import axios from '../apiClient.js';

export const fetchTaskGroups = () => axios.get('/taskgroup/GetTaskgroupList');
export const addTask = (payload) => axios.post('/tasks/addTask', payload);
export const fetchTaskById = (taskId) => axios.get(`/tasks/${taskId}`);
export const updateTask = (taskId, payload) => axios.put(`/tasks/update/${taskId}`, payload);
export const fetchTasks = () => axios.get('/tasks/GetTaskList');
export const deleteTask = (taskId) => axios.delete(`/tasks/Delete/${taskId}`);
