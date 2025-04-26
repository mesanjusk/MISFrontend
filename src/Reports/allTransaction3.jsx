import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import TopNavbar from '../Pages/topNavbar';
import Footer from '../Pages/footer';
import AddOrder1 from "../Pages/addOrder1";

const AllTransaction3 = () => {
    const [transactions, setTransactions] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

    const location = useLocation();
    const { uuid: customerUuid, name: customerName } = location.state?.customer || {}; // 🛠️ fixed

    // Fetch data on component mount
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

    const customerTransactions = transactions.filter(transaction => {
        const matchingEntries = transaction.Journal_entry.filter(entry => entry.Account_id === customerUuid);
        return matchingEntries.length > 0;
    });

    const calculateTotals = () => {
        const totals = customerTransactions.reduce(
            (acc, transaction) => {
                transaction.Journal_entry.forEach(entry => {
                    if (entry.Account_id === customerUuid) {
                        if (entry.Type === 'Debit') {
                            acc.debit += entry.Amount || 0;
                        } else if (entry.Type === 'Credit') {
                            acc.credit += entry.Amount || 0;
                        }
                    }
                });
                return acc;
            },
            { debit: 0, credit: 0 }
        );

        const total = totals.credit - totals.debit;
        return { debit: totals.debit, credit: totals.credit, total };
    };

    const totals = calculateTotals();

    const sortTable = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedEntries = [...customerTransactions].sort((a, b) => {
            const aValue = a[key] || '';
            const bValue = b[key] || '';
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        setTransactions(sortedEntries);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleOrder = () => {
        setShowOrderModal(true);
    };

    const closeModal = () => {
        setShowOrderModal(false);
    };

    return (
        <>
            <div className="no-print">
                <TopNavbar />
            </div>
            <div className="pt-12 pb-20">
                <main className="overflow-x-auto mt-6">
                    <div className="w-full overflow-x-scroll">
                        {customerTransactions.length > 0 ? (
                            <table className="min-w-full table-auto border-collapse">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th onClick={() => sortTable("Transaction_id")} className="py-2 px-4 cursor-pointer">No</th>
                                        <th onClick={() => sortTable("Transaction_date")} className="py-2 px-4 cursor-pointer">Date</th>
                                        <th onClick={() => sortTable("Account_id")} className="py-2 px-4 cursor-pointer">Name</th>
                                        <th onClick={() => sortTable("Description")} className="py-2 px-4 cursor-pointer">Description</th>
                                        <th onClick={() => sortTable("Debit")} className="py-2 px-4 cursor-pointer">Credit</th>
                                        <th onClick={() => sortTable("Credit")} className="py-2 px-4 cursor-pointer">Debit</th>
                                        <th onClick={() => sortTable("Balance")} className="py-2 px-4 cursor-pointer">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {(() => {
                                    let runningBalance = 0;
                                    return customerTransactions.flatMap((transaction, index) =>
                                    transaction.Journal_entry.filter(entry => entry.Account_id === customerUuid)
                                    .map((entry, entryIndex) => {
                                     if (entry.Type === 'Debit') {
                                        runningBalance -= entry.Amount || 0;
                                    } else if (entry.Type === 'Credit') {
                                     runningBalance += entry.Amount || 0;
                                    }

                                 return (
                                     <tr key={`${index}-${entryIndex}`} className="border-t hover:bg-gray-50">
                                        <td className="py-2 px-4">{transaction.Transaction_id}</td>
                                        <td className="py-2 px-4">{new Date(transaction.Transaction_date).toLocaleDateString()}</td>
                                        <td className="py-2 px-4">{customerName}</td>
                                        <td className="py-2 px-4">{transaction.Description}</td>
                                        <td className="py-2 px-4">{entry.Type === 'Debit' ? entry.Amount : '0'}</td>
                                        <td className="py-2 px-4">{entry.Type === 'Credit' ? entry.Amount : '0'}</td>
                                        <td className="py-2 px-4">{runningBalance}</td>
                                    </tr>
                                );
                             })
                                );
                            })()}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-100">
                                        <td colSpan="6" className="py-2 px-4 text-right font-semibold">Total</td>
                                        <td className="py-2 px-4 font-semibold">{totals.total}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        ) : (
                            <p className="text-center text-gray-600">No transactions found.</p>
                        )}
                    </div>
                </main>

                <div className="fixed bottom-6 right-6">
                    <button
                        onClick={handleOrder}
                        className="w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-700"
                    >
                        <svg
                            className="h-8 w-8"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14m7-7H5" />
                        </svg>
                    </button>
                </div>
            </div>

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
        </>
    );
};

export default AllTransaction3;
