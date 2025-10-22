import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiAlertCircle,
  FiBell,
  FiBox,
  FiCalendar,
  FiCheckCircle,
  FiCheckSquare,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiHome,
  FiLayers,
  FiLogOut,
  FiMenu,
  FiMessageCircle,
  FiPlusCircle,
  FiRepeat,
  FiSearch,
  FiSettings,
  FiShoppingCart,
  FiTrendingUp,
  FiUser,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import { LoadingSpinner } from '../Components';

const classNames = (...classes) => classes.filter(Boolean).join(' ');

const shortcutButtons = [
  { label: 'Create Order', path: '/addOrder1', icon: FiPlusCircle },
  { label: 'Record Receipt', path: '/addTransaction', icon: FiTrendingUp },
  { label: 'New Task', path: '/addTask', icon: FiCheckCircle },
  { label: 'Payment Follow-up', path: '/Followups', icon: FiClock },
];

const useInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0].toUpperCase())
    .join('');
};

const createNavSections = (userGroup) => {
  const upper = (value) => (value || '').toUpperCase();
  const isVendor = upper(userGroup) === 'VENDOR';
  const isAdmin = upper(userGroup) === 'ADMIN USER';

  return [
    {
      group: 'Workspace',
      icon: FiGrid,
      items: [
        { label: 'Dashboard', path: '/home', icon: FiHome },
        { label: 'Planner', path: '/planner', icon: FiCalendar },
        { label: 'Review', path: '/review', icon: FiLayers },
        { label: 'Team', path: '/team', icon: FiUsers },
        { label: 'Vendor Home', path: '/vendorHome', icon: FiSettings, hidden: !isVendor },
      ],
    },
    {
      group: 'Customers',
      icon: FiUsers,
      items: [
        { label: 'Customer Ledger', path: '/customerReport' },
        { label: 'Add Customer', path: '/addCustomer' },
        { label: 'Customer Groups', path: '/addCustgroup' },
        { label: 'Search (Mobile)', path: '/customerMobile' },
      ],
    },
    {
      group: 'Items & Inventory',
      icon: FiBox,
      items: [
        { label: 'Item Report', path: '/itemReport' },
        { label: 'Add Item', path: '/addItem' },
        { label: 'Item Groups', path: '/addItemgroup' },
        { label: 'Vendor Bills', path: '/vendorBills', hidden: !isVendor },
      ],
    },
    {
      group: 'Orders & Delivery',
      icon: FiShoppingCart,
      items: [
        { label: 'Create Order', path: '/addOrder1' },
        { label: 'Order Report', path: '/allOrder' },
        { label: 'Delivery Board', path: '/allDelivery' },
        { label: 'All Bills', path: '/allBills' },
        { label: 'Migrate Orders', path: '/migrate-orders', hidden: !isAdmin },
      ],
    },
    {
      group: 'Tasks & Productivity',
      icon: FiCheckSquare,
      items: [
        { label: 'Task Report', path: '/taskReport' },
        { label: 'Pending Tasks', path: '/PendingTasks' },
        { label: 'Assign Task', path: '/addTask' },
        { label: 'Task Groups', path: '/addTaskgroup' },
        { label: 'User Task Board', path: '/addUsertask' },
      ],
    },
    {
      group: 'Users & Attendance',
      icon: FiUserCheck,
      items: [
        { label: 'User Directory', path: '/userReport' },
        { label: 'Add User', path: '/addUser' },
        { label: 'User Groups', path: '/addUsergroup' },
        { label: 'Attendance Tracker', path: '/attendance-report' },
        { label: 'Attendance Log', path: '/AllAttandance' },
      ],
    },
    {
      group: 'Finance',
      icon: FiDollarSign,
      items: [
        { label: 'Payment Report', path: '/paymentReport' },
        { label: 'Priority Report', path: '/priorityReport' },
        { label: 'Add Receivable', path: '/addRecievable' },
        { label: 'Add Payable', path: '/addPayable' },
        { label: 'Cash Ledger', path: '/CashLedger' },
      ],
    },
    {
      group: 'Transactions',
      icon: FiRepeat,
      items: [
        { label: 'Transactions', path: '/allTransaction' },
        { label: 'Receipts', path: '/allTransaction1' },
        { label: 'Payments', path: '/allTransaction2' },
        { label: 'Vendor Payments', path: '/allTransaction3' },
        { label: '4D Ledger', path: '/allTransaction4D' },
        { label: 'Add Transaction', path: '/addTransaction' },
        { label: 'Add Payment', path: '/addTransaction1' },
      ],
    },
    {
      group: 'Communication',
      icon: FiMessageCircle,
      items: [
        { label: 'Send Message', path: '/SendMessage' },
        { label: 'Broadcast Message', path: '/SendMessageAll' },
        { label: 'WhatsApp Login', path: '/WhatsAppLogin' },
        { label: 'WhatsApp Sessions', path: '/WhatsAppSession' },
        { label: 'WhatsApp Admin', path: '/WhatsAppAdminPanel', hidden: !isAdmin },
      ],
    },
    {
      group: 'Support',
      icon: FiAlertCircle,
      items: [
        { label: 'Vendor Directory', path: '/AllVendors' },
        { label: 'Payment Follow-up', path: '/Followups' },
        { label: 'Call Logs', path: '/calllogs', hidden: !isAdmin },
        { label: 'Add Enquiry', path: '/addEnquiry' },
        { label: 'Add Note', path: '/addnote', hidden: true },
      ],
    },
    {
      group: 'Reports & Statements',
      icon: FiFileText,
      items: [
        { label: 'Customer Statement', path: '/customerReport' },
        { label: 'Task Statement', path: '/taskReport' },
        { label: 'User Statement', path: '/userReport' },
        { label: 'Item Statement', path: '/itemReport' },
        { label: 'Attendance Report', path: '/attendance-report' },
      ],
    },
  ];
};

const TopNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userName, setUserName] = useState('');
  const [userGroup, setUserGroup] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const userNameFromState = location.state?.id;
      const user = userNameFromState || localStorage.getItem('User_name');
      if (!user) {
        navigate('/login');
        return;
      }
      setUserName(user);
    }, 600);

    const finishLoading = setTimeout(() => setIsLoading(false), 900);

    return () => {
      clearTimeout(timeout);
      clearTimeout(finishLoading);
    };
  }, [location.state, navigate]);

  useEffect(() => {
    const group = localStorage.getItem('User_group');
    setUserGroup(group || '');
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (
        showMobileMenu &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMobileMenu]);

  const initials = useInitials(userName);
  const navSections = useMemo(() => createNavSections(userGroup), [userGroup]);

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    localStorage.removeItem('User_name');
    localStorage.removeItem('User_group');
    navigate('/');
  };

  const handleNavigate = (path) => {
    if (!path) return;
    navigate(path);
    setShowMobileMenu(false);
    setExpandedSection(null);
  };

  const currentPath = location.pathname.toLowerCase();

  const highlightSection = (section) => {
    const active = section.items.find((item) => item.path?.toLowerCase() === currentPath);
    return Boolean(active);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full px-3 pt-3 pb-4 sm:px-6">
        <div className="glass-panel glass-panel--inset shadow-ambient border border-white/10">
          <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
            <div className="flex items-center gap-4">
              <button
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white shadow-inner shadow-black/20 transition hover:bg-white/10 focus:outline-none"
                onClick={() => handleNavigate(userGroup?.toUpperCase() === 'VENDOR' ? '/vendorHome' : '/home')}
                aria-label="Back to dashboard"
              >
                <FiGrid size={22} />
              </button>
              <div>
                <span className="chip text-xs">Sanju MIS Suite</span>
                <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
                  Unified Operations Console
                </h1>
              </div>
            </div>

            <div className="hidden flex-1 items-center justify-center gap-3 px-4 lg:flex">
              {shortcutButtons.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleNavigate(action.path)}
                  className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  <action.icon className="text-primary group-hover:scale-110" />
                  {action.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchRef}
                  type="search"
                  className="h-12 w-48 rounded-full border border-white/10 bg-white/5 pl-11 pr-5 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary focus:bg-white/10"
                  placeholder="Search command or page"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && event.currentTarget.value.trim()) {
                      const query = event.currentTarget.value.trim().toLowerCase();
                      const section = navSections.find((nav) =>
                        nav.items.some((item) => item.label.toLowerCase().includes(query))
                      );
                      if (section) {
                        const match = section.items.find((item) =>
                          item.label.toLowerCase().includes(query)
                        );
                        handleNavigate(match?.path);
                        event.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>

              <button className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 lg:flex">
                <FiBell />
              </button>

              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 shadow-inner shadow-black/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-semibold text-white">
                  {initials || <FiUser />}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-white">{userName || 'Loading...'}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{userGroup || '—'}</p>
                </div>
                <button
                  onClick={() => setShowMobileMenu((prev) => !prev)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <FiMenu />
                </button>
              </div>
            </div>
          </div>

          <div className="hidden grid-cols-4 gap-8 px-6 pb-6 lg:grid">
            {navSections.map((section) => {
              const filteredItems = section.items.filter((item) => !item.hidden);
              if (filteredItems.length === 0) return null;
              const isActive = highlightSection(section);
              return (
                <div
                  key={section.group}
                  className={classNames(
                    'nav-cluster rounded-2xl border border-white/5 bg-white/5 p-5 transition hover:border-white/15 hover:bg-white/8',
                    isActive && 'border-primary/40 bg-primary/10 shadow-glow'
                  )}
                >
                  <div className="nav-cluster__header text-base">
                    {section.icon && <section.icon className="text-primary" size={18} />}
                    <span>{section.group}</span>
                  </div>
                  <div className="nav-cluster__items">
                    {filteredItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => handleNavigate(item.path)}
                        className={classNames(
                          'nav-link text-left',
                          item.path?.toLowerCase() === currentPath && 'nav-link--active'
                        )}
                      >
                        {item.icon && <item.icon size={16} />}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <div className="lg:hidden">
        <div
          className={classNames(
            'fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-200',
            showMobileMenu ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          )}
          aria-hidden={!showMobileMenu}
        />

        <div
          ref={dropdownRef}
          className={classNames(
            'fixed inset-x-3 top-[5rem] z-40 origin-top rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-ambient transition-transform duration-200',
            showMobileMenu ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
          )}
        >
          <div className="flex flex-col gap-4">
            {navSections.map((section) => {
              const filteredItems = section.items.filter((item) => !item.hidden);
              if (filteredItems.length === 0) return null;
              const expanded = expandedSection === section.group;
              return (
                <div key={section.group} className="rounded-2xl border border-white/10 bg-white/5">
                  <button
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-white"
                    onClick={() =>
                      setExpandedSection((prev) => (prev === section.group ? null : section.group))
                    }
                  >
                    <span className="flex items-center gap-2">
                      {section.icon && <section.icon className="text-primary" />}
                      {section.group}
                    </span>
                    {expanded ? <FiChevronDown /> : <FiChevronRight />}
                  </button>
                  <div
                    className={classNames(
                      'grid gap-1 overflow-hidden px-4 transition-all duration-200',
                      expanded ? 'max-h-96 pb-3' : 'max-h-0'
                    )}
                  >
                    {filteredItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => handleNavigate(item.path)}
                        className={classNames(
                          'nav-link w-full justify-start rounded-xl border border-transparent bg-white/0 px-3 py-2 text-left text-sm',
                          item.path?.toLowerCase() === currentPath && 'nav-link--active border-white/10'
                        )}
                      >
                        {item.icon && <item.icon size={16} />}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
          <LoadingSpinner size={48} className="text-primary" />
        </div>
      )}
    </>
  );
};

export default TopNavbar;
