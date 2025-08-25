import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

import UpdateDelivery from "../Pages/updateDelivery";
import { LoadingSpinner } from "../Components";

export default function AllDelivery() {
  // 🔧 Central API base (env -> vite -> CRA -> localhost)
  const API_BASE = useMemo(() => {
    const raw =
      (typeof import.meta !== "undefined" ? import.meta.env.VITE_API_BASE : "") ||
      process.env.REACT_APP_API ||
      "http://localhost:10000";
    return String(raw).replace(/\/$/, "");
  }, []);

  const [orders, setOrders] = useState([]);
  const [searchOrder, setSearchOrder] = useState("");
  const [filter, setFilter] = useState(""); // "", "delivered", "design", etc.
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

  // delivered list = Delivered but **no billable amount**
  const hasBillableAmount = useCallback(
    (items) => Array.isArray(items) && items.some((it) => Number(it?.Amount) > 0),
    []
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const [ordersRes, customersRes] = await Promise.all([
          axios.get(`${API_BASE}/order/GetDeliveredList`),
          axios.get(`${API_BASE}/customer/GetCustomersList`),
        ]);

        if (!isMounted) return;

        const orderRows = ordersRes?.data?.success ? ordersRes.data.result ?? [] : [];
        const custRows = customersRes?.data?.success ? customersRes.data.result ?? [] : [];

        const customerMap = Array.isArray(custRows)
          ? custRows.reduce((acc, c) => {
              if (c.Customer_uuid && c.Customer_name) {
                acc[c.Customer_uuid] = c.Customer_name;
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
  }, [API_BASE]);

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

  // 🔁 Patch/replace helpers (no reload)
  const upsertOrderPatch = useCallback(
    (orderId, patch) => {
      if (!orderId || !patch) return;

      // If Items gain billable amounts, remove from this list
      if (patch.Items && hasBillableAmount(patch.Items)) {
        setOrders((prev) => prev.filter((o) => (o.Order_uuid || o._id) !== orderId));
        if (selectedOrder && (selectedOrder.Order_uuid || selectedOrder._id) === orderId) {
          setSelectedOrder(null);
          setShowEditModal(false);
        }
        return;
      }

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

      if (hasBillableAmount(nextOrder.Items)) {
        setOrders((prev) => prev.filter((o) => (o.Order_uuid || o._id) !== key));
        if (selectedOrder && (selectedOrder.Order_uuid || selectedOrder._id) === key) {
          setSelectedOrder(null);
          setShowEditModal(false);
        }
        return;
      }

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

  // 🔎 Derived list
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

  // Export helpers
  const getFirstRemark = (order) => {
    if (!Array.isArray(order?.Items) || order.Items.length === 0) return "";
    return String(order.Items[0]?.Remark || "");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Delivered Orders Report", 14, 15);
    doc.autoTable({
      head: [["Order Number", "Customer", "Created", "Remark", "Delivery Date", "Assigned", "Task"]],
      body: filteredOrders.map((o) => [
        o.Order_Number || "",
        o.Customer_name || "",
        formatDateDDMMYYYY(o.createdAt),
        getFirstRemark(o),
        formatDateDDMMYYYY(o.highestStatusTask?.Delivery_Date),
        o.highestStatusTask?.Assigned || "",
        o.highestStatusTask?.Task || "",
      ]),
      startY: 20,
    });
    doc.save("delivered_orders.pdf");
  };

  const exportExcel = () => {
    const worksheetData = filteredOrders.map((o) => ({
      "Order Number": o.Order_Number || "",
      Customer: o.Customer_name || "",
      Created: formatDateDDMMYYYY(o.createdAt),
      Remark: getFirstRemark(o),
      "Delivery Date": formatDateDDMMYYYY(o.highestStatusTask?.Delivery_Date),
      Assigned: o.highestStatusTask?.Assigned || "",
      Task: o.highestStatusTask?.Task || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Delivered");
    XLSX.writeFile(workbook, "delivered_orders.xlsx");
  };

  const handleEditClick = (order) => {
    const id = order._id || order.Order_id || null;
    if (!id) return alert("⚠️ Invalid order ID.");
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
              className="bg-white border rounded-full px-4 py-2 shadow-sm w-full max-w-md"
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
            />
            <select
              className="bg-white border rounded-full px-3 py-2 shadow-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="delivered">Delivered</option>
              <option value="design">Design</option>
              <option value="print">Print</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={exportPDF} className="bg-red-600 text-white px-4 py-2 rounded-lg">
              Export PDF
            </button>
            <button onClick={exportExcel} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              Export Excel
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <LoadingSpinner size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-9 gap-2">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((o) => (
                <div
                  key={o._id || o.Order_uuid}
                  onClick={() => handleEditClick(o)}
                  className="bg-white border rounded-lg p-2 shadow hover:shadow-md cursor-pointer"
                >
                  <div className="text-blue-600 font-bold">#{o.Order_Number}</div>
                  <div className="text-gray-800 font-semibold">{o.Customer_name}</div>
                  <div className="text-gray-600 text-sm">
                    Date {formatDateDDMMYYYY(o.highestStatusTask?.Delivery_Date)}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-10">No delivered orders</div>
            )}
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full">
            <UpdateDelivery
              mode="edit"
              order={selectedOrder}
              onClose={closeEditModal}
              onOrderPatched={(id, patch) => upsertOrderPatch(id, patch)}
              onOrderReplaced={(full) => upsertOrderReplace(full)}
            />
          </div>
        </div>
      )}
    </>
  );
}
