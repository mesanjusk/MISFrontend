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
      
      

      <div className=" bg-[#e5ddd5] pt-20 pb-5 px-4 md:px-10">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    
    {/* User Task Section */}
    <div className="">
           <UserTask onClose={closeUserModal} />
    </div>

    {/* Pending Task Section */}
    <div className="">
     
      {isLoading ? (
        <Skeleton count={5} height={30} />
      ) : (
        pendingTasks.map((task, index) => (
          <div
            key={index}
            onClick={() => handleTaskClick(task)}
            className="cursor-pointer mb-2"
          >
            <div className="grid grid-cols-12 items-center gap-2 p-3 bg-gray-50 rounded-lg shadow hover:bg-green-50 transition-all">
              {/* Task Number Avatar */}
              <div className="col-span-1 flex items-center justify-center bg-gray-100 rounded-full w-10 h-10">
                <span className="text-sm text-gray-600 font-semibold">{task.Usertask_Number}</span>
              </div>

              {/* Task Name and Remark */}
              <div className="col-span-8">
                <div className="text-black font-semibold text-sm">{task.Usertask_name}</div>
                <div className="text-xs text-gray-700">
                  {new Date(task.Date).toLocaleDateString()} – {task.Remark}
                </div>
              </div>

              {/* Deadline and Status */}
              <div className="col-span-3 text-right">
                <div className="text-xs text-gray-500">{new Date(task.Deadline).toLocaleDateString()}</div>
                <div
                  className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block
                    ${task.Status === 'Completed'
                      ? 'bg-green-200 text-green-800'
                      : task.Status === 'Pending'
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-red-200 text-red-800'}
                  `}
                >
                  {task.Status}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
</div>

<AllOrder />

      
      
      
             
              
            
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
