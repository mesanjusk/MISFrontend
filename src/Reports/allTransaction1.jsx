import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";

const AllTransaction1 = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [customers, setCustomers] = useState({});
    const [customerNames, setCustomerNames] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        axios.get("/transaction/GetFilteredTransactions")
            .then(res => {
                if (res.data.success) {
                    setTransactions(res.data.result);
                } else {
                    console.error('Failed to fetch transactions:', res.data.message);
                }
            })
            .catch(err => console.log('Error fetching transactions:', err));

        axios.get("/customer/GetCustomersList")
            .then(res => {
                if (res.data.success) {
                    const customerMap = res.data.result.reduce((acc, customer) => {
                        acc[customer.Customer_uuid.trim()] = customer.Customer_name;
                        return acc;
                    }, {});

                    setCustomers(customerMap);
                    const customerNameList = res.data.result.map(customer => customer.Customer_name);
                    setCustomerNames(customerNameList);
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

            const hasMatchingCustomer = transaction.Journal_entry.some(entry => {
                const customerName = customers[entry.Account_id?.trim()];
                return searchTerm ? customerName?.toLowerCase().includes(searchTerm.toLowerCase()) : true;
            });

            return isWithinDateRange && hasMatchingCustomer;
        });

        setFilteredTransactions(filtered); 
    };

    const uniqueEntries = [];
    const allowedPaymentNames = ["Cash", "UPI Office", "UPI SANJU SK", "BANK CHEQUE", "Sale"];

    const processFilteredTransactions = () => {
        uniqueEntries.length = 0; 
        filteredTransactions.forEach(transaction => {
            transaction.Journal_entry.forEach(entry => {
                const normalizedAccountId = entry.Account_id ? entry.Account_id.trim() : "";
                const paymentName = customers[normalizedAccountId] || transaction.Payment_mode;
                const tranid = transaction.Transaction_id;

                if (!allowedPaymentNames.includes(paymentName)) {
                    return; 
                }

                const debit = entry.Type === 'Debit' ? entry.Amount : 0;
                const credit = entry.Type === 'Credit' ? entry.Amount : 0;

                if (paymentName === "Sale") {
                    uniqueEntries.push({
                        date: new Date(transaction.Transaction_date).toLocaleDateString(),
                        debit,
                        credit,
                        tranid,
                        name: paymentName,
                    });
                } else {
                    if (debit > 0) {
                        uniqueEntries.push({
                            date: new Date(transaction.Transaction_date).toLocaleDateString(),
                            debit,
                            credit: 0,
                            tranid,
                            name: paymentName,
                        });
                    }

                    if (credit > 0) {
                        uniqueEntries.push({
                            date: new Date(transaction.Transaction_date).toLocaleDateString(),
                            debit: 0,
                            credit,
                            tranid,
                            name: paymentName,
                        });
                    }
                }
            });
        });
    };

    const calculateTotals = () => {
        let totalDebit = 0;
        let totalCredit = 0;

        uniqueEntries.forEach(entry => {
            totalDebit += entry.debit || 0;
            totalCredit += entry.credit || 0;
        });

        return totalDebit - totalCredit; 
    };

    processFilteredTransactions();

    const total = calculateTotals(); 

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
                    <label>
                        <input
                            list="customerNames"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by customer name"
                        />
                        <datalist id="customerNames">
                            {customerNames.map((name, index) => (
                                <option key={index} value={name} />
                            ))}
                        </datalist>
                    </label>
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
                                        <th>No. </th>
                                        <th>Name</th>
                                        <th>Credit</th>
                                        <th>Debit</th>
                                        
                                    </tr>
                                </thead>
                                <tbody>
                                    {uniqueEntries.map((row, index) => (
                                        <tr key={index}>
                                            <td>{row.date}</td>
                                            <td>{row.tranid}</td>
                                            <td>{row.name}</td>
                                            <td>{row.credit}</td>
                                            <td>{row.debit}</td>
                                           
                                        </tr>
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
}

export default AllTransaction;
