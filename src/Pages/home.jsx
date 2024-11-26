import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import TopNavbar from "../Pages/topNavbar";
import Footer from './footer';
import axios from 'axios';
import { format } from 'date-fns';
import OrderUpdate from '../Reports/orderUpdate'; 

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');
  const [showOutButton, setShowOutButton] = useState(false);
  const [orders, setOrders] = useState([]); 
  const [attendanceData, setAttendanceData] = useState([]); 
  const [userData, setUserData] = useState([]); 
  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [selectedOrderId, setSelectedOrderId] = useState(null); 
  const [showEditModal, setShowEditModal] = useState(false); 
  const [customers, setCustomers] = useState({});
  const [isLoading, setIsLoading] = useState(true);

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

  const saveAttendance = async (type) => {
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    const currentDate = new Date().toLocaleDateString();

    try {
      const existingAttendance = attendanceData.find(record => record.Date === currentDate);
      
      if (existingAttendance) {
        const updateResponse = await axios.put(`/attendance/updateAttendance/${existingAttendance.Attendance_Record_ID}`, {
          User_name: userName,
          Time: currentTime,
          Type: type,
        });

        if (updateResponse.data.success) {
          alert(`Attendance updated successfully for ${type}`);
        } else {
          console.error('Failed to update attendance:', updateResponse.data.message);
        }
      } else {
        const response = await axios.post('/attendance/addAttendance', {
          User_name: userName,
          Type: type,
          Status: 'Present',
          Date: currentDate,
          Time: currentTime
        });

        if (response.data.success) {
          alert(`Attendance saved successfully for ${type}`);
        } else {
          console.error('Failed to save attendance:', response.data.message);
        }
      }

      fetchAttendance(userName); 
    } catch (error) {
      console.error('Error saving attendance:', error.response?.data?.message || error.message);
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
              {!showOutButton && (
                <button
                  onClick={handleInClick}
                  className="sanju bg-green-500 text-white px-2 py-2 mr-2 rounded"
                >
                  In
                </button>
              )}
              {showOutButton && (
                <button
                  onClick={handleOutClick}
                  className="sanju bg-red-500 text-white px-2 py-2 rounded"
                >
                  Out
                </button>
              )}
            </>
          )}
        </div>
      </div>
  
      <div className="">
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
      <Footer />
    </>
  );
}
