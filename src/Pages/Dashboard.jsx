import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineClipboardList, HiOutlineOfficeBuilding, HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi";
import { LoadingSpinner } from "../Components";
import SectionHeader from "../components/common/SectionHeader";
import SummaryCard from "../components/dashboard/SummaryCard";
import RoleWidget from "../components/dashboard/RoleWidget";
import QuickActions from "../components/dashboard/QuickActions";
import Modal from "../components/common/Modal";
import AllAttandance from "./AllAttandance";
import UserTask from "./userTask";
import OrderBoard from "../components/orders/OrderBoard";
import { useDashboardData } from "../hooks/useDashboardData";
import { useUserRole } from "../hooks/useUserRole";
import { statusApi, TASK_TYPES } from "../hooks/useOrdersData";
import { useOrderDnD } from "../hooks/useOrderDnD";

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
  const navigate = useNavigate();
  const [statusNotice, setStatusNotice] = useState("");
  const [mobileMoveOrder, setMobileMoveOrder] = useState(null);
  const [mobileMoveTarget, setMobileMoveTarget] = useState("");

  const data = useDashboardData({
    role: roleInfo.role,
    userName: roleInfo.userName,
    isAdmin: roleInfo.isAdmin,
  });

  const isTouchDevice = useMemo(() => {
    if (typeof window === "undefined") return false;
    return "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }, []);

  const handleMove = useCallback(
    async (orderId, targetTask, setStatusMessage) => {
      const order = data.orderMap[orderId];
      if (!order) return;

      const normalizedTask = String(targetTask || TASK_TYPES.OTHER).trim();
      const lower = normalizedTask.toLowerCase();
      const currentTask = String(order?.highestStatusTask?.Task || "").trim().toLowerCase();
      if (currentTask === lower) return;

      if (lower === TASK_TYPES.CANCEL.toLowerCase()) {
        if (!roleInfo.isAdmin) {
          toast.error("Cancel is Admin only");
          return;
        }
        const first = window.confirm("Move this order to Cancel?");
        const second = first && window.confirm("This will mark the order as Cancel. Confirm again to continue.");
        if (!second) return;
      }

      const id = orderId;
      const createdAt = new Date().toISOString();
      const optimisticHighest = { ...(order.highestStatusTask || {}), Task: normalizedTask, CreatedAt: createdAt };
      const optimisticStatus = [...(order.Status || []), { Task: normalizedTask, CreatedAt: createdAt }];

      data.patchOrder(id, {
        highestStatusTask: optimisticHighest,
        Status: optimisticStatus,
      });

      setStatusMessage?.(`Moving order to ${normalizedTask}`);
      setStatusNotice(`Moving order ${order.Order_Number || ""} to ${normalizedTask}`);

      try {
        const response = await statusApi.updateStatus(id, normalizedTask);
        const next = response?.data?.result;
       const isSuccess = Boolean(next) || response?.data?.success === true;
        if (isSuccess) {
          if (next) {
            data.replaceOrder(next);
          }
          toast.success(
            lower === TASK_TYPES.DELIVERED.toLowerCase()
              ? "Moved to Delivered"
              : lower === TASK_TYPES.CANCEL.toLowerCase()
              ? "Moved to Cancel"
              : `Moved to ${normalizedTask}`
          );
          setStatusMessage?.(`Order moved to ${normalizedTask}`);
          setStatusNotice(`Order moved to ${normalizedTask}`);
        } else {
          throw new Error("No response body");
        }
      } catch (err) {
        data.patchOrder(id, { highestStatusTask: order.highestStatusTask, Status: order.Status });
        toast.error("Failed to update status");
        setStatusMessage?.("Failed to update status");
        setStatusNotice("Failed to update status");
      }
    },
    [data, roleInfo.isAdmin]
  );

  const { dragHandlers, statusMessage, mobileSelection, startMobileMove, confirmMobileMove, resetMobileSelection } =
    useOrderDnD({ onMove: handleMove });

  const handleMobileMoveRequest = useCallback(
    (order) => {
      if (!order) return;
      setMobileMoveOrder(order);
      setMobileMoveTarget("");
      startMobileMove(toId(order));
    },
    [startMobileMove]
  );

  const handleCancelMobileMove = useCallback(() => {
    resetMobileSelection();
    setMobileMoveOrder(null);
    setMobileMoveTarget("");
  }, [resetMobileSelection]);

  const handleConfirmMobileMove = useCallback(async () => {
    if (!mobileMoveTarget) return;
    await confirmMobileMove(mobileMoveTarget);
    setMobileMoveOrder(null);
    setMobileMoveTarget("");
  }, [confirmMobileMove, mobileMoveTarget]);

  const mobileMoveTargets = useMemo(() => data.columnOrder.filter(Boolean), [data.columnOrder]);

  const handleView = useCallback((order) => navigate(`/orderUpdate/${toId(order)}`), [navigate]);
  const handleEdit = useCallback((order) => navigate(`/updateDelivery/${toId(order)}`), [navigate]);

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
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionHeader title={roleInfo.isAdmin ? "Workflow Board" : "My Pending Orders"} />
            {loading ? (
              <div className="py-10 text-center">
                <LoadingSpinner />
              </div>
            ) : roleInfo.isAdmin ? (
              <div className="mt-2 overflow-x-auto pb-2">
                <OrderBoard
                  columnOrder={data.columnOrder}
                  groupedOrders={data.groupedOrders}
                  isAdmin={roleInfo.isAdmin}
                  isTouchDevice={isTouchDevice}
                  dragHandlers={dragHandlers}
                  onView={handleView}
                  onEdit={handleEdit}
                  onMove={isTouchDevice ? handleMobileMoveRequest : undefined}
                  statusMessage={statusMessage}
                />
              </div>
            ) : (
              <OrderList items={data.myPendingOrders} emptyLabel="No pending orders assigned." />
            )}
          </div>

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

      {mobileSelection && mobileMoveOrder && (
        <Modal onClose={handleCancelMobileMove} title={`Move Order #${mobileMoveOrder.Order_Number || ""}`}>
          <div className="space-y-3">
            <div className="text-sm text-slate-700">Select the target workflow column</div>
            <select
              id="dashboard-mobile-move-target"
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              value={mobileMoveTarget}
              onChange={(e) => setMobileMoveTarget(e.target.value)}
            >
              <option value="" disabled>
                Choose column
              </option>
              {mobileMoveTargets.map((target) => (
                <option key={target} value={target}>
                  {target}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={handleCancelMobileMove}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-300"
                onClick={handleConfirmMobileMove}
                disabled={!mobileMoveTarget}
              >
                Move
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="sr-only" aria-live="polite">
        {statusMessage}
      </div>
    </div>
  );
}
