import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import OrderUpdate from "../Pages/OrderUpdate";
import { LoadingSpinner } from "../Components";

export default function AllOrder() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [searchOrder, setSearchOrder] = useState("");
  const [tasks, setTasks] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customers, setCustomers] = useState({});
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(true);

  const toInt = (v) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };
  const fmtDDMMYYYY = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Fetch orders + customers
  useEffect(() => {
    const fetchData = async () => {
      setIsOrdersLoading(true);
      try {
        const [ordersRes, customersRes] = await Promise.all([
          axios.get("/order/GetOrderList"),
          axios.get("/customer/GetCustomersList"),
        ]);

        const orderList = ordersRes?.data?.success ? ordersRes.data.result ?? [] : [];
        setOrders(Array.isArray(orderList) ? orderList : []);

        if (customersRes?.data?.success) {
          const customerMap = (customersRes.data.result ?? []).reduce((acc, customer) => {
            if (customer.Customer_uuid && customer.Customer_name) {
              acc[customer.Customer_uuid] = customer.Customer_name;
            }
            return acc;
          }, {});
          setCustomers(customerMap);
        } else {
          setCustomers({});
        }
      } catch (err) {
        alert("Failed to fetch orders or customers.");
        setOrders([]);
        setCustomers({});
      } finally {
        setIsOrdersLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      setIsTasksLoading(true);
      try {
        const res = await axios.get("/taskgroup/GetTaskgroupList");
        if (res?.data?.success) {
          const filteredTasks = (res.data.result ?? []).filter(
            (task) => !["delivered", "cancel"].includes((task.Task_group || "").trim().toLowerCase())
          );
          setTasks(filteredTasks);
        } else {
          setTasks([]);
        }
      } catch (err) {
        setTasks([]);
      } finally {
        setIsTasksLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const taskOptions = useMemo(() => {
    const set = new Set(
      tasks
        .map((t) => (t?.Task_group || "").trim())
        .filter(Boolean)
    );
    return Array.from(set);
  }, [tasks]);

  const filteredOrders = useMemo(() => {
    const normalized = orders.map((order) => {
      const statusArr = Array.isArray(order.Status) ? order.Status : [];
      const highestStatusTask =
        statusArr.length > 0
          ? statusArr.reduce((prev, current) =>
              toInt(prev.Status_number) > toInt(current.Status_number) ? prev : current
            )
          : null;

      const customerName = customers[order.Customer_uuid] || "Unknown";

      return {
        ...order,
        highestStatusTask,
        Customer_name: customerName,
      };
    });

    const q = (searchOrder || "").trim().toLowerCase();
    if (!q) return normalized;

    return normalized.filter((order) => {
      const byName = (order.Customer_name || "").toLowerCase().includes(q);
      const byNo = (String(order.Order_Number || "")).toLowerCase().includes(q);
      return byName || byNo;
    });
  }, [orders, customers, searchOrder]);

  const handleEditClick = useCallback((order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedOrder(null);
  }, []);

  const allLoading = isOrdersLoading || isTasksLoading;

  return (
    <>
      <div className="order-update-content min-h-screen">
        <div className="pt-2 pb-2">
          {/* Search bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-3xl mx-auto mb-2">
            <div className="flex bg-white flex-1 min-w-[240px] p-2 rounded-full shadow-sm">
              <input
                type="text"
                placeholder="Search by Customer Name or Order No."
                className="form-control text-black bg-transparent rounded-full w-full p-2 focus:outline-none"
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
              />
            </div>
          </div>

          <main className="flex flex-1 p-2 overflow-y-auto">
            <div className="w-full mx-auto">
              {allLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : taskOptions.length === 0 ? (
                <div className="text-center text-gray-400 py-10">No tasks found.</div>
              ) : (
                taskOptions.map((taskGroup) => {
                  const taskGroupOrders = filteredOrders
                    .filter((order) => order?.highestStatusTask?.Task === taskGroup)
                    .sort((a, b) => {
                      const da = new Date(a?.highestStatusTask?.CreatedAt || 0).getTime();
                      const db = new Date(b?.highestStatusTask?.CreatedAt || 0).getTime();
                      return db - da;
                    });

                  if (taskGroupOrders.length === 0) return null;

                  return (
                    <div key={taskGroup} className="mb-2 p-2 rounded-lg">
                      <h3 className="font-semibold text-lg text-green-700 mb-3">{taskGroup}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-2">
                        {taskGroupOrders.map((order) => {
                          const latestStatusDate = order?.highestStatusTask?.CreatedAt
                            ? new Date(order.highestStatusTask.CreatedAt)
                            : null;

                          let timeDifference = 0;
                          let formattedDate = "";
                          if (latestStatusDate) {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const latest = new Date(latestStatusDate);
                            latest.setHours(0, 0, 0, 0);
                            const diffTime = today.getTime() - latest.getTime();
                            timeDifference = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            formattedDate = fmtDDMMYYYY(latestStatusDate);
                          }

                          let cardClass = "bg-white";
                          if (timeDifference === 0) cardClass = "bg-green-100";
                          else if (timeDifference === 1) cardClass = "bg-yellow-100";
                          else if (timeDifference >= 2) cardClass = "bg-red-100";

                          return (
                            <div
                              key={order.Order_uuid || order._id}
                              className={`${cardClass} rounded-lg p-2 cursor-pointer hover:bg-green-50 transition-all`}
                              onClick={() => handleEditClick(order)}
                            >
                              <div className="font-medium text-gray-800 truncate mb-1 text-sm">
                                {order.Customer_name}
                              </div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold text-green-700">
                                  {order.Order_Number || "-"}
                                </span>
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                    ${
                                      timeDifference === 0
                                        ? "bg-green-200 text-green-800"
                                        : timeDifference === 1
                                        ? "bg-yellow-200 text-yellow-800"
                                        : "bg-red-200 text-red-800"
                                    }
                                  `}
                                >
                                  {timeDifference === 0
                                    ? "Today"
                                    : timeDifference === 1
                                    ? "1 day"
                                    : `${timeDifference} days`}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 text-right">{formattedDate}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>

        {showEditModal && (
          <Modal onClose={closeEditModal}>
            <OrderUpdate order={selectedOrder} onClose={closeEditModal} />
          </Modal>
        )}
      </div>
    </>
  );
}

function Modal({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      aria-modal="true"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute right-2 top-2 text-xl text-gray-400 hover:text-green-500"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
