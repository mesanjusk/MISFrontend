import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function UpdateDelivery() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [Customer_uuid, setCustomer_uuid] = useState(''); 
    const [Quantity, setQuantity] = useState('');
    const [Rate, setRate] = useState('');
    const [Item, setItem] = useState('');
    const [Customer_name, setCustomer_name] = useState('');
    const [Amount, setAmount] = useState(0);  
    const [customers, setCustomers] = useState([]); 
    const [itemOptions, setItemOptions] = useState([]);

    // Fetch the order details
    useEffect(() => {
        axios.get(`/order/${id}`)
            .then(res => {
                if (res.data.success) {
                    const order = res.data.result;
                    setCustomer_uuid(order.Customer_uuid);
                    setItem(order.Item); // Set the current item
                    setQuantity(order.Quantity);
                    setRate(order.Rate);
                    setAmount(order.Amount);
                    setCustomer_name(order.Customer_name || ''); // Set the customer name if available
                }
            })
            .catch(err => console.log('Error fetching order data:', err));
    }, [id]);
    
    // Fetch the customers list
    useEffect(() => {
        axios.get("/customer/GetCustomersList")
            .then(res => {
                if (res.data.success) {
                    setCustomers(res.data.result); 
                    const customer = res.data.result.find(cust => cust.Customer_uuid === Customer_uuid);
                    if (customer) {
                        setCustomer_name(customer.Customer_name); 
                    }
                }
            })
            .catch(err => console.log('Error fetching customers list:', err));
    }, [Customer_uuid]); // Trigger when Customer_uuid changes

    // Fetch the item options
    useEffect(() => {
        axios.get("/item/GetItemList")
            .then(res => {
                if (res.data.success) {
                    const options = res.data.result.map(item => item.Item_name);
                    setItemOptions(options);
                }
            })
            .catch(err => {
                console.error("Error fetching item options:", err);
            });
    }, []);

    // Calculate Amount based on Quantity and Rate
    useEffect(() => {
        if (Quantity && Rate) {
            setAmount(Quantity * Rate); 
        }
    }, [Quantity, Rate]);

    // Handle form submission
    async function submit(e) {
        e.preventDefault();
    
        if (!Item || !Quantity || !Rate || !Customer_uuid) {
            alert('Please provide all required fields.');
            return;
        }
    
        console.log({ id, Customer_uuid, Item, Quantity, Rate, Amount }); 
    
        try {
            const response = await axios.put(`/order/updateDelivery/${id}`, {
                Customer_uuid,
                Item,
                Quantity: Number(Quantity),
                Rate: Number(Rate),
                Amount: Number(Amount)
            });
    
            if (response.data.success) {
                alert(response.data.message);
                navigate("/allOrder");
            } else {
                alert("Failed to update order");
            }
        } catch (e) {
            console.log("Error updating order:", e);
        }
    }

    return (
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
            <div className="bg-white p-3 rounded w-90">
                <h2>Update Order</h2>

                <form onSubmit={submit}>
                    <div className="mb-3">
                        <label htmlFor="customer"><strong>Customer</strong></label>
                        <input
                            type="text"
                            autoComplete="off"
                            value={Customer_name} // Display Customer_name
                            className="form-control rounded-0"
                            readOnly // Read-only field
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="item"><strong>Item Name</strong></label>
                        <select className="form-control rounded-0" onChange={(e) => setItem(e.target.value)} value={Item}>
                            <option value="">Select Item</option>
                            {itemOptions.map((option, index) => (
                                <option key={index} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="quantity"><strong>Quantity</strong></label>
                        <input type="number" autoComplete="off" onChange={(e) => setQuantity(e.target.value)} value={Quantity} className="form-control rounded-0" />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="rate"><strong>Rate</strong></label>
                        <input type="number" autoComplete="off" onChange={(e) => setRate(e.target.value)} value={Rate} className="form-control rounded-0" />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="amount"><strong>Amount</strong></label>
                        <input type="text" autoComplete="off" value={Amount} className="form-control rounded-0" readOnly />
                    </div>

                    <button type="submit" className="w-100 h-10 bg-green-500 text-white shadow-lg flex items-center justify-center">
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
}
