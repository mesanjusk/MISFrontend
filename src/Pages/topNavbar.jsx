import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserTask from "../Pages/userTask";
import axios from "axios";
import { format } from 'date-fns';
import TaskUpdate from "../Pages/taskUpdate";

const TopNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userGroup, setUserGroup] = useState("");
  const [userName, setUserName] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [showUserModel, setShowUserModel] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]); 
   const [task, setTask] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
     const [showTaskModal, setShowTaskModal] = useState(false); 
   const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
   const location = useLocation();

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
           navigate("/login");
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

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleVisibility = () => {
    setIsHidden(prev => !prev);
};

  const handleUser = () => {
    setShowUserModel(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("User_name");
    localStorage.removeItem("User_group");
    navigate("/");
  };

  const home = () => {
    if(userGroup === "Admin User") {
      navigate('/adminHome');
    }
    else if(userGroup === "Vendor") {
      navigate('/vendorHome');
    }
    else {
      navigate('/');
    }
  };
  const closeUserModal = () => {
    setShowUserModel(false); 
  };

  const handleTaskClick = (task) => {
    setSelectedTaskId(task);
    setShowTaskModal(true);
};

const closeTaskModal = () => {
  setShowTaskModal(false); 
  setSelectedTaskId(null);  
};

  const getTodayDate = () => {
    return format(new Date(), 'yyyy-MM-dd');
  };
  return (
    <>
    <div>
      {/* Top Navbar */}
      <nav className="fixed top-0  w-full bg-white text-green-600 pr-14 pl-4 pt-2 pb-2 flex z-50 items-center ">
        <button className="uppercase" onClick={home}>
          <h1 className="text-xl font-bold">s k digital</h1>
        </button>
    
        <button className="text-2xl fixed right-5 focus:outline-none" onClick={toggleSidebar}
      >
        &#x22EE; {/* Three vertical dots */}
      </button>

      <button className=" fixed right-10 focus:outline-none" onClick={handleUser}>
      <svg
  className="w-6 h-6 text-black-500"  
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <circle cx="12" cy="8" r="4" />
  <path d="M6 20v-2a6 6 0 0112 0v2" />
</svg>
      </button>
     
      </nav>

      {/* Sidebar / Drawer */}
      {isOpen && (
        <div className={`shadow-md fixed top-10 right-0  w-50 h-4/6 bg-white transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out z-40`}>
        <div className="p-4 flex justify-between items-center border-b"> 
          
  
            </div>

          {userGroup === "Office User" && (
            <>
              {[
                

                
                 { label: "Add Reciept", path: "/addTransaction1" },
                 { label: "Add Payment", path: "/addTransaction" },
                 { label: "Ledger", path: "/customerReport" },
                 { label: "Search by mobile", path: "/customerMobile" },
                 { label: "Item Report", path: "/itemReport" },
                 { label: "Call logs" , path: "/calllogs"},
                 { label: "Task Report", path: "/taskReport" },
                 { label: "User Report", path: "/userReport" },
                 { label: "Payment Report", path: "/paymentReport" },
                 { label: "Priority Report", path: "/priorityReport" },
                 { label: "Add Item", path: "/addItem" },
                 { label: "Add Item Group", path: "/addItemgroup" },
                 { label: "Report1", path: "/allTransaction2" },
                 { label: "Report2", path: "/allTransaction3" },
                
              ].map((item) => (
                <div key={item.label} onClick={() => navigate(item.path)} className="px-4 hover:bg-gray-100 text-s p-2 rounded">
                  {item.label}
                </div>
              ))}
            </>
          )}

          {(userGroup === "Admin User" || userGroup === "Vendor") && (
            <>
              {[
                { label: "Ledger", path: "/customerReport" },
                { label: "Add Payment", path: "/addTransaction1" },
                { label: "Add Receipt", path: "/addTransaction" },
                { label: "Add User Task", path: "/addUsertask" },
                { label: "Report2", path: "/allTransaction3" },
                { label: "Task Report", path: "/taskReport" },
                { label: "Item Report", path: "/itemReport" },
                { label: "User Report", path: "/userReport" },
                { label: "Payment Report", path: "/paymentReport" },
                { label: "Priority Report", path: "/priorityReport" },
                { label: "Add Customer", path: "/addCustomer" },
                { label: "Add Priority", path: "/addPriority" },
                { label: "Add Task", path: "/addTask" },
               
                { label: "Add User Group", path: "/addUsergroup" },
                { label: "Add Task Group", path: "/addTaskgroup" },
                { label: "Add Payment", path: "/addPayment" },
                { label: "Add Enquiry", path: "/addEnquiry" },
                { label: "Add User", path: "/addUser" },
                { label: "Add Order", path: "/addOrder" },
                { label: "Add Customer Group", path: "/addCustgroup" },
              ].map((item) => (
                <div key={item.label} onClick={() => navigate(item.path)} className="px-4 hover:bg-gray-100 text-s p-2 rounded">
                  {item.label}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Backdrop to close sidebar on mobile */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed top-0 right-0 inset-0 bg-gray opacity-30 z-30"
        ></div>
      )}
    </div>
     {showUserModel && (
       <div className="pt-12 pb-20">
        <div className="d-flex justify-content-center align-items-center bg-gray-200 vh-100 vw-100"> 
        <div className="top-0 right-0  w-100 h-75 ">
        <button type="button" onClick={closeUserModal}>X</button>
        <h1 className="absolute right-10 text-s font-bold mb-6">Welcome, {userName}!</h1>
        <button className="absolute right-10 text-s" onClick={handleLogout}>Logout</button><br /><br />
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
<br />
<button onClick={toggleVisibility}>
    {isHidden ? "Show Attendance" : "Hide Attendance"}
</button>

{!isHidden && (
    isLoading ? (
        <Skeleton count={5} height={30} />
    ) : (
        attendanceData
            .filter(record => new Date(record.Date).toISOString().split("T")[0] === getTodayDate()) 
            .map((record, index) => (
                <div key={index}>
                    <div className="grid grid-cols-5 gap-1 flex items-center p-1 bg-white rounded-lg shadow-inner cursor-pointer">
                        <div className="w-12 h-12 p-2 col-start-1 col-end-1 bg-gray-100 rounded-full flex items-center justify-center">
                            <strong className="text-l text-gray-500">
                                {record.Attendance_Record_ID}
                            </strong>
                        </div>
                        <div className="p-2 col-start-2 col-end-8">
                            <strong className="text-l text-gray-900">{record.User_name}</strong><br />
                            <label className="text-xs">
                                {record.Date}{" "} - {record.Status}
                            </label>
                        </div>
                        <div className="items-center justify-center text-right col-end-9 col-span-1">
                            <label className="text-xs pr-2">{record.Time}</label><br />
                            <label className="text-s text-green-500 pr-2">{record.Type}</label>
                        </div>
                    </div>
                </div>
            ))
    )
)}
      
        <UserTask onClose={closeUserModal} />
        </div>
 </div>
 </div>
                )}
                {showTaskModal && (
                                <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center ">
                                     <TaskUpdate task={selectedTaskId} onClose={closeTaskModal} />
                                </div>
                            )}
    </>
  );
};

export default TopNavbar;
