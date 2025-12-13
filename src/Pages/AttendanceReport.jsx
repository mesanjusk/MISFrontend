import React, { useEffect, useState } from "react";
import {
  fetchUserNames,
  fetchAttendanceList,
  processAttendanceDataRange,
} from "../utils/attendanceUtils";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function AttendanceReport() {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [officeUsers, setOfficeUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [loading, setLoading] = useState(false);

  const loggedInUserName = localStorage.getItem("user_name");
  const userRole = localStorage.getItem("role");
  const isAdmin = userRole === "admin";

  /* ==================================================
     AUTO LOAD CURRENT MONTH
  ================================================== */
  useEffect(() => {
    const now = new Date();
    const s = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);

    setStartDate(s);
    setEndDate(e);

    if (!isAdmin && loggedInUserName) {
      setSelectedUser(loggedInUserName);
      fetchReportData(s, e, loggedInUserName);
    }
  }, []);

  /* ==================================================
     FETCH DATA
  ================================================== */
  const fetchReportData = async (
    s = startDate,
    e = endDate,
    forcedUser = isAdmin ? selectedUser : loggedInUserName
  ) => {
    setLoading(true);
    try {
      const [userLookup, records] = await Promise.all([
        fetchUserNames(),
        fetchAttendanceList(),
      ]);

      // Dropdown users from attendance
      const usersFromAttendance = Array.from(
        new Set(
          records.map((r) => {
            const u = userLookup[(r.Employee_uuid || "").trim()];
            return u?.name;
          })
        )
      ).filter(Boolean);

      setOfficeUsers(usersFromAttendance);

      const finalUser = isAdmin ? forcedUser : loggedInUserName;
      if (!isAdmin) setSelectedUser(finalUser);

      const formatted = processAttendanceDataRange(
        records,
        userLookup,
        s,
        e,
        finalUser
      );

      setReportData(formatted);
    } finally {
      setLoading(false);
    }
  };

  /* ==================================================
     STATS
  ================================================== */
  const totalHours = reportData.reduce(
    (sum, r) => sum + Number(r.TotalHours),
    0
  );

  const attendancePercent =
    reportData.length > 0
      ? (
          (reportData.filter((r) => r.In !== "N/A").length /
            reportData.length) *
          100
        ).toFixed(1)
      : "0";

  /* ==================================================
     PDF EXPORT
  ================================================== */
  const exportPDF = () => {
    if (!selectedUser && !isAdmin) return;

    const doc = new jsPDF();
    doc.text(
      `Attendance Report - ${selectedUser || "All Users"}`,
      14,
      15
    );

    doc.autoTable({
      startY: 22,
      head: [["User", "Date", "In", "Out", "Hours", "Late", "Half"]],
      body: reportData.map((r) => [
        r.User_name,
        r.Date,
        r.In,
        r.Out,
        r.TotalHours,
        r.Late ? "Yes" : "-",
        r.HalfDay ? "Yes" : "-",
      ]),
    });

    doc.save("Attendance_Report.pdf");
  };

  /* ==================================================
     CALENDAR
  ================================================== */
  const calendarMap = {};
  reportData.forEach((r) => {
    calendarMap[r.DateISO] = r;
  });

  const daysInMonth = startDate
    ? new Date(
        new Date(startDate).getFullYear(),
        new Date(startDate).getMonth() + 1,
        0
      ).getDate()
    : 0;

  /* ==================================================
     UI
  ================================================== */
  return (
    <div className="bg-white p-4 mt-4 rounded-lg shadow max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-2 bg-gray-200 rounded"
        >
          ← Back
        </button>
        <h3 className="text-lg font-semibold">
          Attendance Report — {selectedUser || "All Users"}
        </h3>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 items-end">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-1" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-1" />

        <select
          value={selectedUser}
          disabled={!isAdmin}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="border p-1 min-w-[220px]"
        >
          <option value="">{isAdmin ? "Select User" : selectedUser}</option>
          {officeUsers.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        <button onClick={() => fetchReportData()} className="px-4 py-1 bg-blue-500 text-white rounded">View</button>
        <button onClick={exportPDF} className="px-4 py-1 bg-green-600 text-white rounded">Export PDF</button>
        <button onClick={() => setViewMode(viewMode === "table" ? "calendar" : "table")} className="px-4 py-1 bg-gray-800 text-white rounded">
          {viewMode === "table" ? "Calendar View" : "Table View"}
        </button>
      </div>

      <div className="flex gap-6 text-sm font-medium mb-3">
        <div>Total Hours: <b>{totalHours.toFixed(2)}</b></div>
        <div>Attendance %: <b>{attendancePercent}%</b></div>
      </div>

      {viewMode === "table" ? (
        <table className="min-w-full text-sm text-center border">
          <thead>
            <tr>
              <th className="border">User</th>
              <th className="border">Date</th>
              <th className="border">In</th>
              <th className="border">Out</th>
              <th className="border">Hours</th>
              <th className="border">Late</th>
              <th className="border">Half</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((r, i) => (
              <tr key={i}>
                <td className="border">{r.User_name}</td>
                <td className="border">{r.Date}</td>
                <td className="border">{r.In}</td>
                <td className="border">{r.Out}</td>
                <td className="border">{r.TotalHours}</td>
                <td className="border">{r.Late ? "Yes" : "-"}</td>
                <td className="border">{r.HalfDay ? "Yes" : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="grid grid-cols-7 gap-2 text-xs">
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = String(i + 1).padStart(2, "0");
            const month = startDate.split("-")[1];
            const year = startDate.split("-")[0];
            const key = `${year}-${month}-${d}`;
            const rec = calendarMap[key];

            return (
              <div key={i} className="border rounded p-2 h-24">
                <div className="font-bold">{d}</div>
                {rec ? (
                  <>
                    <div className="font-semibold">{rec.User_name}</div>
                    <div>{rec.TotalHours} hrs</div>
                    {rec.Late && <div className="text-red-600">Late</div>}
                    {rec.HalfDay && <div className="text-yellow-600">Half Day</div>}
                  </>
                ) : (
                  <div className="text-gray-400">Absent</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
