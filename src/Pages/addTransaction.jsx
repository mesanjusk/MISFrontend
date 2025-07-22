import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

export default function AddTransaction({ editMode, existingData, onClose, onSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [Description, setDescription] = useState('');
  const [Amount, setAmount] = useState('');
  const [Transaction_date, setTransaction_date] = useState('');
  const [group, setGroup] = useState('');
  const [customers, setCustomers] = useState('');
  const [Customer_name, setCustomer_Name] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDateChecked, setIsDateChecked] = useState(false);
  const [userGroup, setUserGroup] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');

  const [allCustomerOptions, setAllCustomerOptions] = useState([]);
  const [accountCustomerOptions, setAccountCustomerOptions] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const userNameFromState = location.state?.id || localStorage.getItem('User_name');
    if (userNameFromState) {
      setLoggedInUser(userNameFromState);
    } else {
      navigate("/login");
    }
    setUserGroup(localStorage.getItem("User_group") || '');
  }, [location.state, navigate]);

  useEffect(() => {
    axios.get("/customer/GetCustomersList")
      .then(res => {
        if (res.data.success) {
          setAllCustomerOptions(res.data.result);
          const accountOptions = res.data.result.filter(item => item.Customer_group === "Bank and Account");
          setAccountCustomerOptions(accountOptions);
        }
      }).catch(err => {
        console.error("Error fetching customers:", err);
      });
  }, []);

  useEffect(() => {
    if (editMode && existingData) {
      setDescription(existingData.Description || "");
      setAmount(existingData.Total_Debit || existingData.Total_Credit || "");
      setTransaction_date(existingData.Transaction_date?.substring(0, 10) || "");
      setGroup(getCreditUuid(existingData) || "");
      setCustomers(getDebitUuid(existingData) || "");
      const customer = allCustomerOptions.find(c => c.Customer_uuid === getDebitUuid(existingData));
      setCustomer_Name(customer?.Customer_name || "");
      setIsDateChecked(!!existingData.Transaction_date);
    }
  }, [editMode, existingData, allCustomerOptions]);

  const getCreditUuid = (txn) =>
    txn.Journal_entry?.find(j => j.Type.toLowerCase() === "credit")?.Account_id;
  const getDebitUuid = (txn) =>
    txn.Journal_entry?.find(j => j.Type.toLowerCase() === "debit")?.Account_id;

  const handleFileChange = (e) => {
    setSelectedImage(e.target.files[0]);
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handleDateCheckboxChange = () => {
    setIsDateChecked(prev => !prev);
    setTransaction_date('');
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

  const submit = async (e) => {
    e.preventDefault();
    if (!Amount || isNaN(Amount) || Amount <= 0) return alert("Enter valid amount.");
    if (!customers || !group) return alert("Select both a Credit and Debit customer.");

    const Customer = allCustomerOptions.find(c => c.Customer_uuid === customers);
    const Group = accountCustomerOptions.find(c => c.Customer_uuid === group);
    const todayDate = new Date().toISOString().split("T")[0];

    const journal = [
      { Account_id: customers, Type: 'Debit', Amount: Number(Amount) },
      { Account_id: group, Type: 'Credit', Amount: Number(Amount) }
    ];

    const formData = new FormData();
    formData.append('Description', Description);
    formData.append('Total_Credit', Number(Amount));
    formData.append('Total_Debit', Number(Amount));
    formData.append('Payment_mode', Group.Customer_name);
    formData.append('Created_by', loggedInUser);
    formData.append('Transaction_date', Transaction_date || todayDate);
    formData.append('Journal_entry', JSON.stringify(journal));
    if (editMode && existingData?._id) formData.append('_id', existingData._id);
    if (selectedImage) formData.append('image', selectedImage);

    try {
      const res = await axios.post("/transaction/addTransaction", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        alert(res.data.message);
        onSuccess?.(); // Refresh table
        onClose?.();   // Close modal
      } else {
        alert("Failed to save transaction");
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Error occurred while saving the form.");
    }
  };

  const handleWhatsAppClick = async (e) => {
    e.preventDefault();
    await submit(e);
    const cust = allCustomerOptions.find(c => c.Customer_uuid === customers);
    const group = accountCustomerOptions.find(c => c.Customer_uuid === group);
    const message = `Hello ${cust?.Customer_name}, we have received your payment of ₹${Amount} on ${Transaction_date} via ${group?.Customer_name}. Thank you!`;
    const confirmed = window.confirm(`Send WhatsApp message?\n\n"${message}"`);
    if (!confirmed) return;

    try {
      const res = await fetch('https://misbackend-e078.onrender.com/usertask/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: cust?.Mobile_number,
          userName: cust?.Customer_name,
          type: 'customer',
          message
        }),
      });
      const data = await res.json();
      alert(data?.error ? "Failed to send message" : "Message sent successfully");
    } catch (err) {
      alert("Failed to send message: " + err.message);
    }
  };

  const addCustomer = () => navigate("/addCustomer");

  const closeModal = () => {
    if (userGroup === "Office User" || userGroup === "Admin User") {
      onClose ? onClose() : navigate("/home");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
      <div className="bg-white p-3 rounded w-90">
        <h2>{editMode ? "Edit Receipt" : "Add Receipt"}</h2>
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
              <ul className="list-group position-absolute w-100 z-10">
                {filteredOptions.map((option, index) => (
                  <li key={index} className="list-group-item list-group-item-action"
                    onClick={() => handleOptionClick(option)}>
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
            <label><strong>Description</strong></label>
            <input
              type="text"
              value={Description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control"
              placeholder="Description"
            />
          </div>

          <div className="mb-3">
            <label><strong>Amount</strong></label>
            <input
              type="number"
              value={Amount}
              onChange={handleAmountChange}
              className="form-control"
              placeholder="Amount"
            />
          </div>

          <div className="mb-3">
            <label><strong>Payment Mode</strong></label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="form-control"
              required
            >
              <option value="">Select Payment</option>
              {accountCustomerOptions.map((cust, i) => (
                <option key={i} value={cust.Customer_uuid}>
                  {cust.Customer_name}
                </option>
              ))}
            </select>
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="form-control mb-3"
          />

          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              checked={isDateChecked}
              onChange={handleDateCheckboxChange}
            />
            <label className="form-check-label">Save Date</label>
          </div>

          {isDateChecked && (
            <div className="mb-3">
              <label><strong>Date</strong></label>
              <input
                type="date"
                value={Transaction_date}
                onChange={(e) => setTransaction_date(e.target.value)}
                className="form-control"
              />
            </div>
          )}

          <button type="submit" className="btn btn-success w-100 mb-2">
            {editMode ? "Update" : "Submit"}
          </button>

          <button type="button" onClick={handleWhatsAppClick} className="btn btn-success w-100 mb-2">
            WhatsApp
          </button>

          <button type="button" onClick={closeModal} className="btn btn-danger w-100">
            Close
          </button>
        </form>
      </div>
    </div>
  );
}
