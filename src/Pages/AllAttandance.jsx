import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function AllAttandance() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [showReportSection, setShowReportSection] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const userNameFromState = location.state?.id;
    const user = userNameFromState || localStorage.getItem("User_name");
    setLoggedInUser(user);
    if (user) {
      setUserName(user);
      fetchAttendanceData(user);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("User_name");
    localStorage.removeItem("Mobile_number");
    navigate("/");
  };



  const fetchUserNames = async () => {
    try {
      const response = await axios.get("/user/GetUserList");
      const data = response.data;
      if (data.success) {
        const userLookup = {};
        data.result.forEach((user) => {
          userLookup[user.User_uuid] = user.User_name.trim();
        });
        return userLookup;
      } else {
        console.error("Failed to fetch user names:", data);
        return {};
      }
    } catch (error) {
      console.error("Error fetching user names:", error);
      return {};
    }
  };

  const fetchAttendanceData = async (loggedInUser) => {
    try {
      const userLookup = await fetchUserNames();
      const attendanceResponse = await axios.get(
        "/attendance/GetAttendanceList"
      );
      const attendanceRecords = attendanceResponse.data.result || [];
      const formattedData = processAttendanceData(attendanceRecords, userLookup);
      setAttendance(formattedData);

    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const processAttendanceData = (data, userLookup) => {
    const groupedData = new Map();
    const todayDate = new Date().toISOString().split("T")[0];
    data.forEach(({ Date: recordDate, User, Employee_uuid }) => {
      if (!recordDate) return;
      const parsedDate = new Date(recordDate);
      const dateKey = parsedDate.toISOString().split("T")[0];
      if (dateKey !== todayDate) return;
      const userName = userLookup[Employee_uuid.trim()] || "Unknown";
      const userDateKey = `${userName}-${dateKey}`;
      if (!groupedData.has(userDateKey)) {
        groupedData.set(userDateKey, {
          Date: dateKey,
          User_name: userName,
          In: "N/A",
          Break: "N/A",
          Start: "N/A",
          Out: "N/A",
          TotalHours: "N/A",
        });
      }
      const record = groupedData.get(userDateKey);
      User.forEach((userEntry) => {
        switch (userEntry.Type) {
          case "In":
            record.In = userEntry.Time.trim();
            break;
          case "Break":
            record.Break = userEntry.Time.trim();
            break;
          case "Start":
            record.Start = userEntry.Time.trim();
            break;
          case "Out":
            record.Out = userEntry.Time.trim();
            break;
        }
      });
    });

    return Array.from(groupedData.values()).map((record) => {
      record.TotalHours = calculateWorkingHours(
        record.In,
        record.Out,
        record.Break,
        record.Start
      );
      return record;
    });
  };

  const calculateWorkingHours = (inTime, outTime, breakTime, startTime) => {
    if (!inTime || !outTime) return "N/A";
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
    if (!inDate || !outDate) return "N/A";
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

  const fetchReportData = async () => {
    try {
      const userLookup = await fetchUserNames();
      const attendanceResponse = await axios.get(
        "/attendance/GetAttendanceList"
      );
      const attendanceRecords = attendanceResponse.data.result || [];
      const formattedData = processAttendanceDataRange(
        attendanceRecords,
        userLookup,
        startDate,
        endDate
      );
      setReportData(formattedData);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setReportData([]);
    }
  };

  const processAttendanceDataRange = (data, userLookup, start, end) => {
    const groupedData = new Map();
    const startDateObj = start ? new Date(start) : null;
    const endDateObj = end ? new Date(end) : null;

    data.forEach(({ Date: recordDate, User, Employee_uuid }) => {
      if (!recordDate) return;
      const parsedDate = new Date(recordDate);
      if (startDateObj && parsedDate < startDateObj) return;
      if (endDateObj && parsedDate > endDateObj) return;
      const dateKey = parsedDate.toISOString().split("T")[0];
      const userName = userLookup[Employee_uuid.trim()] || "Unknown";
      const userDateKey = `${userName}-${dateKey}`;
      if (!groupedData.has(userDateKey)) {
        groupedData.set(userDateKey, {
          Date: dateKey,
          User_name: userName,
          In: "N/A",
          Break: "N/A",
          Start: "N/A",
          Out: "N/A",
          TotalHours: "N/A",
        });
      }
      const record = groupedData.get(userDateKey);
      User.forEach((userEntry) => {
        switch (userEntry.Type) {
          case "In":
            record.In = userEntry.Time.trim();
            break;
          case "Break":
            record.Break = userEntry.Time.trim();
            break;
          case "Start":
            record.Start = userEntry.Time.trim();
            break;
          case "Out":
            record.Out = userEntry.Time.trim();
            break;
        }
      });
    });

    return Array.from(groupedData.values()).map((record) => {
      record.TotalHours = calculateWorkingHours(
        record.In,
        record.Out,
        record.Break,
        record.Start
      );
      return record;
    });
  };

  return (
    <>
      <div className="bg-[#e5ddd5] pt-5 max-w-8xl mx-auto px-2">
        <div className="mb-4">
          <button
            onClick={() => setShowReportSection(!showReportSection)}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            View Report
          </button>
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 p-2">
          <div className="bg-white overflow-x-auto w-full ">
            <table className="min-w-full text-sm text-center border">
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td className="px-4 py-2 border" colSpan="6">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  attendance.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 border-t">
                      <td className="px-4 py-2 border">{record.User_name}</td>
                      <td className="px-4 py-2 border">{record.In}</td>
                      <td className="px-4 py-2 border">{record.Break}</td>
                      <td className="px-4 py-2 border">{record.Start}</td>
                      <td className="px-4 py-2 border">{record.Out}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showReportSection && (
        <div className="bg-white p-4 mt-4 rounded-lg w-full shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Attendance Register</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border p-1"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border p-1"
            />
            <input
              type="text"
              placeholder="Search user"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="border p-1"
            />
            <button
              onClick={fetchReportData}
              className="px-3 py-1 bg-green-500 text-white rounded"
            >
              View
            </button>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-sm text-center border">
              <thead>
                <tr>
                  <th className="border px-2">Name</th>
                  <th className="border px-2">Date</th>
                  <th className="border px-2">In</th>
                  <th className="border px-2">Break</th>
                  <th className="border px-2">Start</th>
                  <th className="border px-2">Out</th>
                  <th className="border px-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr>
                    <td className="px-4 py-2" colSpan="7">
                      No records
                    </td>
                  </tr>
                ) : (
                  reportData
                    .filter((rec) =>
                      rec.User_name.toLowerCase().includes(searchUser.toLowerCase())
                    )
                    .map((rec, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="border px-2">{rec.User_name}</td>
                        <td className="border px-2">{rec.Date}</td>
                        <td className="border px-2">{rec.In}</td>
                        <td className="border px-2">{rec.Break}</td>
                        <td className="border px-2">{rec.Start}</td>
                        <td className="border px-2">{rec.Out}</td>
                        <td className="border px-2">{rec.TotalHours}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setShowReportSection(false)}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
