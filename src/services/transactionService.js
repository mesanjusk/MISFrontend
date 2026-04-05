import axios from '../apiClient.js';

export const fetchTransactions = () => axios.get('/transaction');
export const addTransaction = (payload, config) => axios.post('/transaction/addTransaction', payload, config);
export const updateTransaction = (transactionId, payload) => axios.put(`/transaction/updateTransaction/${transactionId}`, payload);
export const deleteTransactionById = (transactionId) => axios.delete(`/transaction/deleteByTransactionId/${transactionId}`);
export const deleteTransactionEntry = (transactionId, accountId) => axios.delete(`/transaction/deleteEntry/${transactionId}/${accountId}`);
export const sendTaskMessage = (payload) => axios.post('/usertask/send-message', payload);
