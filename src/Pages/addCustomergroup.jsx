import React, {useState} from 'react';
import axios from "axios"
import { useNavigate } from "react-router-dom"

export default function AddCustGroup() {
    const navigate = useNavigate();

    const [Customer_group,setCustomer_Group]=useState('')


    async function submit(e){
        e.preventDefault();
        try{

            await axios.post("/customergroup/addCustomergroup",{
                Customer_group
            })
            .then(res=>{
                if(res.data=="exist"){
                    alert("Group already exists")
                }
                else if(res.data=="notexist"){
                    alert("Group added successfully")
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
           
            <div className="bg-white p-3 rounded w-25">
            <h3>Add Customer Group</h3>
            <form action="POST">
                <div className="mb-3">
                    <label htmlFor="customergroup"><strong>Customer_Group</strong></label>
                <input type="customergroup" autoComplete="off" onChange={(e) => { setCustomer_Group(e.target.value) }} placeholder="Customer Group" className="form-control rounded-0" />
                </div>
                <button type="submit" onClick={submit} className="btn btn-success w-100 rounded-0"> Submit </button>

            </form>
        </div>
        </div>
    );
}
