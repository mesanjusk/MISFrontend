import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddPayment() {
    const navigate = useNavigate();

    const [Payment_name, setPayment_Name] = useState('');
   
    async function submit(e){
        e.preventDefault();
        try{

            await axios.post("/payment_mode/addPayment",{
                Payment_name
            })
            .then(res=>{
                if(res.data=="exist"){
                    alert("Name already exists")
                }
                else if(res.data=="notexist"){
                    alert("Name added successfully")
                    navigate("/home")
                }
            })
            .catch(e=>{
                alert("wrong details")
                console.log(e);
            })
        }
        catch(e){
            console.log(e);
        }
    }

    return (
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
            <div className="bg-white p-3 rounded w-90">
                <h2>Add Payment</h2>
                <form onSubmit={submit}> 
                    <div className="mb-3">
                        <label htmlFor="customername"><strong>Payment Name</strong></label>
                        <input 
                            type="text" 
                            autoComplete="off" 
                            onChange={(e) => setPayment_Name(e.target.value)} 
                            placeholder="Payment Name" 
                            className="form-control rounded-0" 
                            required 
                        />
                    </div>
                   
                    <button 
                        type="submit" 
                        className="btn bg-green-500 w-100 text-white rounded-0"
                    >
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
}
