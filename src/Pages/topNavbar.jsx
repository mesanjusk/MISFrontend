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

  const home = () => {
    navigate("/");
  };

  return (
    <div>
      {/* Top Navbar */}
      <nav className="fixed top-0  w-full bg-white text-green-600 pr-14 pl-4 pt-2 pb-2 flex z-50 items-center ">
        <button className="uppercase" onClick={home}>
          <h1 className="text-xl font-bold">s k digital</h1>
        </button>

        <button className="text-2xl fixed right-5 focus:outline-none" onClick={toggleSidebar}
      >
        &#x22EE; {/* Three vertical dots */}
      </button>
      <button className=" fixed right-10 focus:outline-none" >
       <svg class="h-8 w-8 text-gray-500"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <circle cx="12" cy="12" r="6" />  <circle cx="12" cy="12" r="2" /></svg>
      </button>

      </nav>

      {/* Sidebar / Drawer */}
      {isOpen && (
        <div className={`shadow-md fixed top-10 right-0  w-50 h-4/6 bg-white transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out z-40`}>
        <div className="p-4 flex justify-between items-center border-b"> 
          
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
                 { label: "Report1", path: "/allTransaction2" },
                 { label: "Report2", path: "/allTransaction3" },
                
              ].map((item) => (
                <div key={item.label} onClick={() => navigate(item.path)} className="px-4 hover:bg-gray-100 text-s p-2 rounded">
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
                { label: "Report1", path: "/allTransaction2" },
                { label: "Report2", path: "/allTransaction3" },
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
                <div key={item.label} onClick={() => navigate(item.path)} className="px-4 hover:bg-gray-100 text-s p-2 rounded">
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
          className="fixed top-0 right-0 inset-0 bg-gray opacity-30 z-30"
        ></div>
      )}
    </div>
  );
};

export default TopNavbar;
