import axios from '../apiClient.js';

export const fetchCustomers = () => axios.get('/api/customers/GetCustomersList');
export const fetchCustomerGroups = () => axios.get('/api/customergroup/GetCustomergroupList');
export const addCustomerGroup = (payload) => axios.post('/api/customergroup/addCustomergroup', payload);
export const fetchCustomerById = (customerId) => axios.get(`/customer/${customerId}`);
export const updateCustomer = (customerId, payload) => axios.put(`/customer/update/${customerId}`, payload);
export const deleteCustomer = (customerId) => axios.delete(`/customer/DeleteCustomer/${customerId}`);
export const checkDuplicateCustomer = (name) => axios.get(`/customer/checkDuplicateName?name=${name}`);
