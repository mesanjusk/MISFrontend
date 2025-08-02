import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AllTransaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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
        toast.error('Error fetching data');
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
    let grouped = transactions.map((txn) => {
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

    if (searchQuery) {
      grouped = grouped.filter((txn) => {
        const creditName = customerMap[txn.Credit_id] || '';
        const debitName = customerMap[txn.Debit_id] || '';
        return creditName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               debitName.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    if (dateFrom && dateTo) {
      grouped = grouped.filter((txn) => {
        const txnDate = new Date(txn.Transaction_date);
        return txnDate >= new Date(dateFrom) && txnDate <= new Date(dateTo);
      });
    }

    if (sortConfig.key) {
      grouped.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredEntries(grouped);
  }, [transactions, searchQuery, dateFrom, dateTo, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredEntries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'Transactions.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [['No', 'Date', 'Credit Name', 'Credit', 'Debit Name', 'Debit']],
      body: filteredEntries.map(txn => [
        txn.Transaction_id,
        formatDate(txn.Transaction_date),
        customerMap[txn.Credit_id] || '-',
        txn.CreditAmount.toFixed(2),
        customerMap[txn.Debit_id] || '-',
        txn.DebitAmount.toFixed(2),
      ])
    });
    doc.save('Transactions.pdf');
  };

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
        toast.success('Transaction updated');
        setShowEditModal(false);
        setTransactions((prev) => prev.map(txn => txn.Transaction_id === editingTxn.Transaction_id ? { ...txn, ...editingTxn } : txn));
      } else {
        toast.error('Update failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating transaction');
    }
  };

  const handleDelete = async (txnId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const res = await axios.delete(`/transaction/deleteByTransactionId/${txnId}`);
      if (res.data.success) {
        toast.success('Transaction deleted');
        setTransactions((prev) => prev.filter(txn => txn.Transaction_id !== txnId));
      } else {
        toast.error('Delete failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting transaction');
    }
  };

  return (
    <div className="p-4">
      <ToastContainer />

      <div className="mb-4 flex flex-wrap gap-4 justify-between">
        <div className="flex gap-2">
          <input type="text" placeholder="Search customer" className="border p-2 rounded" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border p-2 rounded" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border p-2 rounded" />
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Export Excel</button>
          <button onClick={exportToPDF} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Export PDF</button>
        </div>
      </div>

      <div className="overflow-auto bg-white shadow rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-green-100 text-green-900">
            <tr>
              <th onClick={() => handleSort('Transaction_id')} className="cursor-pointer px-4 py-2">No</th>
              <th onClick={() => handleSort('Transaction_date')} className="cursor-pointer px-4 py-2">Date</th>
              <th onClick={() => handleSort('Credit_id')} className="cursor-pointer px-4 py-2">Credit Name</th>
              <th onClick={() => handleSort('CreditAmount')} className="cursor-pointer px-4 py-2">Credit</th>
              <th onClick={() => handleSort('Debit_id')} className="cursor-pointer px-4 py-2">Debit Name</th>
              <th onClick={() => handleSort('DebitAmount')} className="cursor-pointer px-4 py-2">Debit</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-6 text-gray-500">No transactions found.</td></tr>
            ) : (
              filteredEntries.map((txn, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{txn.Transaction_id}</td>
                  <td className="px-4 py-2">{formatDate(txn.Transaction_date)}</td>
                  <td className="px-4 py-2">{customerMap[txn.Credit_id] || '-'}</td>
                  <td className="px-4 py-2 text-right text-green-700">₹{txn.CreditAmount.toFixed(2)}</td>
                  <td className="px-4 py-2">{customerMap[txn.Debit_id] || '-'}</td>
                  <td className="px-4 py-2 text-right text-red-600">₹{txn.DebitAmount.toFixed(2)}</td>
                  <td className="px-4 py-2 text-center">
                    {userRole === 'Admin User' && (
                      <>
                        <button className="text-blue-600 hover:underline mr-2" onClick={() => openEdit(txn)}>Edit</button>
                        <button className="text-red-600 hover:underline" onClick={() => handleDelete(txn.Transaction_id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showEditModal && editingTxn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-4">Edit Transaction</h3>
            <div className="space-y-4">
              <label className="block text-sm">Date:
                <input type="date" value={editingTxn.Transaction_date?.split('T')[0]} onChange={(e) => setEditingTxn({ ...editingTxn, Transaction_date: e.target.value })} className="w-full mt-1 border p-2 rounded" />
              </label>
              <label className="block text-sm">Amount:
                <input type="number" value={editingTxn.Amount} onChange={(e) => setEditingTxn({ ...editingTxn, Amount: Number(e.target.value) })} className="w-full mt-1 border p-2 rounded" />
              </label>
              <label className="block text-sm">Credit Name:
                <select value={editingTxn.Credit_id} onChange={(e) => setEditingTxn({ ...editingTxn, Credit_id: e.target.value })} className="w-full mt-1 border p-2 rounded">
                  <option value="">Select Account</option>
                  {customers.map(c => (<option key={c.Customer_uuid} value={c.Customer_uuid}>{c.Customer_name}</option>))}
                </select>
              </label>
              <label className="block text-sm">Debit Name:
                <select value={editingTxn.Debit_id} onChange={(e) => setEditingTxn({ ...editingTxn, Debit_id: e.target.value })} className="w-full mt-1 border p-2 rounded">
                  <option value="">Select Account</option>
                  {customers.map(c => (<option key={c.Customer_uuid} value={c.Customer_uuid}>{c.Customer_name}</option>))}
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className={`px-4 py-2 rounded ${!editingTxn.Transaction_date || !editingTxn.Amount || !editingTxn.Credit_id || !editingTxn.Debit_id ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`} disabled={!editingTxn.Transaction_date || !editingTxn.Amount || !editingTxn.Credit_id || !editingTxn.Debit_id} onClick={handleUpdate}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTransaction;
