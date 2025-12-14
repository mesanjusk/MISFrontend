import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const IconChevronRight = ({ open }) => (
  <svg
    viewBox="0 0 24 24"
    className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}
  >
    <path fill="currentColor" d="M9 6l6 6-6 6z" />
  </svg>
);

export default function Sidebar({ collapsed, onExpand, onCollapse }) {
  const navigate = useNavigate();
  const { userGroup, clearAuth } = useAuth();
  const [openGroup, setOpenGroup] = useState(null);

  const toggleGroup = (g) => {
    onExpand();
    setOpenGroup((prev) => (prev === g ? null : g));
  };

  const menuGroups = [
    {
      group: "Customer",
      items: [
        { label: "Ledger", path: "/customerReport" },
        { label: "Add Customer", path: "/addcustomer" },
        { label: "Add Customer Group", path: "/addcustomergroup" },
      ],
    },
    {
      group: "Item",
      items: [
        { label: "Item Report", path: "/itemReport" },
        { label: "Add Item", path: "/additem" },
        { label: "Add Item Group", path: "/additemgroup" },
        ...(userGroup === "Vendor"
          ? [{ label: "Vendor Bills", path: "/vendorBills" }]
          : []),
      ],
    },
    {
      group: "Task",
      items: [
        { label: "Task Report", path: "/taskReport" },
        { label: "Pending Task", path: "/pendingtask" },
        { label: "Add Task", path: "/addtask" },
        { label: "Add Task Group", path: "/addtaskgroup" },
      ],
    },
    {
      group: "User",
      items: [
        { label: "User Report", path: "/userReport" },
        { label: "Add User", path: "/adduser" },
        { label: "Add User Group", path: "/addusergroup" },
        { label: "Attendance", path: "/Attendance-Report" },
      ],
    },
    {
      group: "Order",
      items: [
        { label: "Add Order", path: "/addorder1" },
        { label: "All Bills", path: "/allbills" },
        { label: "Vendor Home", path: "/vendorhome" },
      ],
    },
    {
      group: "Enquiry",
      items: [
        { label: "Add Enquiry", path: "/addenquiry" },
        { label: "Add Note", path: "/addnote" },
      ],
    },
    {
      group: "Account",
      items: [
        { label: "Payment Report", path: "/paymentReport" },
        { label: "Priority Report", path: "/priorityReport" },
        { label: "Add Payable", path: "/addPayble" },
        { label: "Add Receivable", path: "/addRecievable" },
      ],
    },
    {
      group: "Transaction",
      items: [
        { label: "Transaction Report", path: "/allTransaction" },
        { label: "All Transaction 1", path: "/alltranscation1" },
        { label: "All Transaction 2", path: "/alltransaction2" },
        { label: "All Transaction 3", path: "/alltransaction3" },
      ],
    },
    {
      group: "Admin",
      items:
        userGroup === "Admin User"
          ? [{ label: "Call Logs", path: "/calllogs" }]
          : [],
    },
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      clearAuth();
      onCollapse();
      navigate("/");
    }
  };

  return (
    <aside
      className={`h-full bg-gradient-to-b from-blue-700 to-indigo-800 text-white
      flex flex-col shadow-xl transition-all duration-300
      ${collapsed ? "w-16" : "w-64"}
    `}
    >
      {/* Brand */}
      <div className="flex items-center justify-center h-16 border-b border-blue-600">
        {collapsed ? (
          <span className="text-lg font-bold">SK</span>
        ) : (
          <h1 className="text-xl font-bold">SANJU SK</h1>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {menuGroups.map(
          (g) =>
            g.items.length > 0 && (
              <div key={g.group}>
                <button
                  onClick={() => toggleGroup(g.group)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-md bg-white/20 grid place-items-center text-xs font-bold">
                      {g.group[0]}
                    </span>
                    {!collapsed && <span>{g.group}</span>}
                  </span>

                  {!collapsed && (
                    <IconChevronRight open={openGroup === g.group} />
                  )}
                </button>

                {!collapsed && openGroup === g.group && (
                  <div className="pl-9 mt-1 space-y-1">
                    {g.items.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          navigate(item.path);
                          onCollapse(); // 👈 auto close after use
                        }}
                        className="block w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-white/10"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
        )}
      </nav>

      {/* Logout */}
      <div className="border-t border-blue-600 p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-red-300 hover:text-red-100"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <path
              fill="currentColor"
              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4v2H5v14h4v2zm7-4v-4H9v-2h7V7l5 5-5 5z"
            />
          </svg>
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
