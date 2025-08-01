import { Outlet, useNavigate } from 'react-router-dom';
import TopNavbar from '../Components/TopNavbar';
import Footer from '../Components/Footer';
import FloatingButtons from '../Components/FloatingButtons';
import order from '../assets/order.svg';
import payment from '../assets/payment.svg';
import reciept from '../assets/reciept.svg';
import usertask from '../assets/usertask.svg';
const Layout = () => {
  const navigate = useNavigate();
  const buttonsList = [
    { onClick: () => navigate('/addTransaction'), src: reciept },
    { onClick: () => navigate('/addTransaction1'), src: payment },
    { onClick: () => navigate('/addOrder1'), src: order },
    { onClick: () => navigate('/addUsertask'), src: usertask },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-gray-900">
      <TopNavbar />
      <main className="flex-grow pt-16 pb-20 px-4">
        <Outlet />
      </main>
      <FloatingButtons buttonType="bars" buttonsList={buttonsList} direction="up" />
      <Footer />
    </div>
  );
};

export default Layout;
