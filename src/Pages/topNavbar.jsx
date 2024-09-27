import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TopNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userGroup, setUserGroup] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const group = localStorage.getItem("User_group");
    setUserGroup(group);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("User_name");
    localStorage.removeItem("User_group");
    navigate("/");
  };

  return (
    <div>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-white text-green-600 pr-14 pl-4 pt-2 pb-2 flex z-50 items-center shadow-md">
        <button onClick={toggleSidebar} className="uppercase">
          <h1 className="text-xl font-bold">s k digital</h1>
        </button>
      </nav>

      {/* Sidebar / Drawer */}
      {isOpen && (
        <div className={`fixed bottom-20 rounded-lg w-50 h-5/6 bg-white shadow-lg transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out z-40`}>
          <div className="p-1 bg-white text-black">
            <button className="focus:outline-none" onClick={handleLogout}>Logout</button>
          </div>

          {userGroup === "Office User" && (
            <>
              {[
                
                 { label: "Add Reciept", path: "/addTransaction1" },
                 { label: "Add Payment", path: "/addTransaction" },
                 { label: "Ledger", path: "/customerReport" },
                 { label: "Add Item", path: "/addItem" },
                 { label: "Add Item Group", path: "/addItemgroup" },

                
              ].map((item) => (
                <div key={item.label} onClick={() => navigate(item.path)} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">
                  {item.label}
                </div>
              ))}
            </>
          )}

          {(userGroup === "Admin User" || userGroup === "Vendor") && (
            <>
              {[
                { label: "Ledger", path: "/customerReport" },
                { label: "Add Payment", path: "/addTransaction1" },
                { label: "Add Receipt", path: "/addTransaction" },
                { label: "Task Report", path: "/taskReport" },
                { label: "Task Report", path: "/taskReport" },
                { label: "Add Customer", path: "/addCustomer" },
                { label: "Add Priority", path: "/addPriority" },
                { label: "Add Task", path: "/addTask" },
               
                { label: "Add User Group", path: "/addUsergroup" },
                { label: "Add Task Group", path: "/addTaskgroup" },
                { label: "Add Payment", path: "/addPayment" },
                { label: "Add Enquiry", path: "/addEnquiry" },
                { label: "Add User", path: "/addUser" },
                { label: "Add Order", path: "/addOrder" },
                { label: "Add Customer Group", path: "/addCustgroup" },
              ].map((item) => (
                <div key={item.label} onClick={() => navigate(item.path)} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">
                  {item.label}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Backdrop to close sidebar on mobile */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed top-0 right-0 inset-0 bg-black opacity-30 z-30"
        ></div>
      )}
    </div>
  );
};

export default TopNavbar;
