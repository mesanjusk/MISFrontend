import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";
import EditCustomer from './editCustomer';
import AddCustomer from '../Pages/addCustomer'; 

const CustomerReport = () => {
    const [customers, setCustomers] = useState({});
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

        axios.get("/customer/GetCustomersList")
            .then(res => {
                if (res.data.success) {
                    const customerMap = res.data.result.reduce((acc, customer) => {
                        if (customer.Customer_uuid && customer.Customer_name && customer.Mobile_number) { 
                            acc[customer._id] = {
                                name: customer.Customer_name,
                                mobile: customer.Mobile_number,
                                group: customer.Customer_group,
                                customerUuid: customer.Customer_uuid 
                            };
                        }
                        return acc;
                    }, {});
                    
                    setCustomers(customerMap);
                    setCustomerNames(Object.values(customerMap).map(c => c.name));
                } else {
                    setCustomers({});
                }
            })
            .catch(err => console.log('Error fetching customers list:', err));
    }, []);

    const handleEdit = (customerId) => {
        setSelectedCustomerId(customerId); 
        setShowEditModal(true); 
    };

    const handleDeleteClick = (customerId) => {
        const customerToDelete = customers[customerId];
        if (customerToDelete) {
            setSelectedCustomer(customerToDelete);
            setShowDeleteModal(true);
            setDeleteErrorMessage(''); 
        } else {
            console.error('Customer not found for ID:', customerId);
        }
    };
    

    const handleDeleteConfirm = () => {
        console.log('Selected Customer for deletion:', selectedCustomer);
        if (!selectedCustomer || !selectedCustomer.customerUuid) {
            console.error('No valid customer selected for deletion');
            return;
        }
    
        const customerUuid = selectedCustomer.customerUuid;
    
        Promise.all([
            axios.get(`/order/CheckCustomer/${customerUuid}`),
            axios.get(`/transaction/CheckCustomer/${customerUuid}`)
        ])
        .then(([orderResponse, transactionResponse]) => {
            if (orderResponse.data.exists && transactionResponse.data.exists) {
                alert('This customer cannot be deleted because they exist in both Order and Transaction tables.');
                setDeleteErrorMessage('This customer cannot be deleted because they exist in both Order and Transaction tables.');
            } else if (orderResponse.data.exists) {
                alert('This customer cannot be deleted because they exist in the Order table.');
                setDeleteErrorMessage('This customer cannot be deleted because they exist in the Order table.');
            } else if (transactionResponse.data.exists) {
                alert('This customer cannot be deleted because they exist in the Transaction table.');
                setDeleteErrorMessage('This customer cannot be deleted because they exist in the Transaction table.');
            } else {
                return axios.delete(`/customer/DeleteCustomer/${customerUuid}`);
            }
        })
        .then(res => {
            if (res && res.data.success) {
                setCustomers(prevCustomers => {
                    const newCustomers = { ...prevCustomers };
                    const idToDelete = Object.keys(newCustomers).find(id => newCustomers[id].customerUuid === customerUuid);
                    if (idToDelete) {
                        delete newCustomers[idToDelete];
                    }
                    return newCustomers;
                });
            }
        })
        .catch(err => {
            console.log('Error deleting customer:', err);
            setDeleteErrorMessage('An error occurred while deleting the customer.');
        });
    
        setShowDeleteModal(false); 
    };
    

    const handleDeleteCancel = () => {
        setShowDeleteModal(false); 
    };

    const handleAddCustomer = () => {
        setShowAddModal(true); 
    };

    return (
        <>
            <TopNavbar />
            <div className="pt-12 pb-20">
                <div className="d-flex flex-wrap bg-white w-100 max-w-md p-2 mx-auto">
                    <label>
                        Search by Customer Name or Group
                        <input
                            list="customerNames"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by customer name or group"
                        />
                    </label>
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
                        {Object.keys(customers).length > 0 ? (
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Mobile</th>
                                        {userGroup === "Admin User" && <th>Actions</th>} 
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(customers)
                                        .filter(([id, customer]) =>
                                            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (customer.group && customer.group.toLowerCase().includes(searchTerm.toLowerCase()))
                                        )
                                        .map(([id, customer]) => (
                                            <tr key={id}>
                                                <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>
                                                    {customer.name}
                                                </td>
                                                <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>
                                                    {customer.mobile}
                                                </td>
                                                <td>
                                                    {userGroup === "Admin User" && (
                                                        <button onClick={() => handleDeleteClick(id)} className="btn">
                                                            <svg className="h-6 w-6 text-red-500" width="12" height="12" viewBox="0 0 22 22" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">  
                                                                <path stroke="none" d="M0 0h24v24H0z"/>  
                                                                <line x1="4" y1="7" x2="20" y2="7" />  
                                                                <line x1="10" y1="11" x2="10" y2="17" />  
                                                                <line x1="14" y1="11" x2="14" y2="17" />  
                                                                <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />  
                                                                <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </td>
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
                            <button onClick={handleDeleteConfirm} className="btn btn-danger">Yes</button>
                            <button onClick={handleDeleteCancel} className="btn btn-secondary">Cancel</button>
                        </div>
                        {deleteErrorMessage && <p className="text-red-500">{deleteErrorMessage}</p>}
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

            <Footer />
        </>
    );
};

export default CustomerReport;
