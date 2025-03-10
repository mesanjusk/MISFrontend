import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddTransaction1() {
    const navigate = useNavigate();

    const [Description, setDescription] = useState('');
    const [Amount, setAmount] = useState('');
    const [Total_Debit, setTotal_Debit] = useState('');
     const [Transaction_date, setTransaction_date] = useState('');
    const [userGroup, setUserGroup] = useState("");
    const [Total_Credit, setTotal_Credit] = useState('');
    const [CreditCustomer, setCreditCustomer] = useState(''); 
    const [DebitCustomer, setDebitCustomer] = useState(''); 
    const [allCustomerOptions, setAllCustomerOptions] = useState([]); 
    const [accountCustomerOptions, setAccountCustomerOptions] = useState([]); 
    const [loggedInUser, setLoggedInUser] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [Customer_name, setCustomer_Name] = useState('');
    const [isDateChecked, setIsDateChecked] = useState(false);

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

        if (!CreditCustomer || !DebitCustomer) {
            alert("Please select both a Credit and Debit customer.");
            return;
        }

        try {
            const creditCustomer = allCustomerOptions.find(option => option.Customer_uuid === CreditCustomer);
            const debitCustomer = accountCustomerOptions.find(option => option.Customer_uuid === DebitCustomer);
            const todayDate = new Date().toISOString().split("T")[0];

            if (!creditCustomer || !debitCustomer) {
                alert("Please select valid customers.");
                return;
            }

            const journal = [
                {
                    Account_id: debitCustomer.Customer_uuid,  
                    Type: 'Debit',
                    Amount: Number(Amount),
                },
                {
                    Account_id: creditCustomer.Customer_uuid,  
                    Type: 'Credit',
                    Amount: Number(Amount),
                }
            ];

            const response = await axios.post("/transaction/addTransaction", {
                Description,
                Total_Credit: Number(Amount),
                Total_Debit: Number(Amount),
                Payment_mode: debitCustomer.Customer_name,  
                Journal_entry: journal,
                Created_by: loggedInUser,
                Transaction_date: Transaction_date || todayDate,
            });

            if (response.data.success) {
                alert(response.data.message);
                navigate("/allOrder");
            } else {
                alert("Failed to add Transaction");
            }
        } catch (e) {
            console.error("Error adding Transaction:", e);
            alert("Error occurred while submitting the form.");
        }
    }

    
    const handleDateCheckboxChange = () => {
        setIsDateChecked(prev => !prev); 
        setTransaction_date(''); 
    };

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
        setCreditCustomer(option.Customer_uuid); 
        setShowOptions(false);
    };

    const closeModal = () => {
        if (userGroup === "Office User") {
            navigate("/home");
        } else if (userGroup === "Admin User") {
            navigate("/adminHome");
        }
    };   

    return (
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
            <div className="bg-white p-3 rounded w-90">
                <h2>Add Payment</h2>

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
                            onChange={(e) => setDebitCustomer(e.target.value)}  
                            value={DebitCustomer}
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
                    <div className="mb-3 ">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="dateCheckbox"
                            checked={isDateChecked}
                            onChange={handleDateCheckboxChange}
                        />
                        <label className="form-check-label" htmlFor="dateCheckbox">
                            Save Date 
                        </label>
                    </div>
                    {isDateChecked && (
                        <div className="mb-3">
                            <label htmlFor="date"><strong>Date</strong></label>
                            <input
                                type="date"
                                id="date"
                                autoComplete="off"
                                onChange={(e) => setTransaction_date(e.target.value)}
                                value={Transaction_date}
                                className="form-control rounded-0"
                            />
                       </div>
                    )}
                    <button type="submit" className="w-100 h-10 bg-green-500 text-white shadow-lg flex items-center justify-center">
                        Submit
                    </button>
                    <button type="button" className="w-100 h-10 bg-red-500 text-white shadow-lg flex items-center justify-center" onClick={closeModal}>Close</button>
                </form>
            </div>
        </div>
    );
}
