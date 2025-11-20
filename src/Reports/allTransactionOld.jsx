import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../apiClient.js';
import { FaWhatsapp, FaSortUp, FaSortDown } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const OFFICE_VENDOR_GROUP_NAME = 'Office & Vendor';

const AllTransactionOld = () => {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [outstandingReport, setOutstandingReport] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [role, setRole] = useState('operator'); // admin or operator
  const navigate = useNavigate();

  // Get role from localStorage
  useEffect(() => {
    const r = (localStorage.getItem('role') || localStorage.getItem('User_role') || 'operator').toLowerCase();
    setRole(r);
  }, []);

  const isAdmin = role === 'admin';

  const groupOf = (cust) =>
    cust?.Account_group || cust?.Group || cust?.group || 'Others';

  // Fetch customers + transactions
  useEffect(() => {
    const fetchData = async () => {
      const [txRes, custRes] = await Promise.all([
        axios.get('/old-transaction/GetTransactionList'),
        axios.get('/customer/GetCustomersList'),
      ]);

      if (txRes.data?.success) setTransactions(txRes.data.result || []);
      if (custRes.data?.success) setCustomers(custRes.data.result || []);
    };

    fetchData();
  }, []);

  // Create outstanding report
  useEffect(() => {
    const report = customers.map((cust) => {
      let debit = 0, credit = 0;

      (transactions || []).forEach((tx) => {
        (tx?.Journal_entry || []).forEach((entry) => {
          if (entry?.Account_id === cust?.Customer_uuid) {
            if (entry?.Type === 'Debit') debit += Number(entry?.Amount || 0);
            if (entry?.Type === 'Credit') credit += Number(entry?.Amount || 0);
          }
        });
      });

      return {
        uuid: cust?.Customer_uuid,
        name: cust?.Customer_name || 'Unnamed',
        mobile: cust?.Mobile_number || 'No phone number',
        group: groupOf(cust),
        debit,
        credit,
        balance: credit - debit,
      };
    });

    setOutstandingReport(report);
  }, [transactions, customers]);

  // Hide mobile numbers for non-admin
  const shouldHideMobile = (item) =>
    !isAdmin && item?.group === OFFICE_VENDOR_GROUP_NAME;

  const displayMobile = (item) =>
    shouldHideMobile(item) ? 'Hidden' : (item?.mobile || 'No phone number');

  // Display ALL data (no filtering) — only sorting
  const sortedReport = useMemo(() => {
    return [...outstandingReport].sort((a, b) => {
      const key = sortConfig.key;
      const dir = sortConfig.direction === 'asc' ? 1 : -1;

      const va = key === 'mobile' ? displayMobile(a) : a[key];
      const vb = key === 'mobile' ? displayMobile(b) : b[key];

      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [outstandingReport, sortConfig, role]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // WhatsApp Message sending
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
      const { data: result } = await axios.post('/usertask/send-message', payload);
      alert(result.error ? 'Failed to send: ' + result.error : 'Message sent successfully.');
    } catch (error) {
      alert('Failed to send message.');
    }
  };

  const sendWhatsApp = (item) => {
    if (shouldHideMobile(item)) {
      return alert('Mobile number is hidden for this account group.');
    }
    if (!item.mobile || item.mobile === 'No phone number') {
      return alert('No phone number available.');
    }
    if (window.confirm(`Send WhatsApp message to ${item.name}?`)) {
      sendMessageToAPI(item.name, item.mobile, item.balance);
    }
  };

  const viewTransactions = (customer) => {
    navigate('/allTransaction3', { state: { customer } });
  };

  // Excel Export
  const exportToExcel = () => {
    const data = sortedReport.map((item) => ({
      Customer: item.name,
      Group: item.group,
      Mobile: displayMobile(item),
      Debit: item.debit,
      Credit: item.credit,
      Amount: `₹${Math.abs(item.balance)}`,
      Type: item.balance < 0 ? 'Payable' : item.balance > 0 ? 'Receivable' : 'Settled',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Outstanding Report');
    XLSX.writeFile(wb, 'outstanding_report.xlsx');
  };

  // PDF Export
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Outstanding Report', 14, 10);
    doc.autoTable({
      head: [['Customer', 'Group', 'Mobile', 'Amount']],
      body: sortedReport.map((item) => [
        item.name,
        item.group,
        displayMobile(item),
        `₹${Math.abs(item.balance)}`,
      ]),
      startY: 20,
    });
    doc.save('outstanding_report.pdf');
  };

  return (
    <div className="pt-04 pb-12 max-w-8xl mx-auto px-4">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-3 mb-4 items-center">
        <h2 className="text-xl font-semibold text-blue-700">Outstanding Report</h2>

        <div className="flex gap-2">
          <button onClick={exportToExcel} className="px-4 py-2 bg-blue-600 text-white rounded">
            Export Excel
          </button>
          <button onClick={exportToPDF} className="px-4 py-2 bg-red-600 text-white rounded">
            Export PDF
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-auto">
        <table className="w-full table-auto text-sm border shadow-sm rounded bg-white">
          <thead className="bg-blue-100 text-blue-900">
            <tr>
              <th onClick={() => handleSort('name')} className="border px-3 py-2 cursor-pointer text-left">
                Customer {sortConfig.key === 'name' && (sortConfig.direction === 'asc'
                  ? <FaSortUp className="inline ml-1" />
                  : <FaSortDown className="inline ml-1" />)}
              </th>

              <th onClick={() => handleSort('group')} className="border px-3 py-2 cursor-pointer text-left">
                Group {sortConfig.key === 'group' && (sortConfig.direction === 'asc'
                  ? <FaSortUp className="inline ml-1" />
                  : <FaSortDown className="inline ml-1" />)}
              </th>

              <th onClick={() => handleSort('mobile')} className="border px-3 py-2 cursor-pointer text-left">
                Mobile {sortConfig.key === 'mobile' && (sortConfig.direction === 'asc'
                  ? <FaSortUp className="inline ml-1" />
                  : <FaSortDown className="inline ml-1" />)}
              </th>

              <th onClick={() => handleSort('balance')} className="border px-3 py-2 cursor-pointer text-right">
                Amount {sortConfig.key === 'balance' && (sortConfig.direction === 'asc'
                  ? <FaSortUp className="inline ml-1" />
                  : <FaSortDown className="inline ml-1" />)}
              </th>

              <th className="border px-3 py-2 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {sortedReport.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">No customers found.</td>
              </tr>
            ) : (
              sortedReport.map((item, index) => (
                <tr key={index} className="border-t hover:bg-gray-50 transition">
                  <td onClick={() => viewTransactions(item)} className="px-3 py-2 text-blue-700 cursor-pointer">
                    {item.name}
                  </td>

                  <td className="px-3 py-2">{item.group}</td>

                  <td className="px-3 py-2">{displayMobile(item)}</td>

                  <td
                    className={`px-3 py-2 text-right font-semibold ${
                      item.balance < 0 ? 'text-red-600' : 'text-blue-700'
                    }`}
                  >
                    ₹{Math.abs(item.balance)}
                  </td>

                  <td className="px-3 py-2 text-center">
                    {(!shouldHideMobile(item) && item.mobile !== 'No phone number') ? (
                      <button onClick={() => sendWhatsApp(item)}>
                        <FaWhatsapp className="text-blue-600 text-lg hover:text-blue-700" />
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">No action</span>
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

export default AllTransactionOld;
