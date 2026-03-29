import React, { useEffect, useState } from "react";
import { HiOutlineClipboardList, HiOutlineOfficeBuilding, HiOutlineExclamationCircle, HiOutlineCash, HiOutlineCreditCard } from "react-icons/hi";
import axios from "../apiClient";
import { LoadingSpinner } from "../Components";
import SectionHeader from "../components/common/SectionHeader";
import SummaryCard from "../components/dashboard/SummaryCard";
import RoleWidget from "../components/dashboard/RoleWidget";
import QuickActions from "../components/dashboard/QuickActions";
import CrmSidebarPanel from "../components/dashboard/CrmSidebarPanel";
import AllAttandance from "./AllAttandance";
import UserTask from "./userTask";
import { useDashboardData } from "../hooks/useDashboardData";
import { useUserRole } from "../hooks/useUserRole";

const toId = (order) => order?.Order_uuid || order?._id || order?.Order_id;

function OrderList({ items, emptyLabel }) {
  return (
    <div className="space-y-2">
      {items?.length === 0 && <p className="text-xs text-slate-500">{emptyLabel}</p>}
      {(items || []).map((order) => (
        <div key={toId(order)} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{order?.Customer_name || "Unknown"}</p>
              <p className="text-xs text-slate-500">#{order?.Order_Number || "-"}</p>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700">{order?.highestStatusTask?.Task || "Other"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const roleInfo = useUserRole();
  const [summaryApi, setSummaryApi] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(true);

  const data = useDashboardData({
    role: roleInfo?.role,
    userName: roleInfo?.userName,
    isAdmin: roleInfo?.isAdmin,
  });

  useEffect(() => {
    let mounted = true;
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        const res = await axios.get("/dashboard/summary");
        if (!mounted) return;
        setSummaryApi(res?.data?.result || res?.data?.data || {});
      } catch (error) {
        if (!mounted) return;
        setSummaryApi({});
      } finally {
        if (mounted) setSummaryLoading(false);
      }
    };

    fetchSummary();

    return () => {
      mounted = false;
    };
  }, []);

  const summaryCards = [
    { title: "Today Orders", value: summaryApi?.todayOrders ?? 0, icon: HiOutlineClipboardList, variant: "primary" },
    { title: "Pending Orders", value: summaryApi?.pendingOrders ?? data?.summary?.activeOrders ?? 0, icon: HiOutlineOfficeBuilding, variant: "warning" },
    { title: "Urgent Orders", value: summaryApi?.urgentOrders ?? 0, icon: HiOutlineExclamationCircle, variant: "danger" },
    { title: "Revenue Today", value: summaryApi?.revenueToday ?? 0, icon: HiOutlineCash, variant: "success" },
    { title: "Pending Payments", value: summaryApi?.pendingPayments ?? 0, icon: HiOutlineCreditCard, variant: "warning" },
  ];

  const loading = data?.isOrdersLoading || data?.isTasksLoading;

  return (
    <div className="min-h-screen bg-slate-50">
      {(loading || summaryLoading) && <div className="fixed top-0 left-0 right-0 h-1 bg-indigo-500 animate-pulse z-[60]" />}
      <div className="mx-auto max-w-[1800px] px-3 py-4">
        {data?.loadError ? <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{data.loadError}</div> : null}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {summaryCards.map((card) => <SummaryCard key={card.title} {...card} />)}
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <RoleWidget role={roleInfo?.role} userName={roleInfo?.userName} />
              {roleInfo?.isAdmin ? <QuickActions /> : null}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <SectionHeader title="Today" />
                <p className="text-sm text-slate-700">Smart workflow summary is live.</p>
                <p className="text-xs text-slate-500">Tap refresh below for latest updates.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <SectionHeader title="My Pending Orders" />
                {loading ? <div className="py-10 text-center"><LoadingSpinner /></div> : <OrderList items={data?.myPendingOrders} emptyLabel="No pending orders assigned." />}
              </div>

              <div className="space-y-3">
                {roleInfo?.isAdmin ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <SectionHeader title="Today Attendance" />
                    <div className="-mx-4"><AllAttandance /></div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <SectionHeader title="My Task Flow" />
                    <UserTask />
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <SectionHeader title="Recent Updates" action={<button onClick={data?.refresh}>Refresh</button>} />
                  <OrderList items={data?.recentOrders} emptyLabel="No recent orders." />
                </div>
              </div>
            </div>
          </div>
          <CrmSidebarPanel />
        </div>
      </div>
    </div>
  );
}
