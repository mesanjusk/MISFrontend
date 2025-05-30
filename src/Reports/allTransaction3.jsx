import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import TopNavbar from '../Pages/topNavbar';
import Footer from '../Pages/footer';
import AddOrder1 from "../Pages/addOrder1";
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const AllTransaction3 = () => {
    const [transactions, setTransactions] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
    const [filterType, setFilterType] = useState("All");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const location = useLocation();
    const navigate = useNavigate();
    const { uuid: customerUuid, name: customerName } = location.state?.customer || {};

    useEffect(() => {
    if (!customerUuid || !customerName) {
        alert("Customer not found. Redirecting...");
        navigate("/allTransaction1");
        return;
    }

    // Dynamically set April 1st of current or previous year depending on today's date
    const today = new Date();
    const currentYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    setStartDate(`${currentYear}-04-01`);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [transRes, custRes] = await Promise.all([
                axios.get('/transaction/GetFilteredTransactions'),
                axios.get('/customer/GetCustomersList')
            ]);

            if (transRes.data.success) setTransactions(transRes.data.result);
            if (custRes.data.success) setCustomers(custRes.data.result);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
}, [customerUuid, customerName, navigate]);


    const customerMap = customers.reduce((acc, customer) => {
        acc[customer.Customer_uuid] = customer.Customer_name;
        return acc;
    }, {});

    const customerTransactions = transactions.filter(transaction =>
        transaction.Journal_entry.some(entry => entry.Account_id === customerUuid)
    );

    const openingBalance = customerTransactions.reduce((acc, transaction) => {
        const txDate = new Date(transaction.Transaction_date);
        if (!startDate || txDate < new Date(startDate)) {
            transaction.Journal_entry.forEach(entry => {
                if (entry.Account_id === customerUuid) {
                    if (entry.Type === 'Credit') acc += entry.Amount || 0;
                    if (entry.Type === 'Debit') acc -= entry.Amount || 0;
                }
            });
        }
        return acc;
    }, 0);

    const filteredTransactions = customerTransactions.filter(transaction => {
        const txDate = new Date(transaction.Transaction_date);
        const withinDateRange =
            (!startDate || new Date(startDate) <= txDate) &&
            (!endDate || new Date(endDate) >= txDate);

        const hasMatchingType = transaction.Journal_entry.some(entry =>
            entry.Account_id === customerUuid &&
            (filterType === "All" || entry.Type === filterType)
        );

        return withinDateRange && hasMatchingType;
    });

    const sortedCustomerTransactions = [...filteredTransactions].sort((a, b) => {
        const { key, direction } = sortConfig;
        if (!key) return 0;
        const aVal = a[key] || '';
        const bVal = b[key] || '';
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    const calculateTotals = () => {
        const totals = filteredTransactions.reduce(
            (acc, transaction) => {
                transaction.Journal_entry.forEach(entry => {
                    if (entry.Account_id === customerUuid) {
                        if (entry.Type === 'Debit') acc.debit += entry.Amount || 0;
                        if (entry.Type === 'Credit') acc.credit += entry.Amount || 0;
                    }
                });
                return acc;
            },
            { debit: 0, credit: 0 }
        );
        totals.total = openingBalance + totals.credit - totals.debit;
        return totals;
    };

    const totals = calculateTotals();

    const sortTable = (key) => {
        const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, direction });
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text(`Transactions for ${customerName}`, 10, 10);
        let y = 20;
        sortedCustomerTransactions.forEach((t, idx) => {
            t.Journal_entry.filter(e => e.Account_id === customerUuid).forEach(e => {
                doc.text(`${idx + 1}. ${t.Description} - ${e.Type}: ₹${e.Amount}`, 10, y);
                y += 10;
            });
        });
        doc.save('transactions.pdf');
    };

    const handleExportExcel = () => {
        const rows = [];

        sortedCustomerTransactions.forEach(transaction => {
            transaction.Journal_entry.filter(entry => entry.Account_id === customerUuid).forEach(entry => {
                rows.push({
                    TransactionID: transaction.Transaction_id,
                    Date: new Date(transaction.Transaction_date).toLocaleDateString(),
                    Description: transaction.Description,
                    Type: entry.Type,
                    Amount: entry.Amount,
                });
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(data, "transactions.xlsx");
    };

    const handleOrder = () => setShowOrderModal(true);
    const closeModal = () => setShowOrderModal(false);

    return (
        <>
            <div className="no-print">
                <TopNavbar />
            </div>

            <div className="pt-16 pb-24 px-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold"><span className="text-blue-600">{customerName}</span></h2>
                       

                    </div>
                    <div className="space-x-2">
                        <button onClick={handleExportPDF} className="px-4 py-1 bg-red-500 text-white rounded">PDF</button>
                        <button onClick={handleExportExcel} className="px-4 py-1 bg-green-600 text-white rounded">Excel</button>
                    </div>
                </div>

                <div className="flex gap-4 mb-4 flex-wrap">
                    <div>
                        <label className="block text-sm font-medium">Start Date</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border px-2 py-1 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">End Date</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border px-2 py-1 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Transaction Type</label>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border px-2 py-1 rounded">
                            <option value="All">All</option>
                            <option value="Credit">Credit</option>
                            <option value="Debit">Debit</option>
                        </select>
                    </div>
                </div>
<p>
  Total Credit: ₹{totals.credit.toFixed(2)} | 
  Total Debit: ₹{totals.debit.toFixed(2)} | 
  Closing Balance: ₹{totals.total.toFixed(2)}
</p>
                {loading ? (
                    <div className="text-center py-12 text-lg">Loading transactions...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="py-2 px-4">No</th>
                                    <th className="py-2 px-4">Date</th>
                                    <th className="py-2 px-4">Name</th>
                                    <th className="py-2 px-4">Description</th>
                                    <th className="py-2 px-4">Debit</th>
                                    <th className="py-2 px-4">Credit</th>
                                    <th className="py-2 px-4">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-yellow-100 font-semibold">
                                     <td className="py-2 px-4" ></td>
                                <td className="py-2 px-4" ></td>
                                    <td className="py-2 px-4" colSpan={1}>Opening Balance</td>
                                    <td className="py-2 px-4" ></td>
                                    <td className="py-2 px-4" ></td>
                                    <td className="py-2 px-4" ></td>
                                    <td className="py-2 px-4">{openingBalance.toFixed(2)}</td>
                                </tr>
                                {(() => {
                                    let runningBalance = openingBalance;
                                    return sortedCustomerTransactions.flatMap((transaction, index) =>
                                        transaction.Journal_entry.filter(entry => entry.Account_id === customerUuid)
                                            .map((entry, entryIndex) => {
                                                if (entry.Type === 'Debit') runningBalance -= entry.Amount || 0;
                                                if (entry.Type === 'Credit') runningBalance += entry.Amount || 0;

                                                const secondEntry = transaction.Journal_entry.find(e => e.Account_id !== customerUuid);
                                                const secondCustomerName = secondEntry ? customerMap[secondEntry.Account_id] || "N/A" : "N/A";

                                                return (
                                                    <tr key={`${index}-${entryIndex}`} className="border-t hover:bg-gray-50">
                                                        <td className="py-2 px-4">{transaction.Transaction_id}</td>
                                                        <td className="py-2 px-4">{new Date(transaction.Transaction_date).toLocaleDateString()}</td>
                                                        <td className="py-2 px-4">{secondCustomerName}</td>
                                                        <td className="py-2 px-4">{transaction.Description}</td>
                                                        <td className="py-2 px-4">{entry.Type === 'Debit' ? entry.Amount : ''}</td>
                                                        <td className="py-2 px-4">{entry.Type === 'Credit' ? entry.Amount : ''}</td>
                                                        <td className={`py-2 px-4 ${runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {runningBalance.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                    );
                                })()}
                                <tr 
                                className="bg-green-100 font-semibold">
                                <td className="py-2 px-4" ></td>
                                <td className="py-2 px-4" ></td>
                                    <td className="py-2 px-4" colSpan={1}>Closing Balance</td>
                                    <td className="py-2 px-4" ></td>
                                    <td className="py-2 px-4" >{totals.debit.toFixed(2)}</td>
                                    <td className="py-2 px-4" >{totals.credit.toFixed(2)}</td>
                                    <td className="py-2 px-4">{totals.total.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showOrderModal && <AddOrder1 closeModal={closeModal} />}
            <Footer />
        </>
    );
};

export default AllTransaction3;
