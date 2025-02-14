import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import TopNavbar from "../Pages/topNavbar";
import Footer from './footer';
import axios from 'axios';
import { format } from 'date-fns';
import OrderUpdate from '../Reports/orderUpdate'; 
import Skeleton from "react-loading-skeleton";
import UserTask from "../Pages/userTask";
import TaskUpdate from "../Pages/taskUpdate";

export default function AdminHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');
  const [showOutButton, setShowOutButton] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [orders, setOrders] = useState([]); 
   const [task, setTask] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false); 
  const [selectedOrderId, setSelectedOrderId] = useState(null); 
   const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [showTaskModal, setShowTaskModal] = useState(false); 
     const [isLoading, setIsLoading] = useState(true);
     const [showUserModel, setShowUserModel] = useState(false);

  useEffect(() => {
    setTimeout(() => {
    const userNameFromState = location.state?.id;
    const loggedInUser = userNameFromState || localStorage.getItem('User_name');

    if (loggedInUser) {
      setUserName(loggedInUser);
      fetchUserData();
      fetchAttendance(loggedInUser);
      fetchFilteredOrders(loggedInUser); 
    } else {
      navigate("/login");
    }
  }, 2000);
  setTimeout(() => setIsLoading(false), 2000);
  }, [location.state, navigate]);

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

      setAttendanceData(attendanceWithUserNames);

      const filteredAttendance = attendanceWithUserNames.filter(record => record.User_name === loggedInUser);

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

  const fetchFilteredOrders = async (loggedInUser) => {
    try {
      const ordersResponse = await axios.get(`/order/GetOrderList`);
      const customerResponse = await axios.get('/customer/GetCustomersList');
      const taskRes = await axios.get("/usertask/GetUsertaskList")
      const customerMap = {};
      if (Array.isArray(customerResponse.data.result)) {
        customerResponse.data.result.forEach(customer => {
          customerMap[customer.Customer_uuid] = customer.Customer_name;
        });
      }

      if (taskRes.data.success) {
        setTask(taskRes.data.result);
    } else {
        setTask([]);
    }
      const filteredOrders = ordersResponse.data.result.filter(order => {
        return order.Status.some(status => status.Assigned === loggedInUser);
      });
  
      const enrichedOrders = filteredOrders.map(order => {
        let highestAssigned = null;
        let highestTask = null;
  
        order.Status.forEach(status => {
          if (status.Assigned === loggedInUser) {
            if (!highestAssigned || status.Status_number > highestAssigned.Status_number) {
              highestAssigned = status;
            }
            if (!highestTask || status.Task > highestTask.Task) {
              highestTask = status;
            }
          }
        });
  
        return {
          ...order,
          Customer_name: customerMap[order.Customer_uuid] || 'Unknown',
          Highest_Assigned: highestAssigned ? highestAssigned.Assigned : 'N/A',
          Highest_Task: highestTask ? highestTask.Task : 'N/A'
        };
      });
  
      setOrders(enrichedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error.message);
    }
  };
const pendingTasks = task.filter(task => task.Status === "Pending");

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
 <div className="flex flex-col w-100 space-y-2 max-w-md mx-auto">
        <h2 className="text-xl font-bold">Task</h2>
        {isLoading ? (
            <Skeleton count={5} height={30} />
          ) : (
              pendingTasks.map((task, index) => (
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
      <div className="tables-container flex">
        <div className="order-table flex-1 ml-10">
          <h2 className="text-xl font-bold">Orders</h2>
           {isLoading ? (
                      <Skeleton count={5} height={30} />
                    ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Assigned</th>
                <th className="px-4 py-2">Task</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr 
                  key={order._id} 
                  onClick={() => handleOrderClick(order)} 
                  className="cursor-pointer hover:bg-gray-200"
                >
                  <td className="border px-4 py-2">{order.Order_Number}</td>
                  <td className="border px-4 py-2">{order.Customer_name}</td>
                  <td className="border px-4 py-2">{order.Highest_Assigned}</td>
                  <td className="border px-4 py-2">{order.Highest_Task}</td>
                </tr>
              ))}
            </tbody>
          </table>
           )}
        </div>

        <div className="attendance-table flex-1">
          <h2 className="text-xl font-bold">Attendance Records</h2>
           {isLoading ? (
                      <Skeleton count={5} height={30} />
                    ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">User Name</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((attendance, index) => (
                <tr key={index} className="hover:bg-gray-200">
                  <td className="border px-4 py-2">{attendance.Attendance_Record_ID}</td>
                  <td className="border px-4 py-2">{attendance.User_name}</td>
                  <td className="border px-4 py-2">{attendance.Date}</td>
                  <td className="border px-4 py-2">{attendance.Time}</td>
                  <td className="border px-4 py-2">{attendance.Type}</td>
                  <td className="border px-4 py-2">{attendance.Status}</td>
                </tr>
              ))}
            </tbody>
          </table>
           )}
        </div>
      </div>

      {showEditModal && (
                <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center w-full h-full">
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
