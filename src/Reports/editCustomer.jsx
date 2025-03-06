import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from "react-router-dom";

export default function EditCustomer({ customerId, closeModal }) {
    const { id } = useParams();
    const [groupOptions, setGroupOptions] = useState([]);
    const [values, setValues] = useState({
        Customer_name: '',
        Mobile_number: '',
        Customer_group: '',
    });
    useEffect(() => {
        console.log("✅ EditCustomer component mounted for ID:", customerId);
    }, [customerId]);

    useEffect(() => {
        axios.get("/customergroup/GetCustomergroupList")
            .then(res => {
                if (res.data.success) {
                    setGroupOptions(res.data.result.map(item => item.Customer_group));
                }
            })
            .catch(err => console.error("Error fetching customer group options:", err));
    }, []);

    useEffect(() => {
        if (customerId) {
            axios.get(`/customer/${customerId}`)
                .then(res => {
                    if (res.data.success) {
                        setValues({
                            Customer_name: res.data.result.Customer_name || '',
                            Mobile_number: res.data.result.Mobile_number || '',
                            Customer_group: res.data.result.Customer_group || '',
                        });
                    }
                })
                .catch(err => console.log('Error fetching customer data:', err));
        }
    }, [customerId]);

    const handleInputChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleSaveChanges = (e) => {
        e.preventDefault();

        if (!values.Customer_name || !values.Mobile_number || !values.Customer_group) {
            alert('All fields are required.');
            return;
        }

        axios.put(`/customer/update/${customerId}`, values)
            .then(res => {
                if (res.data.success) {
                    alert('Customer updated successfully!');
                    closeModal();
                }
            })
            .catch(err => console.log('Error updating customer:', err));
    };

    return (
        <div className="d-flex justify-content-center align-items-center bg-light vh-100">
            <div className="bg-white p-4 rounded w-50">
                <h2 className="text-center font-weight-bold mb-4">Edit Customer</h2>
                <form onSubmit={handleSaveChanges}>
                    <div className="mb-3">
                    <label>Customer Name</label> 
                        <input
                            type="text"
                            name="Customer_name"
                            value={values.Customer_name}
                            onChange={handleInputChange}
                            className="form-control"
                            required
                        />
                    </div>
                    <div className="mb-3">
                    <label>Mobile Number</label> 
                        <input
                            type="text"
                            name="Mobile_number"
                            value={values.Mobile_number}
                            onChange={handleInputChange}
                            className="form-control"
                            required
                        />
                    </div>
                    <div className="mb-3">
                    <label>Customer Group</label> 
                        <select
                            name="Customer_group"
                            value={values.Customer_group}
                            onChange={handleInputChange}
                            className="form-control"
                            required
                        >
                            <option value="" disabled>Select a group</option>
                            {groupOptions.map((group, index) => (
                                <option key={index} value={group}>{group}</option>
                            ))}
                        </select>
                    </div>
                    <div className="d-flex justify-content-between">
                        <button type="submit" className="btn btn-primary">Save Changes</button>
                        <button type="button" className="btn btn-danger" onClick={closeModal}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
