import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddCustomer({ closeModal }) {
    const navigate = useNavigate();

    const [Customer_name, setCustomer_Name] = useState('');
    const [Mobile_number, setMobile_Number] = useState('');
    const [Customer_group, setCustomer_Group] = useState('');
    const [groupOptions, setGroupOptions] = useState([]);

    useEffect(() => {
        axios.get("/customergroup/GetCustomergroupList")
            .then(res => {
                if (res.data.success) {
                    const options = res.data.result.map(item => item.Customer_group);
                    setGroupOptions(options);
                }
            })
            .catch(err => {
                console.error("Error fetching customer group options:", err);
            });
    }, []);

    async function submit(e) {
        e.preventDefault(); 
        try {
            await axios.post("/customer/addCustomer", {
                Customer_name, 
                Mobile_number, 
                Customer_group
            })
            .then(res => {
                if (res.data === "exist") {
                    alert("Customer already exists");
                } else if (res.data === "notexist") {
                    alert("Customer added successfully");
                    exitModal(); // Close modal after successful submission
                    navigate("/allOrder"); 
                }
            })
            .catch(e => {
                alert("Error adding customer");
                console.log(e);
            });
        } catch (e) {
            console.log(e);
        }
    }


    return (
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
            <div className="bg-white p-3 rounded w-90">
                <h2>Add Customer</h2>
                <form onSubmit={submit}> 
                    <div className="mb-3">
                        <label htmlFor="customername"><strong>Customer Name</strong></label>
                        <input 
                            type="text" 
                            autoComplete="off" 
                            onChange={(e) => setCustomer_Name(e.target.value)} 
                            placeholder="Customer Name" 
                            className="form-control rounded-0" 
                            required 
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="mobilenumber"><strong>Mobile Number</strong></label>
                        <input 
                            type="text" 
                            autoComplete="off" 
                            onChange={(e) => setMobile_Number(e.target.value)} 
                            placeholder="Mobile Number" 
                            className="form-control rounded-0" 
                            required 
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="customergroup"><strong>Customer Group</strong></label>
                        <select 
                            className="form-control rounded-0" 
                            onChange={(e) => setCustomer_Group(e.target.value)} 
                            value={Customer_group}
                            required 
                        >
                            <option value="">Select Group</option>
                            {groupOptions.map((option, index) => (
                                <option key={index} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <button 
                        type="submit" 
                        className="btn bg-green-500 w-100 text-white rounded-0"
                    >
                        Submit
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={closeModal}
                    >
                        Close
                    </button>
                </form>
            </div>
        </div>
    );
}
