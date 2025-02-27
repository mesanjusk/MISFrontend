import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";
import BillUpdate from "../Reports/billUpdate";
import AddOrder1 from "../Pages/addOrder1";

export default function AllBills() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [searchOrder, setSearchOrder] = useState("");
    const [filter, setFilter] = useState("");
    const [customers, setCustomers] = useState({});
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
      const [showOrderModal, setShowOrderModal] = useState(false);

    function addOrder1() {
        navigate("/addOrder1");
    }

    useEffect(() => {
        const fetchOrders = axios.get("/order/GetBillList");
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
            .catch(err => console.log('Error fetching data:', err));
    }, []);

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

        const task = (order.highestStatusTask.Task || "").trim().toLowerCase();
        const filterValue = filter.trim().toLowerCase();
        const matchesFilter = filterValue === "" || task === filterValue;

        return matchesSearch && matchesFilter;
    });

    const handleEditClick = (order) => {
        setSelectedOrder(order); 
        setShowEditModal(true);  
    };

    const closeEditModal = () => {
        setShowEditModal(false); 
        setSelectedOrder(null);  
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
                <main className="flex flex-1 p-2 overflow-y-auto">
                    <div className="flex flex-col w-100 space-y-2 max-w-md mx-auto">
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map((order, index) => (
                                <div key={index}>
                                    <div onClick={() => handleEditClick(order)} className="grid grid-cols-5 gap-1 flex items-center p-1 bg-white rounded-lg shadow-inner">
                                        <div className="w-12 h-12 p-2 col-start-1 col-end-1 bg-gray-100 text-Black rounded-full flex items-center justify-center">{order.Order_Number}</div>
                                        <div className="p-2 col-start-2 col-end-8">
                                            <strong className="text-l text-Black-900">{order.Customer_name}</strong>
                                            <br />
                                            <label className="text-s">{new Date(order.createdAt).toLocaleDateString()} - {order.Remark}</label>
                                        </div>
                                        <div className="items-center justify-center text-right col-end-9 col-span-1">
                                            <label className="text-xs pr-2">{new Date(order.highestStatusTask.Delivery_Date).toLocaleDateString()}</label>
                                            <br />
                                            <label className="text-s pr-2">{order.highestStatusTask.Assigned}</label>
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
                    <button
                        onClick={handleOrder}
                        className="w-12 h-12 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center"
                    >
                        <svg
                            className="h-8 w-8 text-white-500"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
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
            {showEditModal && (
                <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center ">
                     <BillUpdate order={selectedOrder} onClose={closeEditModal} />
                </div>
            )}
            <Footer />
        </>
    );
}
