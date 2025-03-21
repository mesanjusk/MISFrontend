import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AddCustomer from "./addCustomer"

export default function AddOrder1() {
    const navigate = useNavigate();

    const [Customer_name, setCustomer_Name] = useState('');
    const [Customer_uuid, setCustomer_uuid] = useState('');
    const [userGroup, setUserGroup] = useState("");
    const [Remark, setRemark] = useState('');
    const [customerOptions, setCustomerOptions] = useState([]);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [showOptions, setShowOptions] = useState(false);
    const [isAdvanceChecked, setIsAdvanceChecked] = useState(false);
    const [Amount, setAmount] = useState('');
    const [cashPaymentModeUuid, setCashPaymentModeUuid] = useState(null); 
    const [loggedInUser, setLoggedInUser] = useState('');
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [accountCustomerOptions, setAccountCustomerOptions] = useState([]);
    const [group, setGroup] = useState(''); 

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
            const group = localStorage.getItem("User_group");
            setUserGroup(group);
          }, []);

    useEffect(() => {
        axios.get("/customer/GetCustomersList")
            .then(res => {
                if (res.data.success) {
                    setCustomerOptions(res.data.result);

                    const accountOptions = res.data.result.filter(item => item.Customer_group === "Account");
                    setAccountCustomerOptions(accountOptions);
                }
            })
            .catch(err => {
                console.error("Error fetching customer options:", err);
            });

        axios.get("/payment_mode/GetPaymentList")
            .then(res => {
                if (res.data.success) {
                    const cashPaymentMode = res.data.result.find(mode => mode.Payment_name === "Cash");
                    if (cashPaymentMode) {
                        setCashPaymentModeUuid(cashPaymentMode.Payment_mode_uuid);
                    }
                }
            })
            .catch(err => {
                console.error("Error fetching payment modes:", err);
            });
    }, []);

    async function submit(e) {
        e.preventDefault();
    
        try {
            const customer = customerOptions.find(option => option.Customer_name === Customer_name);
            const Group = accountCustomerOptions.find(option => option.Customer_uuid === group);
    
            if (!customer) {
                alert("Invalid Customer selection.");
                return;
            }

            const orderResponse = await axios.post("/order/addOrder", {
                Customer_uuid: customer.Customer_uuid, 
                Remark: Remark, 
            });

            if (orderResponse.data.success) {
                if (isAdvanceChecked && Amount && group) {
                    const journal = [
                        {
                            Account_id: group,
                            Type: 'Debit',
                            Amount: Number(Amount), 
                        },
                        {
                            Account_id: customer.Customer_uuid,
                            Type: 'Credit',
                            Amount: Number(Amount), 
                        }
                    ];
    
                    const transactionResponse = await axios.post("/transaction/addTransaction", {
                        Description: Remark, 
                        Total_Credit: Number(Amount), 
                        Total_Debit: Number(Amount), 
                        Payment_mode: Group.Customer_name, 
                        Journal_entry: journal,
                        Created_by: loggedInUser 
                    });
    
                    if (!transactionResponse.data.success) {
                        alert("Failed to add Transaction.");
                    }
                }

                alert("Order added successfully!");
                navigate("/allOrder");

            } else {
                alert("Failed to add Order.");
            }

        } catch (e) {
            console.error("Error adding Order or Transaction:", e);
        }
    }

    const handleInputChange = (e) => {
        const value = e.target.value;
        setCustomer_Name(value);

        if (value) {
            const filtered = customerOptions.filter(option =>
                option.Customer_name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredOptions(filtered);
            setShowOptions(true);
        } else {
            setShowOptions(false);
        }
    };

    const handleOptionClick = (option) => {
        setCustomer_Name(option.Customer_name);  
        setCustomer_uuid(option.Customer_uuid); 
        setShowOptions(false);
    };

    const handleAdvanceCheckboxChange = () => {
        setIsAdvanceChecked(prev => !prev); 
        setAmount(''); 
    };

    const handleCustomer = () => {
        setShowCustomerModal(true);
    };

    const exitModal = () => {
        setShowCustomerModal(false);
    };

    const closeModal = () => {
        if (userGroup === "Office User") {
            navigate("/home");
        } else if (userGroup === "Admin User") {
            navigate("/adminHome");
        }
    };
 
    return (
        <>
        <div className="d-flex justify-content-center align-items-center bg-gray-200 vh-100">
            <div className="bg-white p-3 rounded w-90">
                <h2>Add Order</h2>

                <form onSubmit={submit}>
                    <div className="mb-3 shadow-inner position-relative">
                        <input
                            type="text"
                            placeholder="Search by Customer Name"
                            className="form-control mb-3"
                            value={Customer_name}
                            onChange={handleInputChange}
                            onFocus={() => setShowOptions(true)}
                        />
                        {showOptions && filteredOptions.length > 0 && (
                            <ul className="list-group position-absolute w-100">
                                {filteredOptions.map((option, index) => (
                                    <li 
                                        key={index} 
                                        className="list-group-item list-group-item-action"
                                        onClick={() => handleOptionClick(option)}
                                    >
                                        {option.Customer_name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button onClick={handleCustomer} type="button" className="text-white p-2 rounded-full bg-green-500 mb-3">
                        <svg className="h-8 w-8 text-white-500" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">  
                            <path stroke="none" d="M0 0h24v24H0z"/>  
                            <circle cx="12" cy="12" r="9" />  
                            <line x1="9" y1="12" x2="15" y2="12" />  
                            <line x1="12" y1="9" x2="12" y2="15" />
                        </svg>
                    </button>

                    <div className="mb-3">
                        <label htmlFor="remark"><strong>Order </strong></label>
                        <input
                            type="text"
                            autoComplete="off"
                            onChange={(e) => setRemark(e.target.value)}
                            value={Remark}
                            placeholder="Item Details"
                            className="form-control rounded-0"
                        />
                    </div>

                    <div className="mb-3 ">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="advanceCheckbox"
                            checked={isAdvanceChecked}
                            onChange={handleAdvanceCheckboxChange}
                        />
                        <label className="form-check-label" htmlFor="advanceCheckbox">
                            Advance 
                        </label>
                    </div>

                    {isAdvanceChecked && (
                        <div className="mb-3">
                            <label htmlFor="amount"><strong>Amount</strong></label>
                            <input
                                type="number"
                                id="amount"
                                autoComplete="off"
                                onChange={(e) => setAmount(e.target.value)}
                                value={Amount}
                                placeholder="Enter Amount"
                                className="form-control rounded-0"
                            />
                     
                           <label htmlFor="debit-customer"><strong>Mode</strong></label>
                           <select
                               className="form-control rounded-0"
                               onChange={(e) => setGroup(e.target.value)}  
                               value={group}
                           >
                               <option value="">Select Payment</option>
                               {accountCustomerOptions.map((customer, index) => (
                                   <option key={index} value={customer.Customer_uuid}>
                                       {customer.Customer_name}
                                   </option>
                               ))}
                           </select>
                       </div>
                    )}

                    <button type="submit" className="w-100 h-10 bg-green-500 text-white shadow-lg flex items-center justify-center">
                        Submit
                    </button>
                    <button type="button" className="w-100 h-10 bg-red-500 text-white shadow-lg flex items-center justify-center" onClick={closeModal}>Close</button>
                </form>
            </div>
        </div>
         {showCustomerModal && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <AddCustomer closeModal={exitModal} />
                </div>
            </div>
        )}
       </>
    );
}
