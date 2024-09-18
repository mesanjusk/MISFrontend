import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";

const AllTransaction = () => {
    const [transactions, setTransactions] = useState([]);
    const [customers, setCustomers] = useState({});
    const [customerNames, setCustomerNames] = useState([]); 
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredTransaction, setFilteredTransaction] = useState(null);

    useEffect(() => {
        const fetchTransactions = axios.get("/transaction/GetTransactionList");
        const fetchCustomers = axios.get("/customer/GetCustomersList");

        Promise.all([fetchTransactions, fetchCustomers])
            .then(([transactionsRes, customersRes]) => {
                if (transactionsRes.data.success) {
                    setTransactions(transactionsRes.data.result);
                }

                if (customersRes.data.success) {
                    const customerMap = customersRes.data.result.reduce((acc, customer) => {
                        acc[customer.Customer_uuid] = customer.Customer_name;
                        return acc;
                    }, {});
                    setCustomers(customerMap);

                    const customerNameList = customersRes.data.result.map(customer => customer.Customer_name);
                    setCustomerNames(customerNameList);
                }
            })
            .catch(err => console.log('Error fetching data:', err));
    }, []);

    const handleSearch = () => {
        const filtered = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.Transaction_date);
            const isWithinDateRange = (!startDate || transactionDate >= new Date(startDate)) &&
                                      (!endDate || transactionDate <= new Date(endDate));
    
            const customerNamesInTransaction = transaction.Journal_entry.map(entry => {
                return customers[entry.Account_id] || "Unknown";
            }).join(", ");
    
            const matchesSearchTerm = customerNamesInTransaction.toLowerCase().includes(searchTerm.toLowerCase());
    
            return isWithinDateRange && matchesSearchTerm;
        });
    
        if (filtered.length > 0) {
            const firstMatch = filtered[0]; 

            const journalEntry = firstMatch.Journal_entry[0];
    
            const paymentName = firstMatch.Payment_mode || "Unknown";  
    
            const totalDebit = journalEntry.Type === 'Debit' ? journalEntry.Amount : 0;
            const totalCredit = journalEntry.Type === 'Credit' ? journalEntry.Amount : 0;
    
            setFilteredTransaction({
                Transaction_date: firstMatch.Transaction_date,
                totalDebit,
                totalCredit,
                paymentName, 
            });
        } else {
            setFilteredTransaction(null); 
        }
    };
    

    return (
        <>
            <TopNavbar />
            <div className="pt-12 pb-20">
                <div className="d-flex flex-wrap bg-white w-100 max-w-md p-2 mx-auto">
                    <label>
                        Start Date:
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </label>
                    </div>
                    <div className="d-flex flex-wrap bg-white w-100 max-w-md p-2 mx-auto">
                    <label>
                        End Date:
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
                    <button onClick={handleSearch} className="btn btn-primary">
                        Search
                    </button>
                </div>

                <main className="flex flex-1 p-1 overflow-y-auto">
    <div className="w-100 max-w-md mx-auto">
        {filteredTransaction ? (
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Debit</th>
                        <th>Credit</th>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{new Date(filteredTransaction.Transaction_date).toLocaleDateString()}</td>
                        <td>{filteredTransaction.totalDebit}</td>
                        <td>{filteredTransaction.totalCredit}</td>
                        <td>{filteredTransaction.paymentName}</td> 
                    </tr>
                </tbody>
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
