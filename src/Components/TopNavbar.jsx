import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LoadingSpinner } from "../Components";

export default function TopNavbar({ onToggleSidebar }) {
  const [userName, setUserName] = useState("");
  const [userGroup, setUserGroup] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const n = location.state?.id || localStorage.getItem("User_name");
    const g = localStorage.getItem("User_group");
    if (n) setUserName(n);
    if (g) setUserGroup(g);
    if (!n) navigate("/login");
    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  }, [location.state, navigate]);

  const handleLogout = () => {
    if (window.confirm("Logout?")) {
      localStorage.clear();
      navigate("/");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="sm:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-600">
           
          </div>
        </div>

        <div className="flex items-center gap-4">
        
          <button className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="h-5 w-5 text-slate-700"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </button>

          <div className="relative group">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-700 to-indigo-800 text-white grid place-items-center text-sm font-semibold cursor-pointer">
              {userName ? userName.slice(0, 2).toUpperCase() : "NA"}
            </div>
            <div className="hidden group-hover:block absolute right-0 top-10 w-48 bg-white text-slate-800 rounded-lg shadow-lg border border-slate-200">
              <div className="px-4 py-3 text-sm">
                <div className="font-semibold">{userName}</div>
                <div className="text-xs text-slate-500">{userGroup}</div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className="h-4 w-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {isLoading && (
        <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
          <LoadingSpinner size={48} className="text-blue-500" />
        </div>
      )}
    </>
  );
}
