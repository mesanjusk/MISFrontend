import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddTransaction() {
    const navigate = useNavigate();

    const [Customer_name, setCustomer_Name] = useState('');
    const [Description, setDescription] = useState('');
    const [Amount, setAmount] = useState('');
    const [Total_Debit, setTotal_Debit] = useState('');
    const [Total_Credit, setTotal_Credit] = useState('');
    const [Payment_mode, setPayment_mode] = useState('');
    const [customerOptions, setCustomerOptions] = useState([]);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [showOptions, setShowOptions] = useState(false);
    const [paymentOptions, setPaymentOptions] = useState([]);
    const [loggedInUser, setLoggedInUser] = useState(''); 

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
        axios.get("/payment_mode/GetPaymentList")
            .then(res => {
                if (res.data.success) {
                    const options = res.data.result.map(item => ({
                        Payment_name: item.Payment_name,
                        Payment_mode_uuid: item.Payment_mode_uuid
                    }));
                    setPaymentOptions(options);
                }
            })
            .catch(err => {
                console.error("Error fetching payment options:", err);
            });

        axios.get("/customer/GetCustomersList")
            .then(res => {
                if (res.data.success) {
                    const options = res.data.result.map(item => ({
                        Customer_name: item.Customer_name,
                        Customer_uuid: item.Customer_uuid 
                    }));
                    setCustomerOptions(options);
                }
            })
            .catch(err => {
                console.error("Error fetching customer options:", err);
            });
        
    }, []);

    function addCustomer() {
        navigate("/addCustomer");
    }

    async function submit(e) {
        e.preventDefault();
    
        try {
            const customer = customerOptions.find(option => option.Customer_name === Customer_name);
            const paymentMode = paymentOptions.find(option => option.Payment_name === Payment_mode);
    
            if (!customer || !paymentMode) {
                alert("Invalid Customer or Payment mode selection.");
                return;
            }
    
            const journal = [
                {
                    Account_id: customer.Customer_uuid, 
                    Type: 'Debit',
                    Amount: Number(Amount),
                },
                {
                    Account_id: paymentMode.Payment_mode_uuid, 
                    Type: 'Credit',
                    Amount: Number(Amount),
                }
            ];
    
            const response = await axios.post("/transaction/addTransaction", {
                Description,
                Total_Credit: Number(Amount),
                Total_Debit: Number(Amount),
                Payment_mode: Payment_mode,
                Journal_entry: journal,
                Created_by: loggedInUser
            });
    
            if (response.data.success) {
                alert(response.data.message);
                navigate("/allOrder");
            } else {
                alert("Failed to add Transaction");
            }
        } catch (e) {
            console.error("Error adding Transaction:", e);
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
        setCustomer_Name(option);
        setShowOptions(false);
    };

    const handleAmountChange = (e) => {
        const value = e.target.value;
        setAmount(value);
        setTotal_Debit(value);
        setTotal_Credit(value);
    };

    return (
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
            <div className="bg-white p-3 rounded w-90">
                <h2>Add Transaction</h2>

                <form onSubmit={submit}>
                    <div className="mb-3 position-relative">
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
                                        onClick={() => handleOptionClick(option.Customer_name)}
                                    >
                                        {option.Customer_name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <button onClick={addCustomer} type="button" className="btn btn-primary mb-3">
                        Add Customer
                    </button>

                    <div className="mb-3">
                        <label htmlFor="remark"><strong>Description</strong></label>
                        <input
                            type="text"
                            autoComplete="off"
                            onChange={(e) => setDescription(e.target.value)}
                            value={Description}
                            placeholder="Description"
                            className="form-control rounded-0"
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="amount"><strong>Amount</strong></label>
                        <input
                            type="text"
                            autoComplete="off"
                            onChange={handleAmountChange}
                            value={Amount}
                            placeholder="Amount"
                            className="form-control rounded-0"
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="mode"><strong>Mode</strong></label>
                        <select 
                            className="form-control rounded-0" 
                            onChange={(e) => setPayment_mode(e.target.value)} 
                            value={Payment_mode}
                            required 
                        >
                            <option value="">Select Payment</option>
                            {paymentOptions.map((option, index) => (
                                <option key={index} value={option.Payment_name}>{option.Payment_name}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="w-100 h-10 bg-blue-500 text-white shadow-lg flex items-center justify-center">
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
}
