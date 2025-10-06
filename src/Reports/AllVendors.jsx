import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { getWithFallback } from "../utils/api.js";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import OrderUpdate from "../Pages/OrderUpdate";

export default function AllVendors() {
  // ---------- Helpers ----------
  const getLocalYMD = (d = new Date()) => d.toLocaleDateString("en-CA");
  const norm = (s) => String(s || "").trim().toLowerCase();
  const buildRemarkFromItems = (order) =>
    ((order?.Items || [])
      .map((it) => String(it?.Remark || "").trim())
      .filter(Boolean)
      .join(" | ")) || "";

  // ---------- Data ----------
  const [rawRows, setRawRows] = useState([]);
  const [customersMap, setCustomersMap] = useState({});
  const [customersList, setCustomersList] = useState([]);

  // ---------- UI / search ----------
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------- Assign modal ----------
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeStep, setActiveStep] = useState(null);
  const [selectedVendorUuid, setSelectedVendorUuid] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [plannedDate, setPlannedDate] = useState(getLocalYMD());

  // ---------- Add Step modal ----------
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [taskGroups, setTaskGroups] = useState([]);
  const [newStepLabelChoice, setNewStepLabelChoice] = useState("");
  const [addStepOrder, setAddStepOrder] = useState(null);
  const [newStepLabel, setNewStepLabel] = useState("");
  const [newStepVendorUuid, setNewStepVendorUuid] = useState("");
  const [newStepCost, setNewStepCost] = useState("");
  const [newStepPlannedDate, setNewStepPlannedDate] = useState(getLocalYMD());

  // ---------- OrderUpdate modal + Steps checklist ----------
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStepLabels, setSelectedStepLabels] = useState(new Set());
  const [togglingLabel, setTogglingLabel] = useState("");

  // ✅ fixed API roots
  const ORDER_BASE = "/order";
  const ORDERS_BASES = ["/order"];
  const CUSTOMERS_BASES = ["/customer"];
  const TASKGROUPS_BASES = ["/taskgroup"];

  // ---- Utils ----
  const isStepNeedingVendor = (st) => {
    const hasVendor = !!(st?.vendorId || st?.vendorCustomerUuid);
    const isPosted = !!st?.posting?.isPosted;
    return !hasVendor || !isPosted;
  };

  const computeProjectedRows = (docs, search) => {
    const text = (search || "").trim().toLowerCase();

    const deliveredOnly = (Array.isArray(docs) ? docs : []).filter((o) => {
      if (!Array.isArray(o.Status) || o.Status.length === 0) return false;
      const latest = o.Status[o.Status.length - 1];
      return String(latest?.Task || "").trim().toLowerCase() === "delivered";
    });

    const filtered = text
      ? deliveredOnly.filter((o) => {
          const onum = String(o.Order_Number || "").toLowerCase();
          const cuid = String(o.Customer_uuid || "").toLowerCase();
          const anyRemarkText = String(o.RemarkText || buildRemarkFromItems(o)).toLowerCase();
          const anyItemRemark = (o.Items || []).some((it) =>
            String(it?.Remark || "").toLowerCase().includes(text)
          );
          return (
            onum.includes(text) ||
            cuid.includes(text) ||
            anyRemarkText.includes(text) ||
            anyItemRemark
          );
        })
      : deliveredOnly;

    return filtered
      .map((o) => {
        const pending = (o.Steps || [])
          .filter(isStepNeedingVendor)
          .map((s) => ({
            stepId: s?._id,
            label: s?.label || "",
            vendorId: s?.vendorId || "",
            vendorCustomerUuid: s?.vendorCustomerUuid || "",
            vendorName: s?.vendorName || "",
            costAmount: Number(s?.costAmount || 0),
            isPosted: !!s?.posting?.isPosted,
            plannedDate: s?.plannedDate,
          }));

        const remarkText = String(o.RemarkText || buildRemarkFromItems(o)).trim();

        return { ...o, StepsPending: pending, RemarkText: remarkText };
      })
      .filter((o) => (o.StepsPending || []).length > 0)
      .sort((a, b) => (b.Order_Number || 0) - (a.Order_Number || 0));
  };

  // ---------- Fetch ----------
  const fetchData = async () => {
    setLoading(true);
    try {
      const [rawRes, customersRes, tgRes] = await Promise.all([
        getWithFallback(
          ORDERS_BASES.map((b) => `${b}/allvendors-raw`),
          { params: { deliveredOnly: true } }
        ),
        getWithFallback(CUSTOMERS_BASES.map((b) => `${b}/GetCustomersList`)),
        getWithFallback(TASKGROUPS_BASES.map((b) => `${b}/GetTaskgroupList`)),
      ]);

      const docs = rawRes.data?.rows || [];
      setRawRows(Array.isArray(docs) ? docs : []);

      if (customersRes.data?.success && Array.isArray(customersRes.data.result)) {
        const list = customersRes.data.result;
        setCustomersList(list);
        const cmap = list.reduce((acc, c) => {
          if (c.Customer_uuid && c.Customer_name)
            acc[c.Customer_uuid] = c.Customer_name;
          return acc;
        }, {});
        setCustomersMap(cmap);
      } else {
        setCustomersList([]);
        setCustomersMap({});
      }

      const tgItems = Array.isArray(tgRes?.data?.result)
        ? tgRes.data.result
        : [];
      setTaskGroups(tgItems);
    } catch (err) {
      console.error("Error fetching data:", err);
      alert(err?.response?.data?.error || "Failed to load vendor list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // derive vendor options
  const vendorOptions = useMemo(() => {
    const isOfficeVendor = (groupValue) => norm(groupValue) === "office & vendor";
    return customersList
      .filter((c) => isOfficeVendor(c.Customer_group || c.Group || c.group))
      .map((c) => ({ uuid: c.Customer_uuid, name: c.Customer_name }));
  }, [customersList]);

  const rows = useMemo(
    () => computeProjectedRows(rawRows, searchText),
    [rawRows, searchText]
  );

  const enriched = useMemo(
    () =>
      rows.map((order) => ({
        ...order,
        Customer_name: customersMap[order.Customer_uuid] || "Unknown",
      })),
    [rows, customersMap]
  );

  // ---------- Assign Vendor ----------
  const openAssignModal = (order, step) => {
    setActiveOrder(order);
    setActiveStep(step);
    setSelectedVendorUuid(step.vendorCustomerUuid || step.vendorId || "");
    setCostAmount(step.costAmount ?? "");
    const d = step.plannedDate ? new Date(step.plannedDate) : new Date();
    setPlannedDate(getLocalYMD(d));
    setShowAssignModal(true);
  };
  const closeAssignModal = () => {
    setShowAssignModal(false);
    setActiveOrder(null);
    setActiveStep(null);
    setSelectedVendorUuid("");
    setCostAmount("");
    setPlannedDate(getLocalYMD());
  };
  const assignVendor = async () => {
    if (!activeOrder || !activeStep) return;
    if (!selectedVendorUuid) return alert("Please choose a vendor");
    const amt = Number(costAmount || 0);
    if (Number.isNaN(amt) || amt < 0) return alert("Invalid cost amount");
    if (!plannedDate) return alert("Please select a date");

    try {
      setLoading(true);
      const orderId = activeOrder._id || activeOrder.id;
      await axios.post(
        `${ORDER_BASE}/${orderId}/steps/${activeStep.stepId}/assign-vendor`,
        {
          vendorCustomerUuid: selectedVendorUuid,
          costAmount: amt,
          plannedDate,
          createdBy: localStorage.getItem("User_name") || "operator",
        }
      );
      closeAssignModal();
      await fetchData();
      alert("Vendor assigned & transaction posted.");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "Failed to assign vendor");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Add Step ----------
  const openAddStepModal = (order) => {
    setAddStepOrder(order);
    setNewStepLabel("");
    setNewStepVendorUuid("");
    setNewStepCost("");
    setNewStepPlannedDate(getLocalYMD());
    setShowAddStepModal(true);
    setNewStepLabelChoice("");
    setNewStepLabel("");
  };
  const closeAddStepModal = () => {
    setShowAddStepModal(false);
    setAddStepOrder(null);
  };
  const addStep = async () => {
    if (!addStepOrder) return;
    const resolvedLabel =
      newStepLabelChoice === "__CUSTOM__"
        ? newStepLabel.trim()
        : newStepLabelChoice;
    if (!resolvedLabel)
      return alert("Please choose a task or enter a custom label.");
    try {
      setLoading(true);
      const orderId = addStepOrder._id || addStepOrder.id;
      await axios.post(`${ORDER_BASE}/${orderId}/steps`, {
        label: resolvedLabel,
        vendorCustomerUuid: newStepVendorUuid || null,
        costAmount: Number(newStepCost || 0),
        plannedDate: newStepPlannedDate || null,
      });
      closeAddStepModal();
      await fetchData();
      alert("Step added.");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "Failed to add step");
    } finally {
      setLoading(false);
    }
  };

  // ---------- OrderUpdate + Steps checklist ----------
  const openOrderUpdate = (order) => {
    setSelectedOrder(order);
    const labels = new Set(
      (order?.Steps || [])
        .map((s) => (s?.label || "").trim())
        .filter(Boolean)
    );
    setSelectedStepLabels(labels);
    setShowOrderModal(true);
  };
  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
    setSelectedStepLabels(new Set());
    setTogglingLabel("");
  };
  const getStepIdByLabel = (label) => {
    const l = (label || "").trim();
    const found = (selectedOrder?.Steps || []).find(
      (s) => (s?.label || "").trim() === l
    );
    return found?._id || found?.id || null;
  };
  const refreshSelectedOrderFromStore = () => {
    if (!selectedOrder) return;
    const id =
      selectedOrder._id || selectedOrder.id || selectedOrder.Order_uuid;
    const updated = (rawRows || []).find(
      (o) => (o._id || o.id || o.Order_uuid) === id
    );
    if (updated) setSelectedOrder(updated);
  };
  const toggleStep = async (label, checked) => {
    if (!selectedOrder) return;
    const orderId = selectedOrder._id || selectedOrder.id;
    const tidy = (label || "").trim();
    if (!tidy) return;
    setTogglingLabel(tidy);
    setSelectedStepLabels((prev) => {
      const next = new Set(prev);
      if (checked) next.add(tidy);
      else next.delete(tidy);
      return next;
    });
    try {
      if (checked) {
        await axios.post(`${ORDER_BASE}/${orderId}/steps`, { label: tidy });
      } else {
        const stepId = getStepIdByLabel(tidy);
        if (stepId) {
          await axios.delete(`${ORDER_BASE}/${orderId}/steps/${stepId}`);
        }
      }
      await fetchData();
      refreshSelectedOrderFromStore();
    } catch (e) {
      setSelectedStepLabels((prev) => {
        const next = new Set(prev);
        if (checked) next.delete(tidy);
        else next.add(tidy);
        return next;
      });
      alert(e?.response?.data?.error || "Failed to update steps");
    } finally {
      setTogglingLabel("");
    }
  };

  // ---------- Export ----------
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = [
      "Order #",
      "Customer",
      "Step",
      "Vendor UUID",
      "Cost",
      "Posted?",
      "Remarks",
    ];
    const tableRows = [];
    enriched.forEach((order) => {
      const remark = order.RemarkText || buildRemarkFromItems(order) || "-";
      (order.StepsPending || []).forEach((s) => {
        tableRows.push([
          order.Order_Number,
          order.Customer_name,
          s.label,
          s.vendorCustomerUuid || s.vendorId || "-",
          s.costAmount ?? 0,
          s.isPosted ? "Yes" : "No",
          remark,
        ]);
      });
    });
    doc.text("All Vendors - Pending/Unposted Steps", 14, 15);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
    doc.save("all_vendors_report.pdf");
  };
  const exportToExcel = () => {
    const data = [];
    enriched.forEach((order) => {
      const remark = order.RemarkText || buildRemarkFromItems(order) || "-";
      (order.StepsPending || []).forEach((s) => {
        data.push({
          "Order Number": order.Order_Number,
          "Customer Name": order.Customer_name,
          Step: s.label,
          "Vendor UUID": s.vendorCustomerUuid || s.vendorId || "-",
          "Cost Amount": s.costAmount ?? 0,
          "Posted?": s.isPosted ? "Yes" : "No",
          Remarks: remark,
        });
      });
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AllVendors");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, "all_vendors_report.xlsx");
  };

  return (
    <>
      {/* UI — your existing visible layout */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-gray-700">All Vendors</h1>
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
            >
              Export Excel
            </button>
            <button
              onClick={exportToPDF}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
            >
              Export PDF
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search Order No. / Remark"
          className="border border-gray-300 rounded-md px-3 py-1 w-64 mb-3 text-sm"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        {loading ? (
          <div className="text-center text-gray-500 py-10">Loading...</div>
        ) : enriched.length === 0 ? (
          <div className="text-center text-gray-400 py-10">No vendor data found.</div>
        ) : (
          enriched.map((o) => (
            <div
              key={o._id || o.Order_uuid}
              className="border border-gray-200 rounded-lg p-3 mb-3 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-700">
                    #{o.Order_Number}
                  </div>
                  <div className="text-xs text-gray-500">
                    {o.Customer_name}
                  </div>
                </div>
                <button
                  onClick={() => openOrderUpdate(o)}
                  className="text-blue-600 hover:underline text-xs"
                >
                  View / Update
                </button>
              </div>

              <div className="mt-2 text-xs text-gray-600">
                Remarks: {o.RemarkText || "-"}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

/* Reusable Modal */
function Modal({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      aria-modal="true"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-5xl mx-4 relative max-h-[90vh] overflow-y-auto">
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
