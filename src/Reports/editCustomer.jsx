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
                        const customer = res.data.result;
                        setValues({
                            Customer_name: customer.Customer_name || '',
                            Mobile_number: customer.Mobile_number || '',
                            Customer_group: customer.Customer_group || '',
                        });
                    }
                })
                .catch(err => console.log('Error fetching customer data:', err));
        }
    }, [customerId]);

    const handleSaveChanges = (e) => {
        e.preventDefault();

        if (!values.Customer_name || !values.Mobile_number || !values.Customer_group) {
            alert('All fields are required.');
            return;
        }
        axios.put(`/customer/update/${customerId}`, { 
            Customer_name: values.Customer_name,
            Mobile_number: values.Mobile_number,
            Customer_group: values.Customer_group,
        })
        .then(res => {
            if (res.data.success) {
                alert('Customer updated successfully!');
                closeModal(); 
            }
        })
        .catch(err => {
            console.log('Error updating item:', err);
        });
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
                        className="form-control"
                        value={values.Customer_name}
                      onChange={(e) => setValues({ ...values, Customer_name: e.target.value })}
                      required
                />
                    </div>
                    <div className="mb-3">
                    <label>Mobile Number</label> 
                        <input
                            type="text"
                             className="form-control"
                            value={values.Mobile_number}
                            onChange={(e) => setValues({ ...values, Mobile_number: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-3">
                    <label>Customer Group</label> 
                        <select
                            value={values.Customer_group}
                            onChange={(e) => setValues({ ...values, Customer_group: e.target.value })}
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
                        <button type="submit"  className="w-100 h-10 bg-green-500 text-white shadow-lg flex items-center justify-center">Save</button>
                        <button type="button" className="w-100 h-10 bg-red-500 text-white shadow-lg flex items-center justify-center" onClick={closeModal}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
