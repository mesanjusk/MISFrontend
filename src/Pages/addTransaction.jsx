import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddTransaction() {
    const navigate = useNavigate();

    const [Description, setDescription] = useState('');
    const [Amount, setAmount] = useState('');
    const [Transaction_date, setTransaction_date] = useState('');
    const [Total_Debit, setTotal_Debit] = useState('');
    const [Total_Credit, setTotal_Credit] = useState('');
     const [userGroup, setUserGroup] = useState("");
    const [customers, setCustomers] = useState(''); 
    const [group, setGroup] = useState(''); 
    const [allCustomerOptions, setAllCustomerOptions] = useState([]); 
    const [accountCustomerOptions, setAccountCustomerOptions] = useState([]); 
    const [loggedInUser, setLoggedInUser] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [Customer_name, setCustomer_Name] = useState('');
    const [isDateChecked, setIsDateChecked] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

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

const handleFileChange = (e) => {
  setSelectedImage(e.target.files[0]);
};
    useEffect(() => {
        axios.get("/customer/GetCustomersList")
            .then(res => {
                if (res.data.success) {
                    setAllCustomerOptions(res.data.result);

                    const accountOptions = res.data.result.filter(item => item.Customer_group === "Bank and Account");
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

    const handleWhatsAppClick = async (e) => {
        e.preventDefault(); 
    
        try {
            const whatsappInfo = await submit(e);  
            if (!whatsappInfo) return;
    
            const { name, phone, amount, date, mode } = whatsappInfo;
    
            if (!phone) {
                alert("Customer phone number is missing.");
                return;
            }
    
            const message = `Hello ${name}, we have received your payment of ₹${amount} on ${date} via ${mode}. Thank you!`;
    
            const confirmed = window.confirm(`Send WhatsApp message to ${name}?\n\n"${message}"`);
            if (!confirmed) return;
    
            await sendMessageToAPI(name, phone, message);
    
            navigate("/home");
    
        } catch (error) {
            console.error("Failed to process WhatsApp order flow:", error);
        }
    };
    
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
            const todayDate = new Date().toISOString().split("T")[0];
    
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

             const formData = new FormData();
    formData.append('Description', Description);
    formData.append('Total_Credit', Number(Amount));
    formData.append('Total_Debit', Number(Amount));
    formData.append('Payment_mode', Group.Customer_name);
    formData.append('Created_by', loggedInUser);
    formData.append('Transaction_date', Transaction_date || todayDate);
    formData.append('Journal_entry', JSON.stringify(journal));

    if (selectedImage) {
        formData.append('image', selectedImage);
    }

    
            const response = await axios.post("/transaction/addTransaction", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
            if (response.data.success) {
                alert(response.data.message);
                navigate("/home");
            } else {
                alert("Failed to add Transaction");
            }
            return {
                name: Customer.Customer_name,
                phone: Customer.Mobile_number,
                amount: Amount,
                date: Transaction_date,
                mode: Group.Customer_name
            };
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
    
      const sendMessageToAPI = async (name, phone, message) => {
        const payload = {
            mobile: phone,
            userName: name,
            type: 'customer',
            message: message,
        };
    
        try {
            const res = await fetch('https://misbackend-e078.onrender.com/usertask/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
    
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to send message: ${errorText}`);
            }
    
            const result = await res.json();
            if (result.error) {
                alert("Failed to send: " + result.error);
            } else {
                alert("Message sent successfully.");
            }
        } catch (error) {
            console.error("Request failed:", error);
            alert("Failed to send message: " + error.message);
        }
    };
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
        setCustomers(option.Customer_uuid); 
        setShowOptions(false);
    };
    
    const closeModal = () => {
        if (userGroup === "Office User") {
            navigate("/home");
        } else if (userGroup === "Admin User") {
            navigate("/home");
        }
    };
    
    return (
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
            <div className="bg-white p-3 rounded w-90">
                <h2>Add Reciept</h2>

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
                     <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
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
                    </button><br />
                    <button type="button" onClick={handleWhatsAppClick} className="w-100 h-10 bg-green-500 text-white shadow-lg flex items-center justify-center">
                     WhatsApp
                  </button><br />
                    <button type="button" className="w-100 h-10 bg-red-500 text-white shadow-lg flex items-center justify-center" onClick={closeModal}>Close</button>
                </form>
            </div>
        </div>
    );
}
