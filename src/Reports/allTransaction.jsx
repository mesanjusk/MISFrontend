import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AllTransaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txnRes, custRes] = await Promise.all([
          axios.get('/transaction/GetFilteredTransactions'),
          axios.get('/customer/GetCustomersList'),
        ]);

        if (txnRes.data.success) setTransactions(txnRes.data.result);
        if (custRes.data.success) setCustomers(custRes.data.result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const userGroup = localStorage.getItem('User_group');
    if (userGroup) setUserRole(userGroup);

    fetchData();
  }, []);

  const customerMap = customers.reduce((acc, c) => {
    acc[c.Customer_uuid] = c.Customer_name;
    return acc;
  }, {});

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  useEffect(() => {
    const grouped = transactions.map((txn) => {
      const credit = txn.Journal_entry?.find((e) => e.Type?.toLowerCase() === 'credit');
      const debit = txn.Journal_entry?.find((e) => e.Type?.toLowerCase() === 'debit');

      return {
        Transaction_id: txn.Transaction_id,
        Transaction_date: txn.Transaction_date,
        Description: txn.Description || '',
        CreditAmount: credit?.Amount || 0,
        DebitAmount: debit?.Amount || 0,
        Amount: credit?.Amount || debit?.Amount || 0,
        Credit_id: credit?.Account_id || '',
        Debit_id: debit?.Account_id || '',
      };
    });

    setFilteredEntries(grouped);
  }, [transactions]);

  const openEdit = (txn) => {
    setEditingTxn({ ...txn });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.put(`/transaction/updateByTransactionId/${editingTxn.Transaction_id}`, {
        updatedDescription: editingTxn.Description || '',
        updatedAmount: editingTxn.Amount,
        updatedDate: editingTxn.Transaction_date,
        creditAccountId: editingTxn.Credit_id,
        debitAccountId: editingTxn.Debit_id,
      });
      if (res.data.success) {
        alert('Transaction updated');
        setShowEditModal(false);
        window.location.reload();
      } else {
        alert('Update failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating transaction');
    }
  };

  const handleDelete = async (txnId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const res = await axios.delete(`/transaction/deleteByTransactionId/${txnId}`);
      if (res.data.success) {
        alert('Transaction deleted');
        window.location.reload();
      } else {
        alert('Delete failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting transaction');
    }
  };

  return (
    <>
      <div className="pt-12 pb-20 max-w-7xl mx-auto px-4">
        <h2 className="text-xl font-semibold text-green-700 mb-4">All Transactions</h2>

        <div className="overflow-auto rounded shadow bg-white">
          <table className="w-full text-sm table-auto">
            <thead className="bg-green-100 text-green-900 sticky top-0 z-10">
              <tr>
                <th className="py-2 px-4 border">No</th>
                <th className="py-2 px-4 border">Date</th>
                <th className="py-2 px-4 border">Name Credit</th>
                <th className="py-2 px-4 border">Credit</th>
                <th className="py-2 px-4 border">Name Debit</th>
                <th className="py-2 px-4 border">Debit</th>
                <th className="py-2 px-4 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((txn, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50 transition">
                    <td className="py-2 px-4">{txn.Transaction_id}</td>
                    <td className="py-2 px-4">{formatDate(txn.Transaction_date)}</td>
                    <td className="py-2 px-4">{customerMap[txn.Credit_id] || '-'}</td>
                    <td className="py-2 px-4 text-right text-green-700">₹{txn.CreditAmount.toFixed(2)}</td>
                    <td className="py-2 px-4">{customerMap[txn.Debit_id] || '-'}</td>
                    <td className="py-2 px-4 text-right text-red-600">₹{txn.DebitAmount.toFixed(2)}</td>
                    <td className="py-2 px-4 text-center">
                      {userRole === 'Admin User' && (
                        <>
                          <button className="text-blue-600 hover:underline mr-2" onClick={() => openEdit(txn)}>
                            Edit
                          </button>
                          <button className="text-red-600 hover:underline" onClick={() => handleDelete(txn.Transaction_id)}>
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingTxn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-4">Edit Transaction</h3>

            <div className="space-y-4">
              <label className="block text-sm">
                Date:
                <input
                  type="date"
                  value={editingTxn.Transaction_date?.split('T')[0]}
                  onChange={(e) => setEditingTxn({ ...editingTxn, Transaction_date: e.target.value })}
                  className="w-full mt-1 border p-2 rounded"
                />
              </label>

              <label className="block text-sm">
                Amount:
                <input
                  type="number"
                  value={editingTxn.Amount}
                  onChange={(e) => setEditingTxn({ ...editingTxn, Amount: Number(e.target.value) })}
                  className="w-full mt-1 border p-2 rounded"
                />
              </label>

              <label className="block text-sm">
                Credit Name:
                <select
                  value={editingTxn.Credit_id}
                  onChange={(e) => setEditingTxn({ ...editingTxn, Credit_id: e.target.value })}
                  className="w-full mt-1 border p-2 rounded"
                >
                  <option value="">Select Account</option>
                  {customers.map(c => (
                    <option key={c.Customer_uuid} value={c.Customer_uuid}>
                      {c.Customer_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                Debit Name:
                <select
                  value={editingTxn.Debit_id}
                  onChange={(e) => setEditingTxn({ ...editingTxn, Debit_id: e.target.value })}
                  className="w-full mt-1 border p-2 rounded"
                >
                  <option value="">Select Account</option>
                  {customers.map(c => (
                    <option key={c.Customer_uuid} value={c.Customer_uuid}>
                      {c.Customer_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded ${!editingTxn.Transaction_date || !editingTxn.Amount || !editingTxn.Credit_id || !editingTxn.Debit_id
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                disabled={!editingTxn.Transaction_date || !editingTxn.Amount || !editingTxn.Credit_id || !editingTxn.Debit_id}
                onClick={handleUpdate}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AllTransaction;
