import React, { useEffect, useMemo, useState } from "react";
import axios from "../apiClient.js";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";

export default function UserTask() {
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceState, setAttendanceState] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userNameFromState = location?.state?.id;
    const user = userNameFromState || localStorage.getItem("User_name");
    setLoggedInUser(user);
    if (user) {
      setUserName(user);
      fetchAttendanceData(user);
      initAttendanceState(user);
    } else {
      navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const sequence = ["In", "Break", "Start", "Out"];

  const initAttendanceState = async (name) => {
    if (!name) return;
    try {
      const response = await axios.get(`/attendance/getTodayAttendance/${name}`);
      const data = response.data;
      if (!data.success || !Array.isArray(data.flow)) {
        setAttendanceState("In");
        return;
      }
      const flow = data.flow;
      const nextStep = sequence.find((step) => !flow.includes(step));
      if (flow.includes("Out")) {
        setAttendanceState(null); // complete
      } else {
        setAttendanceState(nextStep || null);
      }
    } catch (error) {
      console.error("Failed to fetch attendance state:", error);
      setAttendanceState("In");
    } finally {
      setShowButtons(true);
    }
  };

  const saveAttendance = async (type) => {
    if (!userName || !type) return;
    try {
      setSaving(true);
      const formattedTime = new Date().toLocaleTimeString();
      const response = await axios.post("/attendance/addAttendance", {
        User_name: userName,
        Type: type,
        Status: "Present",
        Time: formattedTime,
      });

      if (response.data.success) {
        sendmsg(type);
        if (type === "Out") {
          await createTransaction(userName);
        }
        // refresh UI
        await initAttendanceState(userName);
        await fetchAttendanceData(userName);
      } else {
        alert("Failed to save attendance.");
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
    } finally {
      setSaving(false);
    }
  };

  const createTransaction = async (name) => {
    try {
      const userResponse = await axios.get(`/user/getUserByName/${name}`);
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

      const journal = [
        {
          Account_id: "ceb70e15-d545-4ed2-8c3f-384e4f677d10",
          Type: "Credit",
          Amount: Amount,
        },
        {
          Account_id: user.AccountID,
          Type: "Debit",
          Amount: Amount,
        },
      ];

      const transactionResponse = await axios.post("/transaction/addTransaction", {
        Description: "Salary",
        Transaction_date: new Date().toISOString().split("T")[0],
        Total_Credit: Amount,
        Total_Debit: Amount,
        Payment_mode: user.User_group,
        Journal_entry: journal,
        Created_by: loggedInUser,
      });

      if (!transactionResponse.data.success) {
        alert("Failed to add Transaction.");
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  const sendmsg = async (type) => {
    try {
      const message = `SK ${userName} ${type}`;
      await axios.post("/usertask/send-message", {
        userName,
        mobile: "9372333633",
        type,
        message,
      });
    } catch (e) {
      console.error("SMS error:", e);
    }
  };

  const fetchUserNames = async () => {
    try {
      const response = await axios.get("/user/GetUserList");
      const data = response.data;
      if (data.success) {
        const userLookup = {};
        data.result.forEach((u) => {
          userLookup[u.User_uuid] = (u.User_name || "").trim();
        });
        return userLookup;
      }
      return {};
    } catch (error) {
      console.error("Error fetching user names:", error);
      return {};
    }
  };

  const fetchAttendanceData = async (user) => {
    try {
      const userLookup = await fetchUserNames();
      const attendanceResponse = await axios.get("/attendance/GetAttendanceList");
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

      const name = userLookup[(Employee_uuid || "").trim()] || "Unknown";
      const userDateKey = `${name}-${dateKey}`;

      if (!groupedData.has(userDateKey)) {
        groupedData.set(userDateKey, {
          Date: dateKey,
          User_name: name,
          In: "—",
          Break: "—",
          Start: "—",
          Out: "—",
          TotalHours: "—",
        });
      }

      const rec = groupedData.get(userDateKey);
      (User || []).forEach((entry) => {
        switch (entry.Type) {
          case "In":
            rec.In = (entry.Time || "").trim();
            break;
          case "Break":
            rec.Break = (entry.Time || "").trim();
            break;
          case "Start":
            rec.Start = (entry.Time || "").trim();
            break;
          case "Out":
            rec.Out = (entry.Time || "").trim();
            break;
          default:
            break;
        }
      });
    });

    return Array.from(groupedData.values());
  };

  useEffect(() => {
    axios
      .get("/usertask/GetUsertaskList")
      .then((response) => {
        if (response.data.success) setTasks(response.data.result || []);
      })
      .catch((error) => console.error("Error fetching tasks:", error));
  }, []);

  const myPendingTasks = useMemo(() => {
    const base = tasks.filter((t) => t.Status === "Pending");
    return userName ? base.filter((t) => t.User === userName) : base;
  }, [tasks, userName]);

  const todayLabel = useMemo(
    () => format(new Date(), "dd MMM yyyy"),
    []
  );

  const Badge = ({ value }) => {
    const has = value && value !== "—" && value !== "N/A";
    return (
      <span
        className={[
          "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
          has
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-slate-50 text-slate-500 border border-slate-200",
        ].join(" ")}
        title={has ? "Marked" : "Not marked"}
      >
        {has ? value : "—"}
      </span>
    );
  };

  const nextActionChip = (
    <span
      className={[
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        attendanceState
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-slate-50 text-slate-600 border-slate-200",
      ].join(" ")}
    >
      {attendanceState ? `Next: ${attendanceState}` : "Done for today"}
    </span>
  );

  const myTodayRow = useMemo(() => {
    return attendance.find((r) => r.User_name === loggedInUser);
  }, [attendance, loggedInUser]);

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-slate-100">
          <div>
            <h3 className="text-slate-900 font-semibold">My Attendance & Tasks</h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-slate-500">Today</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                {todayLabel}
              </span>
              {nextActionChip}
            </div>
          </div>

          {/* Primary action */}
          {showButtons && (
            <button
              onClick={() => saveAttendance(attendanceState)}
              disabled={!attendanceState || saving}
              className={[
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                !attendanceState || saving
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-500",
              ].join(" ")}
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 ${saving ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <path d="M21 3v6h-6" />
              </svg>
              {saving
                ? "Saving…"
                : attendanceState
                ? `${userName}  ${attendanceState}  –  ${format(new Date(), "dd MMM yyyy")}`
                : "All steps done"}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance (left / full on mobile) */}
          <div className="lg:col-span-2">
            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="text-left text-slate-600">
                    <th className="px-3 py-2 font-medium border-b border-slate-200">In</th>
                    <th className="px-3 py-2 font-medium border-b border-slate-200">Lunch</th>
                    <th className="px-3 py-2 font-medium border-b border-slate-200">Start</th>
                    <th className="px-3 py-2 font-medium border-b border-slate-200">Out</th>
                  </tr>
                </thead>
                <tbody>
                  {!myTodayRow ? (
                    <tr>
                      <td colSpan="4" className="px-3 py-6 text-center text-slate-500">
                        No attendance records found.
                      </td>
                    </tr>
                  ) : (
                    <tr className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <Badge value={myTodayRow.In} />
                      </td>
                      <td className="px-3 py-2">
                        <Badge value={myTodayRow.Break} />
                      </td>
                      <td className="px-3 py-2">
                        <Badge value={myTodayRow.Start} />
                      </td>
                      <td className="px-3 py-2">
                        <Badge value={myTodayRow.Out} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending tasks (right) */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-slate-800 font-semibold text-sm">Pending Tasks</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                  {myPendingTasks.length}
                </span>
              </div>

              {myPendingTasks.length === 0 ? (
                <div className="text-sm text-slate-500 py-4 text-center">Nothing pending 🎉</div>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-auto pr-1">
                  {myPendingTasks.map((t) => (
                    <li
                      key={t._id || t.id}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                    >
                      <div className="text-sm font-medium text-slate-800 truncate">
                        {t.Title || t.title || "Untitled task"}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {t.Description || t.description || ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
