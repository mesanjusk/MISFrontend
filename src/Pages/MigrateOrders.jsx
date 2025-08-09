import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function MigrateOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyIds, setBusyIds] = useState({});
  const [error, setError] = useState("");

  const API_BASE = useMemo(() => {
  
  const raw = import.meta.env.VITE_API_BASE || "";  // no process.env here
  return String(raw).replace(/\/$/, "");
}, []);

  const MIGRATE_API = `${API_BASE}/api/orders/migrate`;

  useEffect(() => {
    fetchFlatOrders();
    // eslint-disable-next-line
  }, []);

  const fetchFlatOrders = async () => {
    try {
      setLoading(true);
      setError("");
      setSelectedIds([]);
      const res = await axios.get(`${MIGRATE_API}/flat`);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Error fetching orders");
      alert(err?.response?.data?.error || "Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o._id));
    }
  };

  const selectTop20 = () => {
    const top = orders.slice(0, 20).map((o) => o._id);
    const isSame =
      selectedIds.length === top.length &&
      selectedIds.every((id) => top.includes(id));
    setSelectedIds(isSame ? [] : top);
  };

  const migrateSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Migrate selected ${selectedIds.length} orders?`)) return;
    try {
      setLoading(true);
      await axios.put(`${MIGRATE_API}/bulk`, { ids: selectedIds });
      await fetchFlatOrders();
      alert("Migration complete for selected orders.");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Bulk migration failed");
    } finally {
      setLoading(false);
    }
  };

  const migrateVisible = async () => {
    if (orders.length === 0) return;
    if (!window.confirm(`Migrate ALL visible (${orders.length}) orders?`)) return;
    try {
      setLoading(true);
      await axios.put(`${MIGRATE_API}/bulk`, { ids: orders.map((o) => o._id) });
      await fetchFlatOrders();
      alert("Migration complete for visible orders.");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Bulk migration failed");
    } finally {
      setLoading(false);
    }
  };

  const migrateOne = async (id) => {
    try {
      setBusyIds((m) => ({ ...m, [id]: true }));
      await axios.put(`${MIGRATE_API}/single/${id}`);
      await fetchFlatOrders();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Single migration failed");
    } finally {
      setBusyIds((m) => {
        const copy = { ...m };
        delete copy[id];
        return copy;
      });
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-xl font-bold">🛠️ Add “Print” Step (Delivered only)</h2>
        <div className="text-sm text-gray-500">
          {loading ? "Loading…" : `Rows: ${orders.length}`}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={migrateSelected}
          disabled={loading || selectedIds.length === 0}
          className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50"
        >
          Migrate Selected ({selectedIds.length})
        </button>
        <button
          onClick={migrateVisible}
          disabled={loading || orders.length === 0}
          className="bg-purple-700 text-white px-3 py-2 rounded disabled:opacity-50"
        >
          Migrate All (Visible)
        </button>
        <button
          onClick={fetchFlatOrders}
          disabled={loading}
          className="bg-gray-200 px-3 py-2 rounded"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-center">
                <input
                  type="checkbox"
                  checked={orders.length > 0 && selectedIds.length === orders.length}
                  onChange={toggleSelectAll}
                />
                <div>
                  <button
                    className="text-blue-600 text-xs underline mt-1"
                    onClick={selectTop20}
                    type="button"
                  >
                    Select Top 20
                  </button>
                </div>
              </th>
              <th className="p-2">Order #</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Steps</th>
              <th className="p-2">Format</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => {
              const isSelected = selectedIds.includes(o._id);
              const stepLabels =
                Array.isArray(o.Steps) && o.Steps.length
                  ? o.Steps.map((s) => s.label).join(", ")
                  : "—";

              // OLD means: needs Print step
              const hasPrint = (o.Steps || []).some(
                (s) => String(s?.label).toLowerCase() === "print"
              );
              const isOld = o._isOld ?? !hasPrint;

              return (
                <tr key={o._id} className="border-t">
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(o._id)}
                    />
                  </td>
                  <td className="p-2 text-center">{o.Order_Number}</td>
                  <td className="p-2">{o.Customer_name || o.Customer_uuid || "Unknown"}</td>
                  <td className="p-2 text-xs">{stepLabels}</td>
                  <td className="p-2">
                    {isOld ? (
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700">
                        OLD (needs Print)
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">
                        NEW
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => migrateOne(o._id)}
                      disabled={!!busyIds[o._id] || loading}
                      className="bg-green-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                    >
                      {busyIds[o._id] ? "…" : "Migrate"}
                    </button>
                  </td>
                </tr>
              );
            })}

            {orders.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  ✅ Nothing to migrate — all Delivered orders already have a “Print” step.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
    </div>
  );
}
