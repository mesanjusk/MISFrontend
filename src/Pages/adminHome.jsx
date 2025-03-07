import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import TopNavbar from "../Pages/topNavbar";
import Footer from './footer';
import axios from 'axios';
import { format } from 'date-fns';
import OrderUpdate from '../Reports/orderUpdate'; 
import Skeleton from "react-loading-skeleton";
import order from  '../assets/order.svg'
import enquiry from  '../assets/enquiry.svg'
import payment from  '../assets/payment.svg'
import reciept from  '../assets/reciept.svg'
import usertask from  '../assets/usertask.svg'
import FloatingButtons from "./floatingButton";

export default function AdminHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');
   const [userGroup, setUserGroup] = useState("");
  const [orders, setOrders] = useState([]); 
    const [attendance, setAttendance] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false); 
  const [selectedOrderId, setSelectedOrderId] = useState(null); 
     const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
           const group = localStorage.getItem("User_group");
           setUserGroup(group);
         }, []);

  useEffect(() => {
    setTimeout(() => {
    const userNameFromState = location.state?.id;
    const loggedInUser = userNameFromState || localStorage.getItem('User_name');

    if (loggedInUser) {
      setUserName(loggedInUser);
      fetchFilteredOrders(loggedInUser); 
      fetchAttendanceData();
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

  const fetchAttendanceData = async () => { 
    try {
      const userLookup = await fetchUserNames();
      
      const attendanceResponse = await axios.get('/attendance/GetAttendanceList');
      const attendanceRecords = attendanceResponse.data.result || [];
      const formattedData = processAttendanceData(attendanceRecords, userLookup);
      setAttendance(formattedData);

    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
};

const processAttendanceData = (data, userLookup) => {
    const groupedData = new Map();
    const todayDate = new Date().toISOString().split("T")[0]; 

    data.forEach(({ Date: recordDate, User, Employee_uuid }) => {  
        if (!recordDate || isNaN(new Date(recordDate).getTime())) {
            console.error("Skipping invalid date:", recordDate);
            return;
        }

        const parsedDate = new Date(recordDate);
        const dateKey = parsedDate.toISOString().split("T")[0];

        if (dateKey !== todayDate) return; 

        const userName = userLookup[Employee_uuid.trim()] || 'Unknown';
        const userDateKey = `${userName}-${dateKey}`;

        if (!groupedData.has(userDateKey)) {
            groupedData.set(userDateKey, { 
                Date: dateKey, 
                User_name: userName,
                In: "N/A", 
                Break: "N/A", 
                Start: "N/A", 
                Out: "N/A", 
                TotalHours: "N/A"
            });
        }

        const record = groupedData.get(userDateKey);

        User.forEach(userEntry => {
            if (!userEntry.CreatedAt) return; 

            const formattedTime = format(new Date(userEntry.CreatedAt), "hh:mm a");

            switch (userEntry.Type) {
                case "In":
                    record.In = formattedTime;  
                    break;
                case "Break":
                    record.Break = formattedTime;
                    break;
                case "Start":
                    record.Start = formattedTime;
                    break;
                case "Out":
                    record.Out = formattedTime;
                    break;
                default:
                    console.warn("Unexpected Type:", userEntry.Type);
                    break;
            }
        });

    });

    return Array.from(groupedData.values()).map((record) => {
        record.TotalHours = calculateWorkingHours(record.In, record.Out, record.Break, record.Start);
        return record;
    });
};

const calculateWorkingHours = (inTime, outTime, breakTime, startTime) => {
    if (!inTime || !outTime) {
        return "N/A"; 
    }

    const parseTime = (timeStr) => {
        if (!timeStr || timeStr === "N/A") return null;
        const [time, period] = timeStr.split(" "); 
        const [hours, minutes] = time.split(":").map(Number);

        let hours24 = hours;
        if (period === "PM" && hours !== 12) hours24 += 12;
        if (period === "AM" && hours === 12) hours24 = 0;

        const now = new Date();
        now.setHours(hours24, minutes, 0, 0);
        return now;
    };

    const inDate = parseTime(inTime);
    const outDate = parseTime(outTime);
    const breakDate = parseTime(breakTime) || 0;
    const startDate = parseTime(startTime) || 0;

    if (!inDate || !outDate) {
        return "N/A";
    }

    let workDuration = (outDate - inDate) / 1000; 

    if (breakDate && startDate) {
        const breakDuration = (startDate - breakDate) / 1000;
        workDuration -= breakDuration; 
    }

    const hours = Math.floor(workDuration / 3600);
    const minutes = Math.floor((workDuration % 3600) / 60);
    const seconds = workDuration % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
};

  const handleOrderClick = (order) => {
    setSelectedOrderId(order); 
    setShowEditModal(true); 
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedOrderId(null); 
  };

  const buttonsList = [
   { onClick: () => navigate('/addTransaction'), src: reciept },
   { onClick: ()=>  navigate('/addTransaction1'), src: payment },
   { onClick: ()=> navigate('/addOrder1'), src: order },
   { onClick: () => navigate('/addUsertask'), src: usertask },
   { onClick: ()=> navigate('/addEnquiry'), src: enquiry },
 ]
 

  return (
    <>
      <TopNavbar />
      <br /><br />
                 {isLoading ? (
                       <Skeleton count={5} height={30} />
                     ) : (
                 <div className="flex flex-col w-100 space-y-2 max-w-md mx-auto">            
                       { orders.map((order, index) => (
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
                                 {new Date(order.highestStatusTask.Delivery_Date).toLocaleDateString()}{" "} - {order.Remark}
                           </label>
                       </div>
                       <div className="items-center justify-center text-right col-end-9 col-span-1">
                             <label className="text-xs pr-2">{order.highestStatusTask.Assigned}</label><br />
                             <label className="text-s text-green-500 pr-2">{order.highestStatusTask.Task}</label>
                       </div>
     
                    </div>
                    </div>
                   ))}
                </div>  
                )} 
               
               {isLoading ? (
  <Skeleton count={5} height={30} />
) : (
  <div className="tables-container flex">
    <table className="min-w-half border">
      <thead>
        <tr>
          <th className="px-4 py-2 border">Name</th>
          <th className="px-4 py-2 border">In</th>
          <th className="px-4 py-2 border">Break</th>
          <th className="px-4 py-2 border">Start</th>
          <th className="px-4 py-2 border">Out</th>
          <th className="px-4 py-2 border">Total</th>
        </tr>
      </thead>
      <tbody>
  {attendance
    .map((row, index) => (
      <tr key={index}>
       <td className="border px-4 py-2">{row.User_name}</td>
        <td className="border px-4 py-2">{row.In}</td>
        <td className="border px-4 py-2">{row.Break}</td>
        <td className="border px-4 py-2">{row.Start}</td>
        <td className="border px-4 py-2">{row.Out}</td>
        <td className="border px-4 py-2">{row.TotalHours}</td>
      </tr>
    ))}
</tbody>

    </table>
  </div>
)}

                
                <FloatingButtons buttonType="bars" buttonsList={buttonsList} direction="up" />
                       
      {showEditModal && (
                <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center w-full h-full">
                     <OrderUpdate order={selectedOrderId} onClose={closeEditModal} />
                </div>
            )}

      <Footer />
    </>
  );
}
