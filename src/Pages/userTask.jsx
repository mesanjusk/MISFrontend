import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { format } from 'date-fns';

export default function UserTask({ onClose }) {
    const [tasks, setTasks] = useState([]);
    const [selectedTasks, setSelectedTasks] = useState([]); 
    const [isCheckedAll, setIsCheckedAll] = useState(false);  
    const [isInClicked, setIsInClicked] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState(null); 
    const [attendanceData, setAttendanceData] = useState([]); 
     const [userName, setUserName] = useState('');
      const [userData, setUserData] = useState([]); 
       const navigate = useNavigate();
      
    
     useEffect(() => {
       
          const userNameFromState = location.state?.id;
          const user = userNameFromState || localStorage.getItem('User_name');
          setLoggedInUser(user);
          if (user) {
            setUserName(user);
            fetchUserData();
            fetchAttendance(user);
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
              Date: user.Date ? format(new Date(user.Date), 'yyyy-MM-dd') : 'Invalid Date',
              Time: user.Time || 'N/A',
              Type: user.Type || 'N/A',
              Status: record.Status || 'N/A',
            };
          });
        });
  
        const filteredAttendance = attendanceWithUserNames.filter(record => record.User_name === loggedInUser);
        setAttendanceData(filteredAttendance);
  
        if (filteredAttendance.length > 0) {
          const lastAttendance = filteredAttendance[filteredAttendance.length - 1]; 
          if (lastAttendance.Type === 'In') {
            setIsInClicked(true); 
          } else {
            setIsInClicked(false); 
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

    useEffect(() => {
        axios.get("/usertask/GetUsertaskList")
            .then(response => {
                if (response.data.success) {
                    setTasks(response.data.result); 
                } else {
                    console.error("Error: Unexpected API response structure", response.data);
                }
            })
            .catch(error => {
                console.error("Error fetching tasks:", error);
            });
    }, []);

    const pendingTasks = tasks.filter(task => task.Status === "Pending");

    const handleCheckboxChange = (taskId) => {
        setSelectedTasks(prevSelected => {
            let updatedSelection;
            if (prevSelected.includes(taskId)) {
                updatedSelection = prevSelected.filter(id => id !== taskId);
            } else {
                updatedSelection = [...prevSelected, taskId];
            }

            setIsCheckedAll(updatedSelection.length === pendingTasks.length);
            return updatedSelection;
        });
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
    
          fetchAttendance(userName); 
        } catch (error) {
          console.error('Error saving attendance:', error.response?.data?.message || error.message);
        }
      };
    
    const handleInClick = () => {
        setIsInClicked(true);  
        saveAttendance('In');
    };

    const handleOutClick = () => {
        setIsInClicked(false); 
        saveAttendance('Out');
    };

    return (
        <div className="d-flex justify-content-center align-items-center bg-gray-200 vh-80">
            <div className="bg-white p-3 rounded w-90">
            <button type="button" onClick={onClose}>X</button>
                <h1 className="text-xl font-bold">User Task</h1>

                <div className="mt-3">
                    {pendingTasks.length > 0 ? (
                        pendingTasks.map(task => (
                            <div key={task._id} className="form-check">
                                <input
                                    type="checkbox"
                                    id={task._id}
                                    className="form-check-input"
                                    checked={selectedTasks.includes(task._id)}
                                    onChange={() => handleCheckboxChange(task._id)}
                                />
                                <label className="form-check-label" htmlFor={task._id}>
                                    {task.Usertask_name}
                                </label>
                            </div>
                        ))
                    ) : (
                        <p>No tasks available.</p>
                    )}
                </div>
                {isCheckedAll && !isInClicked && (
                    <div className="text-center mt-3">
                        <button className="sanju bg-green-500 text-white px-2 py-2 mr-2 rounded" onClick={handleInClick}>In</button>
                    </div>
                )}

                {isCheckedAll && isInClicked && (
                    <div className="text-center mt-3">
                        <button className="sanju bg-red-500 text-white px-2 py-2 rounded" onClick={handleOutClick}>Out</button>
                    </div>
                )}
            </div>
        </div>
    );
}
