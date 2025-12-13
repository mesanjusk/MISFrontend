// src/Pages/AllOrder.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "../apiClient.js";
import OrderUpdate from "../Pages/OrderUpdate";
import UpdateDelivery from "../Pages/updateDelivery";
import { LoadingSpinner } from "../Components";
import { differenceInCalendarDays } from "date-fns";
import toast from "react-hot-toast";

/* ------------------------------ constants ------------------------------ */
const CLOSED_TASKS = ["delivered", "cancel"]; // excluded from normal columns
const DELIVERED_TASK_LABEL = "Delivered";
const CANCEL_TASK_LABEL = "Cancel";
const MIN_LOAD_MS = 800;
const MIN_UPDATE_MS = 300;

// 📱 Mobile drag mode
const LONG_PRESS_MS = 420;

/* ------------------------------ utilities ------------------------------ */
const fmtDDMMYYYY = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const getAgeChipClass = (days) =>
  days <= 1 ? "bg-emerald-500" : days <= 3 ? "bg-amber-500" : "bg-rose-600";

/** Debounce hook */
function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Axios v1 cancel helper */
const isCanceled = (err) =>
  err?.code === "ERR_CANCELED" ||
  err?.name === "CanceledError" ||
  String(err?.message || "").toLowerCase() === "canceled";

/** Minimal retry with backoff for GET requests */
async function getWithRetry(url, opts = {}, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await axios.get(url, opts);
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

/* --------------------------- memoized card --------------------------- */
const OrderCard = React.memo(function OrderCard({
  order,
  onCardClick,
  onEditClick,
  isAdmin,

  // 📱 mobile move mode props
  mobileMoveActive,
  onMobileLongPress,
  onMobilePressEnd,
}) {
  const latestStatusDate = order?.highestStatusTask?.CreatedAt
    ? new Date(order.highestStatusTask.CreatedAt)
    : null;

  let days = 0;
  let formattedDate = "";
  if (latestStatusDate) {
    days = differenceInCalendarDays(new Date(), latestStatusDate);
    formattedDate = fmtDDMMYYYY(latestStatusDate);
  }
  const ageClass = getAgeChipClass(days);

  const handleDragStart = (e) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        id: order.Order_uuid || order._id,
        currentTask: order?.highestStatusTask?.Task || "Other",
      })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className={`relative rounded-md border border-gray-200 bg-white p-1.5 hover:shadow-sm transition-shadow group ${
        mobileMoveActive ? "ring-2 ring-indigo-300" : ""
      }`}
      draggable
      onDragStart={handleDragStart}
      // 📱 long press for mobile move mode
      onTouchStart={(e) => onMobileLongPress?.(e, order)}
      onTouchEnd={onMobilePressEnd}
      onTouchCancel={onMobilePressEnd}
    >
      {/* Age badge (top-right) */}
      <div
        className={`absolute right-1.5 top-1.5 h-5 w-5 ${ageClass} text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm`}
        title="Days since last status update"
      >
        {days}
      </div>

      {/* Card action (open view) */}
     {/* Card action (open view) */}
<button
  type="button"
  onClick={() => onCardClick(order)}
  className="w-full text-left outline-none"
  aria-label="Open order details"
>
  {/* ROW 1 — Customer Name (always visible, max 2 lines) */}
  <div className="pr-6">
    <div
      className="font-semibold text-[12px] text-gray-900 leading-snug line-clamp-2"
      title={order.Customer_name}
    >
      {order.Customer_name}
    </div>
  </div>

  {/* ROW 2 — Date • #OrderNo (ONLY if name is short) */}
  {order.Customer_name && order.Customer_name.length <= 22 && (
    <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-gray-600 pr-6">
      <span>{formattedDate || "-"}</span>
      <span className="text-gray-400">•</span>
      <span className="font-semibold text-indigo-700">
        #{order.Order_Number || "-"}
      </span>
    </div>
  )}
</button>


      {/* Quick Edit (tiny) */}
      {isAdmin && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditClick(order);
          }}
          className="absolute right-1.5 top-7 rounded border border-gray-200 bg-white px-1.5 py-[3px] text-[10px] text-gray-700 hover:bg-gray-50"
          title="Edit / Update Delivery"
        >
          ✏️
        </button>
      )}

      {/* Mobile hint (only when active) */}
      {mobileMoveActive && (
        <div className="mt-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-2 py-1">
          Move mode: tap a column to drop
        </div>
      )}
    </div>
  );
});

