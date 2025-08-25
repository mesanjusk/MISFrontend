// src/Pages/AllOrder.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from '../apiClient.js';
import OrderUpdate from "../Pages/OrderUpdate";
import UpdateDelivery from "../Pages/updateDelivery";
import { LoadingSpinner } from "../Components";
import { differenceInCalendarDays } from "date-fns";
import toast from "react-hot-toast";

/* ------------------------------ constants ------------------------------ */
const CLOSED_TASKS = ["delivered", "cancel"];
const MIN_LOAD_MS = 800; // ensure loading feels smooth
const MIN_UPDATE_MS = 600; // small delay when patching/replacing to feel smooth

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

  return (
    <div className="relative rounded-xl border border-gray-200 bg-white p-3 hover:shadow-md transition">
      {/* Edit icon — admin only; stop propagation */}
      {isAdmin && (
        <button
          type="button"
          className="absolute top-2 right-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-blue-600 text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={(e) => {
            e.stopPropagation();
            onEditClick(order);
          }}
          title="Edit (Update Delivery)"
          aria-label="Edit order"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5"
            aria-hidden="true"
          >
            <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.486 8.486a2 2 0 0 1-.878.506l-3.182.91a.5.5 0 0 1-.62-.62l.91-3.182a2 2 0 0 1 .506-.878l8.486-8.486Zm1.414 1.414L7.5 12.5l-1 1 1-1 7.5-7.5Z" />
          </svg>
        </button>
      )}

      {/* Card as a button for a11y */}
      <button
        type="button"
        onClick={() => onCardClick(order)}
        className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
      >
        <div className="flex items-start gap-2 pr-12">
          <div className="flex-1">
            <div className="font-medium text-gray-900 truncate text-sm">
              {order.Customer_name}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-700">
                {order.Order_Number || "-"}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${chipClass}`}
              >
                {days === 0 ? "Today" : days === 1 ? "1 day" : `${days} days`}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-gray-500">{formattedDate}</div>
          </div>
        </div>
      </button>
    </div>
  );
});

/* -------------------------------- page -------------------------------- */
export default function AllOrder() {
  const [orders, setOrders] = useState([]); // single source of truth (loaded once)
  const [searchOrder, setSearchOrder] = useState("");
  const [tasks, setTasks] = useState([]); // still fetched, but grouping uses actual orders
  const [showOrderModal, setShowOrderModal] = useState(false); // OrderUpdate
  const [showDeliveryModal, setShowDeliveryModal] = useState(false); // UpdateDelivery
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customers, setCustomers] = useState({});
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // sort controls (single source)
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
          // request more rows (server caps via getPaging.max)
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

      // Load task groups (kept, but not a hard dependency for grouping)
      try {
        const res = await getWithRetry("/taskgroup/GetTaskgroupList?page=1&limit=500", {
          signal: ac2.signal,
        });
        if (!isMounted) return;

        if (res?.data?.success) {
          const filteredTasks = (res.data.result ?? []).filter(
            (t) => !CLOSED_TASKS.includes((t?.Task_group || "").trim().toLowerCase())
          );
          setTasks(filteredTasks);
        } else {
          setTasks([]);
        }
      } catch (err) {
        if (!isCanceled(err)) {
          setTasks([]);
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

  // Optional: event bridge for children that can't accept props yet
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

  const sortedOrders = useMemo(() => {
    const copy = [...searchedOrders];
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
  }, [searchedOrders, sortKey]);

  // 👇 Build visible groups from the actual orders so nothing is dropped
  const groupNames = useMemo(() => {
    const set = new Set(
      (normalizedOrders || [])
        .map((o) => (o?.highestStatusTask?.Task || "Other").trim() || "Other")
        .filter(Boolean)
    );
    return Array.from(set).sort();
  }, [normalizedOrders]);

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

  /* ------------------------------- UI -------------------------------- */
  return (
    <>
      {/* Top progress bar when updating */}
      {isUpdating && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse z-[60]" />
      )}

      <div className="order-update-content min-h-screen">
        <div className="pt-2 pb-2">
          {/* Error banner + retry */}
          {loadError && (
            <div className="max-w-3xl mx-auto my-2 rounded-md bg-red-50 border border-red-200 text-red-700 p-2 flex items-center justify-between">
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
          <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-3xl mx-auto mb-3">
            <div className="flex bg-white flex-1 min-w-[240px] p-2 rounded-full border border-gray-200 shadow-sm">
              <input
                type="text"
                placeholder="Search by Customer Name or Order No."
                className="form-control text-black bg-transparent rounded-full w/full p-2 focus:outline-none"
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Sort</label>
              <select
                className="text-sm border border-gray-200 rounded-md p-2 bg-white"
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

          <main className="flex flex-1 p-2 overflow-y-auto">
            <div className="w-full mx-auto">
              {allLoading ? (
                // Skeletons (grid placeholder)
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-gray-200 bg-white p-3"
                    >
                      <div className="h-3 w-2/3 bg-gray-200 rounded mb-2 animate-pulse" />
                      <div className="h-3 w-1/3 bg-gray-200 rounded mb-2 animate-pulse" />
                      <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                  {/* Fallback spinner center (optional) */}
                  <div className="col-span-full flex justify-center py-6">
                    <LoadingSpinner />
                  </div>
                </div>
              ) : groupNames.length === 0 ? (
                <div className="text-center text-gray-400 py-10">No tasks found.</div>
              ) : (
                groupNames.map((taskGroup) => {
                  const taskGroupOrders = sortedOrders.filter(
                    (order) => (order?.highestStatusTask?.Task || "Other") === taskGroup
                  );

                  return (
                    <div key={taskGroup} className="mb-4 p-3 rounded-lg">
                      <div className="sticky top-0 bg-[#f8fafc] z-10 -mx-3 px-3 py-2 mb-2 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg text-blue-700">{taskGroup}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            {taskGroupOrders.length} orders
                          </span>
                        </div>
                      </div>

                      {taskGroupOrders.length === 0 ? (
                        <div className="text-sm text-gray-400 px-3 pb-3">
                          No orders in {taskGroup}.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                          {taskGroupOrders.map((order) => (
                            <OrderCard
                              key={order.Order_uuid || order._id}
                              order={order}
                              onCardClick={handleCardClick}
                              onEditClick={handleEditClick}
                              isAdmin={isAdmin}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>

        {/* OrderUpdate modal (whole card) */}
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

        {/* UpdateDelivery modal (edit icon) */}
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
// Focus trap + ESC close + body scroll lock
function Modal({ onClose, children }) {
  const contentRef = useRef(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        // basic focus trap
        const focusable = contentRef.current?.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'
        );
        if (!focusable || focusable.length === 0) return;
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
    };

    window.addEventListener("keydown", onKey);
    // focus first focusable
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
