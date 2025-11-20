import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* Inline SVG fallback icons (no react-icons needed) */
const IconChevronRight = ({ open }) => (
  <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}>
    <path fill="currentColor" d="M9 6l6 6-6 6z" />
  </svg>
);

export default function Sidebar() {
  const navigate = useNavigate();
  const [userGroup, setUserGroup] = useState("");
  const [openGroup, setOpenGroup] = useState(null);

  useEffect(() => {
    const g = localStorage.getItem("User_group");
    if (g) setUserGroup(g);
  }, []);

  const toggleGroup = (g) => setOpenGroup((prev) => (prev === g ? null : g));

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
        ...(userGroup === "Vendor" ? [{ label: "Vendor Bills", path: "/vendorBills" }] : []),
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
      group: "Account / Payment",
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
        { label: "Add Transaction Old", path: "/addTransactionOld" },
        { label: "Add Transaction 1 Old", path: "/addTransaction1Old" },
        { label: "All Transaction 1", path: "/alltranscation1" },
         { label: "All Transaction Old", path: "/alltransactionOld" },
        { label: "All Transaction 2", path: "/alltransaction2" },
        { label: "All Transaction 3", path: "/alltransaction3" },
      ],
    },
    {
      group: "Admin",
      items: userGroup === "Admin User" ? [{ label: "Call Logs", path: "/calllogs" }] : [],
    },
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.clear();
      navigate("/");
    }
  };

  return (
    <aside className="w-64 h-full bg-gradient-to-b from-blue-700 to-indigo-800 text-white flex flex-col shadow-xl">
      {/* Brand Header */}
      <div className="flex items-center justify-center h-16 border-b border-blue-600">
        <h1 className="text-xl font-bold tracking-wide">SANJU SK</h1>
      </div>

      {/* Scrollable Menu */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {menuGroups.map(
          (g) =>
            g.items.length > 0 && (
              <div key={g.group} className="rounded-lg">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(g.group)}
                  className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-left font-semibold text-sm hover:bg-white/10 ${
                    openGroup === g.group ? "bg-white/15" : ""
                  }`}
                >
                  <span>{g.group}</span>
                  <IconChevronRight open={openGroup === g.group} />
                </button>

                {/* Group Items */}
                {openGroup === g.group && (
                  <div className="pl-4 mt-1 space-y-1">
                    {g.items.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className="block w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-white/10 transition"
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
      <div className="border-t border-blue-600 p-3 text-sm">
        <button
          onClick={handleLogout}
          className="w-full text-left text-red-300 hover:text-red-100 transition flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <path fill="currentColor" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4v2H5v14h4v2zm7-4v-4H9v-2h7V7l5 5-5 5z" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
