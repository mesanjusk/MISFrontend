import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../Components/Sidebar";
import TopNavbar from "../Components/TopNavbar";
import Footer from "../Components/Footer";
import FloatingButtons from "../Components/FloatingButtons";

export default function Layout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);

  const buttonsList = [
    { onClick: () => navigate("/addOrder1"), label: "Order" },
    { onClick: () => navigate("/addTransaction"), label: "Receipt" },
    { onClick: () => navigate("/addTransaction1"), label: "Payment" },
    { onClick: () => navigate("/Followups"), label: "Followups" },
    { onClick: () => navigate("/addUsertask"), label: "Task" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-gray-900 overflow-hidden relative">
      {/* Sidebar */}
      <div
       className={`fixed top-0 left-0 z-50 h-full w-64 transition-all duration-300
          ${collapsed ? "-translate-x-full sm:translate-x-0 sm:w-16" : "translate-x-0 sm:w-64"}
        `}
      >
        <Sidebar
          collapsed={collapsed}
          onExpand={() => setCollapsed(false)}
          onCollapse={() => setCollapsed(true)}
        />
      </div>

      {/* Click Outside Overlay */}
      {!collapsed && (
        <div
           className="fixed inset-0 z-40 bg-transparent sm:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Main Content */}
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-300
          ${collapsed ? "sm:ml-16" : "sm:ml-64"}
        `}
      >
        <TopNavbar onToggleSidebar={() => setCollapsed(!collapsed)} />

        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28 sm:pb-20">
          <Outlet />
        </main>

        <FloatingButtons
          buttonsList={buttonsList}
          direction="up"
          autoClose={true}
          className="z-40"
          mainButtonStyle="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg rounded-full hover:scale-105 transition"
          itemButtonStyle="bg-white text-blue-800 shadow-md rounded-full hover:bg-blue-50"
        />

        <Footer />
      </div>
    </div>
  );
}
