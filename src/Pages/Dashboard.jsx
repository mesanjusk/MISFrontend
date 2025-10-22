import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../apiClient.js';
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

const classNames = (...classes) => classes.filter(Boolean).join(' ');

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

  const periodOptions = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This week' },
    { id: 'month', label: 'This month' },
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
    <div className="page-content space-y-10">
      <section className="glass-panel glass-panel--inset relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/20" aria-hidden />
        <div className="relative flex flex-col gap-8 px-6 py-8 md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="section-heading__eyebrow">Executive overview</p>
              <h2 className="section-heading">Operations control room</h2>
              <p className="max-w-2xl text-sm text-slate-300/80">
                Monitor the pulse of collections, orders, and workforce productivity across every channel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {periodOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setPeriod(option.id)}
                  className={classNames(
                    'rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition-all duration-150 hover:border-primary/50 hover:bg-primary/15 hover:text-white',
                    period === option.id
                      ? 'bg-primary/25 text-white shadow-glow'
                      : 'bg-white/5'
                  )}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.key}
                label={metric.label}
                value={metric.format ? metric.format(current[metric.key]) : current[metric.key] ?? 0}
                icon={metric.icon}
                data={metric.data}
                onClick={metric.route ? () => navigate(metric.route) : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="surface-card space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="section-heading__eyebrow">Cash momentum</p>
              <h3 className="text-2xl font-semibold text-white">Today's pending follow-ups</h3>
              <p className="mt-2 text-sm text-slate-400">
                Collection commitments due today with quick access to mark outcomes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-ambient">
                <ReceiptIndianRupee size={16} />
                ₹{totalPendingToday.toLocaleString('en-IN')}
              </span>
              <button
                type="button"
                onClick={refreshFollowups}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-primary/40 hover:bg-primary/15 hover:text-white"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-ambient">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="w-[18%]">Customer</th>
                    <th className="w-[12%]">Amount (₹)</th>
                    <th>Reason</th>
                    <th>Remark</th>
                    <th className="w-[15%]">Follow-up date</th>
                    <th className="w-[12%] text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingFollowups ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        <td colSpan={6} className="px-4 py-4">
                          <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
                        </td>
                      </tr>
                    ))
                  ) : followupsToday.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">
                        No pending follow-ups for today.
                      </td>
                    </tr>
                  ) : (
                    followupsToday.map((row) => {
                      const id = row._id || row.id || '';
                      const name = row.customer_name || row.Customer || '—';
                      const amt = Number(row.amount ?? row.Amount) || 0;
                      const title = row.title || row.Title || '—';
                      const remark = row.remark || row.Remark || '—';
                      const d = row.followup_date || row.Followup_date || row.date;
                      const dStr = d ? ymd(d) : '—';

                      return (
                        <tr key={id} className="transition hover:bg-white/5">
                          <td className="px-4 py-3 font-medium text-slate-100">{name}</td>
                          <td className="px-4 py-3 font-semibold text-white">
                            ₹{amt.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-slate-200">{title}</td>
                          <td className="px-4 py-3 text-slate-300">{remark}</td>
                          <td className="px-4 py-3 text-slate-200">{dStr}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => markDone(row)}
                              disabled={!id || updatingIds.has(id)}
                              className={classNames(
                                'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition',
                                updatingIds.has(id)
                                  ? 'cursor-not-allowed border border-white/10 bg-white/10 text-slate-400'
                                  : 'border border-primary/40 bg-gradient-to-r from-primary to-secondary shadow-ambient hover:shadow-2xl'
                              )}
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
        </div>

        <div className="surface-card">
          <PendingTasks
            tasks={tasksForView}
            isLoading={isLoading}
            onTaskClick={handleTaskClick}
          />
        </div>
      </section>

      {userGroup === 'Admin User' && (
        <section className="surface-card space-y-6">
          <div>
            <p className="section-heading__eyebrow">Team presence</p>
            <h3 className="text-2xl font-semibold text-white">Today's attendance check-ins</h3>
          </div>
          <AllAttandance />
        </section>
      )}

      {userGroup === 'Office User' && (
        <section className="surface-card space-y-6">
          <div>
            <p className="section-heading__eyebrow">My assignments</p>
            <h3 className="text-2xl font-semibold text-white">Task updates</h3>
          </div>
          <UserTask onClose={closeUserModal} />
        </section>
      )}

      {/* Optional: if you actually render a modal in Dashboard like Home does,
          plug your modal component here and use showTaskModal/selectedTaskId */}
      {/* {showTaskModal && (
        <YourTaskModal id={selectedTaskId} onClose={closeTaskModal} />
      )} */}
    </div>
  );
}
