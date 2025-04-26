import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";
import EditCustomer from './editCustomer';
import AddCustomer from '../Pages/addCustomer';

const CustomerReport = () => {
    const [customer, setCustomer] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [userGroup, setUserGroup] = useState('');
    const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

    useEffect(() => {
        const fetchUserGroup = async () => {
            const group = localStorage.getItem("User_group");
            setUserGroup(group);
        };

        fetchUserGroup();

        axios.get("customer/GetCustomersList")
            .then(res => {
                if (res.data.success) {
                    const customerMap = res.data.result.reduce((acc, customer) => {
                        if (customer.Customer_name) {
                            acc[customer._id] = {
                                name: customer.Customer_name,
                                mobile: customer.Mobile_number,
                                group: customer.Customer_group
                            };
                        }
                        return acc;
                    }, {});
                    setCustomer(customerMap);
                } else {
                    setCustomer({});
                }
            })
            .catch(err => console.log('Error fetching customer list:', err));
    }, []);

    const handleEdit = (customerId) => {
        setSelectedCustomerId(customerId);
        setShowEditModal(true);
    };

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
                setCustomer((prevCustomers) => {
                    const updatedCustomers = { ...prevCustomers };
                    delete updatedCustomers[selectedCustomer._id];
                    return updatedCustomers;
                });
            }
        } catch (error) {
            console.error("Error deleting customer:", error);
            setDeleteErrorMessage("An error occurred while deleting the customer.");
        }

        setShowDeleteModal(false);
    };

    const handleDeleteClick = (customerId) => {
        setSelectedCustomer({ ...customer[customerId], _id: customerId });
        setShowDeleteModal(true);
        setDeleteErrorMessage("");
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
    };

    const handleAddCustomer = () => {
        setShowAddModal(true);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5] text-[#111b21]">
            <div className="no-print">
                <TopNavbar />
            </div>

            <div className="px-4 py-6">
                <div className="bg-white max-w-3xl mx-auto rounded-xl shadow-md p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                        <input 
                            type="text" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            placeholder="Search by name or mobile" 
                            className="w-full sm:w-2/3 border border-gray-300 rounded-md p-2 focus:outline-none"
                        />
                        <button onClick={handlePrint} className="text-green-600 hover:text-green-700">
                            🖨️ Print
                        </button>
                        <button onClick={handleAddCustomer} className="bg-[#25D366] hover:bg-[#20c95c] text-white font-medium py-2 px-4 rounded-md">
                            ➕ Add Customer
                        </button>
                    </div>
                </div>

                <div className="bg-white mt-4 max-w-3xl mx-auto rounded-xl shadow-md p-4">
                    {Object.keys(customer).length > 0 ? (
                        <table className="w-full table-auto text-sm text-left text-gray-700">
                            <thead className="bg-[#e5e5e5] text-gray-800">
                                <tr>
                                    <th className="px-4 py-2">Name</th>
                                    <th className="px-4 py-2">Mobile</th>
                                    {userGroup === "Admin User" && <th className="px-4 py-2">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(customer)
                                    .filter(([id, c]) => {
                                        const search = searchTerm.toLowerCase();
                                        return c.name?.toLowerCase().includes(search) || c.mobile?.toString().includes(search);
                                    })
                                    .map(([id, c]) => (
                                        <tr key={id} className="hover:bg-[#f0f2f5]">
                                            <td className="px-4 py-2 cursor-pointer" onClick={() => handleEdit(id)}>{c.name}</td>
                                            <td className="px-4 py-2 cursor-pointer" onClick={() => handleEdit(id)}>{c.mobile}</td>
                                            {userGroup === "Admin User" && (
                                                <td className="px-4 py-2">
                                                    <button onClick={() => handleDeleteClick(id)} className="text-red-500 hover:text-red-600">🗑️</button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-500">No data available for the selected filters.</p>
                    )}
                </div>
            </div>

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
                        <h4 className="text-lg font-semibold mb-4">Are you sure you want to delete {selectedCustomer?.name}?</h4>
                        {deleteErrorMessage && <p className="text-red-500 mb-2">{deleteErrorMessage}</p>}
                        <div className="flex justify-end gap-4">
                            <button onClick={handleDeleteConfirm} className="bg-red-500 text-white px-4 py-2 rounded-md">Yes</button>
                            <button onClick={handleDeleteCancel} className="bg-gray-300 px-4 py-2 rounded-md">Cancel</button>
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
