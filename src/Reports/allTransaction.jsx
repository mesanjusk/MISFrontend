import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";

const AllTransaction = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [customers, setCustomers] = useState({});
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredCustomerNames, setFilteredCustomerNames] = useState([]);

    useEffect(() => {
        axios.get("/transaction/GetFilteredTransactions")
            .then(res => {
                if (res.data.success) {
                    setTransactions(res.data.result);
                    setFilteredTransactions(res.data.result); 
                } else {
                    console.error('Failed to fetch transactions:', res.data.message);
                }
            })
            .catch(err => console.log('Error fetching transactions:', err));

        axios.get("/customer/GetCustomersList")
            .then(res => {
                if (res.data.success) {
                    const customerMap = res.data.result.reduce((acc, customer) => {
                        acc[customer.Customer_uuid.trim()] = customer.Customer_name.trim();
                        return acc;
                    }, {});
                    setCustomers(customerMap);
                } else {
                    console.error('Failed to fetch customers:', res.data.message);
                }
            })
            .catch(err => console.log('Error fetching customers:', err));
    }, []);

    const handleSearch = () => {
        const filtered = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.Transaction_date);
            const isWithinDateRange =
                (!startDate || transactionDate >= new Date(startDate)) &&
                (!endDate || transactionDate <= new Date(endDate));

                const tranid = transaction.Transaction_id;

            

            return isWithinDateRange;
        });

        setFilteredTransactions(filtered);
    };

    
    useEffect(() => {
        if (searchTerm) {
            const filteredNames = Object.values(customers).filter(customerName =>
                customerName.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredCustomerNames(filteredNames);
            setShowDropdown(filteredNames.length > 0);
        } else {
            setShowDropdown(false);
            setFilteredCustomerNames([]);
        }
    }, [searchTerm, customers]);

    const handleCustomerSelect = (customerName) => {
        setSearchTerm(customerName);
        setShowDropdown(false); 
    };

    const calculateTotals = () => {
        let totalDebit = 0;
        let totalCredit = 0;

        filteredTransactions.forEach(transaction => {
            transaction.Journal_entry.forEach(entry => {
                const debit = (entry.Type === 'Debit') ? entry.Amount : 0;
                const credit = (entry.Type === 'Credit') ? entry.Amount : 0;

                totalDebit += debit;
                totalCredit += credit;
            });
        });

        return totalDebit - totalCredit;
    };

    const total = calculateTotals();

    return (
        <>
            <TopNavbar />
            <div className="pt-12 pb-20">
                <div className="d-flex flex-wrap bg-white w-100 p-2">
                    <label>
                        Start:
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </label>

                    <label>
                        End:
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </label>

                    <label>
                        Customer Name:
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowDropdown(e.target.value.length > 0); 
                            }}
                            placeholder="Search customer"
                        />
                    </label>

                    {showDropdown && filteredCustomerNames.length > 0 && (
                        <ul className="dropdown-menu">
                            {filteredCustomerNames.map((customerName) => (
                                <li key={customerName} onClick={() => handleCustomerSelect(customerName)}>
                                    {customerName}
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
                        {filteredTransactions.length > 0 ? (
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>No.</th>
                                        <th>Name</th>
                                        <th>Credit</th>
                                        <th>Debit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map((transaction, index) => (
                                        transaction.Journal_entry.map((entry, idx) => {
                                            const normalizedAccountId = entry.Account_id?.trim();
                                            const customerName = customers[normalizedAccountId];

                                            if (customerName && customerName.toLowerCase() === searchTerm.toLowerCase()) {
                                                return (
                                                    <tr key={`${index}-${idx}`}>
                                                        <td>{new Date(transaction.Transaction_date).toLocaleDateString()}</td>
                                                        <td>{transaction.Transaction_id}</td>
                                                        <td>{customerName}</td>
                                                        <td>{entry.Type === 'Credit' ? entry.Amount : 0}</td>
                                                        <td>{entry.Type === 'Debit' ? entry.Amount : 0}</td>
                                                    </tr>
                                                );
                                            }
                                            return null;
                                        })
                                    ))} 
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td><strong>Total</strong></td>
                                        <td colSpan={2}><strong>{total}</strong></td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        ) : (
                            <p>No data available for the selected filters.</p>
                        )}
                    </div>
                </main>
            </div>
            <Footer />
        </>
    );
};

export default AllTransaction;
