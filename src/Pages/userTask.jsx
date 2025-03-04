import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { enIN } from 'date-fns/locale';
import { format } from 'date-fns';

export default function UserTask() {
    const [tasks, setTasks] = useState([]);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [attendanceState, setAttendanceState] = useState(localStorage.getItem("attendanceState") || "None");
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [totalTime, setTotalTime] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const user = location.state?.id || localStorage.getItem('User_name');
        setLoggedInUser(user);
        if (user) {
            setUserName(user);
            fetchAttendance(user);
            fetchAttendanceData(user);
        } else {
            navigate("/login");
        }
    }, [navigate]);

    const formatTime = (dateString) => {
        return format(new Date(dateString), "h:mm a", { locale: enIN });
    };

    const fetchAttendance = async (loggedInUser) => {
        try {
            const response = await axios.get('/attendance/GetAttendanceList');
            const records = response.data.result || [];
            const lastRecord = records.filter(record => record.User_name === loggedInUser).pop();
            
            if (lastRecord) {
                setAttendanceState(lastRecord.Type);
                localStorage.setItem('attendanceState', lastRecord.Type);
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
            return updatedSelection;
        });
    };

    const saveAttendance = async (type) => {
        try {
            const formattedTime = formatTime(new Date());
            const response = await axios.post("/attendance/addAttendance", {
                User_name: userName,
                Type: type,
                Status: "Present",
                Time: formattedTime
            });

            if (response.data.success) {
                alert(`Attendance saved successfully for ${type}`);
                setAttendanceState(type);
                localStorage.setItem("attendanceState", type);

                if (type === "Out") {
                    setAttendanceState("None");
                    localStorage.setItem("attendanceState", "None");
                }
            }
        } catch (error) {
            console.error("Error saving attendance:", error);
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

    const fetchAttendanceData = async (loggedInUser) => { 
        try {
          const userLookup = await fetchUserNames();
          
          const attendanceResponse = await axios.get('/attendance/GetAttendanceList');
          const attendanceRecords = attendanceResponse.data.result || [];

          const formattedData = processAttendanceData(attendanceRecords); 
          setAttendance(formattedData);
  
      
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

      const processAttendanceData = (data) => {
        const groupedData = new Map();
    
        data.forEach(({ Date: recordDate, User, Amount }) => {  
   
            if (!recordDate) {
                console.error("Invalid Date:", recordDate);
                return;
            }
    
            const parsedDate = new Date(recordDate);
            if (isNaN(parsedDate.getTime())) {
                console.error("Invalid Date format:", recordDate);
                return;
            }
    
            const dateKey = parsedDate.toISOString().split("T")[0];
    
            if (!groupedData.has(dateKey)) {
                groupedData.set(dateKey, { 
                    Date: dateKey, 
                    In: "N/A", 
                    Break: "N/A", 
                    Start: "N/A", 
                    Out: "N/A", 
                    TotalHours: "N/A", 
                    Amount: "N/A" 
                });
            }
    
            const record = groupedData.get(dateKey);
    
            User.forEach(userEntry => {
                switch (userEntry.Type) {
                    case "In":
                        record.In = userEntry.Time.trim() || "No Time";  
                        break;
                    case "Break":
                        record.Break = userEntry.Time.trim() || "No Time";
                        break;
                    case "Start":
                        record.Start = userEntry.Time.trim() || "No Time";
                        break;
                    case "Out":
                        record.Out = userEntry.Time.trim() || "No Time";
                        break;
                    default:
                        console.warn("Unexpected Type:", userEntry.Type);
                        break;
                }
            });
    
            record.Amount = Amount || record.Amount;

        });
    
        return Array.from(groupedData.values()).map((record) => {
            record.TotalHours = calculateWorkingHours(record.In, record.Out, record.Break, record.Start);
            return record;
        });
    };
    
    const calculateWorkingHours = (inTime, outTime, breakTime, startTime) => {
        if (!inTime || !outTime) {
            return "N/A"; 
        }
 
        const parseTime = (timeStr) => {
            if (!timeStr || timeStr === "N/A") return null;
            const [time, period] = timeStr.split(" "); 
            const [hours, minutes] = time.split(":").map(Number);
    
            let hours24 = hours;
            if (period === "PM" && hours !== 12) hours24 += 12;
            if (period === "AM" && hours === 12) hours24 = 0;
    
            const now = new Date();
            now.setHours(hours24, minutes, 0, 0);
            return now;
        };
    
        const inDate = parseTime(inTime);
        const outDate = parseTime(outTime);
        const breakDate = parseTime(breakTime) || 0;
        const startDate = parseTime(startTime) || 0;
    
        if (!inDate || !outDate) {
            return "N/A";
        }
    
        let workDuration = (outDate - inDate) / 1000; 
    
        if (breakDate && startDate) {
            const breakDuration = (startDate - breakDate) / 1000;
            workDuration -= breakDuration; 
        }
  
        const hours = Math.floor(workDuration / 3600);
        const minutes = Math.floor((workDuration % 3600) / 60);
        const seconds = workDuration % 60;
    
        return `${hours}h ${minutes}m ${seconds}s`;
    };
    
    return (
        <div className="d-flex justify-content-center align-items-center bg-gray-200 vh-100 vw-100">
            <div className="top-0 right-0 w-50 h-100">
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

                {selectedTasks.length > 0 && (
                    <div className="text-center mt-3">
                        {attendanceState === "None" && (
                            <div className="text-center mt-3">
                            <button className="bg-green-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('In')}>In</button>
                        </div>
                        )}

                        {attendanceState === "In" && (
                            <div className="text-center mt-3">
                            <button className="bg-red-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('Out')}>Out</button>&nbsp;&nbsp;
                            <button className="bg-yellow-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('Break')}>Break</button>
                        </div>
                        )}

                        {attendanceState === "Break" && (
                              <div className="text-center mt-3">
                              <button className="bg-red-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('Out')}>Out</button>&nbsp;&nbsp;
                              <button className="bg-green-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('Start')}>Start</button>
                          </div>
                        )}

                        {(attendanceState === "Start") && (
                            <div className="text-center mt-3">
                            <button className="bg-red-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('Out')}>Out</button>
                        </div>
                        )}

                        {totalTime && <p className="text-xl font-bold mt-2">Total Time Worked: {totalTime}</p>}
                    </div>
                )}

                <div className="tables-container flex">
                <table className="min-w-full border">
    <thead>
        <tr>
            <th className="px-4 py-2 border">Date</th>
            <th className="px-4 py-2 border">In</th>
            <th className="px-4 py-2 border">Break</th>
            <th className="px-4 py-2 border">Start</th>
            <th className="px-4 py-2 border">Out</th>
            <th className="px-4 py-2 border">Total</th>
            <th className="px-4 py-2 border">Amount</th>
        </tr>
    </thead>
    <tbody>
    {attendance.map((row, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">{row.Date}</td>
              <td className="border px-4 py-2">{row.In}</td>
              <td className="border px-4 py-2">{row.Break}</td>
              <td className="border px-4 py-2">{row.Start}</td>
              <td className="border px-4 py-2">{row.Out}</td>
              <td className="border px-4 py-2">{row.TotalHours}</td>
              <td className="border px-4 py-2">{row.Amount}</td>
            </tr>
          ))}
    </tbody>
</table>

                </div>
            </div>
        </div>
    );
}
