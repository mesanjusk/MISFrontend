import { Outlet, useNavigate } from 'react-router-dom';
import TopNavbar from '../Components/TopNavbar';
import Footer from '../Components/Footer';
import FloatingButtons from '../Components/FloatingButtons';
import {
  FiCalendar,
  FiCheckSquare,
  FiClock,
  FiCreditCard,
  FiTrendingUp,
} from 'react-icons/fi';


const Layout = () => {
  const navigate = useNavigate();

  const buttonsList = [
    { onClick: () => navigate('/addOrder1'), label: 'New Order', icon: FiCalendar },
    { onClick: () => navigate('/addTransaction'), label: 'Add Receipt', icon: FiTrendingUp },
    { onClick: () => navigate('/addTransaction1'), label: 'Add Payment', icon: FiCreditCard },
    { onClick: () => navigate('/Followups'), label: 'Follow-ups', icon: FiClock },
    { onClick: () => navigate('/addUsertask'), label: 'Assign Task', icon: FiCheckSquare },
  ];

  return (
    <div className="app-shell text-slate-100">
      <div className="app-shell__background" aria-hidden />
      <div className="app-shell__pattern" aria-hidden />

      <TopNavbar />

      <main className="flex-grow relative">
        <div className="page-wrapper">
          <div className="relative z-10 space-y-8">
            <Outlet />
          </div>
        </div>
      </main>

      <FloatingButtons
        buttonsList={buttonsList}
        direction="up"
        autoClose={true}
      />
      <Footer />
    </div>
  );
};

export default Layout;
