import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function MigrateOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchFlatOrders();
  }, []);

  const fetchFlatOrders = async () => {
    try {
      const res = await axios.get('/api/orders/migrate/flat');
      setOrders(res.data);
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err) {
      alert('Error fetching orders');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      const allIds = orders.map((o) => o._id);
      setSelectedIds(allIds);
    }
    setSelectAll(!selectAll);
  };

  const migrateSelected = async () => {
    if (!window.confirm('Migrate selected orders?')) return;
    await axios.put('/api/orders/migrate/bulk', { ids: selectedIds });
    fetchFlatOrders();
  };

  const migrateOne = async (id) => {
    await axios.put(`/api/orders/migrate/single/${id}`);
    fetchFlatOrders();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">🛠️ Migrate Old Orders</h2>

      <button
        onClick={migrateSelected}
        disabled={selectedIds.length === 0}
        className="bg-blue-600 text-white px-4 py-2 mb-4 rounded"
      >
        Migrate Selected ({selectedIds.length})
      </button>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-center">
  <button
    className="text-blue-600 text-sm underline"
    onClick={() => {
      if (selectedIds.length === 20 || selectedIds.length === orders.slice(0, 20).length) {
        setSelectedIds([]);
      } else {
        setSelectedIds(orders.slice(0, 20).map((o) => o._id));
      }
    }}
  >
    Select Top 20
  </button>
</th>

              <th className="p-2">Order #</th>
              <th className="p-2">Item</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Rate</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Steps</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-t">
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(o._id)}
                    onChange={() => toggleSelect(o._id)}
                  />
                </td>
                <td className="p-2 text-center">{o.Order_Number}</td>
                <td className="p-2">{o.Item}</td>
                <td className="p-2 text-center">{o.Quantity}</td>
                <td className="p-2 text-center">{o.Rate}</td>
                <td className="p-2 text-center">{o.Amount}</td>
                <td className="p-2 text-xs">
                  {o.Steps?.length > 0
                    ? o.Steps.map((s) => s.label).join(', ')
                    : 'N/A'}
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => migrateOne(o._id)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Migrate
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">
                  ✅ All orders are already migrated.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
