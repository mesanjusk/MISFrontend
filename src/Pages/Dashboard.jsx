import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

import UserTask from './userTask';
import PendingTasks from './PendingTasks';
import AllAttandance from './AllAttandance';

// Simple card component used on the dashboard
function StatCard({ label, value, onClick }) {
  return (
    <div
      onClick={onClick}
      className="p-4 bg-white rounded shadow cursor-pointer hover:shadow-md transition-shadow"
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value ?? 0}</p>
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onClick: PropTypes.func
};

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

  const cards = [
    { key: 'collection',       label: "Today's Collection",      route: '/allTransaction' },
    { key: 'receivable',       label: "Today's Receivable",      route: '/addRecievable' },
    { key: 'newOrders',        label: 'New Orders Today',        route: '/allOrder' },
    { key: 'completedOrders',  label: 'Completed Orders Today',  route: '/allOrder' },
    { key: 'attendance',       label: "Employees Attendance",    route: '/AllAttandance' },
    { key: 'followups',        label: "Today's Follow-ups",      route: '/addUsertask' },
    { key: 'enquiries',        label: 'New Enquiries',           route: '/addEnquiry' },
    { key: 'targets',          label: 'Target Achievements',     route: '/taskReport' }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={current[card.key]}
            onClick={() => navigate(card.route)}
          />
        ))}
      </div>

      {/* Home-like sections */}
     

      {/* Optional: if you actually render a modal in Dashboard like Home does,
          plug your modal component here and use showTaskModal/selectedTaskId */}
      {/* {showTaskModal && (
        <YourTaskModal id={selectedTaskId} onClose={closeTaskModal} />
      )} */}
    </div>
  );
}
