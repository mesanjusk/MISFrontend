import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LoadingSpinner } from "../Components";

const TopNavbar = () => {
  const [userGroup, setUserGroup] = useState("");
  const [userName, setUserName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef();

  useEffect(() => {
    setTimeout(() => {
      const userNameFromState = location.state?.id;
      const user = userNameFromState || localStorage.getItem('User_name');
      if (user) {
        setUserName(user);
      } else {
        navigate("/login");
      }
    }, 1000);
    setTimeout(() => setIsLoading(false), 1000);
  }, [location.state, navigate]);

  useEffect(() => {
    const group = localStorage.getItem("User_group");
    setUserGroup(group);
  }, []);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("User_name");
      localStorage.removeItem("User_group");
      navigate("/");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
        setOpenGroup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuGroups = [
    {
      group: "Customer",
      items: [
        { label: "Ledger", path: "/customerReport" },
        { label: "Add Customer", path: "/addcustomer" },
        { label: "Add Customer Group", path: "/addcustomergroup" }
      ]
    },
    {
      group: "Item",
      items: [
        { label: "Item Report", path: "/itemReport" },
        { label: "Add Item", path: "/additem" },
        { label: "Add Item Group", path: "/additemgroup" },
        ...(userGroup === "Vendor" ? [{ label: "Vendor Bills", path: "/vendorBills" }] : [])
      ]
    },
    {
      group: "Task",
      items: [
        { label: "Task Report", path: "/taskReport" },
        { label: "Pending Task", path: "/pendingtask" },
        { label: "Add Task", path: "/addtask" },
        { label: "Add Task Group", path: "/addtaskgroup" }
      ]
    },
    {
      group: "User",
      items: [
        { label: "User Report", path: "/userReport" },
        { label: "Add User", path: "/adduser" },
        { label: "Add User Group", path: "/addusergroup" },
        { label: "Attendance", path: "/allattandance" }
      ]
    },
    {
      group: "Order",
      items: [
        { label: "Add Order", path: "/addorder1" },
        { label: "All Bills", path: "/allbills" },
        { label: "Vendor Home", path: "/vendorhome" }
      ]
    },
    {
      group: "Enquiry",
      items: [
        { label: "Add Enquiry", path: "/addenquiry" },
        { label: "Add Note", path: "/addnote" }
      ]
    },
    {
      group: "Account / Payment",
      items: [
        { label: "Payment Report", path: "/paymentReport" },
        { label: "Priority Report", path: "/priorityReport" },
        { label: "Add Payable", path: "/addpayble" },
        { label: "Add Receivable", path: "/addrecivable" },
        { label: "Add Payment", path: "/addpayment" },
        { label: "Add Receipt", path: "/addreciept" }
      ]
    },
    {
      group: "Transaction",
      items: [
        { label: "Transaction Report", path: "/allTransaction" },
        { label: "Add Transaction", path: "/addtranscation" },
        { label: "Add Transaction 1", path: "/addtranscation1" },
        { label: "All Transaction 1", path: "/alltranscation1" },
        { label: "All Transaction 2", path: "/alltranscation2" },
        { label: "All Transaction 3", path: "/alltranscation3" }
      ]
    },
    {
      group: "Other",
      items: userGroup === "Office User" ? [{ label: "Call Logs", path: "/calllogs" }] : []
    }
  ];

  const toggleGroup = (groupName) => {
    setOpenGroup(prev => (prev === groupName ? null : groupName));
  };

  return (
    <>
      <div className="fixed top-0 w-full bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 flex justify-between items-center z-50 shadow-md">
        <button
          onClick={() =>
            navigate(
              userGroup === "Admin User"
                ? "/Home"
                : userGroup === "Vendor"
                ? "/vendorHome"
                : "/"
            )
          }
        >
          <h1 className="text-xl font-bold uppercase">SANJU SK</h1>
        </button>

        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          <span className="text-sm">Hi, {userName}</span>
          <button
            onClick={() => {
              setShowDropdown(prev => !prev);
              setOpenGroup(null);
            }}
            className="text-lg font-bold"
          >
            ☰
          </button>

          {showDropdown && (
            <div className="absolute top-10 right-0 w-72 bg-white text-black rounded shadow-lg z-50 max-h-[80vh] overflow-y-auto border border-gray-300">
              {menuGroups.map((group) =>
                group.items.length > 0 ? (
                  <div key={group.group} className="border-b border-gray-100">
                    <div
                      className="px-4 py-2 text-sm font-semibold bg-gray-50 hover:bg-gray-100 cursor-pointer"
                      onClick={() => toggleGroup(group.group)}
                    >
                      {group.group}
                    </div>
                    {openGroup === group.group && (
                      <div className="pl-4">
                        {group.items.map((item) => (
                          <div
                            key={item.label}
                            onClick={() => {
                              navigate(item.path);
                              setShowDropdown(false);
                              setOpenGroup(null);
                            }}
                            className="text-sm py-1 px-2 rounded hover:bg-gray-100 cursor-pointer"
                          >
                            • {item.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null
              )}

              <div
                onClick={handleLogout}
                className="px-4 py-3 text-red-500 hover:bg-gray-100 cursor-pointer text-sm font-semibold border-t"
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full bg-white opacity-70 z-40 flex items-center justify-center">
          <LoadingSpinner size={48} className="text-primary" />
        </div>
      )}
    </>
  );
};

export default TopNavbar;
