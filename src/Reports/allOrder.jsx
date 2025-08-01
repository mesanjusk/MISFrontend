import React, { useState, useEffect, Suspense, lazy } from "react";
import axios from "axios";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useNavigate } from "react-router-dom";

const AddOrder1 = lazy(() => import("../Pages/addOrder1"));
const OrderUpdate = lazy(() => import("./orderUpdate"));

export default function AllOrder() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [searchOrder, setSearchOrder] = useState("");
    const [tasks, setTasks] = useState([]);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [customers, setCustomers] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [ordersRes, customersRes] = await Promise.all([
                    axios.get("/order/GetOrderList"),
                    axios.get("/customer/GetCustomersList")
                ]);

                setOrders(ordersRes.data.success ? ordersRes.data.result : []);

                if (customersRes.data.success) {
                    const customerMap = customersRes.data.result.reduce((acc, customer) => {
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
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await axios.get("/taskgroup/GetTaskgroupList");
                if (res.data.success) {
                    const filteredTasks = res.data.result.filter(task =>
                        !["delivered", "cancel"].includes(task.Task_group.trim().toLowerCase())
                    );
                    setTasks(filteredTasks);
                } else {
                    setTasks([]);
                }
            } catch (err) {
                setTasks([]);
            }
        };

        fetchTasks();
    }, []);

    const taskOptions = [...new Set(tasks.map((task) => task.Task_group.trim()))];

    const filteredOrders = orders
        .map((order) => {
            const highestStatusTask = (order.Status && order.Status.length > 0)
                ? order.Status.reduce((prev, current) =>
                    prev.Status_number > current.Status_number ? prev : current
                ) : {};

            const customerName = customers[order.Customer_uuid] || "Unknown";

            return {
                ...order,
                highestStatusTask,
                Customer_name: customerName,
            };
        })
        .filter((order) => {
            const matchesSearch =
                searchOrder === "" ||
                order.Customer_name.toLowerCase().includes(searchOrder.toLowerCase());

            return matchesSearch;
        });

    const handleEditClick = (order) => {
        setSelectedOrder(order);
        setShowEditModal(true);
    };
    const handleOrder = () => setShowOrderModal(true);
    const closeModal = () => setShowOrderModal(false);
    const closeEditModal = () => {
        setShowEditModal(false);
        setSelectedOrder(null);
    };

    return (
        <>
            <div className="order-update-content min-h-screen">
                <div className="pt-2 pb-2">
                    <div className="flex flex-wrap bg-white w-full max-w-xl p-2 mx-auto rounded-full shadow-sm">
                        <input
                            type="text"
                            placeholder="Search by Customer Name"
                            className="form-control text-black bg-transparent rounded-full w-full p-2 focus:outline-none"
                            value={searchOrder}
                            onChange={(e) => setSearchOrder(e.target.value)}
                        />
                    </div>

                    <main className="flex flex-1 p-2 overflow-y-auto">
                        <div className="w-full mx-auto">
                            <SkeletonTheme>
                                {isLoading
                                    ? Array(5).fill().map((_, index) => (
                                        <Skeleton key={index} height={80} width="100%" style={{ marginBottom: "5px" }} />
                                    ))
                                    : taskOptions.length === 0 ? (
                                        <div className="text-center text-gray-400 py-10">No tasks found.</div>
                                    ) : (
                                        taskOptions.map((taskGroup) => {
                                            const taskGroupOrders = filteredOrders.filter(order => order.highestStatusTask?.Task === taskGroup);

                                            if (taskGroupOrders.length === 0) return null;

                                            return (
                                                <div key={taskGroup} className="mb-2 p-2  rounded-lg">
                                                    <h3 className="font-semibold text-lg text-green-700 mb-3">{taskGroup}</h3>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-2">
                                                        {taskGroupOrders.map((order) => {
                                                            let latestStatusDate = order.highestStatusTask?.CreatedAt
                                                                ? new Date(order.highestStatusTask.CreatedAt)
                                                                : null;
                                                            let timeDifference = 0;
                                                            let formattedDate = '';
                                                            if (latestStatusDate) {
                                                                const today = new Date();
                                                                today.setHours(0, 0, 0, 0);
                                                                const latest = new Date(latestStatusDate);
                                                                latest.setHours(0, 0, 0, 0);
                                                                const diffTime = today - latest;
                                                                timeDifference = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                                formattedDate = latestStatusDate.toLocaleDateString();
                                                            }
                                                            let cardClass = "bg-white";
                                                            if (timeDifference === 0) cardClass = "bg-green-100";
                                                            else if (timeDifference === 1) cardClass = "bg-yellow-100";
                                                            else if (timeDifference >= 2) cardClass = "bg-red-100";

                                                            return (
                                                                <div
                                                                    key={order.Order_uuid}
                                                                    className={`${cardClass} rounded-lg p-2 cursor-pointer hover:bg-green-50 transition-all`}
                                                                    onClick={() => handleEditClick(order)}
                                                                >
                                                                    {/* Row 1: Customer Name */}
                                                                    <div className="font-medium text-gray-800 truncate mb-1 text-sm">
                                                                        {order.Customer_name}
                                                                    </div>

                                                                    {/* Row 2: Order Number and Delay */}
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="text-sm font-semibold text-green-700">{order.Order_Number}</span>
                                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                                                            ${timeDifference === 0
                                                                                ? 'bg-green-200 text-green-800'
                                                                                : timeDifference === 1
                                                                                    ? 'bg-yellow-200 text-yellow-800'
                                                                                    : 'bg-red-200 text-red-800'}
                                                                        `}>
                                                                            {timeDifference === 0
                                                                                ? 'Today'
                                                                                : timeDifference === 1
                                                                                    ? '1 day'
                                                                                    : `${timeDifference} days`}
                                                                        </span>
                                                                    </div>

                                                                    {/* Row 3: Latest Status Date */}
                                                                    <div className="text-xs text-gray-500 text-right">{formattedDate}</div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                            </SkeletonTheme>
                        </div>
                    </main>

                </div>

                <Suspense fallback={
                    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-30 z-50">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    </div>
                }>
                    {showOrderModal && (
                        <Modal onClose={closeModal}>
                            <AddOrder1 closeModal={closeModal} />
                        </Modal>
                    )}
                    {showEditModal && (
                        <Modal onClose={closeEditModal}>
                            <OrderUpdate order={selectedOrder} onClose={closeEditModal} />
                        </Modal>
                    )}
                </Suspense>
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
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 relative">
                <button
                    className="absolute right-2 top-2 text-xl text-gray-400 hover:text-green-500"
                    onClick={onClose}
                    aria-label="Close"
                    type="button"
                >×</button>
                {children}
            </div>
        </div>
    );
}
