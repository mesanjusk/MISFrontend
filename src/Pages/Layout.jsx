import { Outlet, useNavigate } from 'react-router-dom';
import TopNavbar from '../Components/TopNavbar';
import Footer from '../Components/Footer';
import FloatingButtons from '../Components/FloatingButtons';

const Layout = () => {
  const navigate = useNavigate();

  const buttonsList = [
    { onClick: () => navigate('/addOrder1'), label: 'Order' },
    { onClick: () => navigate('/addTransaction'), label: 'Receipt' },
    { onClick: () => navigate('/addTransaction1'), label: 'Payment' },
    
    { onClick: () => navigate('/addUsertask'), label: 'Task' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-gray-900">
      <TopNavbar />
      <main className="flex-grow pt-16 pb-20 px-4">
        <Outlet />
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
