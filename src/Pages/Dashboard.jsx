import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  const [period, setPeriod] = useState('today'); // 'today' | 'week' | 'month'
  const [stats, setStats] = useState({ today: {}, week: {}, month: {} });

  // Fetch statistics whenever the period changes
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`/dashboard/${period}`);
        setStats((prev) => ({ ...prev, [period]: response.data }));
      } catch (err) {
        // In case the endpoint is missing or fails we just log the error.
        console.error('Failed to load dashboard stats', err);
      }
    };
    fetchStats();
  }, [period]);

  const current = stats[period];

  // Definition of dashboard cards and their navigation targets
  const cards = [
    { key: 'collection', label: "Today's Collection", route: '/allTransaction' },
    { key: 'receivable', label: "Today's Receivable", route: '/addRecievable' },
    { key: 'newOrders', label: 'New Orders Today', route: '/allOrder' },
    { key: 'completedOrders', label: 'Completed Orders Today', route: '/allOrder' },
    { key: 'attendance', label: "Employees Attendance", route: '/AllAttandance' },
    { key: 'followups', label: "Today's Follow-ups", route: '/addUsertask' },
    { key: 'enquiries', label: 'New Enquiries', route: '/addEnquiry' },
    { key: 'targets', label: 'Target Achievements', route: '/taskReport' }
  ];

  return (
    <div className="p-4">
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
    </div>
  );
}

