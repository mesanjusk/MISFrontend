import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EditCustomer({ customerId, closeModal }) {
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
                    const options = res.data.result.map(item => item.Customer_group);
                    setGroupOptions(options);
                }
            })
            .catch(err => {
                console.error("Error fetching customer group options:", err);
            });
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
            console.log('Error updating customer:', err);
        });
    };

    return (
        <div className="bg-white-100">
            <h2 className="text-xl font-bold mb-4">Edit Customer</h2>
            <form onSubmit={handleSaveChanges}>
            <div className="self-start bg-white p-2 w-100 mb-2 rounded-lg">
                <label>Customer Name</label> 
                <br></br>
                <input
                    type="text"
                    value={values.Customer_name}
                    onChange={(e) => setValues({ ...values, Customer_name: e.target.value })}
                    required
                />
               <br></br>
               <label>Mobile Number</label>
                <br></br>
                <input
                    type="text"
                    value={values.Mobile_number}
                    onChange={(e) => setValues({ ...values, Mobile_number: e.target.value })}
                    required
                
                />
                 <br></br>
                <label>Customer Group</label>
                <br></br>
                <select
                    value={values.Customer_group}
                    onChange={(e) => setValues({ ...values, Customer_group: e.target.value })}
                    required
                >
                    {groupOptions.map((group, index) => (
                        <option key={index} value={group}>
                            {group}
                        </option>
                    ))}
                </select>
                <br></br>
                <button type="submit" className="btn btn-primary">Save Changes</button>
                    <br></br>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                </div>
            </form>
        </div>
    );
}
