import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddTransaction() {
    const navigate = useNavigate();

    const [Description, setDescription] = useState('');
    const [Amount, setAmount] = useState('');
    const [Total_Debit, setTotal_Debit] = useState('');
    const [Total_Credit, setTotal_Credit] = useState('');
    const [customers, setCustomers] = useState(''); 
    const [group, setGroup] = useState(''); 
    const [allCustomerOptions, setAllCustomerOptions] = useState([]); 
    const [accountCustomerOptions, setAccountCustomerOptions] = useState([]); 
    const [loggedInUser, setLoggedInUser] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [Customer_name, setCustomer_Name] = useState('');

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
        axios.get("/customer/GetCustomersList")
            .then(res => {
                if (res.data.success) {
                    setAllCustomerOptions(res.data.result);

                    const accountOptions = res.data.result.filter(item => item.Customer_group === "Account");
                    setAccountCustomerOptions(accountOptions);
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
    
        if (!Amount || isNaN(Amount) || Amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
    
        if (!customers || !group) {
            alert("Please select both a Credit and Debit customer.");
            return;
        }
    
        try {
            const Customer = allCustomerOptions.find(option => option.Customer_uuid === customers);
            const Group = accountCustomerOptions.find(option => option.Customer_uuid === group);
    
            if (!Customer || !Group) {
                alert("Please select valid customers.");
                return;
            }
    
            const journal = [
                {
                    Account_id: customers, 
                    Type: 'Debit',
                    Amount: Number(Amount),
                },
                {
                    Account_id: group,  
                    Type: 'Credit',
                    Amount: Number(Amount),
                }
            ];
    
            console.log({
                Description,
                Total_Credit: Number(Amount),
                Total_Debit: Number(Amount),
                Payment_mode: Group.Customer_name,  
                Journal_entry: journal,
                Created_by: loggedInUser
            });
    
            const response = await axios.post("/transaction/addTransaction", {
                Description,
                Total_Credit: Number(Amount),
                Total_Debit: Number(Amount),
                Payment_mode: Group.Customer_name,  
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
            if (e.response) {
                console.error("Response data:", e.response.data);
                console.error("Response status:", e.response.status);
                console.error("Response headers:", e.response.headers);
            }
            alert("Error occurred while submitting the form.");
        }
    }
    

    const handleAmountChange = (e) => {
        const value = e.target.value;
        setAmount(value);
        setTotal_Debit(value);
        setTotal_Credit(value);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setCustomer_Name(value);

        if (value) {
            const filtered = allCustomerOptions.filter(option =>
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
        setCustomers(option.Customer_uuid); 
        setShowOptions(false);
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
                                        onClick={() => handleOptionClick(option)}
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

                    <div className="mb-3 position-relative">
                        <label htmlFor="debit-customer"><strong>Mode</strong></label>
                        <select
                            className="form-control rounded-0"
                            onChange={(e) => setGroup(e.target.value)}  
                            value={group}
                            required
                        >
                            <option value="">Select Payment</option>
                            {accountCustomerOptions.map((customer, index) => (
                                <option key={index} value={customer.Customer_uuid}>
                                    {customer.Customer_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="w-100 h-10 bg-green-500 text-white shadow-lg flex items-center justify-center">
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
}
