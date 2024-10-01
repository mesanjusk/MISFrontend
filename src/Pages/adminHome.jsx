import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import TopNavbar from "../Pages/topNavbar";
import Footer from './footer';
import axios from 'axios';
import { format } from 'date-fns';

export default function AdminHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');
  const [showOutButton, setShowOutButton] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]); 
  const [userData, setUserData] = useState([]); 
  const [error, setError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null); 
  const [showEditModal, setShowEditModal] = useState(false); 

  useEffect(() => {
    const userNameFromState = location.state?.id;
    const loggedInUser = userNameFromState || localStorage.getItem('User_name');

    if (loggedInUser) {
      setUserName(loggedInUser);
      fetchUserData(); 
      fetchOrders(loggedInUser); 
      fetchAttendance();
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

  const fetchAttendance = async () => { 
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

      fetchAttendance(); 
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

      <Footer />
    </>
  );
}
