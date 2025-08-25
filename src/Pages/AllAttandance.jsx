import React, { useEffect, useState } from "react";
import axios from '../apiClient.js';
import { useNavigate, useLocation } from "react-router-dom";
import {
  fetchUserNames,
  fetchAttendanceList,
  processAttendanceDataForDate,
} from "../utils/attendanceUtils";

export default function AllAttandance() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [attendance, setAttendance] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userNameFromState = location.state?.id;
    const user = userNameFromState || localStorage.getItem("User_name");
    setLoggedInUser(user);
    if (user) {
      setUserName(user);
      loadToday();
    } else {
      navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("User_name");
    localStorage.removeItem("Mobile_number");
    navigate("/");
  };

  const loadToday = async () => {
    try {
      const [userLookup, records] = await Promise.all([
        fetchUserNames(),
        fetchAttendanceList(),
      ]);
      const todayISO = new Date().toISOString().split("T")[0];
      const formatted = processAttendanceDataForDate(records, userLookup, todayISO);
      setAttendance(formatted);
    } catch (e) {
      console.error("Error loading attendance:", e);
      setAttendance([]);
    }
  };

  return (
    <>
      <div className="max-w-8xl mx-auto px-2">
        

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 p-2">
          <div className="bg-white overflow-x-auto w-full">
            <table className="min-w-full text-sm text-center border">
              <thead>
                <tr>
                  <th className="border px-2">Name</th>
                  <th className="border px-2">In</th>
                  <th className="border px-2">Break</th>
                  <th className="border px-2">Start</th>
                  <th className="border px-2">Out</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td className="px-4 py-2 border" colSpan="5">
                      No attendance records found for today.
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
    </>
  );
}
