import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddRecievable() {
    const navigate = useNavigate();

    const [Description, setDescription] = useState('');
    const [Amount, setAmount] = useState('');
    const [Total_Debit, setTotal_Debit] = useState('');
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

   async function submit(e) {
  e.preventDefault();

  if (!Amount || isNaN(Amount) || Amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  try {
    const creditCustomer = allCustomerOptions.find(option => option.Customer_uuid === CreditCustomer);
    const debitCustomer = accountCustomerOptions.find(option => option.Customer_uuid === DebitCustomer);

    const journal = [
      {
        Account_id: "81f36451-41f2-402d-9dd3-cc11af039142",
        Type: 'Debit',
        Amount: Number(Amount),
      },
      {
        Account_id: creditCustomer.Customer_uuid,
        Type: 'Credit',
        Amount: Number(Amount),
      }
    ];

    const formData = new FormData();
    formData.append("Description", Description);
    formData.append("Total_Credit", Number(Amount));
    formData.append("Total_Debit", Number(Amount));
    formData.append("Payment_mode", "Opening Balance");
    formData.append("Transaction_date", "01-04-2025");
    formData.append("Created_by", loggedInUser);
    formData.append("Journal_entry", JSON.stringify(journal));
    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    const response = await axios.post("/transaction/addTransaction", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
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
            navigate("/home");
        }
    };   

    return (
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
            <div className="bg-white p-3 rounded w-90">
                <h2>Add Recievable</h2>

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
         <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
                    <button type="submit" className="w-100 h-10 bg-blue-500 text-white shadow-lg flex items-center justify-center">
                        Submit
                    </button>
                    <button type="button" className="w-100 h-10 bg-red-500 text-white shadow-lg flex items-center justify-center" onClick={closeModal}>Close</button>
                </form>
            </div>
        </div>
    );
}
