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

  const handleNavigation = (path) => {
    navigate(path);
    toggleSidebar();
  };

  return (
    <div>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-white text-green-600 pr-14 pl-2 pt-2 pb-2 flex z-50 items-center shadow-md">
        {/* Left: Side Navigation Button */}
        <button onClick={toggleSidebar} className="uppercase">
          <h1 className="text-xl font-bold">s k digital</h1>
        </button>
        {/* Center: Title */}
        {/* Right: Example of an additional icon (e.g., settings) */}
       
      </nav>

      {/* Sidebar / Drawer */}
      {userGroup === "Admin User" && (
      <div className={`fixed bottom-20 rounded-lg w-50 h-5/6 bg-white shadow-lg transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out z-40`}>
          <div className="p-1 bg-white text-black">
      <button className="focus:outline-none" onClick={handleLogout}>Logout</button>
      </div>
        <div onClick={() => handleNavigation("/addCustomer")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

          Add Customer
        </div>

        <div onClick={() => handleNavigation("/addPriority")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

          Add Priority
        </div>
        <div onClick={() => handleNavigation("/addTask")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

          Add Task
        </div>
        <div onClick={() => handleNavigation("/addItem")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

          Add Item
        </div>
        <div onClick={() => handleNavigation("/addItemgroup")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

          Add Item Group
        </div>
        <div onClick={() => handleNavigation("/addUsergroup")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

          Add User Group
        </div>
        <div onClick={() => handleNavigation("/addTaskgroup")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

          Add Task Group
        </div>

        <div onClick={() => handleNavigation("/addPayment")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

          Add Payment
        </div>
        <div onClick={() => handleNavigation("/addEnquiry")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

          Add Enquiry
        </div>
        <div onClick={() => handleNavigation("/addUser")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

          Add User
        </div>
        <div onClick={() => handleNavigation("/addOrder")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

          Add Order
        </div>
        <div onClick={() => handleNavigation("/addCustgroup")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

          Add Customer Group
        </div>
      </div>
      )}

      <div
        className={`fixed bottom-20 rounded-lg w-50 h-5/6 bg-white shadow-lg transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out z-40`}
      >
         <div className="p-1 bg-white text-black">
      <button className="focus:outline-none" onClick={handleLogout}>Logout</button>
      </div>
        <div className="p-1 bg-white text-black">
          <div onClick={() => handleNavigation("/customerReport")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

            Ledger
          </div>
        </div>


        <div className="p-1 bg-white text-black">
          <div onClick={() => handleNavigation("/addTransaction1")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

            Add Payment
          </div>
        </div>
        <div className="p-1 bg-white text-black">
          <div onClick={() => handleNavigation("/addTransaction")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

            Add Receipt
          </div>
        </div>
        <div className="p-1 bg-white text-black">
        <div onClick={() => handleNavigation("/taskReport")} className="flex items-center p-2 bg-white rounded-lg shadow-md cursor-pointer">

            Task Report
          </div>
        </div>
        <div className="p-1 bg-white text-black">

        </div>
        <div className="p-1 bg-white text-black">

        </div>
        <div className="p-1 bg-white text-black">

        </div>
        <div className="p-1 bg-white text-black">

        </div>
        <div className="p-1 bg-white text-black">

        </div>
        <div className="p-1 bg-white text-black">

        </div>
        <div className="p-1 bg-white text-black">

        </div>
        <div className="p-1 bg-white text-black">

        </div>
      </div>

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
