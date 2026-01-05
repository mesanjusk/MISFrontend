import React, { useState, useEffect, useMemo, useCallback } from "react";
import { fetchBillList } from "../services/orderService";
import { fetchCustomers } from "../services/customerService";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

import UpdateDelivery from "../Pages/updateDelivery";
import { LoadingSpinner } from "../Components";

// ✅ Adjust if your path differs
import InvoiceModal from "../Components/InvoiceModal";

export default function AllBills() {
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
  const [filter, setFilter] = useState(""); // "", "delivered", "design", "print", etc.
  const [customers, setCustomers] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Invoice modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const formatDateDDMMYYYY = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const formatINR = (value) => {
    const num = Number(value || 0);
    try {
      return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(num);
    } catch {
      return String(num);
    }
  };

  // ✅ Robust number parsing (handles "1,099", "₹1099", etc.)
  const toNumber = (v) => {
    if (v === null || v === undefined) return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const s = String(v).replace(/[₹,\s]/g, "").trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  // ✅ IMPORTANT: Your "amount" may not be in it.Amount anymore.
  // So we read multiple possible keys + fallback qty*rate.
  const resolveQty = (it) =>
    toNumber(it?.Qty ?? it?.Quantity ?? it?.qty ?? it?.quantity ?? it?.QTY ?? 0);

  const resolveRate = (it) =>
    toNumber(it?.Rate ?? it?.Price ?? it?.rate ?? it?.price ?? it?.RATE ?? 0);

  const resolveAmount = (it) => {
    const direct =
      it?.Amount ??
      it?.amount ??
      it?.Amt ??
      it?.amt ??
      it?.BillAmount ??
      it?.billAmount ??
      it?.Bill_Amount ??
      it?.FinalAmount ??
      it?.finalAmount ??
      it?.Final_Amount ??
      it?.TotalAmount ??
      it?.totalAmount ??
      it?.Total_Amount ??
      it?.NetAmount ??
      it?.netAmount ??
      it?.Net_Amount;

    const n = toNumber(direct);
    if (n > 0) return n;

    // fallback: qty * rate (if you updated only qty/rate)
    const q = resolveQty(it);
    const r = resolveRate(it);
    const calc = q * r;
    return Number.isFinite(calc) ? calc : 0;
  };

  // Bills page shows orders that HAVE billable amount
  const hasBillableAmount = useCallback(
    (items) => Array.isArray(items) && items.some((it) => resolveAmount(it) > 0),
    []
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const [ordersRes, customersRes] = await Promise.all([fetchBillList(), fetchCustomers()]);

        if (!isMounted) return;

        const orderRows = ordersRes?.data?.success ? ordersRes.data.result ?? [] : [];
        const custRows = customersRes?.data?.success ? customersRes.data.result ?? [] : [];

        const customerMap = Array.isArray(custRows)
          ? custRows.reduce((acc, c) => {
              if (c.Customer_uuid && c.Customer_name) acc[c.Customer_uuid] = c.Customer_name;
              return acc;
            }, {})
          : {};

        setCustomers(customerMap);
        setOrders(Array.isArray(orderRows) ? orderRows : []);
      } catch (err) {
        console.error("Error fetching bills data:", err?.message || err);
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

  // 🔁 Local state upsert helpers (no reload)
  const upsertOrderPatch = useCallback(
    (orderId, patch) => {
      if (!orderId || !patch) return;

      if (patch.Items && !hasBillableAmount(patch.Items)) {
        setOrders((prev) => prev.filter((o) => (o.Order_uuid || o._id) !== orderId));

        if (selectedOrder && (selectedOrder.Order_uuid || selectedOrder._id) === orderId) {
          setSelectedOrder(null);
          setShowEditModal(false);
        }

        if (invoiceOrder && (invoiceOrder.Order_uuid || invoiceOrder._id) === orderId) {
          setShowInvoiceModal(false);
          setInvoiceOrder(null);
        }
        return;
      }

      setOrders((prev) =>
        prev.map((o) => ((o.Order_uuid || o._id) === orderId ? { ...o, ...patch } : o))
      );

      if (selectedOrder && (selectedOrder.Order_uuid || selectedOrder._id) === orderId) {
        setSelectedOrder((s) => (s ? { ...s, ...patch } : s));
      }

      if (invoiceOrder && (invoiceOrder.Order_uuid || invoiceOrder._id) === orderId) {
        setInvoiceOrder((s) => (s ? { ...s, ...patch } : s));
      }
    },
    [hasBillableAmount, selectedOrder, invoiceOrder]
  );

  const upsertOrderReplace = useCallback(
    (nextOrder) => {
      if (!nextOrder) return;
      const key = nextOrder.Order_uuid || nextOrder._id;

      if (!hasBillableAmount(nextOrder.Items)) {
        setOrders((prev) => prev.filter((o) => (o.Order_uuid || o._id) !== key));

        if (selectedOrder && (selectedOrder.Order_uuid || selectedOrder._id) === key) {
          setSelectedOrder(null);
          setShowEditModal(false);
        }

        if (invoiceOrder && (invoiceOrder.Order_uuid || invoiceOrder._id) === key) {
          setShowInvoiceModal(false);
          setInvoiceOrder(null);
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

      if (invoiceOrder && (invoiceOrder.Order_uuid || invoiceOrder._id) === key) {
        setInvoiceOrder((s) => (s ? { ...s, ...nextOrder } : s));
      }
    },
    [hasBillableAmount, selectedOrder, invoiceOrder]
  );

  // 🔎 Derived filtered list + bill total
  const filteredOrders = orders
    .map((order) => {
      const highestStatusTask = getHighestStatus(order.Status);
      const items = Array.isArray(order?.Items) ? order.Items : [];
      const billTotal = items.reduce((sum, it) => sum + resolveAmount(it), 0);

      return {
        ...order,
        highestStatusTask,
        Customer_name: customers[order.Customer_uuid] || "Unknown",
        billTotal,
      };
    })
    .filter((order) => {
      if (!hasBillableAmount(order.Items)) return false;

      const name = (order.Customer_name || "").toLowerCase();
      const matchesSearch = name.includes(searchOrder.toLowerCase());

      const task = (order.highestStatusTask?.Task || "").toLowerCase().trim();
      const filterValue = (filter || "").toLowerCase().trim();
      const matchesFilter = filterValue ? task === filterValue : true;

      return matchesSearch && matchesFilter;
    });

  const getFirstRemark = (order) => {
    if (!Array.isArray(order?.Items) || order.Items.length === 0) return "";
    return String(order.Items[0]?.Remark || "");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Bills Report", 14, 15);
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
    doc.save("bills_report.pdf");
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bills");
    XLSX.writeFile(workbook, "bills_report.xlsx");
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

  // ✅ Invoice modal helpers
  const openInvoice = (order) => {
    setInvoiceOrder(order);
    setShowInvoiceModal(true);
  };

  const closeInvoice = () => {
    setShowInvoiceModal(false);
    setInvoiceOrder(null);
  };

  // ✅ Build items for InvoicePreview: provide BOTH styles of keys
  // so your InvoicePreview will never show blank/0.
  const buildInvoiceItems = (order) => {
    const items = Array.isArray(order?.Items) ? order.Items : [];

    return items
      .map((it, idx) => {
        const qty = resolveQty(it);
        const rate = resolveRate(it);
        const amount = resolveAmount(it);
        const name = String(it?.Item_name || it?.Name || it?.Product_name || it?.Item || "Item");

        return {
          // our standard keys
          sr: idx + 1,
          name,
          qty,
          rate,
          amount,
          remark: String(it?.Remark || ""),

          // ✅ compatibility keys (many InvoicePreview components use these)
          Item: name,
          Qty: qty,
          Rate: rate,
          Amt: amount,
          Amount: amount,
        };
      })
      .filter((it) => toNumber(it?.amount ?? it?.Amt ?? it?.Amount) > 0);
  };

  const sendInvoiceOnWhatsApp = (invoiceUrl, order) => {
    const orderNo = order?.Order_Number || "";
    const party = order?.Customer_name || "Customer";
    const msg = `Invoice for Order #${orderNo}\nParty: ${party}\n\n${invoiceUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div className="max-w-8xl mx-auto p-3">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-3 gap-2">
          <div className="flex flex-grow items-center gap-2">
            <input
              type="text"
              placeholder="Search by customer name"
              className="bg-white shadow-sm border border-gray-300 rounded-full px-4 py-2 w-full max-w-md focus:outline-none"
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
            />

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
            {/* ✅ Narrow, auto-fit grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(145px,1fr))] gap-2">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const key =
                    order._id || order.Order_id || order.Order_uuid || `o-${order.Order_Number}`;

                  return (
                    <div
                      key={key}
                      onClick={() => handleEditClick(order)}
                      className="bg-white border border-gray-200 hover:border-blue-500 rounded-md p-2 shadow-sm hover:shadow cursor-pointer transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-blue-700 font-bold text-sm leading-tight truncate">
                            #{order.Order_Number}
                          </div>
                          <div className="text-gray-800 font-semibold text-xs leading-tight truncate">
                            {order.Customer_name}
                          </div>
                          <div className="text-gray-600 text-[11px] leading-tight">
                            {formatDateDDMMYYYY(order.highestStatusTask?.Delivery_Date)}
                          </div>

                          {/* ✅ Total on card */}
                          <div className="mt-1 text-[11px] font-semibold text-gray-900">
                            Total ₹{formatINR(order.billTotal)}
                          </div>
                        </div>

                        {/* ✅ Invoice button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openInvoice(order);
                          }}
                          className="px-2 py-1 rounded text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                          title="Open Invoice"
                        >
                          Bill
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center text-gray-500 py-10">
                  No billed orders found
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
              onOrderPatched={(orderId, patch) => upsertOrderPatch(orderId, patch)}
              onOrderReplaced={(full) => upsertOrderReplace(full)}
            />
          </div>
        </div>
      )}

      {/* ✅ Invoice Modal */}
      <InvoiceModal
        open={showInvoiceModal}
        onClose={closeInvoice}
        orderNumber={invoiceOrder?.Order_Number || ""}
        partyName={invoiceOrder?.Customer_name || "Customer"}
        items={buildInvoiceItems(invoiceOrder)}
        onWhatsApp={(url) => sendInvoiceOnWhatsApp(url, invoiceOrder)}
      />
    </>
  );
}
