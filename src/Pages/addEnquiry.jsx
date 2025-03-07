import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddCategory() {
    const navigate = useNavigate();

    const [Customer_name, setCustomer_Name] = useState('');
    const [Remark, setRemark] = useState('');
    const [customerOptions, setCustomerOptions] = useState([]);

    useEffect(() => {
        axios.get("/customer/GetCustomersList")
            .then(res => {
                if (res.data.success) {
                    const options = res.data.result.map(item => item.Customer_name);
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
        
            if (!Customer_name) {
                alert('Customer Name is required.');
                return;
            }

            const response = await axios.post("/enquiry/addEnquiry", {
                Customer_name,
                Remark,
                
            });

            if (response.data.success) {
                alert(response.data.message);
                navigate("/allOrder");  
            } else {
                alert("Failed to add Enquiry");
            }
        } catch (e) {
            console.log("Error adding Enquiry:", e);
        }
    }

    const closeModal = () => {
        navigate("/home");
     };

    return (
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
            <div className="bg-white p-3 rounded w-90">
                <h2>Add Enquiry</h2>

                <form onSubmit={submit}>
                    <div className="mb-3">
                        <label htmlFor="name"><strong>Customer Name</strong></label>
                        <select
                            className="form-control rounded-0"
                            onChange={(e) => setCustomer_Name(e.target.value)}
                            value={Customer_name}
                        >
                            <option value="">Select Customer</option>
                            {customerOptions.map((option, index) => (
                                <option key={index} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={addCustomer} type="button" className="btn btn-primary mb-3">
                        Add Customer
                    </button>
                    <div className="mb-3">
                        <label htmlFor="remark"><strong>Order Details</strong></label>
                        <input
                            type="text"
                            autoComplete="off"
                            onChange={(e) => setRemark(e.target.value)}
                            value={Remark}
                            placeholder="Remarks"
                            className="form-control rounded-0"
                        />
                    </div>


                    <button type="submit" className="w-100 h-10 bg-green-500 text-white shadow-lg flex items-center justify-center">
                        Submit
                    </button>
                    <button type="button" className="w-100 h-10 bg-red-500 text-white shadow-lg flex items-center justify-center" onClick={closeModal}>Close</button>
                </form>
            </div>
        </div>
    );
}
