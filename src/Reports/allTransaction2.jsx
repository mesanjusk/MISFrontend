import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TopNavbar from '../Pages/topNavbar';
import Footer from '../Pages/footer';
import AddOrder1 from "../Pages/addOrder1";

const AllTransaction2 = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
     const [showOrderModal, setShowOrderModal] = useState(false);

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

    const handleEdit = () => {
       
    };

    return (
        <>
            <div className="no-print">
                <TopNavbar />
            </div>
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
                <button onClick={handlePrint} className="btn">
                            <svg className="h-8 w-8 text-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9V3h12v6M6 15h12m-6 0v6m0 0H9m3 0h3" />
                            </svg>
                        </button>
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
                                        <th>Description</th>
                                        <th>Credit</th>
                                        <th>Debit </th>
                                        <th>Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEntries.map((entry, id) => {
                                        const customerName = customerMap[entry.Account_id] || 'Unknown';

                                        return (
                                            <tr key={id}>
                                                <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>{entry.Transaction_id}</td>
                                                <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>{new Date(entry.Transaction_date).toLocaleDateString()}</td>
                                                <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>{customerName}</td> 
                                                <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>{entry.Description}</td>                                         
                                                <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>{entry.Type === 'Debit' ? entry.Amount : '0'}</td>
                                                <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>{entry.Type === 'Credit' ? entry.Amount : '0'}</td>
                                                <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>{entry.Balance}</td> 
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
                <div className="fixed bottom-20 right-8">
                    <button
                        onClick={handleOrder}
                        className="w-12 h-12 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center"
                    >
                        <svg
                            className="h-8 w-8 text-white-500"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path stroke="none" d="M0 0h24v24H0z" />
                            <circle cx="12" cy="12" r="9" />
                            <line x1="9" y1="12" x2="15" y2="12" />
                            <line x1="12" y1="9" x2="12" y2="15" />
                        </svg>
                    </button>
                </div>
            </div>
            {showOrderModal && (
                                        <div className="modal-overlay">
                                            <div className="modal-content">
                                                <AddOrder1 closeModal={closeModal} />
                                            </div>
                                        </div>
                                    )}
             <div className="no-print">
                <Footer />
            </div>
        </>
    );
};

export default AllTransaction2;

