import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function AllVendors() {
  const navigate = useNavigate();

  // Data
  const [rawRows, setRawRows] = useState([]);         // raw orders from backend
  const [rows, setRows] = useState([]);               // filtered + projected
  const [customersMap, setCustomersMap] = useState({});
  const [customersList, setCustomersList] = useState([]);

  // UI / search
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeStep, setActiveStep] = useState(null);

  // Assign form
  const [selectedVendorUuid, setSelectedVendorUuid] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [plannedDate, setPlannedDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Add Step modal
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [taskGroups, setTaskGroups] = useState([]);              // [{ id, name }]
  const [newStepLabelChoice, setNewStepLabelChoice] = useState(""); // dropdown selection
  const [addStepOrder, setAddStepOrder] = useState(null);
  const [newStepLabel, setNewStepLabel] = useState("");
  const [newStepVendorUuid, setNewStepVendorUuid] = useState("");
  const [newStepCost, setNewStepCost] = useState("");
  const [newStepPlannedDate, setNewStepPlannedDate] = useState(() => new Date().toISOString().slice(0, 10));

  // ---- API roots (Vite-first, CRA fallback) ----
  const API_BASE = useMemo(() => {
    const vite = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) || "";
    const cra = (typeof process !== "undefined" && process.env && process.env.REACT_APP_API) || "";
    const raw = vite || cra || "";
    return String(raw).replace(/\/$/, "");
  }, []);

  const ORDER_API = `${API_BASE}/order`;
  const CUSTOMER_API = `${API_BASE}/customer`;
  const RAW_ENDPOINT = `${ORDER_API}/allvendors-raw`;
  const TASKGROUPS_ENDPOINT = `${API_BASE}/taskgroup/GetTaskgroupList`;

  // ---- Utils ----
  const isStepNeedingVendor = (st) => {
    const hasVendor = !!(st?.vendorId || st?.vendorCustomerUuid);
    const isPosted = !!st?.posting?.isPosted;
    return !hasVendor || !isPosted;
  };

  // NEW: combine per-item remarks for an order
 const getOrderRemark = (order) => {
    const perItem = (order?.Items || [])
      .map((it) => String(it?.Remark || "").trim())
      .filter(Boolean);
    // Legacy order-level Remark (older docs)
    const legacy = String(order?.Remark || "").trim();
    return [...perItem, legacy].filter(Boolean).join(" | ");
  };

  const computeProjectedRows = (docs, search) => {
    const text = (search || "").trim().toLowerCase();

    // keep only orders whose latest status is "delivered"
    const deliveredOnly = (Array.isArray(docs) ? docs : []).filter((o) => {
      if (!Array.isArray(o.Status) || o.Status.length === 0) return false;
      const latest = o.Status[o.Status.length - 1];
      return latest?.Task?.trim().toLowerCase() === "delivered";
    });

    // search filter (order # / customer uuid / per-item remark)
    const filtered = text
      ? deliveredOnly.filter((o) => {
          const onum = String(o.Order_Number || "").toLowerCase();
          const cuid = String(o.Customer_uuid || "").toLowerCase();
          const anyRemark = (o.Items || []).some((it) =>
            String(it?.Remark || "").toLowerCase().includes(text)
          );
          return onum.includes(text) || cuid.includes(text) || anyRemark;
        })
      : deliveredOnly;

    // project pending steps
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

        return { ...o, StepsPending: pending };
      })
      .filter((o) => (o.StepsPending || []).length > 0)
      .sort((a, b) => (b.Order_Number || 0) - (a.Order_Number || 0));
  };

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

      // Task groups (Id === 1 only)
      const tgItems = Array.isArray(tgRes?.data?.result) ? tgRes.data.result : [];
      const filteredGroups = tgItems.filter((tg) => Number(tg?.Id) === 1);
      setTaskGroups(filteredGroups);

      // Initial projection
      setRows(computeProjectedRows(docs, ""));
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

  const onSearch = (e) => {
    e.preventDefault();
    setRows(computeProjectedRows(rawRows, searchText));
  };

  const vendorOptions = useMemo(() => {
    const isOfficeVendor = (groupValue) => {
      if (!groupValue) return false;
      return String(groupValue).trim().toLowerCase() === "office & vendor";
      // or loosen:
      // const g = String(groupValue || "").toLowerCase();
      // return g.includes("office") && g.includes("vendor");
    };
    return customersList
      .filter((c) => isOfficeVendor(c.Customer_group || c.Group || c.group))
      .map((c) => ({ uuid: c.Customer_uuid, name: c.Customer_name }));
  }, [customersList]);

  /* ---------------- Assign Vendor ---------------- */
  const openAssignModal = (order, step) => {
    setActiveOrder(order);
    setActiveStep(step);
    setSelectedVendorUuid(step.vendorCustomerUuid || step.vendorId || "");
    setCostAmount(step.costAmount ?? "");
    const d = step.plannedDate ? new Date(step.plannedDate) : new Date();
    setPlannedDate(d.toISOString().slice(0, 10));
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setActiveOrder(null);
    setActiveStep(null);
    setSelectedVendorUuid("");
    setCostAmount("");
    setPlannedDate(new Date().toISOString().slice(0, 10));
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
      setRows(computeProjectedRows(rawRows, searchText));
      alert("Vendor assigned & transaction posted.");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "Failed to assign vendor");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Add Step (missing steps) ---------------- */
  const openAddStepModal = (order) => {
    setAddStepOrder(order);
    setNewStepLabel("");
    setNewStepVendorUuid("");
    setNewStepCost("");
    setNewStepPlannedDate(new Date().toISOString().slice(0, 10));
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

    // Resolve final label from dropdown or custom input
    const resolvedLabel =
      newStepLabelChoice === "__CUSTOM__"
        ? newStepLabel.trim()
        : newStepLabelChoice;

    if (!resolvedLabel) {
      return alert("Please choose a task or enter a custom label.");
    }

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
      setRows(computeProjectedRows(rawRows, searchText));
      alert("Step added.");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "Failed to add step");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Export ---------------- */
  const enriched = rows.map((order) => ({
    ...order,
    Customer_name: customersMap[order.Customer_uuid] || "Unknown",
  }));

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Order #", "Customer", "Step", "Vendor UUID", "Cost", "Posted?", "Remarks"];
    const tableRows = [];

    enriched.forEach((order) => {
      const remark = getOrderRemark(order) || "-";
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
      const remark = getOrderRemark(order) || "-";
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
          <form className="w-full max-w-md" onSubmit={onSearch}>
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
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
                  <div className="text-gray-900 font-bold text-lg">#{order.Order_Number}</div>
                  <div className="text-gray-700 font-medium">{order.Customer_name}</div>
                  <div className="text-sm text-gray-600 italic mt-1">
                    {getOrderRemark(order) || "-"}
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
              {/* Step Label (Task Group dropdown + optional custom) */}
              <div>
                <label className="block text-sm mb-1">Step Label</label>
                <select
                  className="w-full border rounded px-3 py-2 bg-white"
                  value={newStepLabelChoice}
                  onChange={(e) => setNewStepLabelChoice(e.target.value)}
                >
                  <option value="">-- Choose task --</option>
                  {taskGroups.map((tg) => (
                    <option
                      key={tg.Task_group_uuid || tg._id}
                      value={(tg.Task_group || "").trim()}
                    >
                      {tg.Task_group_name || tg.Task_group || "Unnamed Group"}
                    </option>
                  ))}
                  {/* NEW: explicit Custom option */}
                  
                </select>

                
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
    </>
  );
}
