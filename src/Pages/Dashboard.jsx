import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineBanknotes,
  HiOutlineBuildingLibrary,
  HiOutlineClipboardDocumentCheck,
  HiOutlineClipboardDocumentList,
  HiOutlineExclamationTriangle,
  HiOutlinePhone,
  HiOutlineTruck,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import axios from "../apiClient";
import SectionHeader from "../components/common/SectionHeader";
import DashboardCard from "../components/dashboard/DashboardCard";
import ActionList from "../components/dashboard/ActionList";
import { useUserRole } from "../hooks/useUserRole";
import AllAttandance from "./AllAttandance";

const DAY_MS = 1000 * 60 * 60 * 24;

const statusClass = {
  success: "text-emerald-700",
  warning: "text-amber-700",
  danger: "text-rose-700",
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const calcDelayDays = (dueDate) => {
  const due = parseDate(dueDate);
  if (!due) return 0;
  return Math.max(0, Math.floor((new Date() - due) / DAY_MS));
};

const formatDate = (value) => {
  const date = parseDate(value);
  if (!date) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const isToday = (value) => {
  const date = parseDate(value);
  if (!date) return false;
  const now = new Date();
  return date.toDateString() === now.toDateString();
};

const isInSelectedRange = (value, range) => {
  if (range === "today") return isToday(value);

  const date = parseDate(value);
  if (!date) return false;

  const now = new Date();
  if (range === "week") {
    const diffDays = (now - date) / DAY_MS;
    return diffDays >= 0 && diffDays < 7;
  }
  if (range === "month") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  return true;
};

const toAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const listFromResponse = (response) => {
  if (Array.isArray(response?.data?.result)) return response.data.result;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const normalizeActionItem = (item, index, module) => {
  const dueDate =
    item?.DueDate || item?.Due_Date || item?.dueDate || item?.ExpectedDate || item?.Delivery_Date || item?.Date;

  return {
    id: item?.id || item?._id || item?.Task_uuid || item?.Order_uuid || `${module}-${index}`,
    title: item?.Title || item?.Subject || item?.Task || item?.Customer_name || item?.Order_Number || "Untitled",
    assignedTo: item?.AssignedTo || item?.Assigned || item?.User || item?.Employee_name || item?.User_name || "",
    dueDate,
    dueDateLabel: formatDate(dueDate),
    delayDays: calcDelayDays(dueDate),
    status: (item?.Status || item?.status || "").toString().toLowerCase(),
  };
};

const bucketStatus = (pendingCount, delayedCount) => {
  if (delayedCount > 0) return "delayed";
  if (pendingCount > 0) return "pending";
  return "completed";
};

export default function Dashboard() {
  const roleInfo = useUserRole();

  const [filters, setFilters] = useState({
    range: "today",
    status: "all",
    user: "all",
  });

  const [dashboardData, setDashboardData] = useState({
    attendance: [],
    transactions: [],
    orders: [],
    followups: [],
    tasks: [],
    deliveries: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const [attendanceRes, transactionRes, orderRes, followUpRes, taskRes, deliveryRes] = await Promise.allSettled([
          axios.get("/attendance/today"),
          axios.get("/transactions/today"),
          axios.get("/orders/active"),
          axios.get("/followups/today"),
          axios.get("/tasks/today"),
          axios.get("/deliveries/today"),
        ]);

        if (!isMounted) return;

        setDashboardData({
          attendance: attendanceRes.status === "fulfilled" ? listFromResponse(attendanceRes.value) : [],
          transactions: transactionRes.status === "fulfilled" ? listFromResponse(transactionRes.value) : [],
          orders: orderRes.status === "fulfilled" ? listFromResponse(orderRes.value) : [],
          followups: followUpRes.status === "fulfilled" ? listFromResponse(followUpRes.value) : [],
          tasks: taskRes.status === "fulfilled" ? listFromResponse(taskRes.value) : [],
          deliveries: deliveryRes.status === "fulfilled" ? listFromResponse(deliveryRes.value) : [],
        });

        const failedCalls = [attendanceRes, transactionRes, orderRes, followUpRes, taskRes, deliveryRes].filter(
          (result) => result.status === "rejected"
        );
        if (failedCalls.length) {
          setLoadError("Some dashboard modules could not be loaded right now.");
        }
      } catch {
        if (!isMounted) return;
        setLoadError("Failed to load dashboard data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const normalized = useMemo(() => {
    const followups = dashboardData.followups.map((item, idx) => normalizeActionItem(item, idx, "followup"));
    const tasks = dashboardData.tasks.map((item, idx) => normalizeActionItem(item, idx, "task"));
    const deliveries = dashboardData.deliveries.map((item, idx) => normalizeActionItem(item, idx, "delivery"));
    const orders = dashboardData.orders.map((item, idx) => normalizeActionItem(item, idx, "order"));

    return { ...dashboardData, followups, tasks, deliveries, orders };
  }, [dashboardData]);

  const filteredByStatusAndUser = useCallback(
    (items) => {
      const byRange = items.filter((item) => isInSelectedRange(item.dueDate, filters.range));
      const byStatus =
        filters.status === "all"
          ? byRange
          : byRange.filter((item) => {
              if (filters.status === "delayed") return item.delayDays > 0;
              return item.status === filters.status;
            });

      if (filters.user === "all") return byStatus;
      return byStatus.filter((item) => item.assignedTo?.toLowerCase() === filters.user.toLowerCase());
    },
    [filters.range, filters.status, filters.user]
  );

  const pendingFollowups = useMemo(
    () => filteredByStatusAndUser(normalized.followups.filter((item) => item.status !== "done" && item.status !== "completed")),
    [normalized.followups, filteredByStatusAndUser]
  );

  const pendingTasks = useMemo(
    () => filteredByStatusAndUser(normalized.tasks.filter((item) => item.status !== "done" && item.status !== "completed")),
    [normalized.tasks, filteredByStatusAndUser]
  );

  const pendingDeliveries = useMemo(
    () =>
      filteredByStatusAndUser(
        normalized.deliveries.filter((item) => item.status !== "delivered" && item.status !== "completed")
      ),
    [normalized.deliveries, filteredByStatusAndUser]
  );

  const delayedOrders = useMemo(
    () => normalized.orders.filter((order) => order.delayDays > 0 && isInSelectedRange(order.dueDate, filters.range)),
    [normalized.orders, filters.range]
  );
  const completedOrders = useMemo(
    () => normalized.orders.filter((order) => order.status === "completed" && isInSelectedRange(order.dueDate, filters.range)),
    [normalized.orders, filters.range]
  );
  const pendingOrders = useMemo(
    () =>
      normalized.orders.filter(
        (order) => order.status !== "completed" && order.status !== "delivered" && isInSelectedRange(order.dueDate, filters.range)
      ),
    [normalized.orders, filters.range]
  );

  const totalDebit = useMemo(
    () =>
      dashboardData.transactions.reduce((sum, tx) => {
        if (tx?.Debit != null || tx?.debit != null) return sum + toAmount(tx?.Debit ?? tx?.debit);
        if ((tx?.Type || "").toString().toLowerCase() === "debit") return sum + toAmount(tx?.Amount);
        return sum;
      }, 0),
    [dashboardData.transactions]
  );

  const totalCredit = useMemo(
    () =>
      dashboardData.transactions.reduce((sum, tx) => {
        if (tx?.Credit != null || tx?.credit != null) return sum + toAmount(tx?.Credit ?? tx?.credit);
        if ((tx?.Type || "").toString().toLowerCase() === "credit") return sum + toAmount(tx?.Amount);
        return sum;
      }, 0),
    [dashboardData.transactions]
  );

  const todayAttendanceCount = dashboardData.attendance.length;
  const todayFollowupDone = normalized.followups.filter((item) => item.status === "done" || item.status === "completed").length;
  const todayFollowupDelayed = normalized.followups.filter((item) => item.delayDays > 0).length;
  const todayTaskDone = normalized.tasks.filter((item) => item.status === "done" || item.status === "completed").length;
  const todayTaskPending = pendingTasks.length;
  const todayDeliveryCompleted = normalized.deliveries.filter(
    (item) => item.status === "delivered" || item.status === "completed"
  ).length;

  const activeUsers = useMemo(() => {
    const assignees = [
      ...normalized.followups.map((f) => f.assignedTo),
      ...normalized.tasks.map((t) => t.assignedTo),
      ...normalized.deliveries.map((d) => d.assignedTo),
    ]
      .filter(Boolean)
      .filter((value, idx, arr) => arr.indexOf(value) === idx);
    return assignees;
  }, [normalized]);

  const summaryCards = [
    {
      title: "Today Attendance",
      value: todayAttendanceCount,
      icon: HiOutlineUserGroup,
      status: todayAttendanceCount > 0 ? "completed" : "pending",
      caption: `${todayAttendanceCount} marked today`,
    },
    {
      title: "Today Cash Book",
      value: `₹${totalDebit.toLocaleString()} / ₹${totalCredit.toLocaleString()}`,
      icon: HiOutlineBanknotes,
      status: totalCredit - totalDebit >= 0 ? "completed" : "pending",
      caption: `Net ₹${(totalCredit - totalDebit).toLocaleString()}`,
    },
    {
      title: "Today Bank Book",
      value: `₹${totalDebit.toLocaleString()} / ₹${totalCredit.toLocaleString()}`,
      icon: HiOutlineBuildingLibrary,
      status: totalCredit - totalDebit >= 0 ? "completed" : "pending",
      caption: "Debit / Credit",
    },
    {
      title: "Today Delivery",
      value: `${todayDeliveryCompleted}/${normalized.deliveries.length}`,
      icon: HiOutlineTruck,
      status: bucketStatus(normalized.deliveries.length - todayDeliveryCompleted, pendingDeliveries.filter((d) => d.delayDays > 0).length),
      caption: `${pendingDeliveries.length} pending`,
    },
    {
      title: "Today FollowUps",
      value: `${todayFollowupDone}/${normalized.followups.length}`,
      icon: HiOutlinePhone,
      status: bucketStatus(pendingFollowups.length, todayFollowupDelayed),
      caption: `${todayFollowupDelayed} delayed`,
    },
    {
      title: "Total Active Orders",
      value: normalized.orders.length,
      icon: HiOutlineClipboardDocumentList,
      status: bucketStatus(0, delayedOrders.length),
      caption: `${delayedOrders.length} delayed orders`,
    },
    {
      title: "Today Tasks",
      value: `${todayTaskDone}/${normalized.tasks.length}`,
      icon: HiOutlineClipboardDocumentCheck,
      status: bucketStatus(todayTaskPending, pendingTasks.filter((item) => item.delayDays > 0).length),
      caption: `${todayTaskPending} pending`,
    },
  ];

  const insights = useMemo(() => {
    const lines = [];
    lines.push(`You have ${pendingFollowups.length} pending follow-ups today.`);
    lines.push(`${pendingTasks.filter((task) => task.delayDays > 2).length} tasks are delayed by more than 2 days.`);
    lines.push(totalCredit - totalDebit >= 0 ? "Cash flow is positive today." : "Cash flow is negative today.");

    const workload = pendingFollowups.length + pendingTasks.length + pendingDeliveries.length;
    lines.push(workload >= 10 ? "High workload today ⚠️" : "Workload is manageable today ✅");
    return lines;
  }, [pendingFollowups.length, pendingTasks, pendingDeliveries.length, totalCredit, totalDebit]);

  const filterAction = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700"
        value={filters.range}
        onChange={(event) => setFilters((prev) => ({ ...prev, range: event.target.value }))}
      >
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
      </select>
      <select
        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700"
        value={filters.status}
        onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="delayed">Delayed</option>
      </select>
      <select
        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700"
        value={filters.user}
        onChange={(event) => setFilters((prev) => ({ ...prev, user: event.target.value }))}
      >
        <option value="all">All Users</option>
        {activeUsers.map((user) => (
          <option key={user} value={user}>
            {user}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 py-4">
      <div className="mx-auto max-w-[1800px] space-y-4 px-3 md:px-4">
        <SectionHeader
          title="Smart Business Dashboard"
          subtitle={`Welcome ${roleInfo.userName || "Team"}. Prioritize actions and track business health instantly.`}
          action={filterAction}
        />

        {loadError ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">{loadError}</p> : null}

        {isLoading ? <p className="text-sm text-slate-500">Loading dashboard data...</p> : null}

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <DashboardCard key={card.title} {...card} />
          ))}
        </section>

        {roleInfo.isAdmin ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader
              title="🗓️ Attendance Overview"
              subtitle="Restored full attendance module for admin monitoring."
            />
            <div className="-mx-4 md:mx-0">
              <AllAttandance />
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionHeader title="🔥 Action Required Today" subtitle="Prioritized pending work that needs immediate action." />

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <ActionList title="Pending FollowUps" items={pendingFollowups} />
            <ActionList title="Pending Tasks" items={pendingTasks} />
            <ActionList title="Pending Deliveries" items={pendingDeliveries} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader title="📅 Today’s Work Breakdown" subtitle="Daily completion snapshot across financial and operational modules." />
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">🧾 Today Cash Book</p>
                <p>Total Debit: ₹{totalDebit.toLocaleString()}</p>
                <p>Total Credit: ₹{totalCredit.toLocaleString()}</p>
                <p className={statusClass[totalCredit - totalDebit >= 0 ? "success" : "danger"]}>
                  Net Balance: ₹{(totalCredit - totalDebit).toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">🏦 Today Bank Book</p>
                <p>Total Debit: ₹{totalDebit.toLocaleString()}</p>
                <p>Total Credit: ₹{totalCredit.toLocaleString()}</p>
                <p className={statusClass[totalCredit - totalDebit >= 0 ? "success" : "danger"]}>
                  Net Balance: ₹{(totalCredit - totalDebit).toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">📦 Today Deliveries</p>
                <p>Completed: {todayDeliveryCompleted}</p>
                <p>Pending: {pendingDeliveries.length}</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">📞 Today FollowUps</p>
                <p>Done: {todayFollowupDone}</p>
                <p>Pending: {pendingFollowups.length}</p>
                <p className={statusClass[todayFollowupDelayed > 0 ? "danger" : "success"]}>Delayed: {todayFollowupDelayed}</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">✅ Today Tasks</p>
                <p>Completed: {todayTaskDone}</p>
                <p>Pending: {todayTaskPending}</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader title="📈 Active Orders Overview" subtitle="Track active order pipeline and delay risk." />
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Total Active Orders</p>
                  <p className="text-xl font-semibold text-slate-900">{normalized.orders.length}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Orders Pending</p>
                  <p className="text-xl font-semibold text-amber-700">{pendingOrders.length}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Completed Today</p>
                  <p className="text-xl font-semibold text-emerald-700">{completedOrders.length}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Delayed Orders</p>
                  <p className="text-xl font-semibold text-rose-700">{delayedOrders.length}</p>
                </div>
              </div>

              <div className="space-y-2">
                {normalized.orders.slice(0, 6).map((order) => {
                  const progress = order.status === "completed" ? 100 : order.delayDays > 0 ? 55 : 75;
                  return (
                    <div key={order.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                        <p className="font-semibold text-slate-800">{order.title}</p>
                        <span className={order.delayDays > 0 ? "text-rose-700" : "text-slate-500"}>
                          {order.delayDays > 0 ? `${order.delayDays} day(s) delayed` : "On Time"}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionHeader title="📊 Insights" subtitle="Auto-generated priorities and performance signals." />
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {insights.map((insight) => (
              <li key={insight} className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <HiOutlineExclamationTriangle className="mt-0.5 h-4 w-4 text-indigo-600" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
