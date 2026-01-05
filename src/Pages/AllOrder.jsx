import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import OrderUpdate from "./OrderUpdate";
import UpdateDelivery from "./updateDelivery";
import { LoadingSpinner } from "../Components";
import Modal from "../components/common/Modal";
import OrderBoard from "../components/orders/OrderBoard";
import {
  LABELS,
  ROLE_TYPES,
  TASK_TYPES,
  statusApi,
  useOrdersData,
} from "../hooks/useOrdersData";
import { useOrderGrouping } from "../hooks/useOrderGrouping";
import { useOrderDnD } from "../hooks/useOrderDnD";

const SORT_OPTIONS = [
  { value: "dateDesc", label: "Latest first" },
  { value: "dateAsc", label: "Oldest first" },
  { value: "orderNo", label: "Order No." },
  { value: "name", label: "Customer Name" },
];

export default function AllOrder() {
  const [viewTab, setViewTab] = useState("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("dateDesc");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [mobileMoveOrder, setMobileMoveOrder] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusNotice, setStatusNotice] = useState("");

  const {
    orderList,
    orderMap,
    tasksMeta,
    isOrdersLoading,
    isTasksLoading,
    loadError,
    replaceOrder,
    patchOrder,
  } = useOrdersData();

  const isEnquiry = useCallback(
    (order) =>
      String(order?.Type || "").trim().toLowerCase() === "enquiry" ||
      Boolean(order?.isEnquiry),
    []
  );

  const { ordersCount, enquiriesCount } = useMemo(() => {
    let orders = 0;
    let enquiries = 0;

    orderList.forEach((order) => {
      if (isEnquiry(order)) {
        enquiries += 1;
      } else {
        orders += 1;
      }
    });

    return { ordersCount: orders, enquiriesCount: enquiries };
  }, [orderList, isEnquiry]);

  useEffect(() => {
    const role =
      localStorage.getItem("Role") ||
      localStorage.getItem("role") ||
      localStorage.getItem("User_role");
    setIsAdmin(String(role || "").toLowerCase() === ROLE_TYPES.ADMIN);
  }, []);

  const isTouchDevice = useMemo(() => {
    if (typeof window === "undefined") return false;
    return "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }, []);

  const filteredOrderList = useMemo(() => {
    if (viewTab === "enquiries") {
      return orderList.filter((order) => isEnquiry(order));
    }

    return orderList.filter((order) => !isEnquiry(order));
  }, [orderList, viewTab, isEnquiry]);

  const { columnOrder, groupedOrders } = useOrderGrouping(filteredOrderList, tasksMeta, searchTerm, sortKey, isAdmin, {
    includeCancelColumn: false,
  });

  const [mobileMoveTarget, setMobileMoveTarget] = useState("");

  const handleMove = useCallback(
    async (orderId, targetTask, setStatusMessage) => {
      const order = orderMap[orderId];
      if (!order) return;

      const normalizedTask = String(targetTask || TASK_TYPES.OTHER).trim();
      const lower = normalizedTask.toLowerCase();
      const currentTask = String(order?.highestStatusTask?.Task || "").trim().toLowerCase();
      if (currentTask === lower) return;

      if (lower === TASK_TYPES.CANCEL.toLowerCase()) {
        if (!isAdmin) {
          toast.error("Cancel is Admin only");
          return;
        }
        const first = window.confirm("Move this order to Cancel?");
        const second = first && window.confirm("This will mark the order as Cancel. Confirm again to continue.");
        if (!second) return;
      }

      const id = order.Order_uuid || order._id || order.Order_id;
      if (!id) return;

      const createdAt = new Date().toISOString();
      const optimisticHighest = { ...(order.highestStatusTask || {}), Task: normalizedTask, CreatedAt: createdAt };
      const optimisticStatus = [...(order.Status || []), { Task: normalizedTask, CreatedAt: createdAt }];

      patchOrder(id, {
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
            replaceOrder(next);
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
        patchOrder(id, { highestStatusTask: order.highestStatusTask, Status: order.Status });
        toast.error("Failed to update status");
        setStatusMessage?.("Failed to update status");
        setStatusNotice("Failed to update status");
      }
    },
    [orderMap, isAdmin, patchOrder, replaceOrder]
  );

  const { dragHandlers, mobileSelection, startMobileMove, confirmMobileMove, resetMobileSelection, statusMessage } =
    useOrderDnD({ onMove: handleMove });

  const allLoading = isOrdersLoading || isTasksLoading;

  const handleView = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setShowDeliveryModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const closeDeliveryModal = () => {
    setShowDeliveryModal(false);
    setSelectedOrder(null);
  };

  const onMobileMoveRequest = (order) => {
    setMobileMoveOrder(order);
    startMobileMove(order.Order_uuid || order._id || order.Order_id);
    setMobileMoveTarget("");
  };

  const availableTargets = useMemo(() => columnOrder.filter(Boolean), [columnOrder]);

  const handleConfirmMobileMove = async () => {
    if (!mobileMoveTarget) return;
    await confirmMobileMove(mobileMoveTarget);
    setMobileMoveOrder(null);
  };

  const handleCancelMobileMove = () => {
    resetMobileSelection();
    setMobileMoveOrder(null);
    setMobileMoveTarget("");
  };

  return (
    <>
      {isOrdersLoading && <div className="fixed top-0 left-0 right-0 h-1 bg-indigo-500 animate-pulse z-[60]" />}

      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[2200px] p-2.5 md:p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-xs">
              <button
                type="button"
                onClick={() => setViewTab("orders")}
                className={`px-3 py-1 rounded-full transition ${
                  viewTab === "orders"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                All Orders ({ordersCount})
              </button>
              <button
                type="button"
                onClick={() => setViewTab("enquiries")}
                className={`px-3 py-1 rounded-full transition ${
                  viewTab === "enquiries"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                All Enquiries ({enquiriesCount})
              </button>
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <div className="flex bg-white flex-1 min-w-[220px] px-2.5 py-1.5 rounded-md border border-slate-200">
              <input
                type="text"
                placeholder={LABELS.SEARCH_PLACEHOLDER}
                className="text-slate-900 bg-transparent w-full focus:outline-none text-[12px] placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-slate-500">Sort</label>
              <select
                className="text-[12px] border border-slate-200 rounded-md px-2 py-1.5 bg-white"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

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
          ) : columnOrder.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">No tasks found.</div>
          ) : (
            <OrderBoard
              columnOrder={columnOrder}
              groupedOrders={groupedOrders}
              isAdmin={isAdmin}
              isTouchDevice={isTouchDevice}
              dragHandlers={dragHandlers}
              onView={handleView}
              onEdit={handleEdit}
              onMove={isTouchDevice ? onMobileMoveRequest : undefined}
              statusMessage={statusMessage || statusNotice}
            />
          )}
        </main>
      </div>

      {showOrderModal && (
        <Modal onClose={closeOrderModal} title="Order Details">
          <OrderUpdate
            order={selectedOrder}
            onClose={closeOrderModal}
            onOrderPatched={(orderId, patch) => patchOrder(orderId, patch)}
            onOrderReplaced={(order) => replaceOrder(order)}
          />
        </Modal>
      )}

      {showDeliveryModal && (
        <Modal onClose={closeDeliveryModal} title="Update Delivery">
          <UpdateDelivery
            order={selectedOrder}
            onClose={closeDeliveryModal}
            onOrderPatched={(orderId, patch) => patchOrder(orderId, patch)}
            onOrderReplaced={(order) => replaceOrder(order)}
          />
        </Modal>
      )}

      {mobileSelection && mobileMoveOrder && (
        <Modal onClose={handleCancelMobileMove} title={`Move Order #${mobileMoveOrder.Order_Number || ""}`}>
          <div className="space-y-3">
            <div className="text-sm text-slate-700">Select the target column</div>
            <select
              id="mobile-move-target"
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
              value={mobileMoveTarget}
              onChange={(e) => setMobileMoveTarget(e.target.value)}
            >
              <option value="" disabled>
                Choose column
              </option>
              {availableTargets
                .filter((task) => {
                  const lower = task.toLowerCase();
                  if (lower === TASK_TYPES.CANCEL.toLowerCase() && !isAdmin) return false;
                  return task !== mobileMoveOrder?.highestStatusTask?.Task;
                })
                .map((task) => (
                  <option key={task} value={task}>
                    {task}
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded border border-slate-200 text-sm hover:bg-slate-50"
                onClick={handleCancelMobileMove}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                onClick={handleConfirmMobileMove}
              >
                Confirm
              </button>
            </div>
            {isAdmin && (
              <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-100 rounded px-2 py-1">
                Selecting Cancel will require double confirmation.
              </p>
            )}
          </div>
        </Modal>
      )}

    </>
  );
}
