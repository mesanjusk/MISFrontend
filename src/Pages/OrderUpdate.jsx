/* eslint-disable react/prop-types */
// src/Pages/OrderUpdate.jsx
import { useState, useEffect, useMemo } from "react";
import axios from "../apiClient.js";
import toast from "react-hot-toast";

import OrderHeader from "../Components/OrderHeader";
import StatusTable from "../Components/StatusTable";
import InvoiceModal from "../Components/InvoiceModal";
import InvoicePreview from "../Components/InvoicePreview";

function toYmd(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
const norm = (s) => String(s || "").trim().toLowerCase();

export default function OrderUpdate({
  order = {},
  onClose = () => {},
  // NEW: parent state updaters (AllOrder passes these)
  onOrderPatched = () => {},
  onOrderReplaced = () => {},
}) {
  const [notes, setNotes] = useState([]);
  const [taskGroups, setTaskGroups] = useState([]); // [{ Id, Task_group_uuid, Task_group_name || Task_group }]
  const [selectedTaskGroups, setSelectedTaskGroups] = useState([]); // uuids that are ON
  const [taskOptions, setTaskOptions] = useState([]); // for "Task" dropdown (ALL groups)
  const [isAdvanceChecked, setIsAdvanceChecked] = useState(false);
  const [busyStep, setBusyStep] = useState({}); // { uuid: true } while toggling
  const [saving, setSaving] = useState(false);

  // Invoice modal state
  const [showInvoice, setShowInvoice] = useState(false);

  const [values, setValues] = useState({
    id: order?._id || "",
    Customer_name: order?.Customer_name || "",
    Order_uuid: order?.Order_uuid || "",
    Order_Number: order?.Order_Number || "",
    Customer_uuid: order?.Customer_uuid || "",
    Remark: order?.Remark || "",
    Delivery_Date: toYmd(order?.highestStatusTask?.Delivery_Date) || "",
    Task: order?.highestStatusTask?.Task || "",
    CreatedAt: toYmd(order?.highestStatusTask?.CreatedAt) || toYmd(new Date()),
    Status: Array.isArray(order?.Status) ? order.Status : [],
    Steps: Array.isArray(order?.Steps) ? order.Steps : [],
    Items: Array.isArray(order?.Items) ? order.Items : [],
  });

  /* ---------------- Load ALL task groups ---------------- */
  useEffect(() => {
    let mounted = true;
    axios
      .get("/taskgroup/GetTaskgroupList")
      .then((res) => {
        if (!mounted) return;
        if (!res.data?.success) {
          setTaskGroups([]);
          setTaskOptions(["Packing", "Delivery", "Billing"]);
          return;
        }
        const groups = res.data.result || [];
        setTaskGroups(groups);
        const opts =
          groups
            .map((tg) => tg.Task_group_name || tg.Task_group)
            .filter(Boolean) || [];
        setTaskOptions(opts.length ? opts : ["Packing", "Delivery", "Billing"]);
      })
      .catch(() => {
        if (!mounted) return;
        setTaskGroups([]);
        setTaskOptions(["Packing", "Delivery", "Billing"]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------------- Notes for this order ---------------- */
  useEffect(() => {
    if (!values.Order_uuid) return setNotes([]);
    let mounted = true;
    axios
      .get(`/note/${values.Order_uuid}`)
      .then((res) => {
        if (!mounted) return;
        setNotes(res.data?.success ? res.data.result : []);
      })
      .catch(() => {
        if (!mounted) return;
        setNotes([]);
      });
    return () => {
      mounted = false;
    };
  }, [values.Order_uuid]);

  /* ---------------- Item Remarks just below the name ---------------- */
  const itemRemarks = useMemo(() => {
    const items = Array.isArray(values.Items) ? values.Items : [];
    return items
      .map((it, idx) => {
        const itemName =
          String(it?.Item ?? it?.item ?? "").trim() || `Item ${idx + 1}`;
        const remark = String(it?.Remark ?? it?.remark ?? "").trim();
        return remark ? { itemName, remark } : null;
      })
      .filter(Boolean);
  }, [values.Items]);

  /* ---------------- PRE-SELECT steps from DB (uuid or normalized label) ---------------- */
  useEffect(() => {
    const groups = (taskGroups || []).filter((tg) => Number(tg.Id) === 1);
    const steps = Array.isArray(values.Steps) ? values.Steps : [];

    if (!groups.length || !steps.length) {
      setSelectedTaskGroups([]);
      return;
    }

    const stepUuidSet = new Set(
      steps
        .map((s) => String(s?.uuid || s?.Task_group_uuid || s?._id || "").trim())
        .filter(Boolean)
    );

    const stepLabelNormSet = new Set(
      steps
        .map((s) =>
          norm(
            s?.label ||
              s?.Task_group_name ||
              s?.Task_group ||
              s?.normLabel ||
              ""
          )
        )
        .filter(Boolean)
    );

    const preselected = [];
    for (const tg of groups) {
      const uuid = String(tg.Task_group_uuid || "").trim();
      if (!uuid) continue;
      const lblNorm = norm(tg.Task_group_name || tg.Task_group || "");
      if (stepUuidSet.has(uuid) || stepLabelNormSet.has(lblNorm)) {
        preselected.push(uuid);
      }
    }

    setSelectedTaskGroups(preselected);
  }, [taskGroups, values.Steps]);

  /* ---------------- Handlers ---------------- */
  const handleChangeTask = (task) => {
    setValues((prev) => ({ ...prev, Task: task }));
  };

  const handleAdvanceCheckboxChange = () => {
    setIsAdvanceChecked((prev) => {
      const next = !prev;
      setValues((v) => ({
        ...v,
        Delivery_Date: next ? v.Delivery_Date || toYmd(new Date()) : "",
      }));
      return next;
    });
  };

  // 🔁 Toggle a single step immediately: add on check, remove on uncheck (DB writes)
  const toggleStep = async (tg) => {
    const uuid = tg.Task_group_uuid;
    if (!uuid || busyStep[uuid]) return;

    const label = tg.Task_group_name || tg.Task_group || "Unnamed Group";
    const willCheck = !selectedTaskGroups.includes(uuid);

    // Optimistic UI
    setBusyStep((b) => ({ ...b, [uuid]: true }));
    setSelectedTaskGroups((prev) =>
      willCheck ? [...prev, uuid] : prev.filter((id) => id !== uuid)
    );

    try {
      await axios.post("/order/steps/toggle", {
        orderId: values.id,
        step: { uuid, label },
        checked: willCheck,
      });

      // Keep local Steps mirror in sync for UI
      setValues((v) => {
        const curr = Array.isArray(v.Steps) ? v.Steps : [];
        if (willCheck) {
          if (
            !curr.some(
              (s) =>
                (s?.uuid || s?.Task_group_uuid) === uuid ||
                norm(s?.label) === norm(label)
            )
          ) {
            return { ...v, Steps: [...curr, { uuid, label }] };
          }
          return v;
        }
        return {
          ...v,
          Steps: curr.filter(
            (s) =>
              (s?.uuid || s?.Task_group_uuid) !== uuid &&
              norm(s?.label || s?.Task_group_name || s?.Task_group) !==
                norm(label)
          ),
        };
      });
    } catch (err) {
      // Revert on failure
      setSelectedTaskGroups((prev) =>
        willCheck ? prev.filter((id) => id !== uuid) : [...prev, uuid]
      );
      console.error("toggleStep error:", err);
      toast.error("Failed to update step. Please try again.");
    } finally {
      setBusyStep((b) => ({ ...b, [uuid]: false }));
    }
  };

  const canSubmit = useMemo(() => Boolean(values.Task), [values.Task]);

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!canSubmit || saving) return;

    setSaving(true);
    const today = toYmd(new Date());

    try {
      const payload = {
        orderId: values.id,
        newStatus: {
          Task: values.Task,
          Delivery_Date: values.Delivery_Date || today,
          CreatedAt: new Date().toISOString(),
        },
      };

      const res = await axios.post("/order/addStatus", payload);
      const success = Boolean(res?.data?.success);

      if (!success) {
        toast.error("Update failed.");
        setSaving(false);
        return;
      }

      // Prefer backend-updated order when available
      const updatedOrder =
        res.data?.result ||
        res.data?.order ||
        res.data?.updated ||
        res.data?.data?.order ||
        null;

      if (updatedOrder) {
        // Full replace (parent will diff/merge)
        onOrderReplaced(updatedOrder);
      } else {
        // Fallback: patch locally
        const currentMax =
          Number(order?.highestStatusTask?.Status_number) ||
          Math.max(
            0,
            ...(Array.isArray(values.Status)
              ? values.Status.map((s) => Number(s?.Status_number) || 0)
              : [0])
          );

        const newStatus = {
          ...payload.newStatus,
          Status_number: currentMax + 1,
        };

        const nextStatusArr = [...(values.Status || []), newStatus];
        const orderKey = values.Order_uuid || values.id || order._id;

        onOrderPatched(orderKey, {
          Status: nextStatusArr,
          highestStatusTask: newStatus,
        });
      }

      // Update our local state so UI reflects instantly inside modal too
      setValues((v) => {
        const currentMax =
          Math.max(
            0,
            ...(Array.isArray(v.Status)
              ? v.Status.map((s) => Number(s?.Status_number) || 0)
              : [0])
          ) + 1;
        const newStatusLocal = {
          ...payload.newStatus,
          Status_number: currentMax,
        };
        return {
          ...v,
          Status: [...(v.Status || []), newStatusLocal],
        };
      });

      toast.success("Order updated successfully.");
      onClose?.(); // close modal — parent list is already updated; NO reload.
    } catch (err) {
      console.error("Error updating order:", err);
      toast.error("Error updating order.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- Invoice modal controls ---------------- */
  const openInvoice = () => setShowInvoice(true);
  const closeInvoice = () => setShowInvoice(false);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center overflow-auto">
      {/* Modal container: bounded height + internal scroll */}
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl relative max-h-[90vh] overflow-hidden">
        {/* Close button (stays visible due to sticky header wrap) */}
        <button
          className="absolute right-2 top-2 text-xl text-gray-400 hover:text-blue-500"
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          ×
        </button>

        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white rounded-t-xl pt-6 px-6 pb-3 border-b">
          <OrderHeader values={values} notes={notes} />

          {/* Item Remarks (from Items[].Remark) */}
          {itemRemarks.length > 0 && (
            <div className="mt-3">
              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                {itemRemarks.map((r, i) => (
                  <li key={i}>
                    <span className="font-medium">{r.itemName}:</span> {r.remark}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-6 pb-6 pt-4 max-h-[calc(90vh-140px)]">
          {/* Status Table */}
          <StatusTable status={values.Status} />

          {/* Update Form */}
          <form onSubmit={handleSaveChanges} className="space-y-4 mt-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Update Job Status
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                value={values.Task}
                onChange={(e) => handleChangeTask(e.target.value)}
              >
                <option value="">Select Task</option>
                {taskOptions.map((option, i) => (
                  <option key={i} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="advanceCheckbox"
                checked={isAdvanceChecked}
                onChange={handleAdvanceCheckboxChange}
                className="h-4 w-4 text-[#25d366] focus:ring-[#25d366] border-gray-300 rounded"
              />
              <label htmlFor="advanceCheckbox" className="text-gray-700">
                Update Date
              </label>
            </div>

            {isAdvanceChecked && (
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Delivery Date
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                  value={values.Delivery_Date}
                  onChange={(e) =>
                    setValues({ ...values, Delivery_Date: e.target.value })
                  }
                />
              </div>
            )}

            {/* Steps (Task Groups) — ONLY Id === 1, pre-selected from DB */}
            <div>
              <label className="block mb-1 font-medium">Steps</label>
              <div className="flex flex-wrap gap-2">
                {taskGroups
                  .filter((tg) => Number(tg.Id) === 1)
                  .map((tg) => {
                    const name =
                      tg.Task_group_name || tg.Task_group || "Unnamed Group";
                    const uuid = tg.Task_group_uuid;
                    const checked = selectedTaskGroups.includes(uuid);
                    const loading = !!busyStep[uuid];

                    return (
                      <label
                        key={uuid}
                        className={`flex items-center gap-2 border px-2 py-1 rounded-md shadow-sm ${
                          loading ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => !loading && toggleStep(tg)}
                          className="accent-[#25D366]"
                          disabled={loading}
                        />
                        <span>{name}</span>
                      </label>
                    );
                  })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Already-saved steps are preselected. Checking/unchecking writes
                to the database immediately.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!canSubmit || saving}
                className={`flex-1 text-white font-medium py-2 rounded-lg transition ${
                  canSubmit && !saving
                    ? "bg-[#25d366] hover:bg-[#128c7e]"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {saving ? "Updating..." : "Update Status"}
              </button>

              {/* Preview Invoice button */}
              <button
                type="button"
                onClick={openInvoice}
                className="flex-1 border border-gray-300 hover:border-[#25d366] text-gray-700 hover:text-[#128c7e] font-medium py-2 rounded-lg transition"
              >
                Preview Invoice
              </button>
            </div>
          </form>
        </div>

        {/* Invoice Modal */}
        <InvoiceModal open={showInvoice} onClose={closeInvoice}>
          <InvoicePreview
            order={{
              ...order,
              // keep latest values overrides
              Status: values.Status,
              Items: values.Items,
              Customer_name: values.Customer_name,
              Order_Number: values.Order_Number,
              Order_uuid: values.Order_uuid,
              Customer_uuid: values.Customer_uuid,
            }}
            onClose={closeInvoice}
          />
        </InvoiceModal>
      </div>
    </div>
  );
}
