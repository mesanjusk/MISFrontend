import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaWhatsapp, FaSortUp, FaSortDown } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const AllTransaction1 = () => {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [outstandingReport, setOutstandingReport] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const [txRes, custRes] = await Promise.all([
        axios.get('/transaction/GetFilteredTransactions'),
        axios.get('/customer/GetCustomersList')
      ]);
      if (txRes.data.success) setTransactions(txRes.data.result);
      if (custRes.data.success) setCustomers(custRes.data.result);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const report = customers.map(cust => {
      let debit = 0, credit = 0;
      transactions.forEach(tx => {
        tx.Journal_entry.forEach(entry => {
          if (entry.Account_id === cust.Customer_uuid) {
            if (entry.Type === 'Debit') debit += entry.Amount || 0;
            if (entry.Type === 'Credit') credit += entry.Amount || 0;
          }
        });
      });
      return {
        uuid: cust.Customer_uuid,
        name: cust.Customer_name,
        mobile: cust.Mobile_number || 'No phone number',
        debit,
        credit,
        balance: credit - debit,
      };
    });
    setOutstandingReport(report);
  }, [transactions, customers]);

  const sortedReport = [...outstandingReport]
    .filter(item => {
      if (filterType === 'receivable') return item.balance > 0;
      if (filterType === 'payable') return item.balance < 0;
      if (filterType === 'zero') return item.balance === 0 && (item.debit !== 0 || item.credit !== 0);
      return true;
    })
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sendMessageToAPI = async (name, phone, balance) => {
    const today = new Date().toLocaleDateString('en-IN');
    const message = `Dear ${name}, your balance is ₹${balance} as of ${today}. Please clear it soon. - S.K.Digital`;

    const payload = {
      mobile: phone,
      userName: name,
      type: 'customer',
      message,
    };

    try {
      const res = await fetch('https://misbackend-e078.onrender.com/usertask/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      alert(result.error ? "Failed to send: " + result.error : "Message sent successfully.");
    } catch (error) {
      console.error("Request failed:", error);
      alert("Failed to send message.");
    }
  };

  const sendWhatsApp = (name, phone, balance) => {
    if (phone === 'No phone number') return alert("No phone number available.");
    if (window.confirm(`Send WhatsApp message to ${name}?\nBalance: ₹${balance}`)) {
      sendMessageToAPI(name, phone, balance);
    }
  };

  const viewTransactions = (customer) => {
    navigate('/allTransaction3', { state: { customer } });
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sortedReport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Outstanding Report');
    XLSX.writeFile(wb, 'outstanding_report.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Outstanding Report', 14, 10);
    doc.autoTable({
      head: [['Customer', 'Mobile', 'Amount']],
      body: sortedReport.map(item => [item.name, item.mobile, `₹${item.balance}`]),
      startY: 20,
    });
    doc.save('outstanding_report.pdf');
  };

  return (
    <div className="pt-04 pb-12 max-w-8xl mx-auto px-4">
      {/* Header & Toolbar */}
      <div className="flex flex-col md:flex-row justify-between gap-3 mb-4 items-center">
        <h2 className="text-xl font-semibold text-blue-700">Outstanding Report</h2>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Export Excel
          </button>
          <button onClick={exportToPDF} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Export PDF
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4 items-center">
        <input
          type="text"
          placeholder="Search customer name..."
          className="flex-1 p-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {['receivable', 'payable', 'zero', 'all'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded transition ${
                filterType === type
                  ? type === 'receivable'
                    ? 'bg-blue-600 text-white'
                    : type === 'payable'
                    ? 'bg-red-600 text-white'
                    : type === 'zero'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-white'
                  : type === 'receivable'
                  ? 'bg-blue-100 text-blue-700'
                  : type === 'payable'
                  ? 'bg-red-100 text-red-700'
                  : type === 'zero'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full table-auto text-sm border shadow-sm rounded bg-white">
          <thead className="bg-blue-100 text-blue-900">
            <tr>
              <th onClick={() => handleSort('name')} className="border px-3 py-2 cursor-pointer text-left">
                Customer {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />)}
              </th>
              <th onClick={() => handleSort('mobile')} className="border px-3 py-2 cursor-pointer text-left">
                Mobile {sortConfig.key === 'mobile' && (sortConfig.direction === 'asc' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />)}
              </th>
              <th onClick={() => handleSort('balance')} className="border px-3 py-2 cursor-pointer text-right">
                Amount {sortConfig.key === 'balance' && (sortConfig.direction === 'asc' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />)}
              </th>
              <th className="border px-3 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedReport.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-6 text-gray-500">
                  No customers found.
                </td>
              </tr>
            ) : (
              sortedReport.map((item, index) => (
                <tr key={index} className="border-t hover:bg-gray-50 transition">
                  <td onClick={() => viewTransactions(item)} className="px-3 py-2 text-blue-700 cursor-pointer">
                    {item.name}
                  </td>
                  <td className="px-3 py-2">{item.mobile}</td>
                  <td className={`px-3 py-2 text-right font-semibold ${item.balance < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                    ₹{Math.abs(item.balance)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {item.mobile !== 'No phone number' && (
                      <button onClick={() => sendWhatsApp(item.name, item.mobile, item.balance)}>
                        <FaWhatsapp className="text-blue-600 text-lg hover:text-blue-700 transition" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllTransaction1;
