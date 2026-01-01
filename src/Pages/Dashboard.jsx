import React from "react";
import { HiOutlineClipboardList, HiOutlineOfficeBuilding, HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi";
import { LoadingSpinner } from "../Components";
import SectionHeader from "../components/common/SectionHeader";
import SummaryCard from "../components/dashboard/SummaryCard";
import RoleWidget from "../components/dashboard/RoleWidget";
import QuickActions from "../components/dashboard/QuickActions";
import AllAttandance from "./AllAttandance";
import UserTask from "./userTask";
import { useDashboardData } from "../hooks/useDashboardData";
import { useUserRole } from "../hooks/useUserRole";

const toId = (order) => order?.Order_uuid || order?._id || order?.Order_id;
const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

function OrderList({ items, emptyLabel }) {
  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="text-xs text-slate-500">{emptyLabel}</p>}
      {items.map((order) => {
        const id = toId(order);
        return (
          <div key={id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{order.Customer_name || "Unknown"}</p>
                <p className="text-xs text-slate-500">#{order.Order_Number || "-"}</p>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700">{order?.highestStatusTask?.Task || "Other"}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Updated: {formatDate(order?.highestStatusTask?.CreatedAt)}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const roleInfo = useUserRole();
  const statusNotice = "";

  const data = useDashboardData({
    role: roleInfo.role,
    userName: roleInfo.userName,
    isAdmin: roleInfo.isAdmin,
  });

  const summaryCards = [
    {
      title: "Active Orders",
      value: data.summary.activeOrders,
      icon: HiOutlineClipboardList,
      variant: "primary",
    },
    {
      title: "Pending Today",
      value: data.summary.pendingToday,
      icon: HiOutlineOfficeBuilding,
      variant: "warning",
    },
    {
      title: "Delivered Today",
      value: data.summary.deliveredToday,
      icon: HiOutlineCheckCircle,
      variant: "success",
    },
  ];

  if (roleInfo.isAdmin) {
    summaryCards.push({
      title: "Cancelled Today",
      value: data.summary.cancelledToday,
      icon: HiOutlineXCircle,
      variant: "danger",
    });
  }

  const loading = data.isOrdersLoading || data.isTasksLoading;

  return (
    <div className="min-h-screen bg-slate-50">
      {loading && <div className="fixed top-0 left-0 right-0 h-1 bg-indigo-500 animate-pulse z-[60]" />}

      <div className="mx-auto max-w-[1800px] px-3 py-4 space-y-4">
        {data.loadError && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {data.loadError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard key={card.title} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <RoleWidget role={roleInfo.role} userName={roleInfo.userName} />
          {roleInfo.isAdmin && <QuickActions />}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader title="Today" />
            <p className="text-sm text-slate-700">Status updates will appear here.</p>
            <p className="text-xs text-slate-500">{statusNotice || "No changes yet."}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {!roleInfo.isAdmin && (
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <SectionHeader title="My Pending Orders" />
              {loading ? (
                <div className="py-10 text-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <OrderList items={data.myPendingOrders} emptyLabel="No pending orders assigned." />
              )}
            </div>
          )}

          <div className="space-y-3">
            {roleInfo.isAdmin ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <SectionHeader title="Today Attendance" />
                <div className="-mx-4">
                  <AllAttandance />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <SectionHeader title="My Task Flow" />
                <UserTask />
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <SectionHeader title="Recent Updates" action={<button onClick={data.refresh}>Refresh</button>} />
              <OrderList items={data.recentOrders} emptyLabel="No recent orders." />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
