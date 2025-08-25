// src/Pages/AllDelivery.jsx
import React, { useState, useEffect, useCallback } from "react";
import { getWithFallback } from "../utils/api.js";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

import UpdateDelivery from "../Pages/updateDelivery";
import { LoadingSpinner } from "../Components";

const ORDERS_BASES = ["/api/orders", "/order"];
const CUSTOMERS_BASES = ["/api/customers", "/customer"];

export default function AllDelivery() {

  const [orders, setOrders] = useState([]);
  const [searchOrder, setSearchOrder] = useState("");
  const [filter, setFilter] = useState(""); // "", "delivered", "design", etc. (optional UI filter)
  const [customers, setCustomers] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatDateDDMMYYYY = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Delivered-but-not-billed criterion (matches backend GetDeliveredList filter)
  const hasBillableAmount = useCallback(
    (items) => Array.isArray(items) && items.some((it) => Number(it?.Amount) > 0),
    []
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        // Prefer /api/orders, fall back to /order
        const ordersRes = await getWithFallback(
          ORDERS_BASES.map((b) => `${b}/GetDeliveredList?page=1&limit=500`)
        );
        // Prefer /api/customers, fall back to /customer
        const customersRes = await getWithFallback(
          CUSTOMERS_BASES.map((b) => `${b}/GetCustomersList?page=1&limit=1000`)
        );

        if (!isMounted) return;

        const orderRows = ordersRes?.data?.success ? ordersRes.data.result ?? [] : [];
        const custRows = customersRes?.data?.success ? customersRes.data.result ?? [] : [];

        const customerMap = Array.isArray(custRows)
          ? custRows.reduce((acc, c) => {
              if (c.Customer_uuid) {
                acc[c.Customer_uuid] =
                  c.Customer_name || c.Mobile || c.Code || "Unknown";
              }
              return acc;
            }, {})
          : {};

        setCustomers(customerMap);
        setOrders(Array.isArray(orderRows) ? orderRows : []);
      } catch (err) {
        console.error("Error fetching data:", err?.message || err);
        setCustomers({});
        setOrders([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Safely compute highest status
  const getHighestStatus = (statusArr) => {
    const list = Array.isArray(statusArr) ? statusArr : [];
    if (list.length === 0) return {};
    return list.reduce((prev, curr) => {
      const prevNum = Number(prev?.Status_number || 0);
      const currNum = Number(curr?.Status_number || 0);
      return currNum > prevNum ? curr : prev;
    }, list[0]);
  };

  // 🔁 Local state upsert helpers (no reload)
  const upsertOrderPatch = useCallback(
    (orderId, patch) => {
      if (!orderId || !patch) return;

      // If Items now have billable amounts, remove from this page immediately
      if (patch.Items && hasBillableAmount(patch.Items)) {
        setOrders((prev) => prev.filter((o) => (o.Order_uuid || o._id) !== orderId));
        if (selectedOrder && (selectedOrder.Order_uuid || selectedOrder._id) === orderId) {
          setSelectedOrder(null);
          setShowEditModal(false);
        }
        return;
      }

      // Otherwise, just patch in place
      setOrders((prev) =>
        prev.map((o) =>
          (o.Order_uuid || o._id) === orderId ? { ...o, ...patch } : o
        )
      );
      if (selectedOrder && (selectedOrder.Order_uuid || selectedOrder._id) === orderId) {
        setSelectedOrder((s) => (s ? { ...s, ...patch } : s));
      }
    },
    [hasBillableAmount, selectedOrder]
  );

  const upsertOrderReplace = useCallback(
    (nextOrder) => {
      if (!nextOrder) return;
      const key = nextOrder.Order_uuid || nextOrder._id;

      // If replaced doc contains billable items, remove it from list now
      if (hasBillableAmount(nextOrder.Items)) {
        setOrders((prev) => prev.filter((o) => (o.Order_uuid || o._id) !== key));
        if (selectedOrder && (selectedOrder.Order_uuid || selectedOrder._id) === key) {
          setSelectedOrder(null);
          setShowEditModal(false);
        }
        return;
      }

      // Otherwise, replace/insert
      setOrders((prev) => {
        const idx = prev.findIndex((o) => (o.Order_uuid || o._id) === key);
        if (idx === -1) return [nextOrder, ...prev];
        const copy = prev.slice();
        copy[idx] = { ...prev[idx], ...nextOrder };
        return copy;
      });
      if (selectedOrder && (selectedOrder.Order_uuid || selectedOrder._id) === key) {
        setSelectedOrder((s) => (s ? { ...s, ...nextOrder } : s));
      }
    },
    [hasBillableAmount, selectedOrder]
  );

  // 🔎 Derived filtered list
  const filteredOrders = orders
    .map((order) => {
      const highestStatusTask = getHighestStatus(order.Status);
      return {
        ...order,
        highestStatusTask,
        Customer_name: customers[order.Customer_uuid] || "Unknown",
      };
    })
    .filter((order) => {
      const name = (order.Customer_name || "").toLowerCase();
      const matchesSearch = name.includes(searchOrder.toLowerCase());

      const task = (order.highestStatusTask?.Task || "").toLowerCase().trim();
      const filterValue = (filter || "").toLowerCase().trim();
      const matchesFilter = filterValue ? task === filterValue : true;

      return matchesSearch && matchesFilter;
    });

  // 📄 Export helpers — safe handling of Items/Remark
  const getFirstRemark = (order) => {
    if (!Array.isArray(order?.Items) || order.Items.length === 0) return "";
    return String(order.Items[0]?.Remark || "");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Orders Report", 14, 15);
    doc.autoTable({
      head: [
        [
          "Order Number",
          "Customer Name",
          "Created Date",
          "Remark",
          "Delivery Date",
          "Assigned",
          "Highest Status Task",
        ],
      ],
      body: filteredOrders.map((order) => [
        order.Order_Number || "",
        order.Customer_name || "",
        formatDateDDMMYYYY(order.createdAt),
        getFirstRemark(order),
        formatDateDDMMYYYY(order.highestStatusTask?.Delivery_Date),
        order.highestStatusTask?.Assigned || "",
        order.highestStatusTask?.Task || "",
      ]),
      startY: 20,
    });
    doc.save("orders_report.pdf");
  };

  const exportExcel = () => {
    const worksheetData = filteredOrders.map((order) => ({
      "Order Number": order.Order_Number || "",
      "Customer Name": order.Customer_name || "",
      "Created Date": formatDateDDMMYYYY(order.createdAt),
      Remark: getFirstRemark(order),
      "Delivery Date": formatDateDDMMYYYY(order.highestStatusTask?.Delivery_Date),
      Assigned: order.highestStatusTask?.Assigned || "",
      "Highest Status Task": order.highestStatusTask?.Task || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "orders_report.xlsx");
  };

  const handleEditClick = (order) => {
    const id = order._id || order.Order_id || null;
    if (!id) {
      alert("⚠️ Invalid order ID. Cannot open edit modal.");
      return;
    }
    setSelectedOrder({ ...order, _id: id });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedOrder(null);
  };

  return (
    <>
      <div className="max-w-8xl mx-auto p-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
          <div className="flex flex-grow items-center gap-2">
            <input
              type="text"
              placeholder="Search by customer name"
              className="bg-white shadow-sm border border-gray-300 rounded-full px-4 py-2 w-full max-w-md focus:outline-none"
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
            />
            {/* Optional: a quick filter dropdown */}
            <select
              className="bg-white shadow-sm border border-gray-300 rounded-full px-3 py-2"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              title="Filter by latest task"
            >
              <option value="">All</option>
              <option value="delivered">Delivered</option>
              <option value="design">Design</option>
              <option value="print">Print</option>
            </select>
          </div>
          <div className="flex gap-2 mt-2 md:mt-0">
            <button
              onClick={exportPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow transition"
              title="Export as PDF"
            >
              Export PDF
            </button>
            <button
              onClick={exportExcel}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
              title="Export as Excel"
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <LoadingSpinner size={40} />
          </div>
        ) : (
          <>
            {/* Orders Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-9 gap-2">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const key =
                    order._id || order.Order_id || order.Order_uuid || `o-${order.Order_Number}`;
                  return (
                    <div
                      key={key}
                      onClick={() => handleEditClick(order)}
                      className="bg-white border border-gray-200 hover:border-blue-500 rounded-lg p-2 shadow hover:shadow-md cursor-pointer transition"
                    >
                      <div className="text-blue-600 font-bold text-xl mb-1">
                        #{order.Order_Number}
                      </div>
                      <div className="text-gray-800 font-semibold text-md mb-1">
                        {order.Customer_name}
                      </div>
                      <div className="text-gray-600 text-sm">
                        Date {formatDateDDMMYYYY(order.highestStatusTask?.Delivery_Date)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center text-gray-500 py-10">
                  No orders found
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full">
            <UpdateDelivery
              mode="edit"
              order={selectedOrder}
              onClose={closeEditModal}
              // 👇 no-reload callbacks
              onOrderPatched={(orderId, patch) => upsertOrderPatch(orderId, patch)}
              onOrderReplaced={(full) => upsertOrderReplace(full)}
            />
          </div>
        </div>
      )}
    </>
  );
}
