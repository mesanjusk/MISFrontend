import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";
import UpdateDelivery from "../Pages/updateDelivery";

export default function AllDelivery() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [searchOrder, setSearchOrder] = useState("");
    const [filter, setFilter] = useState("");
    const [customers, setCustomers] = useState({});
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    

    function addOrder1() {
        navigate("/addOrder1");
    }

    useEffect(() => {
        const fetchOrders = axios.get("/order/GetDeliveredList");
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
                    <button onClick={addOrder1} className="w-14 h-14 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center">
                        <strong>+</strong>
                    </button>
                </div>
            </div>
            {showEditModal && (
                <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center ">
                     <UpdateDelivery order={selectedOrder} onClose={closeEditModal} />
                </div>
            )}
            <Footer />
        </>
    );
}
