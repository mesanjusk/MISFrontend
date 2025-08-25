/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import axios from '../apiClient.js';
import AddItem from "./addItem";
import InvoiceModal from "../Components/InvoiceModal";

export default function Vendor({ onClose, order }) {
    const navigate = useNavigate();
    const location = useLocation();  
    const [order_uuid, setOrder_uuid] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [Quantity, setQuantity] = useState('');
    const [Rate, setRate] = useState('');
    const [Item, setItem] = useState('');
    const [Amount, setAmount] = useState(0);
    const [Remark, setRemark] = useState('');
    const [customerList, setCustomerList] = useState([]); 
    const [itemOptions, setItemOptions] = useState([]);
    const [purchasePaymentModeUuid, setPurchasePaymentModeUuid] = useState(null); 
    const [loggedInUser, setLoggedInUser] = useState('');
    const [showItemModal, setShowItemModal] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [showOptions, setShowOptions] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [whatsAppMessage, setWhatsAppMessage] = useState('');
    const [mobileToSend, setMobileToSend] = useState('');
    const [invoiceItems, setInvoiceItems] = useState([]);
    const previewRef = useRef();

    useEffect(() => {
        axios.get("/customer/GetCustomersList")
            .then(res => {
                if (res.data.success) {
                    const filteredCustomers = res.data.result.filter(item => item.Customer_group === "Office & Vendor");
                    setCustomerList(filteredCustomers);
                }
            })
            .catch(err => {
                console.error("Error fetching customer list:", err);
            });
    }, []);

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
            setItem(order.Item);
            setQuantity(order.Quantity);
            setRate(order.Rate);
            setAmount(order.Amount);
            setRemark(order.Items[i].Remark);
            setOrder_uuid(order.Order_uuid);
        }
    }, [order]);

    useEffect(() => {
        axios.get("/item/GetItemList")
            .then(res => {
                if (res.data.success) {
                    setItemOptions(res.data.result);
                }
            })
            .catch(err => {
                console.error("Error fetching item options:", err);
            });
    }, []);

    useEffect(() => {
        axios.get("/customer/GetCustomersList")
        .then(res => {
            if (res.data.success) {
                const purchaseMode = res.data.result.find(c => c.Customer_name === "Purchase");
                if (purchaseMode) {
                    setPurchasePaymentModeUuid(purchaseMode.Customer_uuid);
                }
            }
        })
        .catch(err => {
            console.error("Error fetching payment mode:", err);
        });
    }, []);

    useEffect(() => {
        if (Quantity && Rate) {
            setAmount(Number(Quantity) * Number(Rate));
        }
    }, [Quantity, Rate]);

    const submit = async (e) => {
        e.preventDefault();
        if (!selectedCustomer) {
            alert("Please select a vendor.");
            return;
        }

        const journal = [
            {
                Account_id: selectedCustomer.Customer_uuid,
                Type: 'Debit',
                Amount: Number(Amount),
            },
            {
                Account_id: purchasePaymentModeUuid,
                Type: 'Credit',
                Amount: Number(Amount),
            }
        ];
        console.log("Sending Order_uuid:", order_uuid);

        try {
            const transactionResponse = await axios.post("/transaction/addTransaction", {
                Description: Remark,
                Transaction_date: new Date().toISOString(),
                Order_uuid: order_uuid,
                Total_Credit: Number(Amount),
                Total_Debit: Number(Amount),
                Payment_mode: "Purchase",
                Journal_entry: journal,
                Created_by: loggedInUser
            });

            if (!transactionResponse.data.success) {
                alert("Failed to add Transaction.");
            } else {
                alert("Transaction added successfully!");
                setWhatsAppMessage(`Hello ${selectedCustomer.Customer_name}, your purchase of ${Item} worth ₹${Amount} has been recorded.`);
                setMobileToSend(selectedCustomer.Mobile_number);
                setInvoiceItems([{ Item, Quantity, Rate, Amount }]);
                setShowInvoiceModal(true);
            }
        } catch (err) {
            console.error("Error updating transaction:", err);
        }
    };

    const handleItem = () => {
        setShowItemModal(true);
    };

    const exitModal = () => {
        setShowItemModal(false);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setItem(value);
        const filtered = itemOptions.filter(option => 
            option.Item_name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredOptions(filtered);
        setShowOptions(true);
    };

    const handleOptionClick = (option) => {
        setItem(option.Item_name);
        setShowOptions(false);
    };

    const sendWhatsApp = async () => {
        try {
            await axios.post('/usertask/send-message', {
                mobile: mobileToSend,
                userName: selectedCustomer.Customer_name,
                type: 'customer',
                message: whatsAppMessage,
            });
            alert('WhatsApp message sent');
        } catch {
            alert('Failed to send WhatsApp');
        } finally {
            setShowInvoiceModal(false);
            navigate('/allOrder');
        }
    };

    return (
        <>
        <InvoiceModal
            isOpen={showInvoiceModal}
            onClose={() => { setShowInvoiceModal(false); navigate('/allOrder'); }}
            invoiceRef={previewRef}
            customerName={selectedCustomer?.Customer_name}
            customerMobile={mobileToSend}
            items={invoiceItems}
            remark={Remark}
            onSendWhatsApp={sendWhatsApp}
        />
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
            <div className="bg-white p-3 rounded w-90">
                <button type="button" onClick={onClose}>X</button>
                <h2>Add Vendor</h2>
                <form onSubmit={submit}>
                    <div className="mb-3">
                        <label><strong>Vendors</strong></label>
                        <select className="form-control rounded-0" 
                                onChange={(e) => {
                                    const vendor = customerList.find(c => c.Customer_name === e.target.value);
                                    setSelectedCustomer(vendor);
                                }}
                                value={selectedCustomer?.Customer_name || ""}>
                            <option value="">Select Vendor</option>
                            {customerList.map((option, index) => (
                                <option key={index} value={option.Customer_name}>{option.Customer_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-3">
                        <label>
                            Search by Item Name
                            <input
                                value={Item}
                                onChange={handleInputChange}
                                placeholder="Search by name"
                                onFocus={() => setShowOptions(true)}
                            />
                        </label>
                        {showOptions && filteredOptions.length > 0 && (
                            <ul className="list-group position-absolute w-100">
                                {filteredOptions.map((option, index) => (
                                    <li
                                        key={index}
                                        className="list-group-item list-group-item-action"
                                        onClick={() => handleOptionClick(option)}
                                    >
                                        {option.Item_name}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <button onClick={handleItem} type="button" className="text-white p-2 rounded-full bg-blue-500 mb-3">
                            <svg className="h-8 w-8" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none">
                                <path stroke="none" d="M0 0h24v24H0z"/>  
                                <circle cx="12" cy="12" r="9" />  
                                <line x1="9" y1="12" x2="15" y2="12" />  
                                <line x1="12" y1="9" x2="12" y2="15" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-3">
                        <label><strong>Remark</strong></label>
                        <input
                            type="text"
                            value={Remark}
                            className="form-control rounded-0"
                            onChange={(e) => setRemark(e.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <label><strong>Quantity</strong></label>
                        <input type="number" value={Quantity} className="form-control rounded-0" onChange={(e) => setQuantity(e.target.value)} />
                    </div>

                    <div className="mb-3">
                        <label><strong>Rate</strong></label>
                        <input type="number" value={Rate} className="form-control rounded-0" onChange={(e) => setRate(e.target.value)} />
                    </div>

                    <div className="mb-3">
                        <label><strong>Amount</strong></label>
                        <input type="text" value={Amount} className="form-control rounded-0" readOnly />
                    </div>

                    <button type="submit" className="w-100 h-10 bg-blue-500 text-white shadow-lg flex items-center justify-center">
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
