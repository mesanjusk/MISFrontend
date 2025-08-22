import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import {
  TrendingUp,
  Package,
  Wallet,
  Users,
  ReceiptIndianRupee,
  CalendarClock,
  Activity,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

import MetricCard from '../Components/MetricCard';
import UserTask from './userTask';
import PendingTasks from './PendingTasks';
import AllAttandance from './AllAttandance';

const ymd = (d) => new Date(d).toLocaleDateString('en-CA'); // yyyy-mm-dd

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // ---- period stats (existing) ----
  const [period, setPeriod] = useState('today'); // 'today' | 'week' | 'month'
  const [stats, setStats] = useState({ today: {}, week: {}, month: {} });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`/dashboard/${period}`);
        setStats((prev) => ({ ...prev, [period]: response.data }));
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      }
    };
    fetchStats();
  }, [period]);

  const current = stats[period] ?? {};

  const sampleChart = [{ value: 0 }, { value: 5 }, { value: 3 }, { value: 8 }, { value: 4 }];

  const metrics = [
    { key: 'revenueMtd', label: 'Revenue (MTD)', icon: TrendingUp, data: sampleChart },
    { key: 'ordersToday', label: 'Orders Today', icon: Package, data: sampleChart },
    { key: 'collectionsToday', label: 'Collections Today', icon: Wallet, data: sampleChart },
    { key: 'activeFreelancers', label: 'Active Freelancers', icon: Users, data: sampleChart },
    { key: 'arOutstanding', label: 'AR Outstanding', icon: ReceiptIndianRupee, data: sampleChart },
    { key: 'apOutstanding', label: 'AP Outstanding', icon: ReceiptIndianRupee, data: sampleChart },
    { key: 'payrollDue7d', label: 'Payroll Due (7d)', icon: CalendarClock, data: sampleChart },
    { key: 'conversionRate', label: 'Conversion Rate', icon: Activity, data: sampleChart, format: (v) => (v == null ? '—' : v) }
  ];

  // ---- Home-page parity logic (user/task/attendance) ----
  const [userName, setUserName] = useState('');
  const [userGroup, setUserGroup] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [task, setTask] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showUserModel, setShowUserModel] = useState(false);

  useEffect(() => {
    const group = localStorage.getItem('User_group');
    setUserGroup(group || '');
  }, []);

  useEffect(() => {
    // mimic Home's delayed init & guard
    const t1 = setTimeout(() => {
      const userNameFromState = location.state?.id;
      const user = userNameFromState || localStorage.getItem('User_name');
      setLoggedInUser(user);
      if (user) {
        setUserName(user);
        fetchTasks();
        fetchAttendance(user);
      } else {
        navigate('/');
      }
    }, 2000);

    const t2 = setTimeout(() => setIsLoading(false), 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [location.state, navigate]);

  const fetchTasks = async () => {
    try {
      const taskRes = await axios.get('/usertask/GetUsertaskList');
      if (taskRes.data?.success) {
        setTask(taskRes.data.result || []);
      } else {
        setTask([]);
      }
    } catch (err) {
      console.log('Error fetching tasks:', err);
      setTask([]);
    }
  };

  const fetchUserNames = async () => {
    try {
      const response = await axios.get('/user/GetUserList');
      const data = response.data;
      if (data.success) {
        const lookup = {};
        data.result.forEach(u => {
          lookup[u.User_uuid] = (u.User_name || '').trim();
        });
        return lookup;
      }
      return {};
    } catch (e) {
      console.error('Error fetching user names:', e);
      return {};
    }
  };

  const fetchAttendance = async (userLabel) => {
    try {
      const userLookup = await fetchUserNames();
      const attendanceResponse = await axios.get('/attendance/GetAttendanceList');
      const records = attendanceResponse.data?.result || [];

      const attendanceWithUserNames = records.flatMap(record => {
        const employeeUuid = (record.Employee_uuid || '').trim();
        const name = userLookup[employeeUuid] || 'Unknown';

        return (record.User || []).map(u => ({
          Attendance_Record_ID: record.Attendance_Record_ID,
          User_name: name,
          Date: record.Date,
          Time: u.CreatedAt ? format(new Date(u.CreatedAt), 'hh:mm a') : 'No Time',
          Type: u.Type || 'N/A',
          Status: record.Status || 'N/A'
        }));
      });

      const filtered = attendanceWithUserNames.filter(r => r.User_name === userLabel);
      setAttendanceData(filtered);
    } catch (e) {
      console.error('Error fetching attendance:', e);
      setAttendanceData([]);
    }
  };

  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setSelectedTaskId(null);
  };

  const closeUserModal = () => setShowUserModel(false);

  // Filter tasks exactly like Home
  const tasksForView =
    userGroup === 'Admin User'
      ? task
      : task.filter(t => t.User === loggedInUser);

  /* ===================== Payment Follow-ups (Today, Pending) ===================== */
  const [followupsToday, setFollowupsToday] = useState([]);
  const [loadingFollowups, setLoadingFollowups] = useState(true);
  const [updatingIds, setUpdatingIds] = useState(new Set());

  const refreshFollowups = async () => {
    setLoadingFollowups(true);
    try {
      // Expect backend to return { success: true, result: [...] }
      const res = await axios.get('/paymentfollowup/list');
      const list = Array.isArray(res.data) ? res.data : (res.data?.result || []);
      const today = ymd(new Date());

      const pendingToday = (list || []).filter((f) => {
        const status = (f.status || f.Status || '').toLowerCase();
        const dateRaw = f.followup_date || f.Followup_date || f.date;
        const dateStr = dateRaw ? ymd(dateRaw) : null;
        return (status === 'pending' || status === '') && dateStr === today;
      });

      // sort by amount desc then name
      pendingToday.sort((a, b) => {
        const aAmt = Number(a.amount ?? a.Amount) || 0;
        const bAmt = Number(b.amount ?? b.Amount) || 0;
        if (bAmt !== aAmt) return bAmt - aAmt;
        const an = (a.customer_name || a.Customer || '').toString();
        const bn = (b.customer_name || b.Customer || '').toString();
        return an.localeCompare(bn);
      });

      setFollowupsToday(pendingToday);
    } catch (e) {
      console.error('Error fetching payment follow-ups:', e?.response?.data || e);
      setFollowupsToday([]);
    } finally {
      setLoadingFollowups(false);
    }
  };

  useEffect(() => {
    refreshFollowups();
  }, []);

  const totalPendingToday = followupsToday.reduce(
    (sum, f) => sum + (Number(f.amount ?? f.Amount) || 0),
    0
  );

  const markDone = async (row) => {
    const id = row._id || row.id;
    if (!id) return alert('Missing id on follow-up item.');
    const s = new Set(updatingIds);
    s.add(id);
    setUpdatingIds(s);
    try {
      await axios.patch(`/paymentfollowup/${id}/status`, { status: 'done' });
      await refreshFollowups();
    } catch (e) {
      console.error('Failed to update status:', e?.response?.data || e);
      alert('Failed to mark as done.');
    } finally {
      s.delete(id);
      setUpdatingIds(new Set(s));
    }
  };

  return (
    <div className="p-2">
      <div className="pt-2 max-w-6xl mx-auto px-2">
        {/* Admin: attendance widget (same as Home’s conditional) */}
        {userGroup === 'Admin User' && <AllAttandance />}

        {/* Office user: user task panel (same as Home) */}
        {userGroup === 'Office User' && <UserTask onClose={closeUserModal} />}

        {/* Pending tasks (same filtering & loading props as Home) */}
      </div>

      <PendingTasks
        tasks={tasksForView}
        isLoading={isLoading}
        onTaskClick={handleTaskClick}
      />

      {/* Period selector */}
      <div className="flex space-x-2 mb-4">
        {['today', 'week', 'month'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded ${
              period === p ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {p === 'today' ? 'Today' : p === 'week' ? 'Week' : 'Month'}
          </button>
        ))}
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <MetricCard
            key={m.key}
            label={m.label}
            value={m.format ? m.format(current[m.key]) : current[m.key] ?? 0}
            icon={m.icon}
            data={m.data}
            onClick={m.route ? () => navigate(m.route) : undefined}
          />
        ))}
      </div>

      {/* ===================== Today's Payment Follow-ups (Pending) ===================== */}
      <div className="max-w-6xl mx-auto mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            Today’s (Pending)
          </h3>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
              <ReceiptIndianRupee size={16} />
              <span className="font-medium">
                ₹{totalPendingToday.toLocaleString('en-IN')}
              </span>
            </span>
            <button
              onClick={refreshFollowups}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">(₹)</th>
                <th className="px-3 py-2 font-medium">Details</th>
                <th className="px-3 py-2 font-medium">Remark</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingFollowups ? (
                <tr>
                  <td className="px-3 py-4 text-center text-gray-500" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              ) : followupsToday.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                    No pending follow-ups for today.
                  </td>
                </tr>
              ) : (
                followupsToday.map((row) => {
                  const id = row._id || row.id || '';
                  const name = row.customer_name || row.Customer || '';
                  const amt = Number(row.amount ?? row.Amount) || 0;
                  const title = row.title || row.Title || '';
                  const remark = row.remark || row.Remark || '';
                  const d = row.followup_date || row.Followup_date || row.date;
                  const dStr = d ? ymd(d) : '—';

                  return (
                    <tr key={id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">{name || '—'}</td>
                      <td className="px-3 py-2 font-medium">₹{amt.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2">{title || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{remark || '—'}</td>
                      <td className="px-3 py-2">{dStr}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => markDone(row)}
                          disabled={!id || updatingIds.has(id)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-white ${
                            updatingIds.has(id)
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                          title="Mark as done"
                        >
                          <CheckCircle2 size={16} />
                          {updatingIds.has(id) ? 'Updating…' : 'Done'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optional: if you actually render a modal in Dashboard like Home does,
          plug your modal component here and use showTaskModal/selectedTaskId */}
      {/* {showTaskModal && (
        <YourTaskModal id={selectedTaskId} onClose={closeTaskModal} />
      )} */}
    </div>
  );
}
