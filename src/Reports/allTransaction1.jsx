import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TopNavbar from '../Pages/topNavbar';
import Footer from '../Pages/footer';
import AddOrder1 from "../Pages/addOrder1";

const AllTransaction1 = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
    const [outstandingReport, setOutstandingReport] = useState([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await axios.get('/transaction/GetFilteredTransactions');
                if (response.data.success) {
                    setTransactions(response.data.result);
                }
            } catch (error) {
                console.error('Error fetching transactions:', error);
            }
        };

        const fetchCustomers = async () => {
            try {
                const response = await axios.get('/customer/GetCustomersList');
                if (response.data.success) {
                    setCustomers(response.data.result);
                }
            } catch (error) {
                console.error('Error fetching customers:', error);
            }
        };

        fetchTransactions();
        fetchCustomers();
    }, []);

    useEffect(() => {
        generateOutstandingReport();
    }, [transactions, customers]);

    const generateOutstandingReport = () => {
        const report = customers.map(customer => {
            let debit = 0;
            let credit = 0;
            transactions.forEach(tx => {
                tx.Journal_entry.forEach(entry => {
                    if (entry.Account_id === customer.Customer_uuid) {
                        if (entry.Type === 'Debit') debit += entry.Amount || 0;
                        if (entry.Type === 'Credit') credit += entry.Amount || 0;
                    }
                });
            });
            return {
                name: customer.Customer_name,
                debit,
                credit,
                balance: credit - debit
            };
        }).filter(r => r.debit !== 0 || r.credit !== 0);

        setOutstandingReport(report);
    };

    const customerMap = customers.reduce((acc, customer) => {
        acc[customer.Customer_uuid] = customer.Customer_name;
        return acc;
    }, {});

    const handleSearchInputChange = (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        setCustomerSearchTerm(searchTerm);

        if (searchTerm) {
            const filtered = customers.filter(customer =>
                customer.Customer_name.toLowerCase().includes(searchTerm)
            );
            setFilteredCustomers(filtered);
        } else {
            setFilteredCustomers([]);
        }
    };

    const handleCustomerSelect = (customer) => {
        setSelectedCustomer(customer);
        setCustomerSearchTerm(customer.Customer_name);
        setFilteredCustomers([]);
    };

    const handleSearch = () => {
        if (!selectedCustomer) {
            setFilteredEntries([]);
            return;
        }

        const customerUUID = selectedCustomer.Customer_uuid;

        const filtered = transactions.flatMap(transaction => {
            const isWithinDateRange = (!startDate || new Date(transaction.Transaction_date) >= new Date(startDate)) &&
                                      (!endDate || new Date(transaction.Transaction_date) <= new Date(endDate));
            if (isWithinDateRange) {
                const customerEntries = transaction.Journal_entry.filter(entry => entry.Account_id === customerUUID);
                if (customerEntries.length > 0) {
                    return transaction.Journal_entry
                        .filter(entry => entry.Account_id !== customerUUID)
                        .map(entry => ({
                            ...entry,
                            Transaction_id: transaction.Transaction_id,
                            Transaction_date: transaction.Transaction_date,
                            Description: transaction.Description,
                        }));
                }
            }
            return [];
        });

        let runningDebit = 0;
        let runningCredit = 0;

        const updatedEntries = filtered.map(entry => {
            if (entry.Type === 'Debit') {
                runningDebit += entry.Amount || 0;
            } else if (entry.Type === 'Credit') {
                runningCredit += entry.Amount || 0;
            }

            return {
                ...entry,
                Balance: runningCredit - runningDebit,
            };
        });

        setFilteredEntries(updatedEntries);
    };

    const calculateTotals = () => {
        const totals = filteredEntries.reduce(
            (acc, entry) => {
                if (entry.Type === 'Debit') {
                    acc.debit += entry.Amount || 0;
                } else if (entry.Type === 'Credit') {
                    acc.credit += entry.Amount || 0;
                }
                return acc;
            },
            { debit: 0, credit: 0 }
        );

        const total = totals.credit - totals.debit;

        return { debit: totals.debit, credit: totals.credit, total };
    };

    const totals = calculateTotals();

    const handlePrint = () => {
        window.print();
    };

    const handleOrder = () => {
        setShowOrderModal(true);
    };

    const closeModal = () => {
        setShowOrderModal(false);
    };

    const sortTable = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedEntries = [...filteredEntries].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredEntries(sortedEntries);
    };

    return (
        <>
            <div className="no-print">
                <TopNavbar />
            </div>
            <div className="pt-12 pb-20">
                {/* Filters */}
                <div className="flex flex-wrap bg-white p-4 space-x-4">
                    <label className="flex flex-col">
                        Start :
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border rounded-md mt-2" />
                    </label>
                    <label className="flex flex-col">
                        End :
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border rounded-md mt-2" />
                    </label>
                </div>

                {/* Outstanding Report */}
                <div className="mt-6 max-w-4xl mx-auto bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4 text-center text-green-700">Outstanding Report</h2>
                    <table className="w-full table-auto text-sm border">
                        <thead className="bg-green-100 text-green-900">
                            <tr>
                                <th className="border px-3 py-2 text-left">Customer Name</th>
                                <th className="border px-3 py-2 text-right">Debit</th>
                                <th className="border px-3 py-2 text-right">Credit</th>
                                <th className="border px-3 py-2 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {outstandingReport.map((item, index) => (
                                <tr key={index} className="border-t hover:bg-gray-50">
                                    <td className="px-3 py-2">{item.name}</td>
                                    <td className="px-3 py-2 text-right">{item.debit}</td>
                                    <td className="px-3 py-2 text-right">{item.credit}</td>
                                    <td className={`px-3 py-2 text-right ${item.balance < 0 ? 'text-red-600' : 'text-green-700'}`}>{item.balance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* The rest remains unchanged */}
                {/* Your existing customer search and ledger view remains here */}

                {showOrderModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                            <AddOrder1 closeModal={closeModal} />
                        </div>
                    </div>
                )}

                <div className="no-print">
                    <Footer />
                </div>
            </div>
        </>
    );
};

export default AllTransaction1;
