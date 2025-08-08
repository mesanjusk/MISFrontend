import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../Components/Card';
import {
  FaCalendarAlt,
  FaClipboardCheck,
  FaUsers,
  FaUserFriends,
  FaBoxOpen,
  FaTasks,
  FaShoppingCart,
  FaExchangeAlt,
  FaMoneyBillWave,
  FaWhatsapp,
  FaUserClock,
} from 'react-icons/fa';

// List of main features to display on the dashboard
const features = [
  { name: 'Planner', to: '/planner', icon: FaCalendarAlt },
  { name: 'Review', to: '/review', icon: FaClipboardCheck },
  { name: 'Team', to: '/team', icon: FaUsers },
  { name: 'Customers', to: '/addCustomer', icon: FaUserFriends },
  { name: 'Items', to: '/addItem', icon: FaBoxOpen },
  { name: 'Tasks', to: '/addTask', icon: FaTasks },
  { name: 'Orders', to: '/allOrder', icon: FaShoppingCart },
  { name: 'Transactions', to: '/allTransaction', icon: FaExchangeAlt },
  { name: 'Payments', to: '/paymentReport', icon: FaMoneyBillWave },
  { name: 'WhatsApp', to: '/SendMessage', icon: FaWhatsapp },
  { name: 'Attendance', to: '/AllAttandance', icon: FaUserClock },
];

// Home dashboard showing quick links to major application features
export default function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  // Ensure the user is logged in before displaying the dashboard
  useEffect(() => {
    const user = localStorage.getItem('User_name');
    if (!user) {
      navigate('/');
    } else {
      setUserName(user);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('User_name');
    localStorage.removeItem('User_group');
    navigate('/');
  };

  return (
    <div className="p-4 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          {userName && (
            <p className="text-gray-600">Welcome back, {userName}</p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="self-start sm:self-auto px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {features.map((feature) => (
          <Link key={feature.name} to={feature.to}>
            <Card className="flex items-center space-x-3 hover:shadow-md transition-shadow">
              <feature.icon className="w-6 h-6 text-blue-600" />
              <span className="font-medium">{feature.name}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

