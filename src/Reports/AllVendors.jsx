// src/Pages/AllVendors.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "../apiClient.js";
import { getWithFallback } from "../utils/api.js";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import OrderUpdate from "../Pages/OrderUpdate";

export default function AllVendors() {
  /* ----------------- helpers ----------------- */
  const getLocalYMD = (d = new Date()) => d.toLocaleDateString("en-CA");
  const norm = (s) => String(s || "").trim().toLowerCase();

  const buildRemarkFromItems = (order) =>
    ((order?.Items || [])
      .map((it) => String(it?.Remark || "").trim())
      .filter(Boolean)
      .join(" | ")) || "";

  /* ----------------- state ----------------- */
  const [rawRows, setRawRows] = useState([]);
  const [customersMap, setCustomersMap] = useState({});
  const [customersList, setCustomersList] = useState([]);

  const [taskGroups, setTaskGroups] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  // assign vendor modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeStep, setActiveStep] = useState(null);
  const [selectedVendorUuid, setSelectedVendorUuid] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [plannedDate, setPlannedDate] = useState(getLocalYMD());

  // add step modal
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [addStepOrder, setAddStepOrder] = useState(null);
  const [newStepLabelChoice, setNewStepLabelChoice] = useState("");
  const [newStepLabel, setNewStepLabel] = useState("");
  const [newStepVendorUuid, setNewStepVendorUuid] = useState("");
  const [newStepCost, setNewStepCost] = useState("");
  const [newStepPlannedDate, setNewStepPlannedDate] = useState(getLocalYMD());

  // order update modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStepLabels, setSelectedStepLabels] = useState(new Set());
  const [togglingLabel, setTogglingLabel] = useState("");

  /* ----------------- constants ----------------- */
  // base root in backend is /order
  const ORDER_BASE = "/order";
  const ORDERS_BASES = ["/order"];
  const CUSTOMERS_BASES = ["/customer"];
  const TASKGROUPS_BASES = ["/taskgroup"];

  /* ----------------- derived ----------------- */

  // Vendor dropdown options => customers whose group == "Office & Vendor"
  const vendorOptions = useMemo(() => {
    const isOfficeVendor = (groupValue) => norm(groupValue) === "office & vendor";
    return (customersList || [])
      .filter((c) => isOfficeVendor(c.Customer_group || c.Group || c.group))
      .map((c) => ({ uuid: c.Customer_uuid, name: c.Customer_name }));
  }, [customersList]);

  // Step preset labels from TaskGroups
  const stepLabelOptions = useMemo(() => {
    const pool = new Set();
    (taskGroups || []).forEach((tg) => {
      const steps = tg?.Steps || tg?.steps || [];
      steps.forEach((s) => {
        const lbl = String(s?.label || s?.name || "").trim();
        if (lbl) pool.add(lbl);
      });
    });
    return Array.from(pool).sort((a, b) => a.localeCompare(b));
  }, [taskGroups]);

  // ---- transform rawRows from backend into what UI needs
  // NOTE: we are NOT filtering out orders that have 0 pending steps anymore.
  const computeProjectedRows = (docs, search) => {
    const text = (search || "").trim().toLowerCase();

    const searched = text
      ? (docs || []).filter((o) => {
          const onum = String(o.Order_Number || "").toLowerCase();
          const cuid = String(o.Customer_uuid || "").toLowerCase();
          const remarkText = String(o.RemarkText || buildRemarkFromItems(o)).toLowerCase();
          const anyItemRemark = (o.Items || []).some((it) =>
            String(it?.Remark || "").toLowerCase().includes(text)
          );
          return (
            onum.includes(text) ||
            cuid.includes(text) ||
            remarkText.includes(text) ||
            anyItemRemark
          );
        })
      : docs || [];

    return searched
      .map((o) => {
        // figure out which steps still need vendor OR are not posted
        const pending = (o.Steps || []).filter((s) => {
          const hasVendor = !!(s?.vendorId || s?.vendorCustomerUuid);
          const posted = !!(s?.posting?.isPosted);
          return !hasVendor || !posted;
        })
        .map((s) => ({
          stepId: s?._id || s?.id,
          label: s?.label || "",
          vendorId: s?.vendorId || "",
          vendorCustomerUuid: s?.vendorCustomerUuid || "",
          vendorName: s?.vendorName || "",
          costAmount: Number(s?.costAmount || 0),
          isPosted: !!s?.posting?.isPosted,
          plannedDate: s?.plannedDate,
        }));

        const remarkText =
          String(o.RemarkText || buildRemarkFromItems(o)).trim();

        return {
          ...o,
          StepsPending: pending,
          RemarkText: remarkText,
        };
      })
      .sort((a, b) => (b.Order_Number || 0) - (a.Order_Number || 0));
  };

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

  /* ----------------- fetch ----------------- */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [rawRes, customersRes, tgRes] = await Promise.all([
        getWithFallback(
          ORDERS_BASES.map((b) => `${b}/allvendors-raw`),
          { params: { deliveredOnly: true } } // backend already filters deliveredOnly=true
        ),
        getWithFallback(CUSTOMERS_BASES.map((b) => `${b}/GetCustomersList`)),
        getWithFallback(TASKGROUPS_BASES.map((b) => `${b}/GetTaskgroupList`)),
      ]);

      // delivered-only docs from backend
      const docs = rawRes?.data?.rows || [];
      setRawRows(Array.isArray(docs) ? docs : []);

      // build customer maps
      if (customersRes?.data?.success && Array.isArray(customersRes.data.result)) {
        const list = customersRes.data.result;
        setCustomersList(list);
        const cmap = list.reduce((acc, c) => {
          if (c.Customer_uuid && c.Customer_name) acc[c.Customer_uuid] = c.Customer_name;
          return acc;
        }, {});
        setCustomersMap(cmap);
      } else {
        setCustomersList([]);
        setCustomersMap({});
      }

      const tgItems = Array.isArray(tgRes?.data?.result) ? tgRes.data.result : [];
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

  /* ----------------- Assign Vendor flow ----------------- */
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

      // backend route:
      // POST /order/orders/:orderId/steps/:stepId/assign-vendor
      await axios.post(
        `${ORDER_BASE}/orders/${orderId}/steps/${activeStep.stepId}/assign-vendor`,
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

  /* ----------------- Add Step flow ----------------- */
  const openAddStepModal = (order) => {
    setAddStepOrder(order);
    setNewStepLabelChoice("");
    setNewStepLabel("");
    setNewStepVendorUuid("");
    setNewStepCost("");
    setNewStepPlannedDate(getLocalYMD());
    setShowAddStepModal(true);
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

      // backend route:
      // POST /order/orders/:orderId/steps
      await axios.post(`${ORDER_BASE}/orders/${orderId}/steps`, {
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

  /* ----------------- Order Update Modal + Checklist ----------------- */
  const openOrderUpdate = (order) => {
    setSelectedOrder(order);

    // grab all current steps' labels
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

  // We don't need getStepIdByLabel / delete route anymore.
  // We'll just use /order/steps/toggle in backend.
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
      // backend route:
      // POST /order/steps/toggle
      await axios.post(`${ORDER_BASE}/steps/toggle`, {
        orderId,
        step: { label: tidy }, // backend accepts { step: { uuid?, label? }, checked }
        checked,
      });

      await fetchData();

      // refresh selectedOrder from new rawRows
      const updated = (rawRows || []).find(
        (o) =>
          (o._id || o.id || o.Order_uuid) ===
          (selectedOrder._id || selectedOrder.id || selectedOrder.Order_uuid)
      );
      if (updated) {
        setSelectedOrder(updated);
      }
    } catch (e) {
      // revert UI if failed
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

  /* ----------------- Export ----------------- */
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

      // also include "no pending" case so PDF shows them:
      if ((order.StepsPending || []).length === 0) {
        tableRows.push([
          order.Order_Number,
          order.Customer_name,
          "(no pending step)",
          "-",
          0,
          "—",
          remark,
        ]);
      }
    });
    doc.text("All Vendors - Delivered Orders / Vendor Steps", 14, 15);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
    doc.save("all_vendors_report.pdf");
  };

  const exportToExcel = () => {
    const data = [];
    enriched.forEach((order) => {
      const remark = order.RemarkText || buildRemarkFromItems(order) || "-";

      if ((order.StepsPending || []).length === 0) {
        data.push({
          "Order Number": order.Order_Number,
          "Customer Name": order.Customer_name,
          Step: "(no pending step)",
          "Vendor UUID": "-",
          "Cost Amount": 0,
          "Posted?": "—",
          Remarks: remark,
        });
      } else {
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
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AllVendors");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, "all_vendors_report.xlsx");
  };

  /* ----------------- UI ----------------- */
  return (
    <>
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

        <div className="flex items-center gap-2 mb-3 text-xs text-gray-600">
          <input
            type="text"
            placeholder="Search Order No. / Remark"
            className="border border-gray-300 rounded-md px-3 py-1 w-64 text-sm"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <span className="text-[11px] text-gray-500">
            {enriched.length} delivered orders
          </span>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-10">Loading...</div>
        ) : enriched.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            No delivered orders found.
          </div>
        ) : (
          enriched.map((o) => (
            <div
              key={o._id || o.Order_uuid || o.Order_Number}
              className="border border-gray-200 rounded-lg p-3 mb-3 bg-white shadow-sm"
            >
              {/* Header row */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-700">
                    #{o.Order_Number}
                  </div>
                  <div className="text-xs text-gray-500">
                    {o.Customer_name}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openOrderUpdate(o)}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View / Update
                  </button>
                  <button
                    onClick={() => openAddStepModal(o)}
                    className="text-emerald-600 hover:underline text-xs"
                  >
                    + Add Step
                  </button>
                </div>
              </div>

              {/* Remarks */}
              <div className="mt-2 text-xs text-gray-600">
                <span className="font-medium">Remarks:</span>{" "}
                {o.RemarkText || "-"}
              </div>

              {/* StepsPending */}
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-700 mb-2">
                  Pending / Unposted Steps
                </div>

                {(o.StepsPending || []).length === 0 ? (
                  <div className="text-[11px] text-gray-400 border border-dashed border-gray-300 rounded p-2">
                    No pending vendor steps. (You can still add a step.)
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-2">
                    {(o.StepsPending || []).map((s) => (
                      <div
                        key={s.stepId + s.label}
                        className="border border-gray-200 rounded p-2 text-sm flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-gray-800">
                            {s.label || "-"}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            Vendor: {s.vendorName || s.vendorCustomerUuid || "—"} • Cost:{" "}
                            {Number.isFinite(s.costAmount) ? s.costAmount : 0} • Planned:{" "}
                            {s.plannedDate
                              ? new Date(s.plannedDate).toLocaleDateString()
                              : "—"}{" "}
                            • Posted: {s.isPosted ? "Yes" : "No"}
                          </div>
                        </div>
                        <button
                          onClick={() => openAssignModal(o, s)}
                          className="text-indigo-600 hover:underline text-xs"
                        >
                          Assign / Post
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assign Vendor Modal */}
      {showAssignModal && (
        <Modal onClose={closeAssignModal}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Assign Vendor & Post Transaction
          </h3>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Order</label>
              <div className="text-sm font-medium text-gray-800">
                #{activeOrder?.Order_Number} —{" "}
                {customersMap[activeOrder?.Customer_uuid] || "Unknown"}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Step</label>
              <div className="text-sm font-medium text-gray-800">
                {activeStep?.label}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Vendor</label>
              <select
                value={selectedVendorUuid}
                onChange={(e) => setSelectedVendorUuid(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
              >
                <option value="">Select vendor…</option>
                {vendorOptions.map((v) => (
                  <option key={v.uuid} value={v.uuid}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Cost Amount
              </label>
              <input
                type="number"
                value={costAmount}
                onChange={(e) => setCostAmount(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Planned Date
              </label>
              <input
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={closeAssignModal}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={assignVendor}
              className="px-3 py-1.5 text-sm rounded bg-indigo-600 text-white"
            >
              Save & Post
            </button>
          </div>
        </Modal>
      )}

      {/* Add Step Modal */}
      {showAddStepModal && (
        <Modal onClose={closeAddStepModal}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Step</h3>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Order</label>
              <div className="text-sm font-medium text-gray-800">
                #{addStepOrder?.Order_Number} —{" "}
                {customersMap[addStepOrder?.Customer_uuid] || "Unknown"}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Choose Label
              </label>
              <select
                value={newStepLabelChoice}
                onChange={(e) => setNewStepLabelChoice(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
              >
                <option value="">Select…</option>
                {stepLabelOptions.map((lbl) => (
                  <option key={lbl} value={lbl}>
                    {lbl}
                  </option>
                ))}
                <option value="__CUSTOM__">➕ Custom…</option>
              </select>
            </div>

            {newStepLabelChoice === "__CUSTOM__" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Custom Label
                </label>
                <input
                  type="text"
                  value={newStepLabel}
                  onChange={(e) => setNewStepLabel(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
                  placeholder="e.g., Lamination"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Vendor (optional)
              </label>
              <select
                value={newStepVendorUuid}
                onChange={(e) => setNewStepVendorUuid(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
              >
                <option value="">—</option>
                {vendorOptions.map((v) => (
                  <option key={v.uuid} value={v.uuid}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Cost (optional)
              </label>
              <input
                type="number"
                value={newStepCost}
                onChange={(e) => setNewStepCost(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Planned Date (optional)
              </label>
              <input
                type="date"
                value={newStepPlannedDate}
                onChange={(e) => setNewStepPlannedDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={closeAddStepModal}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={addStep}
              className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white"
            >
              Add Step
            </button>
          </div>
        </Modal>
      )}

      {/* Order Update Modal + Steps Checklist */}
      {showOrderModal && (
        <Modal onClose={closeOrderModal}>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* LEFT: OrderUpdate view */}
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Order #{selectedOrder?.Order_Number}
              </h3>
              <OrderUpdate
                order={selectedOrder || {}}
                onClose={closeOrderModal}
                onSaved={async () => {
                  await fetchData();
                }}
              />
            </div>

            {/* RIGHT: Checklist */}
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Steps Checklist
              </h3>

              <div className="space-y-2 border border-gray-200 rounded p-3 max-h-[60vh] overflow-auto text-sm">
                {stepLabelOptions.length === 0 ? (
                  <div className="text-gray-500 text-sm">
                    No predefined steps found. You can still add steps from the
                    order card.
                  </div>
                ) : (
                  stepLabelOptions.map((lbl) => {
                    const checked = selectedStepLabels.has(lbl);
                    const busy = togglingLabel === lbl;
                    return (
                      <label
                        key={lbl}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={(e) => toggleStep(lbl, e.target.checked)}
                          disabled={busy}
                        />
                        <span className={busy ? "opacity-60" : ""}>{lbl}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/* -------- shared modal shell -------- */
function Modal({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
      aria-modal="true"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-6xl mx-4 relative max-h-[90vh] overflow-y-auto">
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
