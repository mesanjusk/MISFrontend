import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { enIN } from 'date-fns/locale';
import { format } from 'date-fns';

export default function UserTask() {
    const [tasks, setTasks] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [attendanceState, setAttendanceState] = useState(localStorage.getItem("attendanceState") || "None");
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [attendance, setAttendance] = useState([]);
    const [showButtons, setShowButtons] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const user = location.state?.id || localStorage.getItem('User_name');
        setLoggedInUser(user);
        if (user) {
            setUserName(user);
            fetchAttendanceData(user);
        } else {
            navigate("/login");
        }
    }, [navigate]);

    const formatTime = (dateString) => {
        return format(new Date(dateString), "h:mm a", { locale: enIN });
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
                    await createTransaction(loggedInUser);
                }
            }
        } catch (error) {
            console.error("Error saving attendance:", error);
        }
    };
    
    const createTransaction = async (loggedInUser) => {
        try {
            const userResponse = await axios.get(`/user/getUserByName/${loggedInUser}`);
            if (!userResponse.data.success || !userResponse.data.result) {
                alert("Failed to fetch user details!");
                return;
            }
    
            const user = userResponse.data.result;
            const Amount = Number(user.Amount); 
            const userGroup = user.User_group; 
    
            if (!Amount || !userGroup) {
                alert("Amount or User Group not found for user!");
                return;
            }
   
            const userGroupResponse = await axios.get(`/usergroup/getGroup/${userGroup}`);
            if (!userGroupResponse.data.success || !userGroupResponse.data.group) {
                alert("Failed to fetch user group details!");
                return;
            }
    
            const groupUuid = userGroupResponse.data.group.User_group_uuid; 
    
            if (!groupUuid) {
                alert("User Group UUID not found!");
                return;
            }
 
            const journal = [
                {
                    Account_id: groupUuid,  
                    Type: "Debit",
                    Amount: Amount
                },
                {
                    Account_id: user.User_uuid,
                    Type: "Credit",
                    Amount: Amount
                }
            ];
   
            const transactionResponse = await axios.post("/transaction/addTransaction", {
                Description: "Salary", 
                Total_Credit: Amount,
                Total_Debit: Amount,
                Payment_mode: user.User_group, 
                Journal_entry: journal,
                Created_by: loggedInUser
            });
    
            if (!transactionResponse.data.success) {
                alert("Failed to add Transaction.");
            }
    
        } catch (error) {
            console.error("Error creating transaction:", error);
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
    
            const formattedData = processAttendanceData(attendanceRecords, userLookup);
            setAttendance(formattedData);
    
            const filteredAttendance = attendanceRecords.flatMap(record => {
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
            }).filter(record => record.User_name === loggedInUser);
    
            setAttendanceData(filteredAttendance);
    
            if (filteredAttendance.length > 0) {
                const lastRecord = filteredAttendance[filteredAttendance.length - 1];
                const lastDate = new Date(lastRecord.Date).toISOString().split("T")[0];
                const todayDate = new Date().toISOString().split("T")[0];
    
                if (lastDate !== todayDate && lastRecord.Type === "In") {
                    setAttendanceState("None");
                    localStorage.setItem("attendanceState", "None");
                }
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    };
    

      const processAttendanceData = (data, userLookup) => {
        const groupedData = new Map();
    
        data.forEach(({ Date: recordDate, User, Employee_uuid }) => {  
   
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

            const userName = userLookup[Employee_uuid.trim()] || 'Unknown';
            const userDateKey = `${userName}-${dateKey}`;
    
            if (!groupedData.has(userDateKey)) {
                groupedData.set(userDateKey, { 
                    Date: dateKey, 
                    User_name: userName,
                    In: "N/A", 
                    Break: "N/A", 
                    Start: "N/A", 
                    Out: "N/A", 
                    TotalHours: "N/A"
                });
            }
    
    
            const record = groupedData.get(userDateKey);
    
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
            pendingTasks
                .filter(task => task.User === loggedInUser)
                .map(task => (
                    <div key={task._id} className="form-check">
                        <label className="form-check-label">
                            {task.Usertask_name}
                        </label>
                    </div>
                ))
        ) : (
            <p>No tasks available.</p>
        )}
        </div>
        <div className="form-check mt-3">
        <input
    type="checkbox"
    id="toggleButtons"
    className="form-check-input"
    checked={showButtons}
    onChange={() => {
        setShowButtons(prev => !prev);
        if (!showButtons) {
            setAttendanceState("None"); 
        }
    }}
/>

            <label className="form-check-label" htmlFor="toggleButtons">
                Please select checkbox
            </label>
        </div>

        {showButtons && (
            <div className="text-center mt-3">
                {attendanceState === "None" && (
                    <button className="bg-green-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('In')}>In</button>
                )}

                {attendanceState === "In" && (
                    <>
                        <button className="bg-red-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('Out')}>Out</button>&nbsp;&nbsp;
                        <button className="bg-yellow-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('Break')}>Break</button>
                    </>
                )}

                {attendanceState === "Break" && (
                    <>
                        <button className="bg-red-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('Out')}>Out</button>&nbsp;&nbsp;
                        <button className="bg-green-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('Start')}>Start</button>
                    </>
                )}

                {attendanceState === "Start" && (
                    <button className="bg-red-500 text-white px-2 py-2 rounded" onClick={() => saveAttendance('Out')}>Out</button>
                )}
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
        </tr>
    </thead>
    <tbody>
            {attendance
                .filter(row => row.User_name === loggedInUser) 
                .map((row, index) => (
                    <tr key={index}>
                        <td className="border px-4 py-2">{row.Date}</td>
                        <td className="border px-4 py-2">{row.In}</td>
                        <td className="border px-4 py-2">{row.Break}</td>
                        <td className="border px-4 py-2">{row.Start}</td>
                        <td className="border px-4 py-2">{row.Out}</td>
                        <td className="border px-4 py-2">{row.TotalHours}</td>

                    </tr>
                ))}
        </tbody>
</table>

                </div>
                
            </div>
        </div>
        
    );
}
