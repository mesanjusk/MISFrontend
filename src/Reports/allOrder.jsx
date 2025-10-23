// src/Pages/AllOrder.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "../apiClient.js";
import OrderUpdate from "../Pages/OrderUpdate";
import UpdateDelivery from "../Pages/updateDelivery";
import { LoadingSpinner } from "../Components";
import { differenceInCalendarDays } from "date-fns";
import toast from "react-hot-toast";

/* ------------------------------ constants ------------------------------ */
const CLOSED_TASKS = ["delivered", "cancel"]; // not rendered as normal columns
const DELIVERED_TASK_LABEL = "Delivered";     // dedicated drop zone title
const MIN_LOAD_MS = 800;
const MIN_UPDATE_MS = 300;

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
  days === 0
    ? "bg-blue-100 text-blue-800 ring-1 ring-blue-200"
    : days === 1
    ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
    : "bg-rose-100 text-rose-800 ring-1 ring-rose-200";

/** Debounce hook */
function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Axios v1 cancel helper (AbortController) */
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
  const chipClass = getAgeChipClass(days);

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
      className="relative rounded-xl border border-gray-200 bg-white p-2 hover:shadow transition-shadow group"
      draggable
      onDragStart={handleDragStart}
    >
      {/* Card as a button for a11y */}
      <button
        type="button"
        onClick={() => onCardClick(order)}
        className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        aria-label="Open order details"
      >
        <div className="flex items-start gap-2 pr-8">
          {/* Left rail: order number badge */}
          <div className="shrink-0">
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100">
              {order.Order_Number || "-"}
            </span>
          </div>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Customer (click opens UpdateDelivery) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                title="Update Delivery"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(order);
                }}
                className="font-semibold text-sm text-gray-900 underline decoration-dotted underline-offset-2 hover:text-indigo-700 focus:outline-none"
              >
                {order.Customer_name}
              </button>
            </div>

            {/* SECOND ROW: Date · Age */}
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-[11px] text-gray-500">{formattedDate}</span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${chipClass}`}
                title="Age (days since last status)"
              >
                {days}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Hover actions (view/edit quick) */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          type="button"
          onClick={() => onCardClick(order)}
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
          title="View"
        >
          👁️
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(order);
            }}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
            title="Edit / Update Delivery"
          >
            ✏️
          </button>
        )}
      </div>
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
      prev.map((o) =>
        (o.Order_uuid || o._id) === orderId ? { ...o, ...patch } : o
      )
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

  // Exclude delivered orders from visible card list entirely
  const nonDeliveredOrders = useMemo(
    () =>
      searchedOrders.filter(
        (o) => (o?.highestStatusTask?.Task || "").trim().toLowerCase() !== "delivered"
      ),
    [searchedOrders]
  );

  const sortedOrders = useMemo(() => {
    const copy = [...nonDeliveredOrders];
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
  }, [nonDeliveredOrders, sortKey]);

  // Build visible columns from tasksMeta + unseen tasks from orders
  const groupNames = useMemo(() => {
    const base = tasksMeta.map((t) => t.name);

    const seen = new Set(base.map((n) => n.toLowerCase()));
    for (const o of nonDeliveredOrders) {
      const t = (o?.highestStatusTask?.Task || "Other").trim() || "Other";
      const tl = t.toLowerCase();
      if (!CLOSED_TASKS.includes(tl) && !seen.has(tl)) {
        base.push(t);
        seen.add(tl);
      }
    }

    const otherIdx = base.indexOf("Other");
    if (otherIdx > -1) {
      base.splice(otherIdx, 1);
      base.push("Other");
    }

    if (!base.includes(DELIVERED_TASK_LABEL)) base.push(DELIVERED_TASK_LABEL);
    return base;
  }, [tasksMeta, nonDeliveredOrders]);

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

  const allLoading = isOrdersLoading || isTasksLoading;

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

    const prevTask = orderDoc?.highestStatusTask?.Task || "Other";
    if (prevTask === newTask) return;

    const patchId = orderDoc.Order_uuid || orderDoc._id;
    const prevStatusArr = Array.isArray(orderDoc.Status) ? orderDoc.Status.slice() : [];
    const now = new Date().toISOString();

    const newHighest = {
      Task: newTask,
      Status_number: Number(orderDoc?.highestStatusTask?.Status_number || 0) + 1,
      CreatedAt: now,
    };

    await smoothUpdate(async () => {
      upsertOrderPatch(patchId, {
        highestStatusTask: newHighest,
        Status: [...prevStatusArr, newHighest],
      });

      const ok = await persistStatus(orderDoc, newTask);
      if (!ok) {
        // revert on failure
        upsertOrderPatch(patchId, {
          highestStatusTask: { ...orderDoc.highestStatusTask },
          Status: prevStatusArr,
        });
        toast.error("Failed to update status");
      } else {
        toast.success(
          newTask.toLowerCase() === "delivered"
            ? "Moved to Delivered"
            : `Moved to “${newTask}”`
        );
      }
    });
  };

  const allowDrop = (ev) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
  };

  /* ------------------------------- UI -------------------------------- */
  const totalOpen = nonDeliveredOrders.length;
  const totalGroups = groupNames.length;

  return (
    <>
      {isUpdating && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-indigo-500 animate-pulse z-[60]" />
      )}

      <div className="min-h-screen bg-slate-50">
        {/* Topbar / Breadcrumbs */}
        
           

            {/* Filters row */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="flex bg-white flex-1 min-w-[240px] px-3 py-2 rounded-lg border border-slate-200 ">
                <input
                  type="text"
                  placeholder="Search by Customer or Order No."
                  className="text-slate-900 bg-transparent w-full focus:outline-none text-sm placeholder:text-slate-400"
                  value={searchOrder}
                  onChange={(e) => setSearchOrder(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-500">Sort</label>
                <select
                  className="text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
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
          

        {/* Content */}
        <main className="mx-auto max-w-[2200px] p-3 md:p-4">
          {loadError && (
            <div className="mx-auto my-3 max-w-7xl rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 flex items-center justify-between">
              <span className="text-sm">{loadError}</span>
              <button
                className="text-xs px-2 py-1 rounded border border-rose-300 hover:bg-rose-100"
                onClick={() => window.location.reload()}
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {isOrdersLoading || isTasksLoading ? (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 2xl:grid-cols-9 gap-3">
                {Array.from({ length: 9 }).map((_, col) => (
                  <div key={col} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="h-4 w-2/3 bg-slate-200 rounded mb-3 animate-pulse" />
                    <div className="space-y-2">
                      {Array.from({ length: 6 }).map((__, i) => (
                        <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center py-6">
                <LoadingSpinner />
              </div>
            </div>
          ) : groupNames.length === 0 ? (
            <div className="text-center text-slate-400 py-16">
              No tasks found.
            </div>
          ) : (
            <div className="min-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 2xl:grid-cols-9 gap-3">
              {groupNames.map((taskGroup) => {
                const isDeliveredColumn =
                  String(taskGroup).trim().toLowerCase() === "delivered";

                const taskGroupOrders = isDeliveredColumn
                  ? []
                  : sortedOrders.filter((order) => {
                      const t = (order?.highestStatusTask?.Task || "Other").trim().toLowerCase();
                      return t === String(taskGroup).trim().toLowerCase();
                    });

                return (
                  <section
                    key={taskGroup}
                    className={`flex flex-col rounded-xl border ${
                      isDeliveredColumn
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-white"
                    }`}
                    onDragOver={allowDrop}
                    onDrop={(ev) => handleDropToColumn(ev, taskGroup)}
                  >
                    <header
                      className={`sticky top-[65px] md:top-[72px] z-10 px-3 py-2 rounded-t-xl border-b ${
                        isDeliveredColumn
                          ? "bg-emerald-50 border-emerald-100"
                          : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3
                          className={`font-semibold text-sm ${
                            isDeliveredColumn ? "text-emerald-800" : "text-slate-800"
                          }`}
                        >
                          {isDeliveredColumn ? `${DELIVERED_TASK_LABEL} (Drop here)` : taskGroup}
                        </h3>
                        {!isDeliveredColumn && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">
                            {taskGroupOrders.length}
                          </span>
                        )}
                      </div>
                    </header>

                    <div className="p-3 space-y-2 min-h-[220px]">
                      {taskGroupOrders.length === 0 ? (
                        <div
                          className={`text-[12px] text-slate-500 py-7 text-center border-2 border-dashed rounded-xl ${
                            isDeliveredColumn
                              ? "border-emerald-200 bg-emerald-50/60"
                              : "border-slate-200 bg-slate-50/60"
                          }`}
                        >
                          {isDeliveredColumn
                            ? "Drag an order here to mark as Delivered"
                            : "No orders in this stage. Drag & drop here"}
                        </div>
                      ) : (
                        taskGroupOrders.map((order) => (
                          <OrderCard
                            key={order.Order_uuid || order._id}
                            order={order}
                            onCardClick={handleCardClick}
                            onEditClick={handleEditClick}
                            isAdmin={isAdmin}
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
        <Modal onClose={closeOrderModal}>
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
        <Modal onClose={closeDeliveryModal}>
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
