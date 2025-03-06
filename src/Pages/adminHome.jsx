import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import TopNavbar from "../Pages/topNavbar";
import Footer from './footer';
import axios from 'axios';
import { format } from 'date-fns';
import OrderUpdate from '../Reports/orderUpdate'; 
import Skeleton from "react-loading-skeleton";
import github from  '../assets/github.svg'
import dribbble from  '../assets/dribbble.svg'
import linkedin from  '../assets/linkedin.svg'
import medium from  '../assets/medium.svg'
import spotify from  '../assets/spotify.svg'
import twitter from  '../assets/twitter.svg'
import FloatingButtons from 'react-floating-buttons'
import instagram from  '../assets/instagram.svg'


export default function AdminHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');
  const [showOutButton, setShowOutButton] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
   const [userGroup, setUserGroup] = useState("");
  const [userData, setUserData] = useState([]);
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
      fetchUserData();
      fetchAttendance(loggedInUser);
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
            Date: record.Date ? format(new Date(record.Date), 'yyyy-MM-dd') : 'Invalid Date',
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

  const fetchAttendanceData = async (loggedInUser) => { 
    try {
      const userLookup = await fetchUserNames();
      
      const attendanceResponse = await axios.get('/attendance/GetAttendanceList');
      const attendanceRecords = attendanceResponse.data.result || [];

      const formattedData = processAttendanceData(attendanceRecords); 
      setAttendance(formattedData);

  
      const attendanceWithUserNames = attendanceRecords.flatMap(record => {
        const employeeUuid = record.Employee_uuid.trim(); 
        const userName = userLookup[employeeUuid] || 'Unknown'; 
  
        return record.User.map(user => {
          return {
            Attendance_Record_ID: record.Attendance_Record_ID,
            User_name: userName, 
            Date: record.Date,
            Time: user.CreatedAt ? format(new Date(user.CreatedAt), "hh:mm a") : "No Time",
            Type: user.Type || 'N/A',
            Status: record.Status || 'N/A',
          };
        });
      });
      const filteredAttendance = attendanceWithUserNames.filter(record => record.User_name === loggedInUser);
      setAttendanceData(filteredAttendance);
  
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const processAttendanceData = (data) => {
    const groupedData = new Map();

    data.forEach(({ Date: recordDate, User, Amount }) => {  

        if (!recordDate) {
            console.error("Invalid Date:", recordDate);
            return;
        }

        const parsedDate = new Date(recordDate);
        if (isNaN(parsedDate.getTime())) {
            console.error("Invalid Date format:", recordDate);
            return;
        }

        const dateKey = parsedDate.toISOString().split("T")[0];

        if (!groupedData.has(dateKey)) {
            groupedData.set(dateKey, { 
                Date: dateKey, 
                In: "N/A", 
                Break: "N/A", 
                Start: "N/A", 
                Out: "N/A", 
                TotalHours: "N/A", 
                Amount: "N/A" 
            });
        }

        const record = groupedData.get(dateKey);

        User.forEach(userEntry => {
            switch (userEntry.Type) {
                case "In":
                    record.In = userEntry.Time.trim() || "No Time";  
                    break;
                case "Break":
                    record.Break = userEntry.Time.trim() || "No Time";
                    break;
                case "Start":
                    record.Start = userEntry.Time.trim() || "No Time";
                    break;
                case "Out":
                    record.Out = userEntry.Time.trim() || "No Time";
                    break;
                default:
                    console.warn("Unexpected Type:", userEntry.Type);
                    break;
            }
        });

        record.Amount = Amount || record.Amount;

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
   { onClick: () => navigate('/addTransaction'), src: github },
   { onClick: ()=>  navigate('/addTransaction1'), src: medium },
   { onClick: ()=> navigate('/addOrder1'), src: dribbble },
   { onClick: ()=> navigate('/addItemgroup'), src: linkedin },
   { onClick: () => navigate('/addUsertask'), src: spotify },
   { onClick: ()=>  navigate('/addUsergroup'), src: instagram },
   { onClick: ()=>  navigate('/addTaskgroup'), src: twitter },
   { onClick: ()=> navigate('/addEnquiry'), src: linkedin },
   { onClick: ()=> navigate('/addCustgroup'), src: github },
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
              <div className="tables-container flex">
                <table className="min-w-half border">
    <thead>
        <tr>
            <th className="px-4 py-2 border">Date</th>
            <th className="px-4 py-2 border">In</th>
            <th className="px-4 py-2 border">Break</th>
            <th className="px-4 py-2 border">Start</th>
            <th className="px-4 py-2 border">Out</th>
            <th className="px-4 py-2 border">Total</th>
            <th className="px-4 py-2 border">Amount</th>
        </tr>
    </thead>
    <tbody>
    {attendance.map((row, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">{row.Date}</td>
              <td className="border px-4 py-2">{row.In}</td>
              <td className="border px-4 py-2">{row.Break}</td>
              <td className="border px-4 py-2">{row.Start}</td>
              <td className="border px-4 py-2">{row.Out}</td>
              <td className="border px-4 py-2">{row.TotalHours}</td>
              <td className="border px-4 py-2">{row.Amount}</td>
            </tr>
          ))}
    </tbody>
</table>

                </div>
                <div className="exemple-wrapper vertical">
                                <div className="exemples">                  
                                        <code>
                                            {`  <FloatingButtons 
                                                    buttonType='plus' 
                                                    dimension={50} 
                                                    buttonsList={buttonsList}
                                                    top={'250px'} 
                                                    left={'50%'} 
                                                    direction="up" 
                                                    buttonColor="white"
                                                    backgroundColor="green"
                                                    itemBackgroundColor="green" />    `}
                                        </code>
                                        <div className="component">
                                            <FloatingButtons 
                                                buttonType='plus' 
                                                dimension={50} 
                                                buttonsList={[...buttonsList.slice(0, 9)]}
                                                top={'500px'} 
                                                left={'80%'}
                                                direction="up" 
                                                buttonColor="white"
                                                backgroundColor="green"
                                                itemBackgroundColor="green"
                                                />
                                        </div>
                                   
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
