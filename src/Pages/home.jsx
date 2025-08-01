import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import "react-loading-skeleton/dist/skeleton.css";
import axios from 'axios';
import OrderUpdate from '../Reports/orderUpdate'; 
import AllOrder from "../Reports/allOrder";
import UserTask from "./userTask";
import { format } from 'date-fns';
import TaskUpdate from "./taskUpdate";
import PendingTasks from './PendingTasks';
import AllAttandance from "./AllAttandance";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');
  const [userGroup, setUserGroup] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [selectedOrderId, setSelectedOrderId] = useState(null); 
  const [showEditModal, setShowEditModal] = useState(false); 
  const [showOrderModal, setShowOrderModal] = useState(false);
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

        return record.User.map(user => ({
          Attendance_Record_ID: record.Attendance_Record_ID,
          User_name: userName, 
          Date: record.Date,
          Time: user.CreatedAt ? format(new Date(user.CreatedAt), "hh:mm a") : "No Time",
          Type: user.Type || 'N/A',
          Status: record.Status || 'N/A',
        }));
      });

      const filteredAttendance = attendanceWithUserNames.filter(record => record.User_name === loggedInUser);
      setAttendanceData(filteredAttendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

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

  const closeEditModal = () => {
    setShowEditModal(false); 
    setSelectedOrderId(null);  
  };

  const closeModal = () => {
    setShowOrderModal(false);
  };

  return (
    <>
      {userGroup === "Admin User" && <AllAttandance />}
      {userGroup === "Office User" && <UserTask onClose={closeUserModal} />}
      <PendingTasks tasks={  userGroup === "Admin User" ? task  : task.filter(t => t.User === loggedInUser) } isLoading={isLoading} onTaskClick={handleTaskClick} />

      <AllOrder />
      {showOrderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AddOrder1 closeModal={closeModal} />
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay fixed inset-0  flex items-center justify-center">
          <OrderUpdate order={selectedOrderId} onClose={closeEditModal} />
        </div>
      )}

      {showTaskModal && (
        <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <TaskUpdate task={selectedTaskId} onClose={closeTaskModal} />
        </div>
      )}

    </>
  );
}
