import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";
import EditCustomer from './editCustomer';
import AddCustomer from '../Pages/addCustomer';

const CustomerReport = () => {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('Customer_name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [userGroup, setUserGroup] = useState('');
    const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

    useEffect(() => {
        const fetchUserGroup = () => {
            const group = localStorage.getItem("User_group");
            setUserGroup(group);
        };
        fetchUserGroup();

        axios.get("/customer/GetCustomersList")
            .then(res => {
                if (res.data.success) {
                    const sorted = res.data.result.sort((a, b) => a.Customer_name.localeCompare(b.Customer_name));
                    setCustomers(sorted);
                }
            })
            .catch(err => console.log('Error fetching customer list:', err));
    }, []);

    const handleSort = (field) => {
        const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(newOrder);

        const sorted = [...customers].sort((a, b) => {
            const aField = a[field] || '';
            const bField = b[field] || '';
            if (field === 'LastInteraction') {
                return newOrder === 'asc' 
                    ? new Date(aField) - new Date(bField) 
                    : new Date(bField) - new Date(aField);
            }
            return newOrder === 'asc'
                ? aField.toString().localeCompare(bField.toString())
                : bField.toString().localeCompare(aField.toString());
        });

        setCustomers(sorted);
    };

    const filteredCustomers = customers.filter(c => {
        const term = searchTerm.toLowerCase();
        return (
            c.Customer_name?.toLowerCase().includes(term) ||
            c.Mobile_number?.toString().includes(term)
        );
    });

    const handleDeleteConfirm = async () => {
        if (!selectedCustomer || !selectedCustomer._id) return;
        try {
            const [orderResponse, transactionResponse] = await Promise.all([
                axios.get(`/order/CheckCustomer/${selectedCustomer._id}`),
                axios.get(`/transaction/CheckCustomer/${selectedCustomer._id}`)
            ]);

            if (orderResponse.data.exists || transactionResponse.data.exists) {
                setDeleteErrorMessage("This customer cannot be deleted due to linked records.");
                return;
            }

            const deleteResponse = await axios.delete(`/customer/DeleteCustomer/${selectedCustomer._id}`);
            if (deleteResponse.data.success) {
                setCustomers(prev => prev.filter(c => c._id !== selectedCustomer._id));
            }
        } catch (err) {
            console.error("Error deleting customer:", err);
            setDeleteErrorMessage("An error occurred while deleting the customer.");
        }
        setShowDeleteModal(false);
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5] text-[#111b21]">
            <div className="no-print">
                <TopNavbar />
            </div>

            <div className="px-4 py-6">
                <div className="bg-white max-w-6xl mx-auto rounded-xl shadow-md p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                        <input 
                            type="text" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            placeholder="Search by name or mobile" 
                            className="w-full sm:w-2/3 border border-gray-300 rounded-md p-2 focus:outline-none"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => window.print()} className="text-green-600 hover:text-green-700">🖨️ Print</button>
                            <button onClick={() => setShowAddModal(true)} className="bg-[#25D366] hover:bg-[#20c95c] text-white font-medium py-2 px-4 rounded-md">
                                ➕ Add Customer
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white mt-4 max-w-6xl mx-auto rounded-xl shadow-md p-4 overflow-auto">
                    <table className="w-full table-auto text-sm text-left text-gray-700">
                        <thead className="bg-[#e5e5e5] text-gray-800 cursor-pointer">
                            <tr>
                                {["Customer_name", "Mobile_number", "Customer_group", "Status", "LastInteraction", "Tags"]
                                    .map(header => (
                                        <th key={header} className="px-4 py-2" onClick={() => handleSort(header)}>
                                            {header.replace(/_/g, ' ')} {sortField === header ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                                        </th>
                                    ))}
                                {userGroup === "Admin User" && <th className="px-4 py-2">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(c => (
                                <tr key={c._id} className="hover:bg-[#f0f2f5]">
                                    <td className="px-4 py-2 cursor-pointer" onClick={() => { setSelectedCustomerId(c._id); setShowEditModal(true); }}>{c.Customer_name}</td>
                                    <td className="px-4 py-2 cursor-pointer">{c.Mobile_number}</td>
                                    <td className="px-4 py-2">{c.Customer_group}</td>
                                    <td className="px-4 py-2">{c.Status}</td>
                                    <td className="px-4 py-2">{new Date(c.LastInteraction).toLocaleDateString()}</td>
                                    <td className="px-4 py-2">{c.Tags.join(', ')}</td>
                                    {userGroup === "Admin User" && (
                                        <td className="px-4 py-2">
                                            <button onClick={() => { setSelectedCustomer({ ...c }); setShowDeleteModal(true); }} className="text-red-500 hover:text-red-600">🗑️</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCustomers.length === 0 && <p className="text-center text-gray-500 py-4">No matching customers found.</p>}
                </div>
            </div>

            {/* Modals */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <EditCustomer customerId={selectedCustomerId} closeModal={() => setShowEditModal(false)} />
                    </div>
                </div>
            )}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <h4 className="text-lg font-semibold mb-4">Are you sure you want to delete {selectedCustomer?.Customer_name}?</h4>
                        {deleteErrorMessage && <p className="text-red-500 mb-2">{deleteErrorMessage}</p>}
                        <div className="flex justify-end gap-4">
                            <button onClick={handleDeleteConfirm} className="bg-red-500 text-white px-4 py-2 rounded-md">Yes</button>
                            <button onClick={() => setShowDeleteModal(false)} className="bg-gray-300 px-4 py-2 rounded-md">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <AddCustomer closeModal={() => setShowAddModal(false)} />
                    </div>
                </div>
            )}

            <div className="no-print">
                <Footer />
            </div>
        </div>
    );
};

export default CustomerReport;
