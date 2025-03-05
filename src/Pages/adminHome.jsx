import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import TopNavbar from "../Pages/topNavbar";
import Footer from './footer';
import axios from 'axios';
import { format } from 'date-fns';
import OrderUpdate from '../Reports/orderUpdate'; 
import Skeleton from "react-loading-skeleton";
import { Container, Button, Link, lightColors, darkColors } from 'react-floating-action-button';


export default function AdminHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');
  const [showOutButton, setShowOutButton] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
   const [userGroup, setUserGroup] = useState("");
  const [userData, setUserData] = useState([]);
  const [orders, setOrders] = useState([]); 
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
                            <div className="flex flex-col w-100 space-y-2 max-w-md mx-auto">            
                                  { attendanceData.map((attendance, index) => (
                                    <div key={index}>
                                       <div className="grid grid-cols-5 gap-1 flex items-center p-1 bg-white rounded-lg shadow-inner cursor-pointer">
                                <div className="w-12 h-12 p-2 col-start-1 col-end-1 bg-gray-100 rounded-full flex items-center justify-center">
                                              <strong className="text-l text-gray-500">
                                                  {attendance.Attendance_Record_ID}
                                              </strong>
                                </div>
                                <div className="p-2 col-start-2 col-end-8">
                                      <strong className="text-l text-gray-900">{attendance.User_name}</strong><br />
                                       <label className="text-xs">
                                            {attendance.Date}{" "} - {attendance.Status}
                                      </label>
                                  </div>
                                  <div className="items-center justify-center text-right col-end-9 col-span-1">
                                        <label className="text-xs pr-2">{attendance.Type}</label><br />
                                        <label className="text-s text-green-500 pr-2">{attendance.Time}</label>
                                  </div>
                                  </div>
                               </div>
                              ))}
                           </div>  
                           )} 
       
       {userGroup === "Office User" && (
                  <Container>
                 <Link href="/addTransaction"
                     tooltip="Add Reciept"
                     styles={{backgroundColor: darkColors.green, color: lightColors.white}} 
                     icon="far fa-sticky-note" />
                 <Link href="/addTransaction1"
                     tooltip="Add Payment"
                     styles={{backgroundColor: darkColors.green, color: lightColors.white}} 
                     icon="fas fa-user-plus" />
                      <Link href="/addOrder1"
                     tooltip="Add Order"
                     styles={{backgroundColor: darkColors.green, color: lightColors.white}} 
                     icon="far fa-sticky-note" />
                 <Link href="/addItemgroup"
                     tooltip="Add Item Group"
                     styles={{backgroundColor: darkColors.green, color: lightColors.white}} 
                     icon="fas fa-user-plus" />
                 <Button className="fab-item btn btn-link btn-lg text-white"
                     tooltip="The big plus button!" 
                     styles={{backgroundColor: darkColors.green, color: lightColors.white}}            
                     icon="fas fa-plus"
                     rotate={true}
                      />
             </Container>  
              )}
     
     {(userGroup === "Admin User" || userGroup === "Vendor") && (
                  <Container>
                 <Link href="/addTransaction"
                     tooltip="Add Reciept"
                     styles={{backgroundColor: darkColors.green, color: lightColors.white}} 
                     icon="far fa-sticky-note" />
                 <Link href="/addTransaction1"
                     tooltip="Add Payment"
                     styles={{backgroundColor: darkColors.green, color: lightColors.white}} 
                     icon="fas fa-user-plus" />
                      <Link href="/addOrder1"
                     tooltip="Add Order"
                     styles={{backgroundColor: darkColors.green, color: lightColors.white}} 
                     icon="far fa-sticky-note" />
                      <Link href="/addUsertask"
                     tooltip="Add User Task"
                     styles={{backgroundColor: darkColors.green, color: lightColors.white}} 
                     icon="far fa-sticky-note" />
                      <Link href="/addUsergroup"
                     tooltip="Add User Group"
                     styles={{backgroundColor: darkColors.green, color: lightColors.white}} 
                     icon="far fa-sticky-note" />
                      <Link href="/addTaskgroup"
                     tooltip="Add Task Group"
                     styles={{backgroundColor: darkColors.green, color: lightColors.white}} 
                     icon="far fa-sticky-note" />
                       <Link href="/addEnquiry"
                     tooltip="Add Enquiry"
                     styles={{backgroundColor: darkColors.green, color: lightColors.white}} 
                     icon="far fa-sticky-note" />
                      <Link href="/addCustgroup"
                     tooltip="Add Customer Group"
                     styles={{backgroundColor: darkColors.green, color: lightColors.white}} 
                     icon="far fa-sticky-note" />
                 <Link href="/addItemgroup"
                     tooltip="Add Item Group"
                     styles={{backgroundColor: darkColors.green, color: lightColors.white}} 
                     icon="fas fa-user-plus" />
                 <Button className="fab-item btn btn-link btn-lg text-white"
                     tooltip="The big plus button!" 
                     styles={{backgroundColor: darkColors.green, color: lightColors.white}}            
                     icon="fas fa-plus"
                     rotate={true}
                      />
             </Container>  
              )}
           
      {showEditModal && (
                <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center w-full h-full">
                     <OrderUpdate order={selectedOrderId} onClose={closeEditModal} />
                </div>
            )}

      <Footer />
    </>
  );
}
