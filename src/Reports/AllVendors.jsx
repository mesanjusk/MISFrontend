import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
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
  const [rawRows, setRawRows] = useState([]); // raw orders from backend
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
  const [selectedStepLabels, setSelectedStepLabels] = useState(new Set()); // local selection snapshot
  const [togglingLabel, setTogglingLabel] = useState(""); // show tiny spinner on that row

  // ---- API roots ----
  const ORDER_API = `/order`;
  const CUSTOMER_API = `/customer`;
  const RAW_ENDPOINT = `${ORDER_API}/allvendors-raw`;
  const TASKGROUPS_ENDPOINT = `/taskgroup/GetTaskgroupList`;

  // ---- Utils ----
  const isStepNeedingVendor = (st) => {
    const hasVendor = !!(st?.vendorId || st?.vendorCustomerUuid);
    const isPosted = !!st?.posting?.isPosted;
    return !hasVendor || !isPosted;
  };

  const computeProjectedRows = (docs, search) => {
    const text = (search || "").trim().toLowerCase();

    // keep only orders whose latest status is "delivered"
    const deliveredOnly = (Array.isArray(docs) ? docs : []).filter((o) => {
      if (!Array.isArray(o.Status) || o.Status.length === 0) return false;
      const latest = o.Status[o.Status.length - 1];
      return String(latest?.Task || "").trim().toLowerCase() === "delivered";
    });

    // search filter (order # / customer uuid / per-item remark)
    const filtered = text
      ? deliveredOnly.filter((o) => {
          const onum = String(o.Order_Number || "").toLowerCase();
          const cuid = String(o.Customer_uuid || "").toLowerCase();
          const anyRemarkText = String(o.RemarkText || buildRemarkFromItems(o)).toLowerCase();
          const anyItemRemark = (o.Items || []).some((it) =>
            String(it?.Remark || "").toLowerCase().includes(text)
          );
          return onum.includes(text) || cuid.includes(text) || anyRemarkText.includes(text) || anyItemRemark;
        })
      : deliveredOnly;

    // project pending steps + stable RemarkText
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
        axios.get(RAW_ENDPOINT, { params: { deliveredOnly: true } }),
        axios.get(`${CUSTOMER_API}/GetCustomersList`),
        axios.get(TASKGROUPS_ENDPOINT),
      ]);

      const docs = rawRes.data?.rows || [];
      setRawRows(Array.isArray(docs) ? docs : []);

      // Customers
      if (customersRes.data?.success && Array.isArray(customersRes.data.result)) {
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

      // Task groups
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
    // eslint-disable-next-line
  }, []);

  // derive vendor options
  const vendorOptions = useMemo(() => {
    const isOfficeVendor = (groupValue) => {
      if (!groupValue) return false;
      return norm(groupValue) === "office & vendor";
    };
    return customersList
      .filter((c) => isOfficeVendor(c.Customer_group || c.Group || c.group))
      .map((c) => ({ uuid: c.Customer_uuid, name: c.Customer_name }));
  }, [customersList]);

  // derive projected/filtered rows
  const rows = useMemo(() => computeProjectedRows(rawRows, searchText), [rawRows, searchText]);

  // add Customer_name for export/render
  const enriched = useMemo(
    () =>
      rows.map((order) => ({
        ...order,
        Customer_name: customersMap[order.Customer_uuid] || "Unknown",
      })),
    [rows, customersMap]
  );

  // ---------- Step choices (checkbox list) ----------
  // Use all task groups except delivered/cancel, de-duplicated by Task_group/Task_group_name
  const stepChoices = useMemo(() => {
    const names = new Set(
      (taskGroups || [])
        .map((tg) => (tg.Task_group_name || tg.Task_group || "").trim())
        .filter(Boolean)
        .filter((n) => !["delivered", "cancel"].includes(norm(n)))
    );
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [taskGroups]);

  /* ---------------- Assign Vendor ---------------- */
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
      await axios.post(`${ORDER_API}/orders/${orderId}/steps/${activeStep.stepId}/assign-vendor`, {
        vendorCustomerUuid: selectedVendorUuid,
        costAmount: amt,
        plannedDate,
        createdBy: localStorage.getItem("User_name") || "operator",
      });
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

  /* ---------------- Add Step ---------------- */
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
      newStepLabelChoice === "__CUSTOM__" ? newStepLabel.trim() : newStepLabelChoice;
    if (!resolvedLabel) return alert("Please choose a task or enter a custom label.");
    try {
      setLoading(true);
      const orderId = addStepOrder._id || addStepOrder.id;
      await axios.post(`${ORDER_API}/orders/${orderId}/steps`, {
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

  /* ---------------- OrderUpdate + Steps checklist ---------------- */
  const openOrderUpdate = (order) => {
    setSelectedOrder(order);

    // snapshot of currently present step labels in the order
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

  // helper to get stepId by label in current selectedOrder
  const getStepIdByLabel = (label) => {
    const l = (label || "").trim();
    const found = (selectedOrder?.Steps || []).find((s) => (s?.label || "").trim() === l);
    return found?._id || found?.id || null;
    };

  const refreshSelectedOrderFromStore = () => {
    if (!selectedOrder) return;
    const id = selectedOrder._id || selectedOrder.id || selectedOrder.Order_uuid;
    // find latest copy from rawRows after fetch
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

    // optimistic UI update
    setSelectedStepLabels((prev) => {
      const next = new Set(prev);
      if (checked) next.add(tidy);
      else next.delete(tidy);
      return next;
    });

    try {
      if (checked) {
        // ADD step
        await axios.post(`${ORDER_API}/orders/${orderId}/steps`, {
          label: tidy,
        });
      } else {
        // REMOVE step
        const stepId = getStepIdByLabel(tidy);
        if (stepId) {
          await axios.delete(`${ORDER_API}/orders/${orderId}/steps/${stepId}`);
        } else {
          // if we don't have id, fetch to resync (backend might already be in sync)
        }
      }

      // refresh data + keep modal in sync
      await fetchData();
      refreshSelectedOrderFromStore();
    } catch (e) {
      // revert on error
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

  /* ---------------- Export ---------------- */
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Order #", "Customer", "Step", "Vendor UUID", "Cost", "Posted?", "Remarks"];
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
          "Step": s.label,
          "Vendor UUID": s.vendorCustomerUuid || s.vendorId || "-",
          "Cost Amount": s.costAmount ?? 0,
          "Posted?": s.isPosted ? "Yes" : "No",
          "Remarks": remark,
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
      <div className="pt-14 pb-20 max-w-8xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between gap-2 mb-4 items-center">
          <form
            className="w-full max-w-md"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="text"
              placeholder="Search Order # / Customer UUID / Remark"
              className="form-control text-black bg-gray-100 rounded-full px-4 py-2 w-full"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </form>
          <div className="flex gap-2">
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              disabled={loading}
            >
              Export PDF
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={loading}
            >
              Export Excel
            </button>
          </div>
        </div>

        <main className="p-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-3">
            {loading ? (
              <div className="col-span-full text-center text-gray-500 py-10">Loading…</div>
            ) : enriched.length > 0 ? (
              enriched.map((order) => (
                <div
                  key={order._id || order.Order_Number}
                  className="relative bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition"
                >
                  {/* Edit icon — opens OrderUpdate + Steps checklist */}
                  <button
                    type="button"
                    className="absolute top-2 right-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-blue-600 text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      openOrderUpdate(order);
                    }}
                    title="Edit (Order Update)"
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

                  <div className="text-gray-900 font-bold text-lg">#{order.Order_Number}</div>
                  <div className="text-gray-700 font-medium">{order.Customer_name}</div>

                  {/* Remarks */}
                  <div className="text-sm text-gray-600 italic mt-1">
                    {order.RemarkText?.trim() || buildRemarkFromItems(order) || "-"}
                  </div>

                  <div className="mt-3 space-y-2">
                    {(order.StepsPending || []).map((s, idx) => (
                      <div
                        key={`${order._id || order.Order_Number}-${s.stepId || idx}`}
                        className="border rounded px-2 py-2 text-sm flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{s.label || "—"}</div>
                        </div>

                        <button
                          className="shrink-0 px-3 py-1 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700 disabled:opacity-50"
                          onClick={() => openAssignModal(order, s)}
                        >
                          {s.isPosted ? "Edit Vendor" : "+"}
                        </button>
                      </div>
                    ))}

                    <button
                      className="w-full mt-2 text-xs px-2 py-2 border rounded hover:bg-gray-50"
                      onClick={() => openAddStepModal(order)}
                    >
                      + Add Step
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-10">No vendor entries pending.</div>
            )}
          </div>
        </main>
      </div>

      {/* Assign Vendor Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                Assign Vendor & Post{activeStep?.label ? ` — ${activeStep.label}` : ""}
              </h3>
              <button onClick={closeAssignModal} className="text-gray-500 hover:text-black">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Step Name</label>
                <input className="w-full border rounded px-3 py-2 bg-gray-100" value={activeStep?.label || ""} readOnly />
              </div>
              <div>
                <label className="block text-sm mb-1">Select Vendor</label>
                <select
                  className="w-full border rounded px-3 py-2 bg-white"
                  value={selectedVendorUuid}
                  onChange={(e) => setSelectedVendorUuid(e.target.value)}
                >
                  <option value="">-- Choose vendor --</option>
                  {vendorOptions.map((v) => (
                    <option key={v.uuid} value={v.uuid}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Showing customers from group “Office & Vendor”.</p>
              </div>
              <div>
                <label className="block text-sm mb-1">Cost Amount (₹)</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={costAmount}
                  onChange={(e) => setCostAmount(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="px-3 py-2 border rounded" onClick={closeAssignModal}>
                Cancel
              </button>
              <button className="px-3 py-2 rounded bg-black text-white disabled:opacity-50" onClick={assignVendor} disabled={loading}>
                Save & Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Step Modal */}
      {showAddStepModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Add Step to Order #{addStepOrder?.Order_Number}</h3>
              <button onClick={closeAddStepModal} className="text-gray-500 hover:text-black">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Step Label</label>
                <select
                  className="w-full border rounded px-3 py-2 bg-white"
                  value={newStepLabelChoice}
                  onChange={(e) => setNewStepLabelChoice(e.target.value)}
                >
                  <option value="">-- Choose task --</option>
                  {stepChoices.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  <option value="__CUSTOM__">Custom…</option>
                </select>

                {newStepLabelChoice === "__CUSTOM__" && (
                  <input
                    className="mt-2 w-full border rounded px-3 py-2"
                    value={newStepLabel}
                    onChange={(e) => setNewStepLabel(e.target.value)}
                    placeholder="Enter custom step label"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm mb-1">Select Vendor (optional)</label>
                <select
                  className="w-full border rounded px-3 py-2 bg-white"
                  value={newStepVendorUuid}
                  onChange={(e) => setNewStepVendorUuid(e.target.value)}
                >
                  <option value="">-- Choose vendor --</option>
                  {vendorOptions.map((v) => (
                    <option key={v.uuid} value={v.uuid}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Only “Office & Vendor” group is listed.</p>
              </div>

              <div>
                <label className="block text-sm mb-1">Estimated Cost (₹, optional)</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={newStepCost}
                  onChange={(e) => setNewStepCost(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Planned Date (optional)</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={newStepPlannedDate}
                  onChange={(e) => setNewStepPlannedDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="px-3 py-2 border rounded" onClick={closeAddStepModal}>
                Cancel
              </button>
              <button className="px-3 py-2 rounded bg-black text-white disabled:opacity-50" onClick={addStep} disabled={loading}>
                Add Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OrderUpdate modal WITH steps checklist */}
      {showOrderModal && selectedOrder && (
        <Modal onClose={closeOrderModal}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Left: your existing OrderUpdate UI */}
            <div className="lg:col-span-3">
              <OrderUpdate order={selectedOrder} onClose={closeOrderModal} />
            </div>

            {/* Right: Steps checklist */}
            <div className="lg:col-span-2">
              <div className="border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Steps</h4>
                  {togglingLabel ? (
                    <span className="text-xs text-gray-500">Updating…</span>
                  ) : null}
                </div>
                <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-2">
                  {stepChoices.length === 0 ? (
                    <div className="text-sm text-gray-500">No steps found.</div>
                  ) : (
                    stepChoices.map((name) => {
                      const checked = selectedStepLabels.has(name);
                      const busy = togglingLabel === name;
                      return (
                        <label
                          key={name}
                          className="flex items-center gap-2 text-sm border rounded px-2 py-1 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={checked}
                            onChange={(e) => toggleStep(name, e.target.checked)}
                            disabled={busy}
                          />
                          <span className="flex-1">{name}</span>
                          {busy && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="w-4 h-4 animate-spin"
                            >
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" />
                            </svg>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
                <p className="mt-2 text-[11px] text-gray-500">
                  Check to add a step; uncheck to remove it. “Delivered” and “Cancel” are hidden.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/* Reusable Modal (same look/logic as AllOrder) */
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
