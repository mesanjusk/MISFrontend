import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function UserTask() {
    const [tasks, setTasks] = useState([]);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [attendanceState, setAttendanceState] = useState(localStorage.getItem("attendanceState") || "None");
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [totalTime, setTotalTime] = useState(null);
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
            const response = await axios.post("/attendance/addAttendance", {
                User_name: userName,
                Type: type,
                Status: "Present",
                Time: new Date().toISOString()
            });

            if (response.data.success) {
                alert(`Attendance saved successfully for ${type}`);
                setAttendanceState(type);
                localStorage.setItem("attendanceState", type);

                if (type === "Out") {
                    await calculateTotalTime();
                    setAttendanceState("None");
                    localStorage.setItem("attendanceState", "None");
                }
            }
        } catch (error) {
            console.error("Error saving attendance:", error);
        }
    };

    const calculateTotalTime = async () => {
        try {
            const response = await axios.get(`/attendance/getLastIn/${loggedInUser}`);
            if (response.data && response.data.Time) {
                const inTime = new Date(response.data.Time);
                const outTime = new Date();

                if (isNaN(inTime.getTime())) {
                    console.error("Invalid inTime format:", response.data.Time);
                    return;
                }

                const diffMs = outTime - inTime;
                const hours = Math.floor(diffMs / 3600000);
                const minutes = Math.floor((diffMs % 3600000) / 60000);
                const seconds = Math.floor((diffMs % 60000) / 1000);

                setTotalTime(`${hours}h ${minutes}m ${seconds}s`);
            } else {
                console.error("Error: No valid Time found in response");
            }
        } catch (error) {
            console.error("Error calculating total time:", error);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center bg-gray-200 vh-100 vw-100">
            <div className="top-0 right-0 w-50 h-4/6">
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
            </div>
        </div>
    );
}
