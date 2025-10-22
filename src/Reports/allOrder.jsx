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
    ? "bg-blue-200 text-blue-800"
    : days === 1
    ? "bg-yellow-200 text-yellow-800"
    : "bg-red-200 text-red-800";

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
      className="relative rounded-lg border border-gray-200 bg-white p-2 hover:shadow-sm transition"
      draggable
      onDragStart={handleDragStart}
    >
      {/* Edit icon — admin only; stop propagation */}
      
        
      

      {/* Card as a button for a11y */}
      <button
        type="button"
        onClick={() => onCardClick(order)}
        className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
      >
        <div className="flex items-start gap-2 pr-7">
          <div className="flex-1">
            {/* Customer */}
            <div className="flex items-center gap-2 text-sm">
  <button
    type="button"
    title="Edit (Update Delivery)"
    onClick={(e) => {
      e.stopPropagation();           // prevent card click from opening OrderUpdate
      onEditClick(order);            // open UpdateDelivery modal
    }}
    className="font-semibold underline decoration-dotted underline-offset-2 hover:decoration-solid hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded px-0.5 cursor-pointer"
  >
    {order.Customer_name}
  </button>
</div>


            {/* ONE ROW: OrderNo · Date · Days */}
            <div className="mt-1 flex items-center gap-2 justify-between">
              <span className="text-xs font-semibold text-blue-700 truncate max-w-[45%]">
                {order.Order_Number || "-"}
              </span>

              <span className="text-[10px] text-gray-500 shrink-0">
                {formattedDate}
              </span>

              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${chipClass}`}
                title="Age"
              >
                {days === 0 ? "0" : days === 1 ? "1" : `${days} `}
              </span>
            </div>
          </div>
        </div>
      </button>
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

      // Load task groups (used as columns) – capture name + sequence if available
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
              // detect any likely sequence keys; fallback to index
              const seq =
                Number(t.Sequence ?? t.sequence ?? t.Order ?? t.order ?? t.Sort_order ?? t.Position ?? t.Index ?? i) || i;
              return { name, seq };
            });

          // sort by sequence number asc (stable)
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
      searchedOrders.filter((o) => (o?.highestStatusTask?.Task || "").trim().toLowerCase() !== "delivered"),
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

  // Build visible columns: start with backend sequence (tasksMeta), then add any unseen tasks from orders at the end.
  const groupNames = useMemo(() => {
    const base = tasksMeta.map((t) => t.name);

    // add any tasks present on orders but missing from backend list (put after sequenced ones)
    const seen = new Set(base.map((n) => n.toLowerCase()));
    for (const o of nonDeliveredOrders) {
      const t = (o?.highestStatusTask?.Task || "Other").trim() || "Other";
      const tl = t.toLowerCase();
      if (!CLOSED_TASKS.includes(tl) && !seen.has(tl)) {
        base.push(t);
        seen.add(tl);
      }
    }

    // Keep "Other" last if present
    const otherIdx = base.indexOf("Other");
    if (otherIdx > -1) {
      base.splice(otherIdx, 1);
      base.push("Other");
    }

    // Append Delivered drop zone at the end (always)
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
    } catch (err) {
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
    if (prevTask === newTask) return; // no-op

    // Optimistic UI: move the card immediately
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
  return (
    <>
      {isUpdating && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse z-[60]" />
      )}

      <div className="order-update-content min-h-screen">
        <div className="pt-2 pb-2">
          {/* Error banner + retry */}
          {loadError && (
            <div className="max-w-7xl mx-auto my-2 rounded-md bg-red-50 border border-red-200 text-red-700 p-2 flex items-center justify-between">
              <span className="text-sm">{loadError}</span>
              <button
                className="text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-100"
                onClick={() => window.location.reload()}
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {/* Search & sort bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-7xl mx-auto mb-2">
            <div className="flex bg-white flex-1 min-w-[240px] p-1.5 rounded-full border border-gray-200 shadow-sm">
              <input
                type="text"
                placeholder="Search by Customer Name or Order No."
                className="form-control text-black bg-transparent rounded-full w/full p-2 focus:outline-none text-sm"
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-gray-600">Sort</label>
              <select
                className="text-xs border border-gray-200 rounded-md p-1.5 bg-white"
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

          {/* Kanban board */}
          <main className="flex-1 p-2 overflow-x-auto">
            {isOrdersLoading || isTasksLoading ? (
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 2xl:grid-cols-9 gap-2">
                  {Array.from({ length: 9 }).map((_, col) => (
                    <div key={col} className="rounded-lg border bg-white p-2">
                      <div className="h-3.5 w-2/3 bg-gray-200 rounded mb-2 animate-pulse" />
                      <div className="space-y-1.5">
                        {Array.from({ length: 6 }).map((__, i) => (
                          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              </div>
            ) : groupNames.length === 0 ? (
              <div className="text-center text-gray-400 py-10">No tasks found.</div>
            ) : (
              <div className="min-w-[1400px] max-w-[2200px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 2xl:grid-cols-9 gap-2">
                {groupNames.map((taskGroup) => {
                  const isDeliveredColumn =
                    String(taskGroup).trim().toLowerCase() === "delivered";

                  const taskGroupOrders = isDeliveredColumn
                    ? [] // Never show delivered orders; column is drop zone only
                    : sortedOrders.filter(
                        (order) =>
                          (order?.highestStatusTask?.Task || "Other") === taskGroup
                      );

                  return (
                    <section
                      key={taskGroup}
                      className={`flex flex-col rounded-lg border border-gray-200 ${
                        isDeliveredColumn ? "bg-[#f1f5f9]" : "bg-[#f8fafc]"
                      }`}
                      onDragOver={allowDrop}
                      onDrop={(ev) => handleDropToColumn(ev, taskGroup)}
                    >
                      <header className="sticky top-0 z-10 px-2 py-1.5 border-b border-gray-100 rounded-t-lg bg-[#f8fafc]">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-semibold text-xs md:text-sm ${isDeliveredColumn ? "text-emerald-700" : "text-blue-700"}`}>
                            {isDeliveredColumn ? `${DELIVERED_TASK_LABEL} (Drop here)` : taskGroup}
                          </h3>
                          {!isDeliveredColumn && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {taskGroupOrders.length}
                            </span>
                          )}
                        </div>
                      </header>

                      <div className="p-2 space-y-2 min-h-[180px]">
                        {taskGroupOrders.length === 0 ? (
                          <div
                            className={`text-[11px] text-gray-500 py-5 text-center border border-dashed rounded ${
                              isDeliveredColumn
                                ? "border-emerald-300 bg-emerald-50"
                                : "border-gray-200"
                            }`}
                          >
                            {isDeliveredColumn
                              ? "Drag an order here to mark as Delivered"
                              : "Drop orders here"}
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
      </div>
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
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      aria-modal="true"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={contentRef}
        className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 relative max-h-[90vh] overflow-y-auto focus:outline-none"
      >
        <button
          className="absolute right-2 top-2 text-xl text-gray-400 hover:text-blue-500"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
