import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiAlertCircle,
  FiBarChart2,
  FiCompass,
  FiFileText,
  FiHome,
  FiList,
} from 'react-icons/fi';

const footerLinks = [
  { label: 'Overview', path: '/home', icon: FiHome },
  { label: 'Orders', path: '/allOrder', icon: FiList },
  { label: 'Delivery', path: '/allDelivery', icon: FiBarChart2 },
  { label: 'Vendors', path: '/AllVendors', icon: FiAlertCircle },
  { label: 'Bills', path: '/allBills', icon: FiFileText },
];

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <footer className="pointer-events-none fixed bottom-5 left-0 right-0 z-30 flex justify-center px-4">
      <nav className="pointer-events-auto glass-panel glass-panel--inset flex w-full max-w-2xl items-center justify-between gap-2 rounded-3xl border border-white/10 bg-slate-900/70 px-4 py-3 shadow-ambient">
        <div className="hidden items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-400 sm:flex">
          <FiCompass className="text-primary" />
          Navigate
        </div>

        <div className="flex flex-1 items-center justify-around gap-1">
          {footerLinks.map((link) => {
            const active = location.pathname.toLowerCase() === link.path.toLowerCase();
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition hover:text-white ${
                  active
                    ? 'bg-primary/20 text-white shadow-glow'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <link.icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-slate-300'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </footer>
  );
}

