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
  const [showDropdown, setShowDropdown] = useState(false);

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
      const taskRes = await axios.get("/usertask/GetUsertaskList");
      if (taskRes.data.success) {
        setTask(taskRes.data.result);
      } else {
        setTask([]);
      }
    } catch (err) {
      console.log('Error fetching data:', err);
    }
  };

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
        return {};
      }
    } catch (error) {
      return {};
    }
  };

  const fetchAttendance = async (user) => {
    try {
      const userLookup = await fetchUserNames();
      const response = await axios.get('/attendance/GetAttendanceList');
      const records = response.data.result || [];

      const formatted = records.flatMap(record => {
        const employeeUuid = record.Employee_uuid.trim();
        const name = userLookup[employeeUuid] || 'Unknown';
        return record.User.map(user => ({
          Attendance_Record_ID: record.Attendance_Record_ID,
          User_name: name,
          Date: record.Date,
          Time: user.CreatedAt ? format(new Date(user.CreatedAt), "hh:mm a") : "No Time",
          Type: user.Type || 'N/A',
          Status: record.Status || 'N/A',
        }));
      });

      const filtered = formatted.filter(r => r.User_name === user);
      setAttendanceData(filtered);
    } catch (err) {
      console.error("Attendance fetch error:", err);
    }
  };

  useEffect(() => {
    const group = localStorage.getItem("User_group");
    setUserGroup(group);
  }, []);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("User_name");
      localStorage.removeItem("User_group");
      navigate("/");
    }
  };

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleVisibility = () => setIsHidden(prev => !prev);
  const home = () => {
    if (userGroup === "Admin User") navigate('/Home');
    else if (userGroup === "Vendor") navigate('/vendorHome');
    else navigate('/');
  };
  const closeUserModal = () => setShowUserModel(false);
  const handleTaskClick = (task) => {
    setSelectedTaskId(task);
    setShowTaskModal(true);
  };
  const closeTaskModal = () => {
    setShowTaskModal(false);
    setSelectedTaskId(null);  
  };
  const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');

  const pendingTasks = task.filter(t => t.Status === "Pending" && t.User === loggedInUser);

  return (
    <>
      <div className="fixed top-0 w-full bg-white text-green-600 pr-14 pl-4 pt-2 pb-2 flex z-50 items-center shadow-md">
        <button onClick={home}>
          <h1 className="text-xl font-bold uppercase">s k digital</h1>
        </button>

        <div className="ml-auto flex items-center gap-4">
          <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="focus:outline-none">
              <svg className="w-6 h-6 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 20v-2a6 6 0 0112 0v2" />
              </svg>
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-50 border">
                <div className="p-3 border-b font-semibold text-gray-700">Hi, {userName}</div>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500">
                  Logout
                </button>
              </div>
            )}
          </div>

          <button onClick={toggleSidebar} className="text-2xl focus:outline-none">
            &#x22EE;
          </button>
        </div>
      </div>

      {/* Sidebar */}
      {isOpen && (
        <>
          <div className="fixed top-10 right-0 w-64 h-[90vh] bg-white z-40 shadow-lg overflow-y-auto">
            <div className="p-4 font-semibold border-b">Menu</div>
            {[
              { label: "Ledger", path: "/customerReport" },
              { label: "Item Report", path: "/itemReport" },
              { label: "Task Report", path: "/taskReport" },
              { label: "User Report", path: "/userReport" },
              { label: "Payment Report", path: "/paymentReport" },
              { label: "Priority Report", path: "/priorityReport" },
              { label: "Add Recievable", path: "/addRecievable" },
              { label: "Add Payable", path: "/addPayable" },
              ...(userGroup === "Office User" ? [{ label: "Call logs", path: "/calllogs" }] : []),
            ].map((item) => (
              <div key={item.label} onClick={() => navigate(item.path)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                {item.label}
              </div>
            ))}
          </div>
          <div onClick={toggleSidebar} className="fixed inset-0 bg-black opacity-25 z-30" />
        </>
      )}

      {/* User Modal */}
      {showUserModel && (
        <div className="fixed inset-0 bg-white z-40 pt-20 px-6 overflow-auto">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-bold">Welcome, {userName}</h2>
            <button onClick={closeUserModal} className="text-red-500 font-bold text-xl">×</button>
          </div>

          {isLoading ? (
            <div className="text-center text-gray-500">Loading tasks...</div>
          ) : (
            pendingTasks.map((task, i) => (
              <div key={i} onClick={() => handleTaskClick(task)} className="mb-2 p-3 bg-gray-50 border rounded shadow-sm cursor-pointer">
                <div className="font-semibold text-green-700">{task.Usertask_name}</div>
                <div className="text-sm text-gray-600">{new Date(task.Date).toLocaleDateString()} - {task.Remark}</div>
                <div className="text-xs text-right text-gray-500">{new Date(task.Deadline).toLocaleDateString()}</div>
              </div>
            ))
          )}
          <UserTask onClose={closeUserModal} />
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <TaskUpdate task={selectedTaskId} onClose={closeTaskModal} />
        </div>
      )}
    </>
  );
};

export default TopNavbar;
