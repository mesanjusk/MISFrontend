import React, { useState, useEffect } from "react";
import axios from "axios";
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";
import EditCustomer from "./editCustomer";
import AddCustomer from "../Pages/addCustomer";

const CustomerReport = () => {
    const [customers, setCustomers] = useState([]);  // Store as an array instead of an object
    const [searchTerm, setSearchTerm] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [userGroup, setUserGroup] = useState("");
    const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const group = localStorage.getItem("User_group");
                setUserGroup(group);

                const res = await axios.get("/customer/GetCustomersList");
                console.log("API Response:", res.data);

                if (res.data.success && Array.isArray(res.data.result)) {
                    setCustomers(res.data.result); // Directly store as an array
                } else {
                    setCustomers([]);
                    console.warn("No customers returned from API.");
                }
            } catch (error) {
                console.error("Error fetching customers list:", error);
            }
        };

        fetchCustomers();
    }, []);

    const handleEdit = (customerId) => {
        setSelectedCustomerId(customerId);
        setShowEditModal(true);
    };

    const handleDeleteClick = (customer) => {
        setSelectedCustomer(customer);
        setShowDeleteModal(true);
        setDeleteErrorMessage("");
    };

    const filteredCustomers = customers.filter((customer) => {
        const name = customer.Customer_name?.toLowerCase() || "";
        const mobile = customer.Mobile_number ? String(customer.Mobile_number) : "";
        const group = customer.Customer_group?.toLowerCase() || "";

        return (
            name.includes(searchTerm.toLowerCase()) ||
            mobile.includes(searchTerm) ||
            group.includes(searchTerm.toLowerCase())
        );
    });

    const handleDeleteConfirm = async () => {
        if (!selectedCustomer || !selectedCustomer.Customer_uuid) {
            console.error("No valid customer selected for deletion");
            return;
        }

        const customerUuid = selectedCustomer.Customer_uuid;

        try {
            const [orderResponse, transactionResponse] = await Promise.all([
                axios.get(`/order/CheckCustomer/${customerUuid}`),
                axios.get(`/transaction/CheckCustomer/${customerUuid}`)
            ]);

            if (orderResponse.data.exists || transactionResponse.data.exists) {
                setDeleteErrorMessage("This customer cannot be deleted due to linked records.");
                return;
            }

            const deleteResponse = await axios.delete(`/customer/DeleteCustomer/${customerUuid}`);
            if (deleteResponse.data.success) {
                setCustomers((prevCustomers) =>
                    prevCustomers.filter((c) => c.Customer_uuid !== customerUuid)
                );
            }
        } catch (error) {
            console.error("Error deleting customer:", error);
            setDeleteErrorMessage("An error occurred while deleting the customer.");
        }

        setShowDeleteModal(false);
    };

    return (
        <>
            <TopNavbar />
            <div className="pt-12 pb-20">
                <div className="d-flex flex-wrap bg-white w-100 max-w-md p-2 mx-auto">
                    <label>
                        Search by Customer Name or Mobile
                        <input
                            type="text"
                            placeholder="Search by Name or Mobile"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </label>
                </div>

                <div className="d-flex flex-wrap bg-white w-100 max-w-md p-2 mx-auto">
                    <button
                        onClick={() => setShowAddModal(true)}
                        type="button"
                        className="p-3 rounded-full text-white bg-green-500 mb-3"
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

                <main className="flex flex-1 p-1 overflow-y-auto">
                    <div className="w-100 max-w-md mx-auto">
                        {filteredCustomers.length > 0 ? (
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Mobile</th>
                                        {userGroup === "Admin User" && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.map((customer, index) => (
                                        <tr key={index}>
                                            <td
                                                onClick={() => handleEdit(customer.Customer_uuid)}
                                                style={{ cursor: "pointer" }}
                                            >
                                                {customer.Customer_name}
                                            </td>
                                            <td
                                                onClick={() => handleEdit(customer.Customer_uuid)}
                                                style={{ cursor: "pointer" }}
                                            >
                                                {customer.Mobile_number}
                                            </td>
                                            <td>
                                                {userGroup === "Admin User" && (
                                                    <button
                                                        onClick={() => handleDeleteClick(customer)}
                                                        className="btn"
                                                    >
                                                        <svg
                                                            className="h-6 w-6 text-red-500"
                                                            width="12"
                                                            height="12"
                                                            viewBox="0 0 22 22"
                                                            strokeWidth="2"
                                                            stroke="currentColor"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path stroke="none" d="M0 0h24v24H0z" />
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
                            <p>No data available.</p>
                        )}
                    </div>
                </main>
            </div>

            {showEditModal && (
                <EditCustomer customerId={selectedCustomerId} closeModal={() => setShowEditModal(false)} />
            )}

            {showDeleteModal && (
                <div className="modal-overlay">
                    <h4>Are you sure you want to delete {selectedCustomer?.Customer_name}?</h4>
                    <button onClick={handleDeleteConfirm} className="btn btn-danger">Yes</button>
                    <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">Cancel</button>
                    {deleteErrorMessage && <p className="text-red-500">{deleteErrorMessage}</p>}
                </div>
            )}

            {showAddModal && <AddCustomer closeModal={() => setShowAddModal(false)} />}

            <Footer />
        </>
    );
};

export default CustomerReport;
