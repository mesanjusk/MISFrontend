import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AllPayments() {
  const [payments, setPayments] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await axios.get("/payment_mode/GetPaymentList");
      if (res.data.success) {
        setPayments(res.data.result);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      alert("Failed to load payments list");
    }
  };

  const handleEdit = (id, currentName) => {
    setEditId(id);
    setEditName(currentName);
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.put(`/payment_mode/update/${editId}`, {
        Payment_name: editName,
      });
      if (res.data.success) {
        alert("Updated successfully!");
        setEditId(null);
        setEditName("");
        fetchPayments();
      }
    } catch (err) {
      console.error("Update failed", err);
      alert("Update failed");
    }
  };

  const handleDelete = async (uuid) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) return;
    try {
      const res = await axios.delete(`/payment_mode/DeletePayment/${uuid}`);
      if (res.data.success) {
        alert("Deleted successfully!");
        fetchPayments();
      }
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">All Payments</h2>
      <table className="table-auto w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">#</th>
            <th className="border px-4 py-2">Payment Name</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p, i) => (
            <tr key={p._id}>
              <td className="border px-4 py-2">{i + 1}</td>
              <td className="border px-4 py-2">
                {editId === p._id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border px-2 py-1 w-full"
                  />
                ) : (
                  p.Payment_name
                )}
              </td>
              <td className="border px-4 py-2">
                {editId === p._id ? (
                  <>
                    <button
                      onClick={handleUpdate}
                      className="bg-green-500 text-white px-3 py-1 mr-2 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="bg-gray-500 text-white px-3 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(p._id, p.Payment_name)}
                      className="bg-blue-500 text-white px-3 py-1 mr-2 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.Payment_mode_uuid)}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr>
              <td colSpan="3" className="text-center py-4">
                No data found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
