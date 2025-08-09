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
  const [rows, setRows] = useState([]);
  const [customersMap, setCustomersMap] = useState({});
  const [customersList, setCustomersList] = useState([]);

  // UI / search
  const [searchOrder, setSearchOrder] = useState("");
  const [loading, setLoading] = useState(false);

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeStep, setActiveStep] = useState(null);

  // Assign form (vendor + amount + date + taskgroup step)
  const [selectedVendorUuid, setSelectedVendorUuid] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [plannedDate, setPlannedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  // Taskgroup steps
  const [taskStepOptions, setTaskStepOptions] = useState([]); // array of strings (labels)
  const [selectedStepLabel, setSelectedStepLabel] = useState("");

  // ---- API roots (Vite-first, CRA fallback) ----
  const API_BASE = useMemo(() => {
    const vite = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) || "";
    const cra  = (typeof process !== "undefined" && process.env && process.env.REACT_APP_API) || "";
    const raw = vite || cra || "";
    return String(raw).replace(/\/$/, "");
  }, []);
  const ORDER_API = `${API_BASE}/order`;
  const CUSTOMER_API = `${API_BASE}/customer`;
  const VENDORS_ENDPOINT = `${ORDER_API}/allvendors`;

  // Common taskgroup endpoints we’ve used in this project
  const TASKGROUP_ENDPOINTS = [
    `${API_BASE}/taskgroup/with-steps`,
    `${API_BASE}/taskgroup/withUsage`,
    `${API_BASE}/taskgroup/GetTaskgroupList`,
    `${API_BASE}/taskgroup/list`,
    `${API_BASE}/taskgroup`
  ];

  // Fetch Taskgroups → flatten to unique step labels
  const fetchTaskSteps = async () => {
    for (const url of TASKGROUP_ENDPOINTS) {
      try {
        const res = await axios.get(url);
        const data = res?.data;
        if (!data) continue;

        const groups = Array.isArray(data?.result) ? data.result
                    : Array.isArray(data?.groups) ? data.groups
                    : Array.isArray(data) ? data
                    : [];

        const labels = new Set();
        groups.forEach((g) => {
          const steps = g?.Steps || g?.steps || g?.stepList || [];
          if (Array.isArray(steps)) {
            steps.forEach((s) => {
              const lbl = s?.label || s?.name || s?.Step || s?.Title || s?.title;
              if (lbl && String(lbl).trim()) labels.add(String(lbl).trim());
            });
          } else if (typeof g?.steps === "string") {
            g.steps.split(",").map(x => x.trim()).forEach(x => x && labels.add(x));
          }
        });

        const list = Array.from(labels);
        if (list.length) {
          setTaskStepOptions(list.sort());
          return;
        }
      } catch {
        // try next endpoint
      }
    }
    setTaskStepOptions([]); // none matched → allow free‑text fallback
  };

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const [vendorsRes, customersRes] = await Promise.all([
        axios.get(VENDORS_ENDPOINT, { params }),
        axios.get(`${CUSTOMER_API}/GetCustomersList`)
      ]);

      const vendorRows = vendorsRes.data?.rows || vendorsRes.data || [];
      setRows(Array.isArray(vendorRows) ? vendorRows : []);

      if (customersRes.data?.success && Array.isArray(customersRes.data.result)) {
        const list = customersRes.data.result;
        setCustomersList(list);
        const map = list.reduce((acc, c) => {
          if (c.Customer_uuid && c.Customer_name) acc[c.Customer_uuid] = c.Customer_name;
          return acc;
        }, {});
        setCustomersMap(map);
      } else {
        setCustomersList([]);
        setCustomersMap({});
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      alert(err?.response?.data?.error || "Failed to load vendor list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTaskSteps();
    // eslint-disable-next-line
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    fetchData({ search: searchOrder.trim() || undefined });
  };

  const openAssignModal = (order, step) => {
    setActiveOrder(order);
    setActiveStep(step);

    setSelectedVendorUuid(step.vendorCustomerUuid || "");
    setCostAmount(step.costAmount ?? "");
    const d = step.plannedDate ? new Date(step.plannedDate) : new Date();
    setPlannedDate(d.toISOString().slice(0, 10));

    // Preselect dropdown to current label (if any)
    setSelectedStepLabel(step?.label || "");

    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setActiveOrder(null);
    setActiveStep(null);
    setSelectedVendorUuid("");
    setCostAmount("");
    const d = new Date();
    setPlannedDate(d.toISOString().slice(0, 10));
    setSelectedStepLabel("");
  };

  // Vendor dropdown: ONLY group === "Office & Vendor"
  const vendorOptions = useMemo(() => {
    const isOfficeVendor = (groupValue) => {
      if (!groupValue) return false;
      return String(groupValue).trim().toLowerCase() === "office & vendor";
    };
    return customersList
      .filter(c => isOfficeVendor(c.Customer_group || c.Group || c.group))
      .map(c => ({ uuid: c.Customer_uuid, name: c.Customer_name }));
  }, [customersList]);

  const assignVendor = async () => {
    if (!activeOrder || !activeStep) return;

    const label = (selectedStepLabel || "").trim();
    if (!label) {
      alert("Please choose a Step from Taskgroups (or type one).");
      return;
    }
    if (!selectedVendorUuid) {
      alert("Please choose a vendor from the list.");
      return;
    }
    const amt = Number(costAmount || 0);
    if (Number.isNaN(amt) || amt < 0) {
      alert("Invalid cost amount");
      return;
    }
    if (!plannedDate) {
      alert("Please select a date");
      return;
    }

    try {
      setLoading(true);
      const orderId = activeOrder._id || activeOrder.id;
      const stepId = activeStep.stepId ?? activeStep._id ?? "";

      await axios.post(
        `${ORDER_API}/orders/${orderId}/steps/${stepId}/assign-vendor`,
        {
          vendorCustomerUuid: selectedVendorUuid,
          costAmount: amt,
          plannedDate, // YYYY-MM-DD
          createdBy: localStorage.getItem("User_name") || "operator",
          label // send standardized step label
        }
      );

      closeAssignModal();
      fetchData({ search: searchOrder.trim() || undefined });
      alert("Vendor assigned & transaction posted.");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "Failed to assign vendor");
    } finally {
      setLoading(false);
    }
  };

  const enriched = rows.map((order) => ({
    ...order,
    Customer_name: customersMap[order.Customer_uuid] || "Unknown"
  }));

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Order #", "Customer", "Step", "Vendor UUID", "Cost", "Posted?"];
    const tableRows = [];

    enriched.forEach((order) => {
      (order.StepsPending || []).forEach((s) => {
        tableRows.push([
          order.Order_Number,
          order.Customer_name,
          s.label,
          s.vendorCustomerUuid || s.vendorId || "-",
          s.costAmount ?? 0,
          s.isPosted ? "Yes" : "No"
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
      (order.StepsPending || []).forEach((s) => {
        data.push({
          "Order Number": order.Order_Number,
          "Customer Name": order.Customer_name,
          Step: s.label,
          "Vendor UUID": s.vendorCustomerUuid || s.vendorId || "-",
          "Cost Amount": s.costAmount ?? 0,
          "Posted?": s.isPosted ? "Yes" : "No",
          Remark: order.Remark || "-"
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
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
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

        <main className="p-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
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
                    {order.Remark || "-"}
                  </div>

                  <div className="mt-3 space-y-2">
                    {(order.StepsPending || []).map((s, i) => (
                      <div
                        key={`${order._id || order.Order_Number}-${s.stepId || i}`}
                        className="border rounded px-2 py-2 text-sm flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold truncate">
                            Step: {s.label || "—"}
                          </div>
                          <div className={`text-xs ${s.isPosted ? "text-green-600" : "text-amber-600"}`}>
                            {s.isPosted ? "Posted" : "Not Posted"}
                          </div>
                        </div>

                        <button
                          className="shrink-0 px-3 py-1 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700 disabled:opacity-50"
                          onClick={() => openAssignModal(order, s)}
                          title={s.isPosted ? "Edit Vendor" : "Assign & Post"}
                        >
                          {s.isPosted ? "Edit Vendor" : "+"}
                        </button>
                      </div>
                    ))}
                    {(order.StepsPending || []).length === 0 && (
                      <div className="text-gray-400 text-sm">No pending steps</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-10">
                No vendor entries pending.
              </div>
            )}
          </div>
        </main>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                {activeStep?.isPosted ? "Edit Vendor" : "Assign Vendor & Post"}
                {activeStep?.label ? ` — ${activeStep.label}` : ""}
              </h3>
              <button onClick={closeAssignModal} className="text-gray-500 hover:text-black">✕</button>
            </div>

            <div className="space-y-3">
              {/* Step selection from Taskgroups */}
              <div>
                <label className="block text-sm mb-1">Step (from Taskgroups)</label>
                {taskStepOptions.length ? (
                  <select
                    className="w-full border rounded px-3 py-2 bg-white"
                    value={selectedStepLabel}
                    onChange={(e) => setSelectedStepLabel(e.target.value)}
                  >
                    <option value="">-- Choose step --</option>
                    {taskStepOptions.map(lbl => (
                      <option key={lbl} value={lbl}>{lbl}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="Type step name"
                    value={selectedStepLabel}
                    onChange={(e) => setSelectedStepLabel(e.target.value)}
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Pick a standardized step from your Taskgroups. If none are loaded, you can type one.
                </p>
              </div>

              {/* Vendor dropdown (Office & Vendor group only) */}
              <div>
                <label className="block text-sm mb-1">Select Vendor</label>
                <select
                  className="w-full border rounded px-3 py-2 bg-white"
                  value={selectedVendorUuid}
                  onChange={(e) => setSelectedVendorUuid(e.target.value)}
                >
                  <option value="">-- Choose vendor --</option>
                  {vendorOptions.map(v => (
                    <option key={v.uuid} value={v.uuid}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Showing customers from group “Office & Vendor”.
                </p>
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
              <button className="px-3 py-2 border rounded" onClick={closeAssignModal}>Cancel</button>
              <button
                className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
                onClick={assignVendor}
                disabled={loading}
              >
                Save & Post
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
