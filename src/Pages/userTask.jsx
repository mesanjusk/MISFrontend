import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { enIN } from 'date-fns/locale';
import { format } from 'date-fns';

export default function UserTask() {
    const [tasks, setTasks] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [attendanceState, setAttendanceState] = useState(null);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [userMobile, setUserMobile] = useState(null);
    const [userName, setUserName] = useState('');
    const [mobile, setMobile] = useState('');
    const [attendance, setAttendance] = useState([]);
    const [showButtons, setShowButtons] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const userNameFromState = location.state?.id;
        const user = userNameFromState || localStorage.getItem('User_name');
        const usermobile = userNameFromState || localStorage.getItem('Mobile_number');
        setLoggedInUser(user);
        console.log(user);
        setUserMobile(usermobile);
        if (user) {
            setUserName(user);
            setUserMobile(usermobile);
            fetchAttendanceData(user);
        } else {
            navigate("/");
        }
    }, [navigate]);

    const saveAttendance = async (type) => {
        try {
            const formattedTime = new Date().toLocaleTimeString();
            const response = await axios.post("/attendance/addAttendance", {
                User_name: userName,
                Type: type,
                Status: "Present",
                Time: formattedTime
            });

            if (response.data.success) {
                alert(`Attendance saved successfully for ${type}`);

                let newState = "None";
                if (type === "In") {
                    newState = "Break";
                } else if (type === "Break") {
                    newState = "Start";
                } else if (type === "Start") {
                    newState = "Out";
                } else if (type === "Out") {
                    newState = "In";
                }

                setAttendanceState(newState);
                localStorage.setItem("attendanceState", newState);
                localStorage.setItem("attendanceDate", new Date().toLocaleDateString());

                if (type === "Out") {
                    await createTransaction(userName);
                }
            }
        } catch (error) {
            console.error("Error saving attendance:", error);
        }
    };

    const createTransaction = async (userName) => {
        try {
            const userResponse = await axios.get(`/user/getUserByName/${userName}`);
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
                    Account_id: "ceb70e15-d545-4ed2-8c3f-384e4f677d10",
                    Type: "Credit",
                    Amount: Amount
                },
                {
                    Account_id: user.AccountID,
                    Type: "Debit",
                    Amount: Amount
                }
            ];

            const transactionResponse = await axios.post("/transaction/addTransaction", {
                Description: "Salary",
                Transaction_date: new Date().toISOString(),
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

    useEffect(() => {
        const savedState = localStorage.getItem("attendanceState");
        const lastUpdated = localStorage.getItem("attendanceDate");
        const today = new Date().toISOString().split("T")[0];

        if (savedState && lastUpdated === today) {
            setAttendanceState(savedState);
        } else {
            setAttendanceState("In");
        }
    }, []);


    const fetchLastAttendance = async () => {
        try {
            const response = await fetch(`https://misbackend-e078.onrender.com/attendance/getTodayAttendance/${userName}`);
            const data = await response.json();
            if (data && data.success) {
                return data;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Fetch error:", error);
            return null;
        }
    };

    useEffect(() => {
        if (showButtons) {
            fetchLastAttendance().then((lastAttendance) => {
                let newState = "In";
                if (lastAttendance && lastAttendance.success) {
                    const lastType = lastAttendance.lastState;
                    if (lastType === "In") newState = "Break";
                    else if (lastType === "Break") newState = "Start";
                    else if (lastType === "Start") newState = "Out";
                    else if (lastType === "Out") newState = "In";
                }
                setAttendanceState(newState);
            }).catch((error) => {
                console.error("Error fetching last attendance:", error);
                setAttendanceState("In");
            });
        }
    }, [showButtons]);

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

    const sendmsg = async (type) => {
        const res = await fetch('https://misbackend-e078.onrender.com/usertask/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userName,
                mobile: "9372333633",
                type
            }),
        });

        const result = await res.json();
        console.log(result);

    }


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

                return record.User.map(user => ({
                    Attendance_Record_ID: record.Attendance_Record_ID,
                    User_name: userName,
                    Date: new Date(user.CreatedAt).toISOString().split("T")[0],
                    Time: user.CreatedAt ? format(new Date(user.CreatedAt), "hh:mm a") : "No Time",
                    Type: user.Type || 'N/A',
                    Status: record.Status || 'N/A',
                }));
            }).filter(record => record.User_name === loggedInUser);

            setAttendanceData(filteredAttendance);

            const todayDate = new Date().toISOString().split("T")[0];
            const attendanceByDate = filteredAttendance.reduce((acc, record) => {
                acc[record.Date] = acc[record.Date] || [];
                acc[record.Date].push(record);
                return acc;
            }, {});

            const lastRecordedDate = Object.keys(attendanceByDate).sort().pop();
            const lastDayRecords = attendanceByDate[lastRecordedDate] || [];
            const lastRecord = lastDayRecords.length > 0 ? lastDayRecords[lastDayRecords.length - 1] : null;

            if (lastRecordedDate !== todayDate) {
                setAttendanceState("In");
                localStorage.setItem("attendanceState", "In");
            } else {
                let newState = "In";

                if (lastRecord) {
                    if (lastRecord.Type === "In") {
                        newState = "Out_Break";
                    } else if (lastRecord.Type === "Break") {
                        newState = "Out_Start";
                    } else if (lastRecord.Type === "Start") {
                        newState = "Out";
                    } else if (lastRecord.Type === "Out") {
                        newState = "In";
                    }
                }

                setAttendanceState(newState);
                localStorage.setItem("attendanceState", newState);
            }

        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    };

    const processAttendanceData = (data, userLookup) => {
        const groupedData = new Map();
        const todayDate = new Date().toISOString().split("T")[0];

        data.forEach(({ Date: recordDate, User, Employee_uuid }) => {

            if (!recordDate) {
                console.error("Invalid Date:", recordDate);
                return;
            }

            const parsedDate = new Date(recordDate);
            const dateKey = parsedDate.toISOString().split("T")[0];

            if (dateKey !== todayDate) return;

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

        <div  >
            <div >


                <div className="px-1 pt-4 bg-green-200 grid grid-cols-12  items-center h-18" style={{ display: 'none' }} >
                    <div className="w-12 h-12 p-2 col-start-1 col-end-1 bg-gray-100 rounded-full flex items-center justify-center"></div>
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
                            setShowButtons((prev) => {
                                return !prev;
                            });
                        }}
                    />
                    <label className="form-check-label" htmlFor="toggleButtons">
                        उपरोक्त सभी टास्क ध्यान से पढ़े और उनका पूरा करे
                    </label>
                </div>

                {showButtons && attendanceState && (
                    <div className="text-center mt-3">

                        {attendanceState === "In" && (
                            <button
                                className="bg-green-500 text-white px-2 py-2 rounded"
                                onClick={() => { saveAttendance("In"); sendmsg("In") }}
                            >
                                In
                            </button>
                        )}

                        {attendanceState === "Break" && (
                            <>

                                <button
                                    className="bg-yellow-500 text-white px-2 py-2 rounded"
                                    onClick={() => { saveAttendance("Break"); sendmsg("Break") }}
                                >
                                    Break
                                </button>
                            </>
                        )}

                        {attendanceState === "Start" && (
                            <>

                                <button
                                    className="bg-green-500 text-white px-2 py-2 rounded"
                                    onClick={() => { saveAttendance("Start"); sendmsg("Start") }}
                                >
                                    Start
                                </button>
                            </>
                        )}

                        {attendanceState === "Out" && (
                            <button
                                className="bg-red-500 text-white px-2 py-2 rounded"
                                onClick={() => { saveAttendance("Out"); sendmsg("Out") }}
                            >
                                Out
                            </button>
                        )}
                    </div>
                )}
 

<div > <table className="min-w-full border border-gray-300 text-sm bg-white rounded-lg overflow-hidden">
                    <thead>
                        <tr className="bg-whatsapp-light-green text-whatsapp-dark">
                            <th className="border px-4 py-2 text-left">Date</th>
                            <th className="border px-4 py-2 text-left">In</th>
                            <th className="border px-4 py-2 text-left">Break</th>
                            <th className="border px-4 py-2 text-left">Start</th>
                            <th className="border px-4 py-2 text-left">Out</th>
                            <th className="border px-4 py-2 text-left">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendance
                            .filter(row => row.User_name === loggedInUser)
                            .map((row, index) => (
                                <tr key={index} className="hover:bg-whatsapp-light-gray">
                                    <td className="border px-4 py-2">{row.Date}</td>
                                    <td className="border px-4 py-2">{row.In}</td>
                                    <td className="border px-4 py-2">{row.Break}</td>
                                    <td className="border px-4 py-2">{row.Start}</td>
                                    <td className="border px-4 py-2">{row.Out}</td>
                                    <td className="border px-4 py-2">{row.TotalHours}</td>
                                </tr>
                            ))}
                    </tbody>
                </table></div> <div > </div>


                


            </div>

        </div>


    );
}
