import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

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

  // Close dropdown if clicked outside
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
      items: [{ label: "Ledger", path: "/customerReport" }],
    },
    {
      group: "Item",
      items: [
        { label: "Item Report", path: "/itemReport" },
        ...(userGroup === "Vendor" ? [{ label: "Vendor Bills", path: "/vendorBills" }] : []),
      ],
    },
    {
      group: "Task",
      items: [{ label: "Task Report", path: "/taskReport" }],
    },
    {
      group: "User",
      items: [{ label: "User Report", path: "/userReport" }],
    },
    {
      group: "Account",
      items: [
        { label: "Payment Report", path: "/paymentReport" },
        { label: "Priority Report", path: "/priorityReport" },
        { label: "Add Receivable", path: "/addRecievable" },
        { label: "Add Payable", path: "/addPayable" },
        { label: "Transaction", path: "/allTransaction" },
        ...(userGroup === "Office User" ? [{ label: "Call logs", path: "/calllogs" }] : []),
      ],
    },
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
              setOpenGroup(null); // reset group
            }}
            className="text-lg font-bold"
          >
            ☰
          </button>

          {showDropdown && (
            <div className="absolute top-10 right-0 w-64 bg-white text-black rounded shadow-lg z-50 overflow-y-auto max-h-[80vh] border border-gray-200">
              {menuGroups.map((group) => (
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
              ))}
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary border-solid"></div>
        </div>
      )}
    </>
  );
};

export default TopNavbar;
