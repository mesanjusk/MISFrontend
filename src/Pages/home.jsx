import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import TopNavbar from "./topNavbar";
import Footer from './footer';
import axios from 'axios';
import OrderUpdate from '../Reports/orderUpdate'; 
import AllOrder from "../Reports/allOrder";
import order from  '../assets/order.svg'
import enquiry from  '../assets/enquiry.svg'
import payment from  '../assets/payment.svg'
import reciept from  '../assets/reciept.svg'
import FloatingButtons from "./floatingButton";
import UserTask from "./userTask";
import { format } from 'date-fns';
import TaskUpdate from "./taskUpdate";

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
  const [showUserModel, setShowUserModel] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [attendanceData, setAttendanceData] = useState([]); 
     const [task, setTask] = useState([]);
      const [selectedTaskId, setSelectedTaskId] = useState(null);
       const [showTaskModal, setShowTaskModal] = useState(false); 
  

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
        fetchData(user);
        fetchAttendance(user);
      } else {
        navigate("/");
      }
    }, 2000);
    setTimeout(() => setIsLoading(false), 2000);
  }, [location.state, navigate]);


 const fetchData = async (user) => {
      try {
          const [taskRes] = await Promise.all([
              axios.get("/usertask/GetUsertaskList")
          ]);
  
          if (taskRes.data.success) {
            setTask(taskRes.data.result);
        } else {
            setTask([]);
        }
  
        
      } catch (err) {
          console.log('Error fetching data:', err);
      }
  };
  
  const pendingTasks = task.filter(task => task.Status === "Pending"  && task.User === loggedInUser);

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

  useEffect(() => {
    const group = localStorage.getItem("User_group");
    setUserGroup(group);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("User_name");
    localStorage.removeItem("User_group");
    navigate("/");
  };
  const toggleVisibility = () => {
    setIsHidden(prev => !prev);
};
const handleTaskClick = (task) => {
    setSelectedTaskId(task);
    setShowTaskModal(true);
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
  const closeEditModal = () => {
    setShowEditModal(false); 
    setSelectedOrderId(null);  
  };
const closeModal = () => {
    setShowOrderModal(false);
};

const buttonsList = [
  { onClick: ()=> navigate('/addTransaction'), src: reciept },
  { onClick: ()=> navigate('/addTransaction1'), src: payment },
  { onClick: ()=> navigate('/addOrder1'), src: order },
  { onClick: ()=> navigate('/addEnquiry'), src: enquiry },
]


  return (
    <>
      <TopNavbar />
      <br /><br />

              <h1 className="absolute right-10 text-s mb-6">Welcome, {userName} <button className=" font-bold mb-6 text-s" onClick={handleLogout}>Logout</button></h1> 
              <br /><br />
              <AllOrder />
              <UserTask onClose={closeUserModal} />
    
      
                        <div >
                      {isLoading ? (
                                      <Skeleton count={5} height={30} />
                                    ) : (
                          pendingTasks.map((task, index) => (
                            <div key={index}>
                            <div onClick={() => handleTaskClick(task)} className="grid grid-cols-5 gap-1 flex items-center p-1 bg-white rounded-lg shadow-inner cursor-pointer">
                                <div className="w-12 h-12 p-2 col-start-1 col-end-1 bg-gray-100 rounded-full flex items-center justify-center">
                                    <strong className="text-l text-gray-500">
                                        {task.Usertask_Number}
                                    </strong>
                                </div>
                                <div className="p-2 col-start-2 col-end-8">
                                     <strong className="text-l text-gray-900">{task.Usertask_name}</strong><br />
                                      <label className="text-xs">{new Date(task.Date).toLocaleDateString()}{" "}-{task.Remark}</label>
                                </div>
                                <div className="items-center justify-center text-right col-end-9 col-span-1">
                                      <label className="text-xs pr-2">{new Date(task.Deadline).toLocaleDateString()}</label><br />
                                      <label className="text-s text-green-500 pr-2">{task.Status}</label></div>
                                </div>
                                </div>
            
                          ))          
                    )}
                    </div>
      
      
      
             
              
            
            <FloatingButtons buttonType="bars" buttonsList={buttonsList} direction="up" />
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
             {showTaskModal && (
                                            <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center ">
                                                 <TaskUpdate task={selectedTaskId} onClose={closeTaskModal} />
                                            </div>
                                        )}
            <Footer /> 
    </>
  );
}
