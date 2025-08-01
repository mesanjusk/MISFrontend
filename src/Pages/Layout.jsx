import { Outlet } from 'react-router-dom';
import TopNavbar from '../Components/TopNavbar';
import Footer from '../Components/Footer';

const Layout = () => (
  <div className="min-h-screen flex flex-col bg-background text-gray-900">
    <TopNavbar />
    <main className="flex-grow pt-16 pb-20 px-4">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default Layout;
