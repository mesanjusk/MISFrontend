import React, { useEffect, useState } from "react";
import axios from "axios";
import AddTransaction from "../Pages/AddTransaction";
import AddTransaction1 from "../Pages/AddTransaction1";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function AllPayments() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentModes, setPaymentModes] = useState([]);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    fetchTransactions();
    fetchPaymentModes();
  }, []);

  useEffect(() => {
    handleFilters();
  }, [transactions, searchQuery, selectedPaymentMode, sortField, sortAsc]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/transaction/GetTransactionList");
      setTransactions(res.data.success ? res.data.result : []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentModes = async () => {
    try {
      const res = await axios.get("/transaction/distinctPaymentModes");
      if (res.data.success) {
        setPaymentModes(res.data.result);
      }
    } catch (err) {
      console.error("Failed to fetch payment modes", err);
    }
  };

  const handleFilters = () => {
    let filtered = [...transactions];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(txn =>
        txn.Description?.toLowerCase().includes(q) ||
        txn.Transaction_id?.toLowerCase().includes(q)
      );
    }

    if (selectedPaymentMode) {
      filtered = filtered.filter(txn => txn.Payment_mode === selectedPaymentMode);
    }

    if (sortField) {
      filtered.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    setFilteredTransactions(filtered);
  };

  const exportToExcel = () => {
    const rows = filteredTransactions.map(txn => {
      const debit = txn.Journal_entry?.find(j => j.Type?.toLowerCase() === "debit");
      const type = isCustomer(txn, debit?.Account_id) ? "Receipt" : "Payment";
      return {
        ID: txn.Transaction_id,
        Date: txn.Transaction_date?.substring(0, 10),
        Description: txn.Description,
        Amount: txn.Total_Debit || txn.Total_Credit,
        Mode: txn.Payment_mode,
        Type: type
      };
    });

    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Transactions");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "transactions.xlsx");
  };

  const openEditModal = (txn) => {
    const debit = txn.Journal_entry?.find(j => j.Type?.toLowerCase() === "debit");
    const credit = txn.Journal_entry?.find(j => j.Type?.toLowerCase() === "credit");

    if (!debit || !credit) {
      alert("Invalid transaction: missing debit or credit entry.");
      return;
    }

    const customerInDebit = isCustomer(txn, debit.Account_id);
    setModalType(customerInDebit ? "receipt" : "payment");
    setSelectedTransaction(txn);
    setIsEdit(true);
    setShowModal(true);
  };

  const isCustomer = (txn, accountId) => {
    return accountId?.startsWith("CUS") || accountId?.toLowerCase()?.includes("customer");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await axios.delete(`/transaction/delete/${id}`);
        fetchTransactions();
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTransaction(null);
    setIsEdit(false);
    fetchTransactions();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="p-4">
      <div className="flex flex-wrap justify-between gap-2 items-center mb-4">
        <h2 className="text-xl font-bold">All Payments & Receipts</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search by description or ID..."
            className="border px-3 py-1 rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
            onClick={exportToExcel}
          >
            Export to Excel
          </button>
        </div>
      </div>

      {/* Payment Mode Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded border ${selectedPaymentMode === "" ? "bg-blue-600 text-white" : "bg-white"}`}
          onClick={() => setSelectedPaymentMode("")}
        >
          All
        </button>
        {paymentModes.map((mode) => (
          <button
            key={mode}
            className={`px-3 py-1 rounded border ${selectedPaymentMode === mode ? "bg-blue-600 text-white" : "bg-white"}`}
            onClick={() => setSelectedPaymentMode(mode)}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table-auto w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              {["Transaction_id", "Transaction_date", "Description", "Total_Debit", "Payment_mode"].map(field => (
                <th
                  key={field}
                  className="border px-4 py-2 cursor-pointer"
                  onClick={() => handleSort(field)}
                >
                  {field.replace("Transaction_", "").replace("_", " ")} {sortField === field ? (sortAsc ? "▲" : "▼") : ""}
                </th>
              ))}
              <th className="border px-4 py-2">Type</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-4">Loading...</td></tr>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map(txn => {
                const debit = txn.Journal_entry?.find(j => j.Type?.toLowerCase() === "debit");
                const type = isCustomer(txn, debit?.Account_id) ? "Receipt" : "Payment";
                return (
                  <tr key={txn._id}>
                    <td className="border px-4 py-2">{txn.Transaction_id}</td>
                    <td className="border px-4 py-2">{txn.Transaction_date?.substring(0, 10)}</td>
                    <td className="border px-4 py-2">{txn.Description}</td>
                    <td className="border px-4 py-2">{txn.Total_Debit || txn.Total_Credit}</td>
                    <td className="border px-4 py-2">{txn.Payment_mode}</td>
                    <td className="border px-4 py-2">{type}</td>
                    <td className="border px-4 py-2 flex gap-2 justify-center">
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                        onClick={() => openEditModal(txn)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        onClick={() => handleDelete(txn._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="7" className="text-center py-4">No data found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Modal */}
      {showModal && modalType === "receipt" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-2xl overflow-y-auto max-h-[90vh]">
            <AddTransaction
              editMode={isEdit}
              existingData={selectedTransaction}
              onClose={closeModal}
              onSuccess={fetchTransactions}
            />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showModal && modalType === "payment" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-2xl overflow-y-auto max-h-[90vh]">
            <AddTransaction1
              editMode={isEdit}
              existingData={selectedTransaction}
              onClose={closeModal}
              onSuccess={fetchTransactions}
            />
          </div>
        </div>
      )}
    </div>
  );
}
