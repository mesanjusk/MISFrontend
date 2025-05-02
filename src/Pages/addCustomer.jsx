import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddCustomer() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        Customer_name: '',
        Mobile_number: '',
        Customer_group: '',
        Status: 'active',
        Tags: [],
        LastInteraction: ''
    });

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/customer/addCustomer", form);
            if (res.data.success) {
                alert("Customer added successfully");
                navigate("/home");
            } else {
                alert("Failed to add Customer.");
            }
        } catch (e) {
            console.error("Error adding customer:", e);
            alert("Error adding customer");
        }
    };

    const handleChange = (field, value) => {
        setForm(prev => ({
            ...prev,
            [field]: field === "Tags" ? value.split(",").map(tag => tag.trim()) : value
        }));
    };

    return (
        <div className="flex justify-center items-center bg-[#eae6df] min-h-screen">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-semibold text-green-600 mb-4 text-center">Add Customer</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm mb-1">Customer Name</label>
                        <input
                            type="text"
                            value={form.Customer_name}
                            onChange={(e) => handleChange('Customer_name', e.target.value)}
                            placeholder="Customer Name"
                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm mb-1">Mobile Number</label>
                        <input
                            type="text"
                            value={form.Mobile_number}
                            onChange={(e) => handleChange('Mobile_number', e.target.value)}
                            placeholder="Mobile Number"
                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm mb-1">Customer Group</label>
                        <select
                            value={form.Customer_group}
                            onChange={(e) => handleChange('Customer_group', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500"
                            required
                        >
                            <option value="">Select Group</option>
                            {groupOptions.map((option, index) => (
                                <option key={index} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm mb-1">Status</label>
                        <select
                            value={form.Status}
                            onChange={(e) => handleChange('Status', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm mb-1">Tags</label>
                        <input
                            type="text"
                            value={form.Tags.join(", ")}
                            onChange={(e) => handleChange('Tags', e.target.value)}
                            placeholder="Enter tags separated by commas"
                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500"
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {form.Tags.map((tag, index) => (
                                <span key={index} className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">{tag}</span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm mb-1">Last Interaction</label>
                        <input
                            type="datetime-local"
                            value={form.LastInteraction ? new Date(form.LastInteraction).toISOString().slice(0, 16) : ''}
                            onChange={(e) => handleChange('LastInteraction', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div className="flex gap-4 mt-6">
                        <button
                            type="submit"
                            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
                        >
                            Submit
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/home")}
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
