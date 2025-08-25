import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import axios from '../apiClient.js';
import OrderUpdate from '../Reports/OrderUpdate';
import AddOrder1 from "./addOrder1";
import { LoadingSpinner } from "../Components";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');
  const [userGroup, setUserGroup] = useState("");
  const [orders, setOrders] = useState([]); 
  const [userData, setUserData] = useState([]); 
  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [selectedOrderId, setSelectedOrderId] = useState(null); 
  const [showEditModal, setShowEditModal] = useState(false); 
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [customers, setCustomers] = useState({});
  const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      const group = localStorage.getItem("User_group");
      setUserGroup(group);
    }, []);

  useEffect(() => {
    setTimeout(() => {
      const userNameFromState = location.state?.id;
      const user = userNameFromState || localStorage.getItem('User_name');
      setLoggedInUser(user);
      if (user) {
        setUserName(user);
        fetchUserData();
        fetchData(user);
      } else {
        navigate("/login");
      }
    }, 2000);
    setTimeout(() => setIsLoading(false), 2000);
  }, [location.state, navigate]);

  const fetchData = async (user) => {
    try {
        const [ordersRes, customersRes] = await Promise.all([
            axios.get("/order/GetOrderList"),
            axios.get("/customer/GetCustomersList"),
        ]);

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

      
    } catch (err) {
        console.log('Error fetching data:', err);
    }
};

  const filteredOrders = orders
    .map(order => {
      if (order.Status.length === 0) return order; 
  
      const highestStatusTask = order.Status.reduce((prev, current) => 
        (prev.Status_number > current.Status_number) ? prev : current
      );
  
      const customerName = customers[order.Customer_uuid] || "Unknown";
  
      return {
        ...order,
        highestStatusTask,
        Customer_name: customerName,
      };
    })
    .filter(order => order.highestStatusTask.Assigned === loggedInUser); 

  const fetchUserData = async () => {
    try {
      const response = await axios.get("/user/GetUserList");
      if (response.data && response.data.success && Array.isArray(response.data.result)) {
        setUserData(response.data.result); 
        return response.data.result; 
      } else {
        return null; 
      }
    } catch (error) {
      return null; 
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrderId(order); 
    setShowEditModal(true); 
  };

  const closeEditModal = () => {
    setShowEditModal(false); 
    setSelectedOrderId(null);  
  };
const closeModal = () => {
    setShowOrderModal(false);
};

  return (
    <>
      <br /><br />
            {isLoading ? (
                  <div className="flex justify-center py-4"><LoadingSpinner /></div>
                ) : (
            <div className="flex flex-col w-100 space-y-2 max-w-md mx-auto">
                  { filteredOrders.map((order, index) => (
                    <div key={index}>
                <div onClick={() => handleOrderClick(order)} className="grid grid-cols-5 gap-1 flex items-center p-1 bg-white rounded-lg shadow-inner cursor-pointer">
                <div className="w-12 h-12 p-2 col-start-1 col-end-1 bg-gray-100 rounded-full flex items-center justify-center">
                              <strong className="text-l text-gray-500">
                                  {order.Order_Number}
                              </strong>
                </div>
                <div className="p-2 col-start-2 col-end-8">
                      <strong className="text-l text-gray-900">{order.Customer_name}</strong><br />
                       <label className="text-xs">
                            {new Date(order.highestStatusTask.Delivery_Date).toLocaleDateString()}{" "} - {order.Items[i].Remark}
                      </label>
                  </div>
                  <div className="items-center justify-center text-right col-end-9 col-span-1">
                        <label className="text-xs pr-2">{order.highestStatusTask.Assigned}</label><br />
                        <label className="text-s text-blue-500 pr-2">{order.highestStatusTask.Task}</label>
                  </div>

               </div>
               </div>
              ))}
           </div>
           )}
            {showOrderModal && (
                           <div className="modal-overlay">
                               <div className="modal-content">
                                   <AddOrder1 closeModal={closeModal} />
                               </div>
                           </div>
                       )}
            {showEditModal && (
                <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center ">
                     <OrderUpdate order={selectedOrderId} onClose={closeEditModal} />
                </div>
            )}
    </>
  );
}
