import axios from "../apiClient.js";

export const fetchOrders = () => axios.get("/order/GetOrderList");
export const fetchDeliveredOrders = () => axios.get("/order/GetDeliveredList");

/**
 * ⚠️ Your backend route is: /order/updateOrder/:id  (NOT /order/update/:id)
 * Keep this fixed to avoid 404.
 */
export const updateOrder = (orderId, payload) =>
  axios.put(`/order/updateOrder/${orderId}`, payload);

export const addOrder = (payload) => axios.post("/order/addOrder", payload);
export const fetchBillList = () => axios.get("/order/GetBillList");

export const fetchOrderStepsById = (orderId) =>
  axios.get(`/order/getStepsByOrderId/${orderId}`);

export const updateOrderSteps = (payload) => axios.post("/order/updateOrderSteps", payload);
export const toggleOrderStep = (payload) => axios.post("/order/steps/toggle", payload);
export const addOrderStatus = (payload) => axios.post("/order/addStatus", payload);

export const updateOrderDelivery = (orderId, payload) =>
  axios.put(`/order/updateDelivery/${orderId}`, payload);

/* ---------------- Bills: NEW ---------------- */

/**
 * ✅ Paginated bills list (50 at a time)
 * Backend endpoint we will add: GET /order/GetBillListPaged
 * Query: page, limit, search, task, paid
 */
export const fetchBillListPaged = ({
  page = 1,
  limit = 50,
  search = "",
  task = "",
  paid = "", // "", "paid", "unpaid"
} = {}) => {
  return axios.get("/order/GetBillListPaged", {
    params: { page, limit, search, task, paid },
  });
};

/**
 * ✅ Persist paid/unpaid
 * Backend endpoint we will add: PATCH /order/bills/:id/status
 */
export const updateBillStatus = (orderId, status, meta = {}) => {
  return axios.patch(`/order/bills/${orderId}/status`, { status, ...meta });
};
