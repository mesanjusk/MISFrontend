/* eslint-disable react/prop-types */
// src/Pages/OrderUpdate.jsx
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

export default function OrderUpdate({ order = {}, onClose = () => {} }) {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [taskGroups, setTaskGroups] = useState([]); // [{ Id, Task_group_uuid, Task_group_name || Task_group }]
  const [selectedTaskGroups, setSelectedTaskGroups] = useState([]); // uuids currently ON (no preselect)
  const [taskOptions, setTaskOptions] = useState([]); // for "Task" dropdown (ALL groups)
  const [userOptions, setUserOptions] = useState({}); // { TaskName: [usernames] }
  const [isAdvanceChecked, setIsAdvanceChecked] = useState(false);
  const [busyStep, setBusyStep] = useState({}); // { uuid: true } while toggling

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
    Assigned: order?.highestStatusTask?.Assigned || "",
    Task: order?.highestStatusTask?.Task || "",
    CreatedAt: toYmd(order?.highestStatusTask?.CreatedAt) || toYmd(new Date()),
    Status: Array.isArray(order?.Status) ? order.Status : [],
    Steps: Array.isArray(order?.Steps) ? order.Steps : [], // saved steps on the order
    Items: Array.isArray(order?.Items) ? order.Items : [], // used by invoice preview
  });

  /* ---------------- Load ALL task groups (no Id filter for dropdown) ---------------- */
  useEffect(() => {
    axios
      .get("/taskgroup/GetTaskgroupList")
      .then((res) => {
        if (!res.data?.success) {
          setTaskGroups([]);
          setTaskOptions(["Packing", "Delivery", "Billing"]);
          return;
        }
        const groups = res.data.result || [];
        setTaskGroups(groups);

        // Build Task dropdown using ALL groups (no Id === 1 filter here)
        const opts =
          groups
            .map((tg) => tg.Task_group_name || tg.Task_group)
            .filter(Boolean) || [];
        setTaskOptions(opts.length ? opts : ["Packing", "Delivery", "Billing"]);
      })
      .catch(() => {
        setTaskGroups([]);
        setTaskOptions(["Packing", "Delivery", "Billing"]);
      });
  }, []);

  /* ---------------- Users by Allowed_Task_Groups -> map to task name ---------------- */
  useEffect(() => {
    axios
      .get("/user/GetUserList")
      .then((res) => {
        if (!res.data?.success) return setUserOptions({});
        const list = res.data.result || [];
        const map = {};
        list.forEach((u) => {
          const allowed = Array.isArray(u.Allowed_Task_Groups)
            ? u.Allowed_Task_Groups
            : [];
          allowed.forEach((groupName) => {
            if (!map[groupName]) map[groupName] = [];
            map[groupName].push(u.User_name);
          });
        });
        setUserOptions(map);
      })
      .catch(() => setUserOptions({}));
  }, []);

  /* ---------------- ❌ Removed pre-check of steps ---------------- */

  /* ---------------- Notes for this order ---------------- */
  useEffect(() => {
    if (!values.Order_uuid) return setNotes([]);
    axios
      .get(`/note/${values.Order_uuid}`)
      .then((res) => setNotes(res.data?.success ? res.data.result : []))
      .catch(() => setNotes([]));
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

  /* ---------------- Handlers ---------------- */
  const handleChangeTask = (task) => {
    setValues((prev) => {
      const validUsers = userOptions[task] || [];
      const newAssigned = validUsers.includes(prev.Assigned) ? prev.Assigned : "";
      return { ...prev, Task: task, Assigned: newAssigned };
    });
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

  // Toggle a single step immediately: add on check, remove on uncheck
  const toggleStep = async (tg) => {
    const uuid = tg.Task_group_uuid;
    if (!uuid || busyStep[uuid]) return;

    const label = tg.Task_group_name || tg.Task_group || "Unnamed Group";
    const nextChecked = !selectedTaskGroups.includes(uuid);

    // Optimistic UI
    setBusyStep((b) => ({ ...b, [uuid]: true }));
    setSelectedTaskGroups((prev) =>
      nextChecked ? [...prev, uuid] : prev.filter((id) => id !== uuid)
    );

    try {
      await axios.post("/order/steps/toggle", {
        orderId: values.id,
        step: { uuid, label },
        checked: nextChecked,
      });

      // Keep local Steps mirror in sync
      setValues((v) => {
        const curr = Array.isArray(v.Steps) ? v.Steps : [];
        if (nextChecked) {
          if (!curr.some((s) => (s?.uuid || "") === uuid || (s?.label || "") === label)) {
            return { ...v, Steps: [...curr, { uuid, label, checked: true }] };
          }
          return v;
        } else {
          return {
            ...v,
            Steps: curr.filter(
              (s) => (s?.uuid || "") !== uuid && (s?.label || "") !== label
            ),
          };
        }
      });
    } catch (err) {
      // Revert on failure
      setSelectedTaskGroups((prev) =>
        nextChecked ? prev.filter((id) => id !== uuid) : [...prev, uuid]
      );
      console.error("toggleStep error:", err);
      alert("Failed to update step. Please try again.");
    } finally {
      setBusyStep((b) => ({ ...b, [uuid]: false }));
    }
  };

  const canSubmit = useMemo(
    () => Boolean(values.Task && values.Assigned),
    [values.Task, values.Assigned]
  );

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const today = toYmd(new Date());

    try {
      const payload = {
        orderId: values.id,
        newStatus: {
          Task: values.Task,
          Assigned: values.Assigned,
          Delivery_Date: values.Delivery_Date || today,
          CreatedAt: new Date().toISOString(),
        },
      };
      const res = await axios.post("/order/addStatus", payload);
      if (res.data?.success) {
        alert("Order updated successfully!");
        onClose?.();
        navigate("/home");
      } else {
        alert("Update failed.");
      }
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Error updating order.");
    }
  };

  /* ---------------- Invoice modal controls ---------------- */
  const openInvoice = () => setShowInvoice(true);
  const closeInvoice = () => setShowInvoice(false);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl p-6 relative">
        <button
          className="absolute right-2 top-2 text-xl text-gray-400 hover:text-blue-500"
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          ×
        </button>

        {/* Header */}
        <OrderHeader values={values} notes={notes} />

        {/* Item Remarks (from Items[].Remark) */}
        {itemRemarks.length > 0 && (
          <div className="mt-3 mb-4">

            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              {itemRemarks.map((r, i) => (
                <li key={i}>
                  <span className="font-medium">{r.itemName}:</span> {r.remark}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Status Table */}
        <StatusTable status={values.Status} />

        {/* Update Form */}
        <form onSubmit={handleSaveChanges} className="space-y-4">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Update Job Status</label>
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

          <div>
            <label className="block font-medium text-gray-700 mb-1">Assign User</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
              value={values.Assigned}
              onChange={(e) => setValues({ ...values, Assigned: e.target.value })}
              disabled={!values.Task}
            >
              <option value="">Select User</option>
              {(userOptions[values.Task] || []).map((user, i) => (
                <option key={i} value={user}>
                  {user}
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
              <label className="block font-medium text-gray-700 mb-1">Delivery Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                value={values.Delivery_Date}
                onChange={(e) => setValues({ ...values, Delivery_Date: e.target.value })}
              />
            </div>
          )}

          {/* Steps (Task Groups) — ONLY Id === 1, and NOT pre-selected */}
          <div>
            <label className="block mb-1 font-medium">Steps</label>
            <div className="flex flex-wrap gap-2">
              {taskGroups
                .filter((tg) => tg.Id === 1)
                .map((tg) => {
                  const name = tg.Task_group_name || tg.Task_group || "Unnamed Group";
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
              Checking/unchecking updates the order immediately.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex-1 text-white font-medium py-2 rounded-lg transition ${
                canSubmit ? "bg-[#25d366] hover:bg-[#128c7e]" : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Update Status
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
