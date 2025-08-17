import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import OrderUpdate from "../Pages/OrderUpdate";
import UpdateDelivery from "../Pages/UpdateDelivery";
import { LoadingSpinner } from "../Components";

export default function AllOrder() {
  const [orders, setOrders] = useState([]);
  const [searchOrder, setSearchOrder] = useState("");
  const [tasks, setTasks] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);       // OrderUpdate
  const [showDeliveryModal, setShowDeliveryModal] = useState(false); // UpdateDelivery
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
            (task) =>
              !["delivered", "cancel"].includes(
                (task.Task_group || "").trim().toLowerCase()
              )
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
      const byNo = String(order.Order_Number || "").toLowerCase().includes(q);
      return byName || byNo;
    });
  }, [orders, customers, searchOrder]);

  // Open OrderUpdate on whole card click
  const handleCardClick = useCallback((order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  }, []);

  // Open UpdateDelivery on edit icon/button click
  const handleEditClick = useCallback((order) => {
    setSelectedOrder(order);
    setShowDeliveryModal(true);
  }, []);

  const closeOrderModal = useCallback(() => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  }, []);

  const closeDeliveryModal = useCallback(() => {
    setShowDeliveryModal(false);
    setSelectedOrder(null);
  }, []);

  const allLoading = isOrdersLoading || isTasksLoading;

  return (
    <>
      <div className="order-update-content min-h-screen">
        <div className="pt-2 pb-2">
          {/* Search bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-3xl mx-auto mb-3">
            <div className="flex bg-white flex-1 min-w-[240px] p-2 rounded-full ">
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
                <div className="flex justify-center py-6">
                  <LoadingSpinner />
                </div>
              ) : taskOptions.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  No tasks found.
                </div>
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
                    <div key={taskGroup} className="mb-4 p-3 rounded-lg ">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg text-green-700">
                          {taskGroup}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                          {taskGroupOrders.length} orders
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
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

                          const chipClass =
                            timeDifference === 0
                              ? "bg-green-200 text-green-800"
                              : timeDifference === 1
                              ? "bg-yellow-200 text-yellow-800"
                              : "bg-red-200 text-red-800";

                          return (
                            <div
                              key={order.Order_uuid || order._id}
                              className="relative rounded-xl border border-gray-200 bg-white p-3 hover:shadow-md transition cursor-pointer"
                              onClick={() => handleCardClick(order)}  // WHOLE CARD → OrderUpdate
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") handleCardClick(order);
                              }}
                            >
                              {/* Edit icon — opens UpdateDelivery (stop propagation) */}
                              <button
                                type="button"
                                className="absolute top-2 right-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-green-600 text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                                onClick={(e) => {
                                  e.stopPropagation(); // prevent card click
                                  handleEditClick(order);
                                }}
                                title="Edit (Update Delivery)"
                                aria-label="Edit order"
                              >
                                {/* simple pencil svg icon */}
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="w-3.5 h-3.5"
                                  aria-hidden="true"
                                >
                                  <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.486 8.486a2 2 0 0 1-.878.506l-3.182.91a.5.5 0 0 1-.62-.62l.91-3.182a2 2 0 0 1 .506-.878l8.486-8.486Zm1.414 1.414L7.5 12.5l-1 1 1-1 7.5-7.5Z" />
                                </svg>
                                
                              </button>

                              <div className="flex items-start gap-2 pr-12">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 truncate text-sm">
                                    {order.Customer_name}
                                  </div>
                                  <div className="mt-1 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-green-700">
                                      {order.Order_Number || "-"}
                                    </span>
                                    <span
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${chipClass}`}
                                    >
                                      {timeDifference === 0
                                        ? "Today"
                                        : timeDifference === 1
                                        ? "1 day"
                                        : `${timeDifference} days`}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-[11px] text-gray-500">
                                    {formattedDate}
                                  </div>
                                </div>
                              </div>
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

        {/* OrderUpdate modal (whole card) */}
        {showOrderModal && (
          <Modal onClose={closeOrderModal}>
            <OrderUpdate order={selectedOrder} onClose={closeOrderModal} />
          </Modal>
        )}

        {/* UpdateDelivery modal (edit icon) */}
        {showDeliveryModal && (
          <Modal onClose={closeDeliveryModal}>
            <UpdateDelivery order={selectedOrder} onClose={closeDeliveryModal} />
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
      <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 relative max-h-[90vh] overflow-y-auto">
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
