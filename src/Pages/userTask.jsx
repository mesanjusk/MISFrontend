import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { format } from 'date-fns';

export default function UserTask() {
    const [tasks, setTasks] = useState([]);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [isCheckedAll, setIsCheckedAll] = useState(false);
    const [attendanceState, setAttendanceState] = useState("None");
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [userName, setUserName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const user = location.state?.id || localStorage.getItem('User_name');
        setLoggedInUser(user);
        if (user) {
            setUserName(user);
            fetchAttendance(user);
        } else {
            navigate("/login");
        }
    }, [navigate]);

    const fetchAttendance = async (loggedInUser) => {
        try {
            const attendanceResponse = await axios.get('/attendance/GetAttendanceList');
            const attendanceRecords = attendanceResponse.data.result || [];
            const filteredAttendance = attendanceRecords.filter(record => record.User_name === loggedInUser);
            setAttendanceData(filteredAttendance);
            
            if (filteredAttendance.length > 0) {
                const lastAttendance = filteredAttendance[filteredAttendance.length - 1];
                setAttendanceState(lastAttendance.Type);
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    };

    useEffect(() => {
        axios.get("/usertask/GetUsertaskList")
            .then(response => {
                if (response.data.success) {
                    setTasks(response.data.result);
                } else {
                    console.error("Error fetching tasks", response.data);
                }
            })
            .catch(error => {
                console.error("Error fetching tasks:", error);
            });
    }, []);

    const pendingTasks = tasks.filter(task => task.Status === "Pending");

    const handleCheckboxChange = (taskId) => {
        setSelectedTasks(prevSelected => {
            const updatedSelection = prevSelected.includes(taskId)
                ? prevSelected.filter(id => id !== taskId)
                : [...prevSelected, taskId];
            setIsCheckedAll(updatedSelection.length === pendingTasks.length);
            return updatedSelection;
        });
    };

    const saveAttendance = async (type) => {
      const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
      const currentDate = new Date().toLocaleDateString();
  
      try {
          const response = await axios.post('/attendance/addAttendance', {
              User_name: userName,
              Type: type,
              Status: 'Present',
              Date: currentDate,
              Time: currentTime
          });
  
          if (response.data.success) {
              alert(`Attendance saved successfully for ${type}`);
  
              setAttendanceState(type === "Out" ? "None" : type);
          } else {
              console.error('Failed to save attendance:', response.data.message);
          }
      } catch (error) {
          console.error('Error saving attendance:', error.response?.data?.message || error.message);
      }
  };
  
    return (
        <div className="d-flex justify-content-center align-items-center bg-gray-200 vh-100 vw-100">
            <div className="top-0 right-0  w-50 h-4/6 ">
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

                {isCheckedAll && attendanceState === "None" && (
    <div className="text-center mt-3">
        <button className="bg-green-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('In')}>In</button>
    </div>
)}

{isCheckedAll && attendanceState === "In" && (
    <div className="text-center mt-3">
        <button className="bg-red-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('Out')}>Out</button>&nbsp;&nbsp;
        <button className="bg-yellow-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('Break')}>Break</button>
    </div>
)}

{isCheckedAll && attendanceState === "Break" && (
    <div className="text-center mt-3">
        <button className="bg-red-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('Out')}>Out</button>&nbsp;&nbsp;
        <button className="bg-green-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('Start')}>Start</button>
    </div>
)}

{isCheckedAll && attendanceState === "Start" && (
    <div className="text-center mt-3">
        <button className="bg-red-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('Out')}>Out</button>
    </div>
)}

            </div>
        </div>
    );
}
