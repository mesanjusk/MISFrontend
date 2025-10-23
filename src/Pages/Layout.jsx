import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../Components/Sidebar";
import TopNavbar from "../Components/TopNavbar";
import Footer from "../Components/Footer";
import FloatingButtons from "../Components/FloatingButtons";

export default function Layout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const buttonsList = [
    { onClick: () => navigate("/addOrder1"), label: "Order" },
    { onClick: () => navigate("/addTransaction"), label: "Receipt" },
    { onClick: () => navigate("/addTransaction1"), label: "Payment" },
    { onClick: () => navigate("/Followups"), label: "Followups" },
    { onClick: () => navigate("/addUsertask"), label: "Task" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-40 h-full w-64 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-64 sm:translate-x-0"
        }`}
      >
        <Sidebar />
      </div>

      {/* Main wrapper beside sidebar */}
      <div className="flex flex-col flex-1 sm:ml-64 min-w-0">
        <TopNavbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28 sm:pb-20">
          <Outlet />
        </main>

        {/* Floating action buttons */}
        <FloatingButtons
          buttonsList={buttonsList}
          direction="up"
          autoClose={true}
          className="z-40"
          mainButtonStyle="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg rounded-full hover:scale-105 transition"
          itemButtonStyle="bg-white text-blue-800 shadow-md rounded-full hover:bg-blue-50"
        />

        {/* Footer aligned with main area (not under sidebar) */}
        <div className="sm:ml-64">
          <Footer />
        </div>
      </div>
    </div>
  );
}
