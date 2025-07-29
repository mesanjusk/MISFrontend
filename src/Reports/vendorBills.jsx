import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import BillUpdate from "../Reports/billUpdate";

export default function VendorBills() {
    const navigate = useNavigate();
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [searchOrder, setSearchOrder] = useState("");
    const [customers, setCustomers] = useState({});
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loggedInUser, setLoggedInUser] = useState('');

    useEffect(() => {
        const userNameFromState = location.state?.id;
        const user = userNameFromState || localStorage.getItem('User_name');
        if (user) setLoggedInUser(user);
        else navigate("/login");
    }, [location.state, navigate]);

    useEffect(() => {
        const fetchOrders = axios.get("/order/GetBillList");
        const fetchCustomers = axios.get("/customer/GetCustomersList");
        Promise.all([fetchOrders, fetchCustomers])
            .then(([ordersRes, customersRes]) => {
                if (ordersRes.data.success) setOrders(ordersRes.data.result);
                else setOrders([]);

                if (customersRes.data.success) {
                    const customerMap = customersRes.data.result.reduce((acc, c) => {
                        if (c.Customer_uuid && c.Customer_name) {
                            acc[c.Customer_uuid] = c.Customer_name;
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

    const filteredOrders = orders
        .map(order => {
            const highestStatusTask = order.Status.reduce((prev, current) =>
                (prev.Status_number > current.Status_number) ? prev : current, {});
            const customerName = customers[order.Customer_uuid] || "Unknown";
            return { ...order, highestStatusTask, Customer_name: customerName };
        })
        .filter(order => (
            order.highestStatusTask.Assigned === loggedInUser &&
            order.Customer_name.toLowerCase().includes(searchOrder.toLowerCase())
        ));

    const handleEditClick = (order) => {
        setSelectedOrder(order);
        setShowEditModal(true);
    };
    const closeEditModal = () => {
        setShowEditModal(false);
        setSelectedOrder(null);
    };

    return (
        <>
            <div className="pt-12 pb-20 max-w-7xl mx-auto px-4">
                <div className="flex flex-wrap items-center bg-white w-full p-2 mb-4 rounded-lg shadow gap-2">
                    <input
                        type="text"
                        placeholder="Search by Customer Name"
                        className="form-control text-black bg-gray-100 rounded-full px-4 py-2"
                        value={searchOrder}
                        onChange={(e) => setSearchOrder(e.target.value)}
                    />
                </div>
                <main className="flex flex-1 p-4 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map((order, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleEditClick(order)}
                                    className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="font-semibold text-lg text-gray-800">
                                            #{order.Order_Number}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-md font-medium text-gray-700">
                                        {order.Customer_name}
                                    </div>
                                    <div className="text-sm text-gray-600 mb-2">{order.Remark}</div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Assigned: {order.highestStatusTask?.Assigned || "N/A"}</span>
                                        <span>
                                            Delivery: {order.highestStatusTask?.Delivery_Date
                                                ? new Date(order.highestStatusTask.Delivery_Date).toLocaleDateString()
                                                : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500">No orders found</div>
                        )}
                    </div>
                </main>
            </div>
            {showEditModal && (
                <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center ">
                    <BillUpdate order={selectedOrder} onClose={closeEditModal} />
                </div>
            )}
        </>
    );
}
