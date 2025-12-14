import axios from '../apiClient.js';

export const fetchAttendanceList = () => axios.get('/attendance/GetAttendanceList');
