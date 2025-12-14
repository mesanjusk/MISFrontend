import axios from '../apiClient.js';

export const fetchOrders = () => axios.get('/order/GetOrderList');
export const fetchDeliveredOrders = () => axios.get('/order/GetDeliveredList');
export const updateOrder = (orderId, payload) => axios.put(`/order/update/${orderId}`, payload);
