import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddCustomer({ onClose }) {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        Customer_name: '',
        Mobile_number: '',  // This field is now optional by default
        Customer_group: '',
        Status: 'active',
        Tags: [],
        LastInteraction: '',
    });

    const [groupOptions, setGroupOptions] = useState([]);
    const [duplicateNameError, setDuplicateNameError] = useState('');

    const canSubmit = Boolean(form.Customer_name.trim()) && Boolean(form.Customer_group.trim());

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

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - offset * 60000);
        return localDate.toISOString().slice(0, 16);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setDuplicateNameError('');

        if (!form.Customer_name.trim()) {
            alert("Customer name is required.");
            return;
        }

        // Validate mobile number if it is entered (10 digits only)
        if (form.Mobile_number && !/^\d{10}$/.test(form.Mobile_number)) {
            alert("Please enter a valid 10-digit mobile number.");
            return;
        }

        try {
            // Check for duplicate name
            const duplicateRes = await axios.get(`/customer/checkDuplicateName?name=${form.Customer_name.trim()}`);
            if (!duplicateRes.data.success) {
                setDuplicateNameError("Customer name already exists.");
                return;
            }
        } catch (error) {
            console.error("Error checking for duplicate name:", error);
            alert("Error checking for duplicate name");
            return;
        }

        try {
            const payload = { ...form };

            // Clean up payload before sending to the backend
            payload.Customer_name = form.Customer_name.trim();
            payload.Tags = form.Tags.filter(tag => tag !== '');
            if (!form.LastInteraction) delete payload.LastInteraction;

            const res = await axios.post("/customer/addCustomer", payload);
            if (res.data.success) {
                alert("Customer added successfully");
                if (onClose) onClose();
                else navigate("/home");
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
            [field]: field === "Tags"
                ? value.split(",").map(tag => tag.trim())
                : value
        }));
    };

    const handleCancel = () => {
        if (onClose) onClose();
        else navigate("/home");
    };

    const content = (
        <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-green-600 mb-4 text-center">Add Customer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Customer Name */}
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
                        {duplicateNameError && <p className="text-red-500 text-sm">{duplicateNameError}</p>}
                    </div>

                    {/* Mobile Number */}
                    <div>
                        <label className="block text-gray-700 text-sm mb-1">Mobile Number</label>
                        <input
                            type="text"
                            value={form.Mobile_number}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d{0,10}$/.test(value)) {
                                    handleChange('Mobile_number', value);
                                }
                            }}
                            placeholder="Mobile Number"
                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Customer Group */}
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

                    {/* Status */}
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

                    {/* Tags */}
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

                    {/* Last Interaction */}
                    <div>
                        <label className="block text-gray-700 text-sm mb-1">Last Interaction</label>
                        <input
                            type="datetime-local"
                            value={formatDateForInput(form.LastInteraction)}
                            onChange={(e) => handleChange('LastInteraction', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 mt-6">
                <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`w-full text-white py-2 rounded-lg transition font-medium ${
                        canSubmit ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                >
                    Submit
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition"
                >
                    Cancel
                </button>
            </div>
        </form>
        </div>
    );

    if (onClose) return content;

    return (
        <div className="flex justify-center items-center bg-[#eae6df] min-h-screen">
            {content}
        </div>
    );
}
