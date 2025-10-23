/* eslint-disable react/prop-types */
import React, { useMemo, useState, useEffect } from "react";

/* ------------------------------------------------------------------ */
/* Utilities                                                           */
/* ------------------------------------------------------------------ */
const cn = (...a) => a.filter(Boolean).join(" ");
const fmt = (n) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(1)}k`
    : `${n}`;

const kpiBadge = (v) =>
  v === 0 ? "bg-slate-200 text-slate-700" : v > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";

/* ------------------------------------------------------------------ */
/* IMPORT: real widgets for role-based quick panel                     */
/* ------------------------------------------------------------------ */
// Adjust paths if needed (e.g., "../Pages/AllAttandance")
import AllAttandance from "../Pages/AllAttandance";
import UserTask from "../Pages/userTask";

/* ------------------------------------------------------------------ */
/* Mock Data (replace with API later)                                  */
/* ------------------------------------------------------------------ */
const mock = {
  summary: [
    { id: "orders", label: "New Orders", value: 3721, delta: -2, icon: CartIcon },
    { id: "products", label: "Total Products", value: 2149, delta: 12, icon: BoxIcon },
    { id: "customers", label: "Active Customers", value: 1552, delta: 8, icon: UsersIcon },
    { id: "revenue", label: "Monthly Revenue", value: 15000, delta: 22, prefix: "₹", icon: WalletIcon },
  ],
  salesSeries: [220, 320, 410, 380, 520, 640, 590, 720, 680, 860, 910, 1040],
  compareSeries: [180, 260, 340, 300, 420, 520, 480, 560, 520, 610, 690, 800],
  topSellerAges: [
    { label: "17 - 30 Years old", value: 62, color: "#3b82f6" },
    { label: "31 - 50 Years old", value: 33, color: "#f59e0b" },
    { label: ">= 50 Years old", value: 10, color: "#22c55e" },
  ],
  salesShare: [
    { label: "COD", value: 55, color: "#3b82f6" },
    { label: "UPI", value: 30, color: "#22c55e" },
    { label: "Card", value: 15, color: "#f59e0b" },
  ],
  transactions: [
    { name: "Richard Gere", date: "12 Nov 2025", amount: 103, positive: true, avatar: "RG" },
    { name: "Tom Hanks", date: "02 Dec 2025", amount: 86, positive: false, avatar: "TH" },
    { name: "Arnold", date: "03 Jul 2025", amount: 42, positive: true, avatar: "AS" },
    { name: "Vin Diesel", date: "16 May 2025", amount: 67, positive: true, avatar: "VD" },
    { name: "Robert De Niro", date: "31 Jul 2025", amount: 22, positive: true, avatar: "RN" },
  ],
  activities: [
    { user: "Sylvester Stallone", time: "07:00 PM", text: "Has joined the team" },
    { user: "Matt Damon", time: "07:00 PM", text: "Added 3 new photos" },
    { user: "Catherine Z-Jones", time: "07:00 PM", text: "Changed Oppo Find X2 Pro price" },
    { user: "Vin Diesel", time: "07:00 PM", text: "Commented on Order #B-4012" },
  ],
  bestSellers: [
    { name: "Richard Gere", date: "12 Nov 2025", sales: 137 },
    { name: "Tom Hanks", date: "02 Dec 2025", sales: 129 },
    { name: "Keanu Reeves", date: "09 Aug 2025", sales: 118 },
  ],

  // NEW: Attendance mock data (kept for your small panel above)
  attendance: [
    { name: "Priya Sharma", time: "09:24 AM", status: "Present", avatar: "PS" },
    { name: "Aman Verma", time: "09:45 AM", status: "Late", avatar: "AV" },
    { name: "Riya Gupta", time: "—", status: "Absent", avatar: "RG" },
    { name: "Mohit Jain", time: "09:12 AM", status: "Present", avatar: "MJ" },
    { name: "Anita Rao", time: "10:02 AM", status: "Late", avatar: "AR" },
  ],
};

/* ------------------------------------------------------------------ */
/* Charts (pure SVG so no deps)                                       */
/* ------------------------------------------------------------------ */
function LineChart({ seriesA = [], seriesB = [], height = 220 }) {
  const W = 640;
  const H = height;
  const P = 32;
  const maxY = Math.max(...seriesA, ...seriesB, 10);
  const stepX = (W - P * 2) / Math.max(seriesA.length - 1, 1);
  const y = (v) => H - P - (v / maxY) * (H - P * 2);
  const path = (arr) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"} ${P + i * stepX} ${y(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line
          key={i}
          x1={P}
          x2={W - P}
          y1={P + t * (H - P * 2)}
          y2={P + t * (H - P * 2)}
          className="stroke-slate-200"
          strokeDasharray="4 4"
        />
      ))}
      <line x1={P} y1={P} x2={P} y2={H - P} className="stroke-slate-300" />
      <line x1={P} y1={H - P} x2={W - P} y2={H - P} className="stroke-slate-300" />
      <path d={path(seriesB)} className="fill-none stroke-slate-300" strokeWidth="2" />
      <path d={path(seriesA)} className="fill-none stroke-blue-500" strokeWidth="3" />
      {seriesA.map((v, i) => (
        <circle key={i} cx={P + i * stepX} cy={y(v)} r="3" className="fill-blue-500" />
      ))}
    </svg>
  );
}

function PieChart({ data = [], size = 220, donut = false }) {
  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  const R = size / 2;
  const C = { x: R, y: R };
  let acc = 0;
  const arcs = data.map((d) => {
    const start = (acc / total) * 2 * Math.PI;
    acc += d.value;
    const end = (acc / total) * 2 * Math.PI;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = C.x + R * Math.cos(start);
    const y1 = C.y + R * Math.sin(start);
    const x2 = C.x + R * Math.cos(end);
    const y2 = C.y + R * Math.sin(end);
    return { d, path: `M ${C.x} ${C.y} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z` };
  });

  return (
    <div className="flex gap-6 items-center">
      <svg width={size} height={size} className="shrink-0">
        {arcs.map((a, i) => (
          <path key={i} d={a.path} fill={a.d.color} className="opacity-90" />
        ))}
        {donut && <circle cx={R} cy={R} r={R * 0.55} className="fill-white" />}
      </svg>
      <ul className="text-sm space-y-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: d.color }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="ml-auto font-medium text-slate-900">{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small Components                                                    */
/* ------------------------------------------------------------------ */
function SummaryCard({ label, value, delta = 0, prefix = "", Icon }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <div className="p-2.5 rounded-xl bg-slate-50">
          <Icon className="h-6 w-6 text-slate-700" />
        </div>
        <span className={cn("px-2.5 py-1 text-xs rounded-full", kpiBadge(delta))}>
          {delta > 0 ? `+${delta}%` : `${delta}%`}
        </span>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight">
        {prefix}
        {fmt(value)}
      </div>
      <div className="text-slate-500 text-sm">{label}</div>
    </div>
  );
}

function Section({ title, right }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-slate-800 font-semibold">{title}</h3>
      {right}
    </div>
  );
}

function Avatar({ text }) {
  const colors = ["#eef2ff", "#ecfeff", "#fef3c7", "#dcfce7", "#fee2e2"];
  const i = useMemo(() => Math.floor(Math.random() * colors.length), []);
  return (
    <div
      className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold"
      style={{ background: colors[i] }}
      title={text}
    >
      {text}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Right Panel                                                         */
/* ------------------------------------------------------------------ */
function AttendanceBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const map = {
    present: "bg-emerald-50 text-emerald-700",
    late: "bg-amber-50 text-amber-700",
    absent: "bg-rose-50 text-rose-700",
  };
  return (
    <span className={cn("text-xs px-2 py-1 rounded-md", map[s] || "bg-slate-100 text-slate-700")}>
      {status}
    </span>
  );
}

function AttendancePanel({ items }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-100">
      <Section
        title="Attendance"
        right={
          <button className="text-xs px-2 py-1 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100">
            Today
          </button>
        }
      />
      <ul className="space-y-3">
        {items.map((t, i) => (
          <li key={i} className="flex items-center gap-3">
            <Avatar text={t.avatar} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate">{t.name}</div>
              <div className="text-xs text-slate-500">{t.time === "—" ? "Not marked" : t.time}</div>
            </div>
            <AttendanceBadge status={t.status} />
          </li>
        ))}
      </ul>
      <button className="w-full mt-4 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl py-2">
        View All
      </button>
    </div>
  );
}

function TransactionsPanel({ items }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-100">
      <Section title="Transactions" />
      <ul className="space-y-3">
        {items.map((t, i) => (
          <li key={i} className="flex items-center gap-3">
            <Avatar text={t.avatar} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate">{t.name}</div>
              <div className="text-xs text-slate-500">{t.date}</div>
            </div>
            <div className={cn("text-sm font-semibold", t.positive ? "text-emerald-600" : "text-rose-600")}>
              {t.positive ? "+" : "-"}₹{t.amount}
            </div>
          </li>
        ))}
      </ul>
      <button className="w-full mt-4 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl py-2">
        View More
      </button>
    </div>
  );
}

function ActivitiesPanel({ items }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-100">
      <Section title="Recent Activities" />
      <ol className="relative ml-3">
        {items.map((a, i) => (
          <li key={i} className="mb-6">
            <div className="absolute -left-3 top-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
            <div className="text-sm font-medium text-slate-800">{a.user}</div>
            <div className="text-xs text-slate-500">{a.time}</div>
            <div className="text-sm text-slate-600 mt-1">{a.text}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function BestSellersPanel({ items }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-100">
      <Section title="Weekly Best Sellers" />
      <ul className="space-y-3">
        {items.map((b, i) => (
          <li key={i} className="flex items-center gap-3">
            <Avatar text={b.name.split(" ").map((x) => x[0]).join("").slice(0, 2)} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate">{b.name}</div>
              <div className="text-xs text-slate-500">{b.date}</div>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">{b.sales} Sales</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Icons (inline, no deps)                                            */
/* ------------------------------------------------------------------ */
function CartIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M7 18a2 2 0 1 0 0 4a2 2 0 0 0 0-4m10 0a2 2 0 1 0 0 4a2 2 0 0 0 0-4M7.16 14h9.71a2 2 0 0 0 1.94-1.52l1.9-8A1 1 0 0 0 19.76 3H5.21l-.36-2H1v2h2l2.6 12.39A3 3 0 0 0 8.53 17H19v-2H8.53a1 1 0 0 1-1-.78z"
      />
    </svg>
  );
}
function BoxIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M21 16V8a1 1 0 0 0-.55-.89l-8-4a1 1 0 0 0-.9 0l-8 4A1 1 0 0 0 3 8v8a1 1 0 0 0 .55.89l8 4a1 1 0 0 0 .9 0l8-4A1 1 0 0 0 21 16M12 5.24L17.53 8L12 10.76L6.47 8zM5 9.47l6 3.29v6.77l-6-3zM13 19.53v-6.77l6-3v6.77z"
      />
    </svg>
  );
}
function UsersIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3s1.34 3 3 3m-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5S5 6.34 5 8s1.34 3 3 3m0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13m8 0c-.29 0-.62.02-.97.05C16.76 13.82 18 14.9 18 16.5V20h6v-3.5c0-2.33-4.67-3.5-8-3.5"
      />
    </svg>
  );
}
function WalletIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M21 7H3a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h18a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1m-2 8h-3a2 2 0 0 1 0-4h3zM17 6H5a1 1 0 0 1 0-2h12a2 2 0 0 1 2 2z"
      />
    </svg>
  );
}
function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="m21 21l-4.35-4.35A7.94 7.94 0 0 0 18 10a8 8 0 1 0-8 8a7.94 7.94 0 0 0 6.65-3.35L21 21M4 10a6 6 0 1 1 6 6a6 6 0 0 1-6-6"
      />
    </svg>
  );
}
function BellIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M12 2a7 7 0 0 0-7 7v3.29l-1.71 1.7A1 1 0 0 0 4 16h16a1 1 0 0 0 .71-1.71L19 12.29V9a7 7 0 0 0-7-7m0 20a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function Dashboard() {
  // NEW: detect user group for role-based widget
  const [userGroup, setUserGroup] = useState("");

  useEffect(() => {
    const g = localStorage.getItem("User_group");
    if (g) setUserGroup(g);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main grid */}
      <div className="mx-auto max-w-[1400px] px-6 py-6 grid grid-cols-12 gap-6">
        {/* Left (main)  */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {/* General Report */}
          <div>
            <h2 className="text-slate-900 text-lg font-semibold mb-3">General Report</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {mock.summary.map((s) => (
                <SummaryCard
                  key={s.id}
                  label={s.label}
                  value={s.value}
                  delta={s.delta}
                  prefix={s.prefix}
                  Icon={s.icon}
                />
              ))}
            </div>
          </div>

          {/* Sales Report */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-4">
            <Section
              title="Sales Report"
              right={
                <div className="flex items-center gap-2 text-sm">
                  <button className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100">
                    2 May, 2025 - 2 Jun, 2025
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100">
                    Filter by Category
                  </button>
                </div>
              }
            />
            <div className="-mx-2">
              <LineChart seriesA={mock.salesSeries} seriesB={mock.compareSeries} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-slate-600">This Month</div>
                <div className="text-xl font-semibold">₹15,000</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-slate-600">Last Month</div>
                <div className="text-xl font-semibold">₹10,000</div>
              </div>
            </div>
          </div>

          {/* Weekly Top Seller + Sales Report (pie/donut) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-4">
              <Section title="Weekly Top Seller" right={<a className="text-sm text-blue-600" href="#">Show More</a>} />
              <PieChart data={mock.topSellerAges} size={240} />
            </div>
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-4">
              <Section title="Sales Report" right={<a className="text-sm text-blue-600" href="#">Show More</a>} />
              <PieChart data={mock.salesShare} size={240} donut />
            </div>
          </div>

          {/* Best Sellers */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-4">
            <BestSellersPanel items={mock.bestSellers} />
          </div>
        </div>

        {/* Right panel */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Small attendance summary (mock) */}
          <AttendancePanel items={mock.attendance} />

          {/* NEW: Role-based quick widget — placed JUST ABOVE Transactions */}
          {userGroup === "Admin User" && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-3">
              <Section title="Attendance (Live)" />
              {/* Full widget (compact container so it doesn't overflow) */}
              <div className="max-h-[420px] overflow-auto rounded-xl">
                <AllAttandance />
              </div>
            </div>
          )}

          {userGroup === "Office User" && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-3">
              <Section title="Your Tasks" />
              <div className="max-h-[420px] overflow-auto rounded-xl">
                <UserTask onClose={() => {}} />
              </div>
            </div>
          )}

          {/* Transactions panel (stays below the new widget) */}
          <TransactionsPanel items={mock.transactions} />
          <ActivitiesPanel items={mock.activities} />
        </div>
      </div>
    </div>
  );
}
