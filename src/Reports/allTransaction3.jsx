import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TopNavbar from '../Pages/topNavbar';
import Footer from '../Pages/footer';
import AddOrder1 from "../Pages/addOrder1";
import { FaWhatsapp } from 'react-icons/fa';

const AllTransaction3 = () => {
    const [transactions, setTransactions] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [outstandingReport, setOutstandingReport] = useState([]);
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
                uuid: customer.Customer_uuid,
                name: customer.Customer_name,
                mobile: customer.Mobile_number || 'No phone number', // Set default text if phone number is missing
                debit,
                credit,
                balance: credit - debit
            };
        }).filter(r => r.debit !== 0 || r.credit !== 0);

        setOutstandingReport(report);
    };

    const sendMessageToAPI = async (name, phone, balance) => {
        const today = new Date().toLocaleDateString('en-IN'); // format: DD/MM/YYYY
        const senderName = "S.K.Digital"; // <-- Your Company/Sender Name
    
        // Full proper message
        const messageText = `Customer Name: ${name}\nOutstanding Balance: ₹${balance}\nDate: ${today}\n\nKindly clear the pending amount at your earliest convenience.\n\nThank you,\n${senderName}`;
    
        const payload = {
            mobile: phone,           // Customer mobile number
            userName: name,          // Still pass customer name
            type: 'customer',        // Message type
            message: messageText     // IMPORTANT: pass full message here
        };
    
        console.log("Sending payload:", payload);
    
        try {
            const res = await fetch('https://misbackend-e078.onrender.com/usertask/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
    
            const result = await res.json();
            console.log("Message sent:", result);
    
            if (result.error) {
                alert("Failed to send: " + result.error);
            } else {
                alert("Message sent successfully.");
            }
        } catch (error) {
            console.error("Request failed:", error);
            alert("Failed to send message.");
        }
    };
    
    
    
    const sendWhatsApp = (name, phone, balance) => {
        if (phone === 'No phone number') {
            alert("No phone number available for this customer.");
            return;
        }

        // Call the sendMessageToAPI function to send the message via the backend API
        sendMessageToAPI(name, phone, balance);
    };

    return (
        <>
            <div className="no-print">
                <TopNavbar />
            </div>
            <div className="pt-12 pb-20">
                {/* Outstanding Report Table */}
                <div className="mt-6 max-w-4xl mx-auto bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4 text-center text-green-700">Outstanding Report</h2>
                    <table className="w-full table-auto text-sm border">
                        <thead className="bg-green-100 text-green-900">
                            <tr>
                                <th className="border px-3 py-2 text-left">Customer Name</th>
                                <th className="border px-3 py-2 text-left">Mobile Number</th>
                                <th className="border px-3 py-2 text-right">Balance</th>
                                <th className="border px-3 py-2 text-center">WhatsApp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {outstandingReport.map((item, index) => (
                                <tr key={index} className="border-t hover:bg-gray-50">
                                    <td className="px-3 py-2">{item.name}</td>
                                    <td className="px-3 py-2">{item.mobile}</td> {/* Display customer mobile */}
                                    <td className={`px-3 py-2 text-right ${item.balance < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                        ₹{item.balance}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        {item.mobile !== 'No phone number' && (
                                            <button onClick={() => sendWhatsApp(item.name, item.mobile, item.balance)}>
                                                <FaWhatsapp className="text-green-600 text-lg" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Order Modal */}
                {showOrderModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                            <AddOrder1 closeModal={() => setShowOrderModal(false)} />
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

export default AllTransaction3;
