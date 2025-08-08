import React, { useState } from "react";
import {
  fetchUserNames,
  fetchAttendanceList,
  processAttendanceDataRange,
} from "../utils/attendanceUtils";
import { useNavigate } from "react-router-dom";

export default function AttendanceReport() {
  const [searchUser, setSearchUser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [userLookup, records] = await Promise.all([
        fetchUserNames(),
        fetchAttendanceList(),
      ]);
      const formatted = processAttendanceDataRange(records, userLookup, startDate, endDate);
      setReportData(formatted);
    } catch (e) {
      console.error("Error fetching report data:", e);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = reportData.filter((r) =>
    r.User_name.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="bg-white p-4 mt-4 rounded-lg w-full shadow-lg max-w-7xl mx-auto">
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-2 bg-gray-200 rounded"
        >
          ← Back
        </button>
        <h3 className="text-lg font-semibold">Attendance Register</h3>
      </div>

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
          disabled={loading}
        >
          {loading ? "Loading..." : "View"}
        </button>
      </div>

      <div className="overflow-x-auto max-h-[70vh]">
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
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-2" colSpan="7">
                  {loading ? "Loading..." : "No records"}
                </td>
              </tr>
            ) : (
              filtered.map((rec, idx) => (
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
    </div>
  );
}
