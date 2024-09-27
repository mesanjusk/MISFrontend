import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import TopNavbar from "../Pages/topNavbar";
import Footer from './footer';
import axios from 'axios';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState(''); 
  const [showOutButton, setShowOutButton] = useState(false); 

  useEffect(() => {
    const userNameFromState = location.state?.id;
    const loggedInUser = userNameFromState || localStorage.getItem('User_name');

    if (loggedInUser) {
      setUserName(loggedInUser);
    } else {
      navigate("/login");
    }
  }, [location.state, navigate]);

  const handleInClick = async () => {
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    setAttendanceStatus('In');
    setShowOutButton(true);
  
    try {
        const response = await axios.post('/attendance/addAttendance', {
            User_name: userName,           
            Type: 'In',  
            Status: 'Present',    
            Time: currentTime    
        });
  
        if (response.data.success) {
            alert('Attendance saved successfully');
        } else {
            console.error('Failed to save attendance:', response.data.message);
        }
    } catch (error) {
        console.error('Error saving attendance:', error.response?.data?.message || error.message);
    }
};
  
const handleOutClick = async () => {
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    setAttendanceStatus('Out');
    setShowOutButton(false);
  
    try {
        const response = await axios.post('/attendance/addAttendance', {
            User_name: userName, 
            Type: 'Out',  
            Status: 'Present',    
            Time: currentTime    
        });
  
        if (response.data.success) {
            alert('Attendance saved successfully');
        } else {
            console.error('Failed to save attendance:', response.data.message);
        }
    } catch (error) {
        console.error('Error saving attendance:', error.response?.data?.message || error.message);
    }
};

  return (
    <>
      <TopNavbar />
      <div className="  relative mt-10">
        <h1 className="absolute right-10 text-s font-bold mb-6">Welcome, {userName}!</h1>

        <div className="absolute right-10 top-10 p-2">
          <button
            onClick={handleInClick}
            className={`btn ${showOutButton ? 'hidden' : 'visible'} bg-green-500 text-white px-2 py-2 mr-2 rounded`}
          >
            In
          </button>

          {showOutButton && (
            <button
              onClick={handleOutClick}
              className="btn bg-red-500 text-white px-2 py-2 rounded"
            >
              Out
            </button>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
