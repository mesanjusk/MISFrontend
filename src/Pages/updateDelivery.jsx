import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import AddItem from "./addItem";

export default function UpdateDelivery({ onClose, order }) {
    const navigate = useNavigate();
    const location = useLocation();  
    const [orderId, setOrderId] = useState(order?.Order_id || "");
    const [Customer_uuid, setCustomer_uuid] = useState(''); 
    const [Quantity, setQuantity] = useState('');
    const [Rate, setRate] = useState('');
    const [Item, setItem] = useState('');
    const [Customer_name, setCustomer_name] = useState('');
    const [Amount, setAmount] = useState(0);  
    const [Remark, setRemark] = useState('');
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
            setItem(order.Item);
            setQuantity(order.Quantity);
            setRate(order.Rate);
            setAmount(order.Amount);
            setCustomer_name(order.Customer_name || '');
            setOrderId(order._id);
            setRemark(order.Remark);
        }
    }, [order]);

    useEffect(() => {
        axios.get("/customer/GetCustomersList")
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
   
    useEffect(() => {
        axios.get("/payment_mode/GetPaymentList")
        .then(res => {
            if (res.data.success) {
                const salePaymentMode = res.data.result.find(mode => mode.Payment_name === "Sale");
                if (salePaymentMode) {
                    setSalePaymentModeUuid(salePaymentMode.Payment_mode_uuid);
                }
            }
        })
        .catch(err => {
            console.error("Error fetching payment modes:", err);
        });
    }, []); 

    useEffect(() => {
        axios.get("/item/GetItemList")
            .then(res => {
                if (res.data.success) {
                    const options = res.data.result.map(item => item.Item_name);
                    setItemOptions(options);
                }
            })
            .catch(err => {
                console.error("Error fetching item options:", err);
            });
    }, []);

    useEffect(() => {
        if (Quantity && Rate) {
            setAmount(Quantity * Rate); 
        }
    }, [Quantity, Rate]);

    async function submit(e) {
        e.preventDefault();
    
        if (!Item || !Quantity || !Rate || !Customer_uuid) {
            alert('Please provide all required fields.');
            return;
        }
    
        try {
            const response = await axios.put(`/order/updateDelivery/${orderId}`, {
                Customer_uuid,
                Item,
                Quantity: Number(Quantity),
                Rate: Number(Rate),
                Amount: Number(Amount),
                Remark
            });
    
            if (response.data.success) {
                const journal = [
                    {
                        Account_id: Customer_uuid, 
                        Type: 'Credit',
                        Amount: Number(Amount), 
                    },
                    {
                        Account_id: "Sales", 
                        Type: 'Debit',
                        Amount: Number(Amount), 
                    }
                ];
                console.log("Journal Entry Payload:", journal);

                const transactionResponse = await axios.post("/transaction/addTransaction", {
                    Description: "Delivered", 
                    Transaction_date: new Date().toISOString(),
                    Total_Credit: Number(Amount), 
                    Total_Debit: Number(Amount), 
                    Payment_mode: "Sale", 
                    Journal_entry: journal,
                    Created_by: loggedInUser 
                });
                console.log("Transaction Payload:", transactionResponse);
                if (!transactionResponse.data.success) {
                    alert("Failed to add Transaction.");
                }

                alert("Transaction added successfully!");
                navigate("/allOrder");

            } else {
                alert("Failed to update transaction");
            }
        } catch (e) {
            console.log("Error updating transaction:", e);
        }
    }

    const handleItem = () => {
        setShowItemModal(true);
    };

    const exitModal = () => {
        setShowItemModal(false);
    };
    return (
        <>
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
            <div className="bg-white p-3 rounded w-90">
                <button type="button" onClick={onClose}>X</button>
                <h2>Update Order</h2>
                <form onSubmit={submit}>

                    <div className="mb-3">
                        <label htmlFor="item"><strong>Item Name</strong>
                        <button onClick={handleItem} type="button" className="text-white p-2 rounded-full bg-green-500 mb-3">
                        <svg className="h-8 w-8 text-white-500" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">  
                            <path stroke="none" d="M0 0h24v24H0z"/>  
                            <circle cx="12" cy="12" r="9" />  
                            <line x1="9" y1="12" x2="15" y2="12" />  
                            <line x1="12" y1="9" x2="12" y2="15" />
                        </svg>
                    </button>
                        </label>

                        <select className="form-control rounded-0" onChange={(e) => setItem(e.target.value)} value={Item}>
                            <option value="">Select Item</option>
                            {itemOptions.map((option, index) => (
                                <option key={index} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="customer"><strong>Remark</strong></label>
                        <input
                            type="text"
                            autoComplete="off"
                            value={Remark} 
                            className="form-control rounded-0"
                            onChange={(e) => setRemark(e.target.value)}
                           
                        />
                    </div>
                   
                    <div className="mb-3">
                        <label htmlFor="quantity"><strong>Quantity</strong></label>
                        <input type="number" autoComplete="off" onChange={(e) => setQuantity(e.target.value)} value={Quantity} className="form-control rounded-0" />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="rate"><strong>Rate</strong></label>
                        <input type="number" autoComplete="off" onChange={(e) => setRate(e.target.value)} value={Rate} className="form-control rounded-0" />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="amount"><strong>Amount</strong></label>
                        <input type="text" autoComplete="off" value={Amount} className="form-control rounded-0" readOnly />
                    </div>

                    <button type="submit" className="w-100 h-10 bg-green-500 text-white shadow-lg flex items-center justify-center">
                        Submit
                    </button>
                </form>
            </div>
        </div>
        {showItemModal && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <AddItem closeModal={exitModal} />
                </div>
            </div>
        )}
        </>
    );
}
