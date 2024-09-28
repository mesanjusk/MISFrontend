import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";
import AddOrder1 from "../Pages/addOrder1"; 

export default function AllOrder() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [searchOrder, setSearchOrder] = useState("");
    const [filter, setFilter] = useState("");
    const [tasks, setTasks] = useState([]);
    const [showOrderModal, setShowOrderModal] = useState(false); 
    const [customers, setCustomers] = useState({});
    const [loadingOrders, setLoadingOrders] = useState(true); 
    const [loadingTasks, setLoadingTasks] = useState(true);   

    useEffect(() => {
        const fetchOrders = axios.get("/order/GetOrderList");
        const fetchCustomers = axios.get("/customer/GetCustomersList");

        Promise.all([fetchOrders, fetchCustomers])
            .then(([ordersRes, customersRes]) => {
                if (ordersRes.data.success) {
                    setOrders(ordersRes.data.result);
                } else {
                    setOrders([]);
                }

                if (customersRes.data.success) {
                    const customerMap = customersRes.data.result.reduce((acc, customer) => {
                        if (customer.Customer_uuid && customer.Customer_name) {
                            acc[customer.Customer_uuid] = customer.Customer_name;
                        } else {
                            console.warn("Invalid customer data:", customer);
                        }
                        return acc;
                    }, {});
                    setCustomers(customerMap);
                } else {
                    setCustomers({});
                }
            })
            .catch(err => console.log('Error fetching data:', err))
            .finally(() => setLoadingOrders(false)); 
    }, []);

    useEffect(() => {
        axios.get("/taskgroup/GetTaskgroupList")
            .then(res => {
                if (res.data.success) {
                    const filteredTasks = res.data.result.filter(task =>
                        task.Task_group.trim().toLowerCase() !== "delivered" &&
                        task.Task_group.trim().toLowerCase() !== "cancel"
                    );
                    setTasks(filteredTasks);
                } else {
                    setTasks([]);
                }
            })
            .catch(err => console.log('Error fetching tasks:', err))
            .finally(() => setLoadingTasks(false)); 
    }, []);

    const taskOptions = [...new Set(tasks.map(task => task.Task_group.trim()))];

    const filteredOrders = orders.map(order => {
        const highestStatusTask = order.Status.reduce((prev, current) =>
            (prev.Status_number > current.Status_number) ? prev : current, {});

        const customerName = customers[order.Customer_uuid] || "Unknown";

        return {
            ...order,
            highestStatusTask,
            Customer_name: customerName
        };
    }).filter(order => {
        const matchesSearch = order.Customer_name.toLowerCase().includes(searchOrder.toLowerCase());
        const matchesFilter = filter === "" || order.highestStatusTask.Task === filter;

        return matchesSearch && matchesFilter;
    });

    const handleEditClick = (order) => {
        navigate(`/orderUpdate/${order._id}`);
    };

    const handleOrder = () => {
        setShowOrderModal(true); 
    };

    const closeModal = () => {
        setShowOrderModal(false); 
    };

    return (
        <>
            <TopNavbar />
            <div className="pt-12 pb-20">
                <div className="d-flex flex-wrap bg-white w-100 max-w-md p-2 mx-auto">
                    <input
                        type="text"
                        placeholder="Search by Customer Name"
                        className="form-control text-black bg-gray-100 rounded-full"
                        value={searchOrder}
                        onChange={(e) => setSearchOrder(e.target.value)}
                    />
                </div>
                
                
                <div className="overflow-x-scroll flex space-x-1 py-0" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      <style>{`.overflow-x-scroll::-webkit-scrollbar {display: none; } `}</style>
      
      
    
                    {loadingTasks ? (
                        <div>Loading...</div>
                    ) : taskOptions.length > 0 ? (
                        taskOptions.map((taskGroup, index) => (
                            <button
                                key={index}
                                onClick={() => setFilter(taskGroup)}
                                className={`sanju ${filter === taskGroup ? 'sanju bg-green-200' : 'bg-gray-100'} uppercase rounded-full text-black p-2 text-xs me-1`}
                            >
                                {taskGroup}
                            </button>
                        ))
                    ) : (
                        <div>No tasks available</div>
                    )}
                </div>

                <div className="flex-1"></div>
                <main className="flex flex-1 p-2 overflow-y-auto">
                    <div className="flex flex-col w-100 space-y-2 max-w-md mx-auto">
                        {loadingOrders ? (
                            <div>Loading...</div>
                        ) : filteredOrders.length > 0 ? (
                            filteredOrders.map((order, index) => (
                                <div key={index}>
                                    <div onClick={() => handleEditClick(order)} className="grid grid-cols-5 gap-1 flex items-center p-1 bg-white rounded-lg shadow-inner">
                                        <div className="w-12 h-12 p-2 col-start-1 col-end-1 bg-gray-100 rounded-full flex items-center justify-center">
                                        <strong className="text-l text-gray-500">  {order.Order_Number}</strong> 
                                        </div>
                                        <div className="p-2 col-start-2 col-end-8">
                                            <strong className="text-l text-gray-900">{order.Customer_name}</strong>
                                            <br />
                                            <label className="text-xs">{new Date(order.highestStatusTask.CreatedAt).toLocaleDateString()} - {order.Remark}</label>
                                        </div>
                                        <div className="items-center justify-center text-right col-end-9 col-span-1">
                                            <label className="text-xs pr-2">{new Date(order.highestStatusTask.Delivery_Date).toLocaleDateString()}</label>
                                            <br />
                                            <label className="text-s text-green-500 pr-2">{order.highestStatusTask.Assigned}</label>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div>No orders found</div>
                        )}
                    </div>
                </main>
                <div className="fixed bottom-20 right-8">
                    <button onClick={handleOrder} className="w-12 h-12 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center">
                        <svg className="h-8 w-8 text-white-500" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" />
                            <circle cx="12" cy="12" r="9" />
                            <line x1="9" y1="12" x2="15" y2="12" />
                            <line x1="12" y1="9" x2="12" y2="15" />
                        </svg>
                    </button>
                </div>
            </div>

            {showOrderModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <AddOrder1 closeModal={closeModal} />
                    </div>
                </div>
            )}
            <Footer />
        </>
    );
}