/* -------------------------------- page -------------------------------- */
export default function AllOrder() {
  const [orders, setOrders] = useState([]);
  const [searchOrder, setSearchOrder] = useState("");
  const [tasksMeta, setTasksMeta] = useState([]); // [{name, seq}]
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customers, setCustomers] = useState({});
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [sortKey, setSortKey] = useState("dateDesc"); // dateDesc | dateAsc | orderNo | name
  const debouncedQuery = useDebouncedValue(searchOrder, 250);

  // Admin flag (adjust per your auth)
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const role =
      localStorage.getItem("Role") ||
      localStorage.getItem("role") ||
      localStorage.getItem("User_role");
    setIsAdmin(String(role || "").toLowerCase() === "admin");
  }, []);

  // 📱 detect touch device
  const isTouchDevice = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }, []);

  // 📱 Mobile move mode state
  const [mobileMove, setMobileMove] = useState(null); // { id }
  const longPressTimer = useRef(null);
  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const onMobileLongPress = useCallback(
    (e, order) => {
      if (!isTouchDevice) return;
      clearLongPressTimer();

      longPressTimer.current = setTimeout(() => {
        const id = order.Order_uuid || order._id;
        if (!id) return;
        setMobileMove({ id });
        toast.success("Move mode enabled: Tap a column to drop");
      }, LONG_PRESS_MS);
    },
    [isTouchDevice]
  );

  const onMobilePressEnd = useCallback(() => {
    clearLongPressTimer();
  }, []);

  const cancelMobileMoveMode = useCallback(() => {
    setMobileMove(null);
    toast("Move mode cancelled", { icon: "✋" });
  }, []);

  // Smooth update helper
  const smoothUpdate = useCallback(async (fn) => {
    setIsUpdating(true);
    const start = Date.now();
    try {
      await fn();
    } finally {
      const dt = Date.now() - start;
      const pad = Math.max(0, MIN_UPDATE_MS - dt);
      await new Promise((r) => setTimeout(r, pad));
      setIsUpdating(false);
    }
  }, []);

  /* ---------------------------- Load once ---------------------------- */
  useEffect(() => {
    let isMounted = true;
    const ac1 = new AbortController();
    const ac2 = new AbortController();

    (async () => {
      setLoadError(null);
      setIsOrdersLoading(true);
      setIsTasksLoading(true);
      const start = Date.now();

      try {
        const [ordersRes, customersRes] = await Promise.all([
          getWithRetry("/order/GetOrderList?page=1&limit=500", { signal: ac1.signal }),
          getWithRetry("/customer/GetCustomersList?page=1&limit=1000", { signal: ac1.signal }),
        ]);

        if (!isMounted) return;

        const orderList = ordersRes?.data?.success ? ordersRes.data.result ?? [] : [];
        setOrders(Array.isArray(orderList) ? orderList : []);

        if (customersRes?.data?.success) {
          const customerMap = (customersRes.data.result ?? []).reduce((acc, c) => {
            if (c.Customer_uuid) {
              acc[c.Customer_uuid] = c.Customer_name || c.Mobile || c.Code || "Unknown";
            }
            return acc;
          }, {});
          setCustomers(customerMap);
        } else {
          setCustomers({});
        }
      } catch (err) {
        if (!isCanceled(err)) {
          setLoadError("Failed to fetch orders or customers.");
          toast.error("Failed to fetch orders or customers.");
          setOrders([]);
          setCustomers({});
        }
      } finally {
        const dt = Date.now() - start;
        const pad = Math.max(0, MIN_LOAD_MS - dt);
        setTimeout(() => {
          if (isMounted) setIsOrdersLoading(false);
        }, pad);
      }

      // Load task groups
      try {
        const res = await getWithRetry("/taskgroup/GetTaskgroupList?page=1&limit=500", {
          signal: ac2.signal,
        });
        if (!isMounted) return;

        if (res?.data?.success) {
          const rows = (res.data.result ?? [])
            .filter((t) => {
              const name = (t?.Task_group || "").trim();
              const low = name.toLowerCase();
              return !!name && !CLOSED_TASKS.includes(low);
            })
            .map((t, i) => {
              const name = (t.Task_group || "").trim();
              const seq =
                Number(t.Sequence ?? t.sequence ?? t.Order ?? t.order ?? t.Sort_order ?? t.Position ?? t.Index ?? i) || i;
              return { name, seq };
            });

          rows.sort((a, b) => a.seq - b.seq);
          setTasksMeta(rows);
        } else {
          setTasksMeta([]);
        }
      } catch (err) {
        if (!isCanceled(err)) {
          setTasksMeta([]);
        }
      } finally {
        if (isMounted) setIsTasksLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      ac1.abort();
      ac2.abort();
    };
  }, []);

  /* ----------------------- Local update helpers ---------------------- */
  const upsertOrderReplace = useCallback((nextOrder) => {
    if (!nextOrder) return;
    setOrders((prev) => {
      const key = nextOrder.Order_uuid || nextOrder._id;
      const idx = prev.findIndex((o) => (o.Order_uuid || o._id) === key);
      if (idx === -1) return [nextOrder, ...prev];
      const copy = prev.slice();
      copy[idx] = { ...prev[idx], ...nextOrder };
      return copy;
    });
  }, []);

  const upsertOrderPatch = useCallback((orderId, patch) => {
    if (!orderId || !patch) return;
    setOrders((prev) =>
      prev.map((o) => (o.Order_uuid || o._id) === orderId ? { ...o, ...patch } : o)
    );
  }, []);

  useEffect(() => {
    const handler = (ev) => {
      const { type, orderId, patch, order } = ev.detail || {};
      if (type === "patch") {
        smoothUpdate(async () => upsertOrderPatch(orderId, patch));
      } else if (type === "replace") {
        smoothUpdate(async () => upsertOrderReplace(order));
      }
    };
    window.addEventListener("order:updated", handler);
    return () => window.removeEventListener("order:updated", handler);
  }, [smoothUpdate, upsertOrderPatch, upsertOrderReplace]);

  /* ------------------------ Derived view model ----------------------- */
  const normalizedOrders = useMemo(() => {
    return orders.map((order) => {
      const statusArr = Array.isArray(order.Status) ? order.Status : [];
      const highestStatusTask =
        statusArr.length > 0
          ? statusArr.reduce((prev, current) =>
              Number(prev?.Status_number) > Number(current?.Status_number) ? prev : current
            )
          : null;

      const customerName = customers[order.Customer_uuid] || "Unknown";
      return { ...order, highestStatusTask, Customer_name: customerName };
    });
  }, [orders, customers]);

  const searchedOrders = useMemo(() => {
    const q = (debouncedQuery || "").trim().toLowerCase();
    if (!q) return normalizedOrders;
    return normalizedOrders.filter((order) => {
      const byName = (order.Customer_name || "").toLowerCase().includes(q);
      const byNo = String(order.Order_Number || "").toLowerCase().includes(q);
      return byName || byNo;
    });
  }, [normalizedOrders, debouncedQuery]);

  // Exclude delivered & cancel from normal card list
  const workingOrders = useMemo(
    () =>
      searchedOrders.filter((o) => {
        const t = (o?.highestStatusTask?.Task || "").trim().toLowerCase();
        return t !== "delivered" && t !== "cancel";
      }),
    [searchedOrders]
  );

  const sortedOrders = useMemo(() => {
    const copy = [...workingOrders];
    switch (sortKey) {
      case "dateAsc":
        return copy.sort((a, b) => {
          const da = new Date(a?.highestStatusTask?.CreatedAt || 0).getTime();
          const db = new Date(b?.highestStatusTask?.CreatedAt || 0).getTime();
          return da - db;
        });
      case "orderNo":
        return copy.sort((a, b) =>
          String(a.Order_Number || "").localeCompare(String(b.Order_Number || ""))
        );
      case "name":
        return copy.sort((a, b) =>
          String(a.Customer_name || "").localeCompare(String(b.Customer_name || ""))
        );
      case "dateDesc":
      default:
        return copy.sort((a, b) => {
          const da = new Date(a?.highestStatusTask?.CreatedAt || 0).getTime();
          const db = new Date(b?.highestStatusTask?.CreatedAt || 0).getTime();
          return db - da;
        });
    }
  }, [workingOrders, sortKey]);

  // Build visible columns from tasksMeta + unseen tasks from orders, then append Delivered + Cancel
  const groupNames = useMemo(() => {
    const base = tasksMeta.map((t) => t.name);

    const seen = new Set(base.map((n) => n.toLowerCase()));
    for (const o of workingOrders) {
      const t = (o?.highestStatusTask?.Task || "Other").trim() || "Other";
      const tl = t.toLowerCase();
      if (!CLOSED_TASKS.includes(tl) && !seen.has(tl)) {
        base.push(t);
        seen.add(tl);
      }
    }

    // Move "Other" to end of working columns
    const otherIdx = base.indexOf("Other");
    if (otherIdx > -1) {
      base.splice(otherIdx, 1);
      base.push("Other");
    }

    // Append special columns at the end, in order: Delivered, Cancel
    if (!base.includes(DELIVERED_TASK_LABEL)) base.push(DELIVERED_TASK_LABEL);
    if (isAdmin && !base.includes(CANCEL_TASK_LABEL)) {
  base.push(CANCEL_TASK_LABEL);
}
    return base;
  }, [tasksMeta, workingOrders]);

  /* -------------------------- Modal handlers ------------------------- */
  const handleCardClick = useCallback((order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  }, []);

  const handleEditClick = useCallback((order) => {
    setSelectedOrder(order);
    setShowDeliveryModal(true);
  }, []);

  const closeOrderModal = useCallback(() => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  }, []);

  const closeDeliveryModal = useCallback(() => {
    setShowDeliveryModal(false);
    setSelectedOrder(null);
  }, []);

  /* ---------------------- Drag & Drop status change ---------------------- */
  const persistStatus = async (orderDoc, newTask) => {
    try {
      const id = orderDoc._id || orderDoc.Order_id || orderDoc.Order_uuid;
      await axios.post("/order/updateStatus", { Order_id: id, Task: newTask });
      return true;
    } catch {
      try {
        const id = orderDoc._id || orderDoc.Order_id || orderDoc.Order_uuid;
        await axios.put(`/order/updateStatus/${id}`, { Task: newTask });
        return true;
      } catch (err2) {
        console.error("Status update failed:", err2?.response?.status, err2?.response?.data || err2?.message);
        return false;
      }
    }
  };

  // ✅ Cancel confirmations
  const confirmCancelDouble = () => {
    const c1 = window.confirm("Move this order to Cancel?");
    if (!c1) return false;
    const c2 = window.confirm("This will mark the order as Cancel.\n\nConfirm again to continue.");
    return !!c2;
  };

  const handleDropToColumn = async (ev, newTask) => {
    ev.preventDefault();

    let payload = null;
    try {
      payload = JSON.parse(ev.dataTransfer.getData("application/json"));
    } catch {
      return;
    }
    const droppedId = payload?.id;
    if (!droppedId) return;

    const orderDoc = normalizedOrders.find((o) => (o.Order_uuid || o._id) === droppedId);
    if (!orderDoc) return;

    const newTaskLower = String(newTask || "").trim().toLowerCase();
    const isDeliveredDrop = newTaskLower === "delivered";
    const isCancelDrop = newTaskLower === "cancel";

    // ✅ Block Cancel for non-admin (hard block)
    if (isCancelDrop && !isAdmin) {
      toast.error("Cancel is Admin only");
      return;
    }

    // ✅ Double confirm Cancel (admin)
    if (isCancelDrop && isAdmin) {
      const ok = confirmCancelDouble();
      if (!ok) return;
    }

    const prevTask = orderDoc?.highestStatusTask?.Task || "Other";
    if (String(prevTask || "").trim().toLowerCase() === newTaskLower) return;

    const patchId = orderDoc.Order_uuid || orderDoc._id;
    const prevStatusArr = Array.isArray(orderDoc.Status) ? orderDoc.Status.slice() : [];
    const now = new Date().toISOString();

    const newHighest = {
      Task: isDeliveredDrop ? "delivered" : isCancelDrop ? "cancel" : newTask,
      Status_number: Number(orderDoc?.highestStatusTask?.Status_number || 0) + 1,
      CreatedAt: now,
    };

    await smoothUpdate(async () => {
      // optimistic UI
      upsertOrderPatch(patchId, {
        highestStatusTask: newHighest,
        Status: [...prevStatusArr, newHighest],
      });

      const ok = await persistStatus(orderDoc, newHighest.Task);
      if (!ok) {
        // revert on failure
        upsertOrderPatch(patchId, {
          highestStatusTask: { ...orderDoc.highestStatusTask },
          Status: prevStatusArr,
        });
        toast.error("Failed to update status");
      } else {
        const lbl = newTaskLower;
        toast.success(
          lbl === "delivered"
            ? "Moved to Delivered"
            : lbl === "cancel"
            ? "Moved to Cancel"
            : `Moved to “${newTask}”`
        );
      }
    });
  };

  const allowDrop = (ev) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
  };

  // 📱 Mobile move: tap column to drop
  const handleColumnTapIfMobileMove = useCallback(
    async (taskGroup) => {
      if (!mobileMove?.id) return;

      const tl = String(taskGroup || "").trim().toLowerCase();
      const isCancel = tl === "cancel";

      // Non-admin cannot use mobile move to Cancel either
      if (isCancel && !isAdmin) {
        toast.error("Cancel is Admin only");
        return;
      }

      // Admin double confirm on Cancel (mobile tap)
      if (isCancel && isAdmin) {
        const ok = confirmCancelDouble();
        if (!ok) return;
      }

      const orderDoc = normalizedOrders.find((o) => (o.Order_uuid || o._id) === mobileMove.id);
      if (!orderDoc) {
        setMobileMove(null);
        return;
      }

      // simulate drop by calling handleDropToColumn logic directly:
      const fakeEv = { preventDefault: () => {}, dataTransfer: null };
      // We directly run the same patch logic (without reading transfer)
      const prevTask = orderDoc?.highestStatusTask?.Task || "Other";
      if (String(prevTask || "").trim().toLowerCase() === tl) return;

      const patchId = orderDoc.Order_uuid || orderDoc._id;
      const prevStatusArr = Array.isArray(orderDoc.Status) ? orderDoc.Status.slice() : [];
      const now = new Date().toISOString();

      const newHighest = {
        Task: tl === "delivered" ? "delivered" : tl === "cancel" ? "cancel" : taskGroup,
        Status_number: Number(orderDoc?.highestStatusTask?.Status_number || 0) + 1,
        CreatedAt: now,
      };

      await smoothUpdate(async () => {
        upsertOrderPatch(patchId, {
          highestStatusTask: newHighest,
          Status: [...prevStatusArr, newHighest],
        });

        const ok = await persistStatus(orderDoc, newHighest.Task);
        if (!ok) {
          upsertOrderPatch(patchId, {
            highestStatusTask: { ...orderDoc.highestStatusTask },
            Status: prevStatusArr,
          });
          toast.error("Failed to update status");
        } else {
          toast.success(
            tl === "delivered"
              ? "Moved to Delivered"
              : tl === "cancel"
              ? "Moved to Cancel"
              : `Moved to “${taskGroup}”`
          );
        }
      });

      setMobileMove(null);
    },
    [mobileMove, normalizedOrders, isAdmin, smoothUpdate, upsertOrderPatch, persistStatus]
  );

  /* ------------------------------- UI -------------------------------- */
  const allLoading = isOrdersLoading || isTasksLoading;

  return (
    <>
      {isUpdating && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-indigo-500 animate-pulse z-[60]" />
      )}

      {/* 📱 Mobile move mode bar */}
      {mobileMove?.id && (
        <div className="fixed left-0 right-0 bottom-0 z-[80] bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-between shadow-lg">
          <div className="text-[12px] text-slate-700">
            <span className="font-semibold text-indigo-700">Move mode:</span>{" "}
            Tap any column to drop
          </div>
          <button
            type="button"
            onClick={cancelMobileMoveMode}
            className="text-[12px] px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="min-h-screen bg-slate-50">
        {/* Filters row */}
        <div className="mx-auto max-w-[2200px] p-2.5 md:p-3">
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <div className="flex bg-white flex-1 min-w-[220px] px-2.5 py-1.5 rounded-md border border-slate-200">
              <input
                type="text"
                placeholder="Search by Customer or Order No."
                className="text-slate-900 bg-transparent w-full focus:outline-none text-[12px] placeholder:text-slate-400"
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-slate-500">Sort</label>
              <select
                className="text-[12px] border border-slate-200 rounded-md px-2 py-1.5 bg-white"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                <option value="dateDesc">Latest first</option>
                <option value="dateAsc">Oldest first</option>
                <option value="orderNo">Order No.</option>
                <option value="name">Customer Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="mx-auto max-w-[2200px] px-2.5 md:px-3 pb-3">
          {loadError && (
            <div className="mx-auto my-2 max-w-7xl rounded-md bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 flex items-center justify-between">
              <span className="text-[12px]">{loadError}</span>
              <button
                className="text-[11px] px-2 py-1 rounded border border-rose-300 hover:bg-rose-100"
                onClick={() => window.location.reload()}
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {allLoading ? (
            <div className="max-w-7xl mx-auto">
              {/* ✅ reduce column width: more columns in xl/2xl */}
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 2xl:grid-cols-12 gap-1.5">
                {Array.from({ length: 12 }).map((_, col) => (
                  <div key={col} className="rounded-lg border border-slate-200 bg-white p-2">
                    <div className="h-3 w-2/3 bg-slate-200 rounded mb-2 animate-pulse" />
                    <div className="space-y-1.5">
                      {Array.from({ length: 6 }).map((__, i) => (
                        <div key={i} className="h-9 bg-slate-100 rounded-md animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center py-3">
                <LoadingSpinner />
              </div>
            </div>
          ) : groupNames.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">No tasks found.</div>
          ) : (
            <div className="min-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 2xl:grid-cols-12 gap-1.5">
              {groupNames.map((taskGroup) => {
                const tl = String(taskGroup || "").trim().toLowerCase();
                const isDeliveredColumn = tl === "delivered";
                const isCancelColumn = tl === "cancel";
                const cancelLocked = isCancelColumn && !isAdmin;

                // For working columns, render cards; for Delivered/Cancel, show empty drop zone
                const taskGroupOrders =
                  isDeliveredColumn || isCancelColumn
                    ? []
                    : sortedOrders.filter((order) => {
                        const t = (order?.highestStatusTask?.Task || "Other").trim().toLowerCase();
                        return t === tl;
                      });

                // ✅ mobile tap-to-drop handler (disabled if cancel locked)
                const handleTapColumn = mobileMove?.id && !cancelLocked
                  ? () => handleColumnTapIfMobileMove(taskGroup)
                  : undefined;

                return (
                  <section
                    key={taskGroup}
                    className={`flex flex-col rounded-lg border ${
                      isDeliveredColumn
                        ? "border-emerald-200 bg-emerald-50"
                        : isCancelColumn
                        ? cancelLocked
                          ? "border-slate-200 bg-slate-100 opacity-60"
                          : "border-rose-200 bg-rose-50"
                        : "border-slate-200 bg-white"
                    } ${handleTapColumn ? "cursor-pointer" : ""}`}
                    // ✅ Disable drop/dragover completely for cancel locked
                    onDragOver={cancelLocked ? undefined : allowDrop}
                    onDrop={cancelLocked ? undefined : (ev) => handleDropToColumn(ev, taskGroup)}
                    onClick={handleTapColumn}
                    role={handleTapColumn ? "button" : undefined}
                    tabIndex={handleTapColumn ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (!handleTapColumn) return;
                      if (e.key === "Enter" || e.key === " ") handleTapColumn();
                    }}
                    aria-disabled={cancelLocked ? "true" : "false"}
                  >
                    <header
                      className={`sticky top-[56px] md:top-[62px] z-10 px-2.5 py-1.5 rounded-t-lg border-b ${
                        isDeliveredColumn
                          ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                          : isCancelColumn
                          ? cancelLocked
                            ? "bg-slate-100 border-slate-200 text-slate-700"
                            : "bg-rose-50 border-rose-100 text-rose-800"
                          : "bg-slate-50 border-slate-100 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-[12px]">
                          {isDeliveredColumn
                            ? `${DELIVERED_TASK_LABEL} (Drop here)`
                            : isCancelColumn
                            ? cancelLocked
                              ? `${CANCEL_TASK_LABEL} (Admin only)`
                              : `${CANCEL_TASK_LABEL} (Drop here)`
                            : taskGroup}
                        </h3>
                        {!isDeliveredColumn && !isCancelColumn && (
                          <span className="text-[10px] px-1.5 py-[2px] rounded-full bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">
                            {taskGroupOrders.length}
                          </span>
                        )}
                      </div>

                      {/* Mobile hint */}
                      {mobileMove?.id && !cancelLocked && (
                        <div className="mt-1 text-[10px] opacity-80">
                          Tap to drop here
                        </div>
                      )}
                    </header>

                    <div className="p-2 space-y-1.5 min-h-[150px]">
                      {isDeliveredColumn ? (
                        <div className="text-[11px] py-5 text-center border-2 border-dashed rounded-lg border-emerald-200 text-emerald-700 bg-emerald-50/60">
                          Drag an order here to mark as Delivered
                        </div>
                      ) : isCancelColumn ? (
                        cancelLocked ? (
                          // ✅ COMPLETELY DISABLED VISUALLY FOR NON-ADMIN
                          <div className="text-[11px] py-5 text-center rounded-lg border border-slate-200 bg-white/60 text-slate-600">
                            🔒 Cancel is disabled for your role
                          </div>
                        ) : (
                          <div className="text-[11px] py-5 text-center border-2 border-dashed rounded-lg border-rose-200 text-rose-700 bg-rose-50/60">
                            Drag an order here to mark as Cancel (double confirm)
                          </div>
                        )
                      ) : taskGroupOrders.length === 0 ? (
                        <div className="text-[11px] text-slate-500 py-5 text-center border-2 border-dashed rounded-lg border-slate-200 bg-slate-50/60">
                          No orders in this stage. Drag & drop here
                        </div>
                      ) : (
                        taskGroupOrders.map((order) => (
                          <OrderCard
                            key={order.Order_uuid || order._id}
                            order={order}
                            onCardClick={handleCardClick}
                            onEditClick={handleEditClick}
                            isAdmin={isAdmin}
                            mobileMoveActive={mobileMove?.id === (order.Order_uuid || order._id)}
                            onMobileLongPress={onMobileLongPress}
                            onMobilePressEnd={onMobilePressEnd}
                          />
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* OrderUpdate modal (click on card) */}
      {showOrderModal && (
        <Modal
          onClose={() => {
            closeOrderModal();
            setMobileMove(null);
          }}
        >
          <OrderUpdate
            order={selectedOrder}
            onClose={closeOrderModal}
            onOrderPatched={(orderId, patch) =>
              smoothUpdate(async () => upsertOrderPatch(orderId, patch))
            }
            onOrderReplaced={(order) =>
              smoothUpdate(async () => upsertOrderReplace(order))
            }
          />
        </Modal>
      )}

      {/* UpdateDelivery modal (✏️ icon) */}
      {showDeliveryModal && (
        <Modal
          onClose={() => {
            closeDeliveryModal();
            setMobileMove(null);
          }}
        >
          <UpdateDelivery
            order={selectedOrder}
            onClose={closeDeliveryModal}
            onOrderPatched={(orderId, patch) =>
              smoothUpdate(async () => upsertOrderPatch(orderId, patch))
            }
            onOrderReplaced={(order) =>
              smoothUpdate(async () => upsertOrderReplace(order))
            }
          />
        </Modal>
      )}
    </>
  );
}

/* ------------------------------- Modal ------------------------------- */
function Modal({ onClose, children }) {
  const contentRef = useRef(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const focusable = contentRef.current?.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'
        );
        if (focusable && focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", onKey);
    setTimeout(() => {
      const first = contentRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus?.();
    }, 0);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 flex justify-center items-center z-[70]"
      aria-modal="true"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={contentRef}
        className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-4xl mx-3 relative max-h-[90vh] overflow-y-auto focus:outline-none shadow-2xl"
      >
        <button
          className="absolute right-3 top-2 text-2xl leading-none text-slate-400 hover:text-indigo-500"
          onClick={onClose}
          aria-label="Close"
          type="button"
          title="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
