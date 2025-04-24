import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";
import EditCustomer from './editCustomer';
import AddCustomer from '../Pages/addCustomer';

const CustomerReport = () => {
    const [customer, setCustomer] = useState({});
    const [customerNames, setCustomerNames] = useState([]);
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
                    setCustomerNames(Object.values(customerMap).map(c => c.name));
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
        if (!selectedCustomer || !selectedCustomer._id) {
            console.error("No valid customer selected for deletion");
            return;
        }
    
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
        <>
            <div className="no-print">
                <TopNavbar />
            </div>

            <div className="print-content">
                <div className="pt-12 pb-20">
                    <div className="d-flex flex-wrap bg-white w-100 max-w-md p-2 mx-auto">
                    <label>
                         Search by Name or Mobile
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name or mobile" className="form-control" />
                    </label>
                        <button onClick={handlePrint} className="btn">
                            <svg className="h-8 w-8 text-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9V3h12v6M6 15h12m-6 0v6m0 0H9m3 0h3" />
                            </svg>
                        </button>
                    </div>
                    <div className="d-flex flex-wrap bg-white w-100 max-w-md p-2 mx-auto">
                    <button onClick={handleAddCustomer} type="button" className="p-3 rounded-full text-white bg-green-500 mb-3">
                        <svg className="h-8 w-8 text-white-500" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">  
                            <path stroke="none" d="M0 0h24v24H0z"/>  
                            <circle cx="12" cy="12" r="9" />  
                            <line x1="9" y1="12" x2="15" y2="12" />  
                            <line x1="12" y1="9" x2="12" y2="15" />
                        </svg>
                    </button>
                </div>
                    <main className="flex flex-1 p-1 overflow-y-auto">
                        <div className="w-100 max-w-md mx-auto">
                            {Object.keys(customer).length > 0 ? (
                                <table className="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Mobile</th>
                                            {userGroup === "Admin User" && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(customer)
                                            .filter(([id, customer]) => {
                                                const search = searchTerm.toLowerCase();
                                                const nameMatch = customer.name?.toLowerCase().includes(search);
                                                const mobileMatch = customer.mobile?.toString().toLowerCase().includes(search);
                                                return nameMatch || mobileMatch;
                                            })
                                            
                                            .map(([id, customer]) => (
                                                <tr key={id}>
                                                    <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>
                                                        {customer.name}
                                                    </td>
                                                    <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>
                                                        {customer.mobile}
                                                    </td>
                                                    {userGroup === "Admin User" && (
                                                        <td>
                                                            <button onClick={() => handleDeleteClick(id)} className="btn">
                                                                <svg className="h-6 w-6 text-red-500" width="12" height="12" viewBox="0 0 22 22" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path stroke="none" d="M0 0h24v24H0z" />
                                                                    <line x1="4" y1="7" x2="20" y2="7" />
                                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                                    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                                                                    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No data available for the selected filters.</p>
                            )}
                        </div>
                    </main>
                </div>
            </div>
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <EditCustomer customerId={selectedCustomerId} closeModal={() => setShowEditModal(false)} />
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4>Are you sure you want to delete {selectedCustomer?.name}?</h4>
                        <div className="modal-actions">
                            <button onClick={() => handleDeleteConfirm(selectedCustomer?._id)} className="btn btn-danger">Yes</button>
                            <button onClick={handleDeleteCancel} className="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <AddCustomer closeModal={() => setShowAddModal(false)} /> 
                    </div>
                </div>
            )}
            <div className="no-print">
                <Footer />
            </div>
        </>
    );
};

export default CustomerReport;
