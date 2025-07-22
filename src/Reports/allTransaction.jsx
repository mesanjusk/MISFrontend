import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TopNavbar from '../Pages/topNavbar';
import Footer from '../Pages/footer';

const AllTransaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [txnRes, custRes] = await Promise.all([
        axios.get('/transaction/GetFilteredTransactions'),
        axios.get('/customer/GetCustomersList')
      ]);
      if (txnRes.data.success) setTransactions(txnRes.data.result);
      if (custRes.data.success) setCustomers(custRes.data.result);
    };
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
    const grouped = transactions.map(txn => {
      const credit = txn.Journal_entry.find(e => e.Type.toLowerCase() === 'credit');
      const debit = txn.Journal_entry.find(e => e.Type.toLowerCase() === 'debit');
      return {
        Transaction_id: txn.Transaction_id,
        Transaction_date: txn.Transaction_date,
        Description: txn.Description,
        Amount: credit?.Amount || debit?.Amount || 0,
        Credit_id: credit?.Account_id,
        Debit_id: debit?.Account_id
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
        debitAccountId: editingTxn.Debit_id
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

  return (
    <>
      <div className="no-print">
        <TopNavbar />
      </div>

      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">All Transactions</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4">No</th>
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Name Credit</th>
                <th className="py-2 px-4">Credit</th>
                <th className="py-2 px-4">Name Debit</th>
                <th className="py-2 px-4">Debit</th>
                <th className="py-2 px-4">Edit</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((txn, index) => (
                <tr key={index} className="border-t">
                  <td className="py-2 px-4">{txn.Transaction_id}</td>
                  <td className="py-2 px-4">{formatDate(txn.Transaction_date)}</td>
                  <td className="py-2 px-4">{customerMap[txn.Credit_id] || '-'}</td>
                  <td className="py-2 px-4">{txn.Amount?.toFixed(2)}</td>
                  <td className="py-2 px-4">{customerMap[txn.Debit_id] || '-'}</td>
                  <td className="py-2 px-4">{txn.Amount?.toFixed(2)}</td>
                  <td className="py-2 px-4">
                    <button className="text-blue-600 underline" onClick={() => openEdit(txn)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="no-print">
        <Footer />
      </div>

      {showEditModal && editingTxn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-4">Edit Transaction</h3>

            <div className="space-y-3">
              <label className="block">
                Date:
                <input
                  type="date"
                  value={editingTxn.Transaction_date?.split('T')[0]}
                  onChange={(e) => setEditingTxn({ ...editingTxn, Transaction_date: e.target.value })}
                  className="w-full mt-1 border p-2 rounded"
                />
              </label>

              <label className="block">
                Amount:
                <input
                  type="number"
                  value={editingTxn.Amount}
                  onChange={(e) => setEditingTxn({ ...editingTxn, Amount: Number(e.target.value) })}
                  className="w-full mt-1 border p-2 rounded"
                />
              </label>

              <label className="block">
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

              <label className="block">
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
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleUpdate}>
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
