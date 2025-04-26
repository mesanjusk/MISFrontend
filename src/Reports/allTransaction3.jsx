import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TopNavbar from '../Pages/topNavbar';
import Footer from '../Pages/footer';

const AllTransaction3 = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('Cash'); 
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]); 
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    
    const [sortConfig, setSortConfig] = useState({
        key: 'Transaction_date',
        direction: 'desc',
    });

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

                    const cashCustomer = response.data.result.find(customer => customer.Customer_name === 'Cash');
                    if (cashCustomer) {
                        setSelectedCustomer(cashCustomer);
                        setCustomerSearchTerm(cashCustomer.Customer_name);
                    }
                }
            } catch (error) {
                console.error('Error fetching customers:', error);
            }
        };

        fetchTransactions();
        fetchCustomers();
    }, []);

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

        const transactionIds = transactions
            .filter(transaction =>
                transaction.Journal_entry.some(entry => entry.Account_id === customerUUID) &&
                (!startDate || new Date(transaction.Transaction_date) >= new Date(startDate)) &&
                (!endDate || new Date(transaction.Transaction_date) <= new Date(endDate))
            )
            .map(transaction => transaction.Transaction_id);

        const filtered = transactions.flatMap(transaction => {
            if (transactionIds.includes(transaction.Transaction_id)) {
                return transaction.Journal_entry
                    .filter(entry => entry.Account_id !== customerUUID)
                    .map(entry => ({
                        ...entry,
                        Transaction_id: transaction.Transaction_id,
                        Transaction_date: transaction.Transaction_date,
                    }));
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
                Balance: runningDebit - runningCredit, 
            };
        });

        // Sort the entries by date in descending order (most recent first)
        const sortedEntries = updatedEntries.sort((a, b) => {
            return new Date(b.Transaction_date) - new Date(a.Transaction_date);
        });

        setFilteredEntries(sortedEntries);
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

        const total = totals.debit - totals.credit;

        return { debit: totals.debit, credit: totals.credit, total };
    };

    const totals = calculateTotals();

    useEffect(() => {
        handleSearch(); 
    }, [transactions, selectedCustomer, startDate, endDate]);

    const handlePrint = () => {
        window.print();
    };

    const handleSort = (column) => {
        let direction = 'asc';
        if (sortConfig.key === column && sortConfig.direction === 'asc') {
            direction = 'desc';
        }

        setSortConfig({ key: column, direction });

        const sortedEntries = [...filteredEntries].sort((a, b) => {
            if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
            if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredEntries(sortedEntries);
    };

    const handleSaveAsPDF = () => {
        const doc = new jsPDF();
        const currentDate = new Date().toLocaleDateString();
        
        // Title and Date
        doc.setFontSize(18);
        doc.text(`Transactions Report - ${currentDate}`, 14, 20);

        // Table header
        const headers = ['No', 'Date', 'Name', 'Debit', 'Credit', 'Balance'];
        const rows = filteredEntries.map(entry => [
            entry.Transaction_id,
            new Date(entry.Transaction_date).toLocaleDateString(),
            customerMap[entry.Account_id] || 'Unknown',
            entry.Type === 'Debit' ? entry.Amount : '0',
            entry.Type === 'Credit' ? entry.Amount : '0',
            entry.Balance,
        ]);

        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 30,
            theme: 'striped',
        });

        // Save PDF
        doc.save(`${selectedCustomer.Customer_name}_transactions_${currentDate}.pdf`);
    };

    return (
        <>
            <div className="no-print">
                <TopNavbar />
            </div>
            <div className="pt-12 pb-20 bg-gray-50">
                <div className="flex flex-wrap bg-white w-full p-4 rounded-md shadow-md mb-6">
                    <label className="text-sm font-medium mr-4">
                        Start Date:
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="ml-2 px-4 py-2 border rounded-md"
                        />
                    </label>
                    <label className="text-sm font-medium mr-4">
                        End Date:
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="ml-2 px-4 py-2 border rounded-md"
                        />
                    </label>
                    <button 
                        onClick={handlePrint} 
                        className="ml-auto bg-green-600 text-white p-3 rounded-full hover:bg-green-500 focus:outline-none transition-colors"
                    >
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9V3h12v6M6 15h12m-6 0v6m0 0H9m3 0h3" />
                        </svg>
                    </button>
                </div>
                <div className="relative max-w-md mx-auto my-4 p-2 bg-white border rounded-md shadow-md">
                    <input
                        type="text"
                        placeholder="Search Customer"
                        value={customerSearchTerm}
                        onChange={handleSearchInputChange}
                        className="w-full p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {filteredCustomers.length > 0 && (
                        <ul className="absolute top-full left-0 w-full bg-white border mt-2 rounded-md shadow-lg z-10">
                            {filteredCustomers.map((customer) => (
                                <li
                                    key={customer.Customer_uuid}
                                    className="cursor-pointer p-2 hover:bg-gray-200"
                                    onClick={() => handleCustomerSelect(customer)}
                                >
                                    {customer.Customer_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="flex justify-center mb-6">
                    <button 
                        onClick={handleSearch} 
                        className="bg-green-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-green-500 transition-colors"
                    >
                        Search
                    </button>
                </div>
                <main className="mt-6 overflow-x-auto">
                    <div className="w-full max-w-4xl mx-auto">
                        {filteredEntries.length > 0 ? (
                            <table className="min-w-full bg-white shadow-md rounded-md overflow-hidden">
                                <thead className="bg-green-600 text-white">
                                    <tr>
                                        <th 
                                            className="py-3 px-4 text-left cursor-pointer"
                                            onClick={() => handleSort('Transaction_id')}
                                        >
                                            No
                                        </th>
                                        <th 
                                            className="py-3 px-4 text-left cursor-pointer"
                                            onClick={() => handleSort('Transaction_date')}
                                        >
                                            Date
                                        </th>
                                        <th 
                                            className="py-3 px-4 text-left cursor-pointer"
                                            onClick={() => handleSort('Customer_name')}
                                        >
                                            Name
                                        </th>
                                        <th 
                                            className="py-3 px-4 text-left cursor-pointer"
                                            onClick={() => handleSort('Debit')}
                                        >
                                            Debit
                                        </th>
                                        <th 
                                            className="py-3 px-4 text-left cursor-pointer"
                                            onClick={() => handleSort('Credit')}
                                        >
                                            Credit
                                        </th>
                                        <th 
                                            className="py-3 px-4 text-left cursor-pointer"
                                            onClick={() => handleSort('Balance')}
                                        >
                                            Balance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEntries.map((entry, index) => {
                                        const customerName = customerMap[entry.Account_id] || 'Unknown';
                                        return (
                                            <tr key={index} className="hover:bg-gray-100">
                                                <td className="py-2 px-4">{entry.Transaction_id}</td>
                                                <td className="py-2 px-4">{new Date(entry.Transaction_date).toLocaleDateString('en-GB')}</td>
                                                <td className="py-2 px-4">{customerName}</td>                                          
                                                <td className="py-2 px-4">{entry.Type === 'Debit' ? entry.Amount : '0'}</td>
                                                <td className="py-2 px-4">{entry.Type === 'Credit' ? entry.Amount : '0'}</td>
                                                <td className="py-2 px-4">{entry.Balance}</td> 
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td><strong>Total</strong></td>
                                        <td colSpan="4">
                                            <strong>{totals.total}</strong>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        ) : (
                            <p className="text-center py-4">No transactions found.</p>
                        )}
                    </div>
                </main>
                <div className="flex justify-center mt-6">
                    <button 
                        onClick={handleSaveAsPDF} 
                        className="bg-blue-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-blue-500 transition-colors"
                    >
                        Save as PDF
                    </button>
                </div>
            </div>
            <div className="no-print">
                <Footer />
            </div>
        </>
    );
};

export default AllTransaction3;
