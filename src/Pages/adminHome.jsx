import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import TopNavbar from "../Pages/topNavbar";
import Footer from './footer';
import axios from 'axios';
import { format } from 'date-fns';
import OrderUpdate from '../Reports/orderUpdate'; 

export default function AdminHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');
  const [showOutButton, setShowOutButton] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [showEditModal, setShowEditModal] = useState(false); 
  const [selectedOrderId, setSelectedOrderId] = useState(null); 

  useEffect(() => {
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
  
      const customerMap = {};
      if (Array.isArray(customerResponse.data.result)) {
        customerResponse.data.result.forEach(customer => {
          customerMap[customer.Customer_uuid] = customer.Customer_name;
        });
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

  const handleInClick = () => {
    setShowOutButton(true);
    saveAttendance('In');
  };

  const handleOutClick = () => {
    setShowOutButton(false);
    saveAttendance('Out');
  };

  const handleOrderClick = (order) => {
    setSelectedOrderId(order); 
    setShowEditModal(true); 
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedOrderId(null); 
  };

  return (
    <>
      <TopNavbar />
      <div className="relative mt-10">
        <h1 className="absolute right-10 text-s font-bold mb-6">Welcome, {userName}!</h1>

        <div className="absolute right-10 top-10 p-2">
          <button
            onClick={handleInClick}
            className={`sanju ${showOutButton ? 'hidden' : 'visible'} bg-green-500 text-white px-2 py-2 mr-2 rounded`}
          >
            In
          </button>

          {showOutButton && (
            <button
              onClick={handleOutClick}
              className="sanju bg-red-500 text-white px-2 py-2 rounded"
            >
              Out
            </button>
          )}
        </div>
      </div>

      <div className="tables-container flex">
        <div className="order-table flex-1 ml-10">
          <h2 className="text-xl font-bold">Filtered Orders</h2>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">Order Number</th>
                <th className="px-4 py-2">Customer Name</th>
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
        </div>

        <div className="attendance-table flex-1">
          <h2 className="text-xl font-bold">Attendance Records</h2>
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
        </div>
      </div>

      {showEditModal && (
                <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center w-full h-full">
                     <OrderUpdate order={selectedOrderId} onClose={closeEditModal} />
                </div>
            )}

      <Footer />
    </>
  );
}
