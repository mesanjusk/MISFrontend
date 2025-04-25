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
        <div className="flex justify-center items-center bg-[#eae6df] min-h-screen">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-semibold text-green-600 mb-4 text-center">Edit Customer</h2>
                <form onSubmit={handleSaveChanges} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm mb-1">Customer Name</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={values.Customer_name}
                            onChange={(e) => setValues({ ...values, Customer_name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm mb-1">Mobile Number</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={values.Mobile_number}
                            onChange={(e) => setValues({ ...values, Mobile_number: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm mb-1">Customer Group</label>
                        <select
                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={values.Customer_group}
                            onChange={(e) => setValues({ ...values, Customer_group: e.target.value })}
                            required
                        >
                            <option value="" disabled>Select a group</option>
                            {groupOptions.map((group, index) => (
                                <option key={index} value={group}>{group}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-4 mt-6">
                        <button
                            type="submit"
                            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
