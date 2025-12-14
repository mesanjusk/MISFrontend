import axios from '../apiClient.js';

export const fetchOrders = () => axios.get('/order/GetOrderList');
export const fetchDeliveredOrders = () => axios.get('/order/GetDeliveredList');
export const updateOrder = (orderId, payload) => axios.put(`/order/update/${orderId}`, payload);
export const fetchBillList = () => axios.get('/order/GetBillList');
export const addOrder = (payload) => axios.post('/order/addOrder', payload);
export const fetchOrderStepsById = (orderId) => axios.get(`/order/getStepsByOrderId/${orderId}`);
export const updateOrderSteps = (payload) => axios.post('/order/updateOrderSteps', payload);
export const toggleOrderStep = (payload) => axios.post('/order/steps/toggle', payload);
export const addOrderStatus = (payload) => axios.post('/order/addStatus', payload);
export const updateOrderDelivery = (orderId, payload) => axios.put(`/order/updateDelivery/${orderId}`, payload);
