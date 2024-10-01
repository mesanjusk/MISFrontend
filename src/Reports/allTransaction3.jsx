import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TopNavbar from '../Pages/topNavbar';
import Footer from '../Pages/footer';

const AllTransaction3 = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('CASH'); // Default search term set to "CASH"
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]); // Set to current date
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]); // Set to current date

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

                    // Automatically select the "CASH" customer if available
                    const cashCustomer = response.data.result.find(customer => customer.Customer_name === 'CASH');
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

        const total = totals.debit - totals.credit;

        return { debit: totals.debit, credit: totals.credit, total };
    };

    const totals = calculateTotals();

    useEffect(() => {
        handleSearch(); // Call handleSearch when component mounts or dependencies change
    }, [transactions, selectedCustomer, startDate, endDate]);

    return (
        <>
            <TopNavbar />
            <div className="pt-12 pb-20">
                <div className="d-flex flex-wrap bg-white w-100 p-2">
                    <label>
                        Start :
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </label>
                    <label>
                        End :
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </label>
                </div>
                <div className="d-flex flex-wrap bg-white w-100 max-w-md p-2 mx-auto">
                    <input
                        type="text"
                        placeholder="Search Customer"
                        value={customerSearchTerm}
                        onChange={handleSearchInputChange}
                        className="mr-2"
                    />
                    {filteredCustomers.length > 0 && (
                        <ul className="absolute bg-white border border-gray-300 z-10">
                            {filteredCustomers.map((customer) => (
                                <li
                                    key={customer.Customer_uuid}
                                    className="cursor-pointer p-1 hover:bg-gray-200"
                                    onClick={() => handleCustomerSelect(customer)}
                                >
                                    {customer.Customer_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="d-flex justify-content-center">
                    <button onClick={handleSearch} className="bg-green-600 text-white px-2 py-1 mr-2 rounded">
                        Search
                    </button>
                </div>
                <main className="flex flex-1 p-1 overflow-y-auto">
                    <div className="w-100 max-w-md mx-auto">
                        {filteredEntries.length > 0 ? (
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Date</th>
                                        <th>Name</th>
                                        <th>Debit</th>
                                        <th>Credit</th>
                                        <th>Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEntries.map((entry, index) => {
                                        const customerName = customerMap[entry.Account_id] || 'Unknown';

                                        return (
                                            <tr key={index}>
                                                <td>{entry.Transaction_id}</td>
                                                <td>{new Date(entry.Transaction_date).toLocaleDateString()}</td>
                                                <td>{customerName}</td>                                          
                                                <td>{entry.Type === 'Debit' ? entry.Amount : '0'}</td>
                                                <td>{entry.Type === 'Credit' ? entry.Amount : '0'}</td>
                                                <td>{entry.Balance}</td> 
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
                            <p>No transactions found.</p>
                        )}
                    </div>
                </main>
            </div>
            <Footer />
        </>
    );
};

export default AllTransaction3;
