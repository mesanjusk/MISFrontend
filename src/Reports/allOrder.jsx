import React, { useState, useEffect, Suspense, lazy } from "react";
import axios from "axios";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useNavigate } from "react-router-dom";
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";
import enquiry from '../assets/enquiry.svg';
import payment from '../assets/payment.svg';
import reciept from '../assets/reciept.svg';
import FloatingButtons from "../Pages/floatingButton";
import order from '../assets/order.svg';

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
                console.error("Error fetching data:", err);
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
                console.error("Error fetching tasks:", err);
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

    const buttonsList = [
        { onClick: () => navigate('/addTransaction'), src: reciept },
        { onClick: () => navigate('/addTransaction1'), src: payment },
        { onClick: () => navigate('/addOrder1'), src: order },
        { onClick: () => navigate('/addEnquiry'), src: enquiry },
    ];

    return (
        <>
            <div className="order-update-content bg-[#e5ddd5] ">
                <TopNavbar />
                <div className="pt-5 pb-5">

                    {/* Search Bar */}
                    <div className="flex flex-wrap bg-white w-full max-w-xl p-2 mx-auto rounded-full shadow-sm">
                        <input
                            type="text"
                            placeholder="Search by Customer Name"
                            className="form-control text-black bg-transparent rounded-full w-full p-2 focus:outline-none"
                            value={searchOrder}
                            onChange={(e) => setSearchOrder(e.target.value)}
                        />
                    </div>

                    {/* Main Content */}
                    <main className="flex flex-1 p-2 overflow-y-auto">
                        <div className="w-full mx-auto">
                            <SkeletonTheme>
                                {isLoading
                                    ? Array(5).fill().map((_, index) => (
                                        <Skeleton key={index} height={80} width="100%" style={{ marginBottom: "10px" }} />
                                    ))
                                    : taskOptions.map((taskGroup) => {
                                        const taskGroupOrders = filteredOrders.filter(order => order.highestStatusTask?.Task === taskGroup);

                                        if (taskGroupOrders.length === 0) return null;

                                        return (
                                            <div key={taskGroup} className="mb-6 p-4 bg-[#e5ddd5] rounded-lg">
                                                <h3 className="font-semibold text-lg text-green-700 mb-3">{taskGroup}</h3>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                                                    {taskGroupOrders.map((order) => {
                                                        const latestStatusDateRaw = order.highestStatusTask?.CreatedAt;
                                                        const latestStatusDate = latestStatusDateRaw ? new Date(latestStatusDateRaw) : null;
                                                        const currentDate = new Date();

                                                        let timeDifference = 0;
                                                        if (latestStatusDate) {
                                                            const current = new Date(currentDate.setHours(0, 0, 0, 0));
                                                            const latest = new Date(latestStatusDate.setHours(0, 0, 0, 0));
                                                            const diffTime = current - latest;
                                                            timeDifference = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                        }

                                                        let cardClass = "bg-white";
                                                        if (timeDifference === 0) {
                                                            cardClass = "bg-green-100";
                                                        } else if (timeDifference === 1) {
                                                            cardClass = "bg-yellow-100";
                                                        } else if (timeDifference >= 2) {
                                                            cardClass = "bg-red-100";
                                                        }

                                                        return (
                                                            <div
                                                                key={order.Order_uuid}
                                                                className={`${cardClass} rounded-lg p-4 cursor-pointer hover:bg-green-50 transition-all`}
                                                                onClick={() => handleEditClick(order)}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full text-sm font-bold text-green-800">
                                                                        {order.Order_Number}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex justify-between items-center">
                                                                            <div className="font-semibold text-gray-800 truncate">{order.Customer_name}</div>
                                                                            <div className={`text-xs font-medium px-2 py-0.5 rounded-full
                                                                                ${timeDifference === 0
                                                                                    ? 'bg-green-200 text-green-800'
                                                                                    : timeDifference === 1
                                                                                        ? 'bg-yellow-200 text-yellow-800'
                                                                                        : 'bg-red-200 text-red-800'}`}>
                                                                                {timeDifference === 0
                                                                                    ? 'Today'
                                                                                    : timeDifference === 1
                                                                                        ? '1 day '
                                                                                        : `${timeDifference} days delay`}
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {latestStatusDateRaw ? new Date(latestStatusDateRaw).toLocaleDateString() : ''} • {order.Remark}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
                                                                    <span>{order.highestStatusTask?.Delivery_Date ? new Date(order.highestStatusTask.Delivery_Date).toLocaleDateString() : ''}</span>
                                                                    <span className="text-green-500">{order.highestStatusTask?.Assigned}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </SkeletonTheme>
                        </div>
                    </main>

                    <FloatingButtons
                        buttonType="bars"
                        buttonsList={buttonsList}
                        direction="up"
                        buttonClassName="rounded-full bg-green-500 hover:bg-green-600 text-white"
                    />
                </div>

                {/* Modals */}
                <Suspense fallback={
                    <div className="flex justify-center items-center min-h-screen">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    </div>
                }>
                    {showOrderModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
                                <AddOrder1 closeModal={closeModal} />
                            </div>
                        </div>
                    )}

                    {showEditModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
                                <OrderUpdate order={selectedOrder} onClose={closeEditModal} />
                            </div>
                        </div>
                    )}
                </Suspense>

                <Footer />
            </div>
        </>
    );
}
