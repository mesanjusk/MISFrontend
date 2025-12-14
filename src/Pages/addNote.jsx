import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { addNote } from '../services/noteService.js';
import { fetchCustomers } from '../services/customerService.js';

export default function AddNote({ onClose, order }) {
    const navigate = useNavigate();
    const location = useLocation();  
    const [orderId, setOrderId] = useState(order?.Order_id || "");
    const [Customer_uuid, setCustomer_uuid] = useState(''); 
    const [Note_name, setNote_name] = useState('');
    const [Customer_name, setCustomer_name] = useState('');
    const [Order_uuid, setOrder_uuid] = useState('');
    const [customers, setCustomers] = useState([]); 
    const [itemOptions, setItemOptions] = useState([]);
    const [salePaymentModeUuid, setSalePaymentModeUuid] = useState(null); 
    const [loggedInUser, setLoggedInUser] = useState('');
    const [showItemModal, setShowItemModal] = useState(false);

    useEffect(() => {
        const userNameFromState = location.state?.id;
        const logInUser = userNameFromState || localStorage.getItem('User_name');
    
        if (logInUser) {
            setLoggedInUser(logInUser);
        } else {
            navigate("/login");
        }
    }, [location.state, navigate]);

    useEffect(() => {
        if (order) {
            setCustomer_uuid(order.Customer_uuid);
            setCustomer_name(order.Customer_name || '');
            setOrder_uuid(order.Order_uuid || '');
            setOrderId(order._id);
        }
    }, [order]);

    useEffect(() => {
        fetchCustomers()
            .then(res => {
                if (res.data.success) {
                    setCustomers(res.data.result);
                    const customer = res.data.result.find(cust => cust.Customer_uuid === Customer_uuid);
                    if (customer) {
                        setCustomer_name(customer.Customer_name);
                    }
                }
            })
            .catch(err => console.log('Error fetching customers list:', err));
    }, [Customer_uuid]);

    async function submit(e) {
        e.preventDefault();
    
        try {
            const response = await addNote({
                Customer_uuid,
                Order_uuid,
                Note_name,
            });

            if (response.data.success) {
                alert("Note added successfully!");
                navigate("/allOrder");

            } 

        } catch (e) {
            console.log("Error updating transaction:", e);
        }
    }

    return (
        <>
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
            <div className="bg-white p-3 rounded w-90">
                <button type="button" onClick={onClose}>X</button>
                <h2>Add Note</h2>
                <form onSubmit={submit}>

                    <div className="mb-3">
                        <label htmlFor="customer"><strong>Customer</strong></label>
                        <input
                            type="text"
                            autoComplete="off"
                            value={Customer_name} 
                            className="form-control rounded-0"
                            readOnly 
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="note"><strong>Note</strong></label>
                        <input type="text" autoComplete="off" onChange={(e) => setNote_name(e.target.value)} value={Note_name} className="form-control rounded-0" />
                    </div>


                    <button type="submit" className="w-100 h-10 bg-blue-500 text-white shadow-lg flex items-center justify-center">
                        Save
                    </button>
                </form>
            </div>
        </div>
        </>
    );
}