import { NavLink } from "react-router-dom";

export default function Footer() {
  const tabs = [
    { label: "Report", path: "/allOrder", icon: "📄" },
    { label: "Delivered", path: "/allDelivery", icon: "🚚" },
    { label: "Vendor", path: "/AllVendors", icon: "🏭" },
    { label: "Bills", path: "/allBills", icon: "🧾" },
  ];

  return (
    <footer className="fixed bottom-0 right-0 left-0 sm:left-64 z-40 bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg">
      <div className="max-w-screen-xl mx-auto flex justify-around py-2">
        {tabs.map((t) => (
          <NavLink
            key={t.path}
            to={t.path}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs font-medium transition ${
                isActive
                  ? "text-yellow-300 scale-105"
                  : "text-white hover:text-yellow-200"
              }`
            }
          >
            <span className="text-lg mb-1">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </div>
    </footer>
  );
}
