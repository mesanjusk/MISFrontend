import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import TopNavbar from "../Pages/topNavbar";
import Footer from './footer';
import axios from 'axios';
import { format } from 'date-fns';
import OrderUpdate from '../Reports/orderUpdate'; 
import UserTask from "../Pages/userTask";
import TaskUpdate from "../Pages/taskUpdate";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');
  const [showOutButton, setShowOutButton] = useState(false);
  const [showUserModel, setShowUserModel] = useState(false);
  const [orders, setOrders] = useState([]); 
  const [attendanceData, setAttendanceData] = useState([]); 
  const [task, setTask] = useState([]);
  const [userData, setUserData] = useState([]); 
  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [selectedOrderId, setSelectedOrderId] = useState(null); 
  const [showEditModal, setShowEditModal] = useState(false); 
  const [customers, setCustomers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false); 

  useEffect(() => {
    setTimeout(() => {
      const userNameFromState = location.state?.id;
      const user = userNameFromState || localStorage.getItem('User_name');
      setLoggedInUser(user);
      if (user) {
        setUserName(user);
        fetchUserData();
        fetchData(user);
        fetchAttendance(user);
      } else {
        navigate("/login");
      }
    }, 2000);
    setTimeout(() => setIsLoading(false), 2000);
  }, [location.state, navigate]);

  const fetchData = async (user) => {
    try {
        const [ordersRes, customersRes, taskRes] = await Promise.all([
            axios.get("/order/GetOrderList"),
            axios.get("/customer/GetCustomersList"),
            axios.get("/usertask/GetUsertaskList")
        ]);

        if (ordersRes.data.success) {
            setOrders(ordersRes.data.result);
        } else {
            setOrders([]);
        }

        if (taskRes.data.success) {
          setTask(taskRes.data.result);
      } else {
          setTask([]);
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
  
    const fetchUserNames = async () => {
      try {
          const response = await axios.get('/user/GetUserList');
          const data = response.data;
  
          if (data.success) {
              const userLookup = {};
              data.result.forEach(user => {
                  userLookup[user.User_uuid] = user.User_name.trim(); 
              });
              return userLookup;
          } else {
              console.error('Failed to fetch user names:', data);
              return {};
          }
      } catch (error) {
          console.error('Error fetching user names:', error);
          return {};
      }
    };

  const fetchAttendance = async (loggedInUser) => { 
    try {
      const userLookup = await fetchUserNames();
      
      const attendanceResponse = await axios.get('/attendance/GetAttendanceList');
  
      const attendanceRecords = attendanceResponse.data.result || [];
  
      const attendanceWithUserNames = attendanceRecords.flatMap(record => {
        const employeeUuid = record.Employee_uuid.trim(); 
        const userName = userLookup[employeeUuid] || 'Unknown'; 

        return record.User.map(user => {
          return {
            Attendance_Record_ID: record.Attendance_Record_ID,
            User_name: userName, 
            Date: user.Date ? format(new Date(user.Date), 'yyyy-MM-dd') : 'Invalid Date',
            Time: user.Time || 'N/A',
            Type: user.Type || 'N/A',
            Status: record.Status || 'N/A',
          };
        });
      });

      const filteredAttendance = attendanceWithUserNames.filter(record => record.User_name === loggedInUser);
      setAttendanceData(filteredAttendance);

      if (filteredAttendance.length > 0) {
        const lastAttendance = filteredAttendance[filteredAttendance.length - 1]; 
        if (lastAttendance.Type === 'In') {
          setShowOutButton(true); 
        } else {
          setShowOutButton(false); 
        }
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

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

  const handleTaskClick = (task) => {
    setSelectedTaskId(task);
    setShowTaskModal(true);
};
  const handleUserClick = () => {
    setShowUserModel(true);
  };

  const handleOrderClick = (order) => {
    setSelectedOrderId(order); 
    setShowEditModal(true); 
  };

  const closeEditModal = () => {
    setShowEditModal(false); 
    setSelectedOrderId(null);  
  };

  const closeTaskModal = () => {
    setShowTaskModal(false); 
    setSelectedTaskId(null);  
  };

  const closeUserModal = () => {
    setShowUserModel(false); 
  };

  const getTodayDate = () => {
    return format(new Date(), 'yyyy-MM-dd');
  };

  return (
    <>
      <TopNavbar />
      <div className="relative mt-10">
        <h1 className="absolute right-10 text-s font-bold mb-6">Welcome, {userName}!</h1>
  
        <div className="absolute right-10 top-10 p-2">
        {isLoading ? (
            <Skeleton width={50} height={30} className="mr-2" />
          ) : (
            <>
           
                <button
                  onClick={handleUserClick}
                  className="sanju bg-green-500 text-white px-2 py-2 mr-2 rounded"
                >
                  Attendance
                </button>
              
            </>
          )}
        </div>
      </div>
  
      <div className="">
      <div className="flex flex-col w-100 space-y-2 max-w-md mx-auto">
        <h2 className="text-xl font-bold">Task</h2>
        {isLoading ? (
            <Skeleton count={5} height={30} />
          ) : (
              task.map((task, index) => (
                <div key={index}>
                <div
                    onClick={() => handleTaskClick(task)}
                    className="grid grid-cols-5 gap-1 flex items-center p-1 bg-white rounded-lg shadow-inner cursor-pointer"
                >
                    <div className="w-12 h-12 p-2 col-start-1 col-end-1 bg-gray-100 rounded-full flex items-center justify-center">
                        <strong className="text-l text-gray-500">
                            {task.Usertask_Number}
                        </strong>
                    </div>
                    <div className="p-2 col-start-2 col-end-8">
                                                  <strong className="text-l text-gray-900">
                                                      {task.Usertask_name}
                                                  </strong>
                                                  <br />
                                                  <label className="text-xs">
                                                      {new Date(
                                                          task.Date
                                                      ).toLocaleDateString()}{" "}
                                                      - {task.Remark}
                                                  </label>
                                              </div>
                                              <div className="items-center justify-center text-right col-end-9 col-span-1">
                                                  <label className="text-xs pr-2">
                                                      {new Date(
                                                          task.Deadline
                                                      ).toLocaleDateString()}
                                                  </label>
                                                  <br />
                                                  <label className="text-s text-green-500 pr-2">
                                                      {task.Status}
                                                  </label>
                                              </div>
                    </div>
                    </div>

              ))
            )}
       </div>
        <div className="orders-table flex-1 mr-4">
        <h2 className="text-xl font-bold">Order</h2>
        {isLoading ? (
            <Skeleton count={5} height={30} />
          ) : (
              filteredOrders.map((order) => (
                <tr key={order._id} onClick={() => handleOrderClick(order)} className="cursor-pointer hover:bg-gray-200">
                  <td className="border px-4 py-2">{order.Order_Number}</td>
                  <td className="border px-4 py-2">{order.Customer_name}</td>
                  <td className="border px-4 py-2">{order.highestStatusTask.Assigned}</td>
                  <td className="border px-4 py-2">{order.highestStatusTask.Task}</td>
                </tr>
              ))
            )}
       </div>

        <div className="attendance-table flex-1">
        <h2 className="text-xl font-bold">Attendance</h2>
        {isLoading ? (
            <Skeleton count={5} height={30} />
          ) : (
              attendanceData
                .filter(record => record.Date === getTodayDate()) 
                .map((record, index) => (
                    <div key={index} className="hover:bg-gray-200">
                    <div> {record.Date}</div>
                  <div> {record.User_name}</div>
                  <div> {record.Time}</div>
                  <div> {record.Type}  {record.Status}</div>
                    </div>
                 ))
                )}
                </div>
        </div>
   {showEditModal && (
                <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center ">
                     <OrderUpdate order={selectedOrderId} onClose={closeEditModal} />
                </div>
            )}
            {showUserModel && (
                <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center ">
                     <UserTask order={selectedOrderId} onClose={closeUserModal} />
                </div>
            )}
            {showTaskModal && (
                <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center ">
                     <TaskUpdate task={selectedTaskId} onClose={closeTaskModal} />
                </div>
            )}
      <Footer />
    </>
  );
}
