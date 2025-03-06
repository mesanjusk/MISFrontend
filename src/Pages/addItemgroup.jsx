import React, {useState} from 'react';
import axios from "axios"
import { useNavigate } from "react-router-dom"

export default function AddCustGroup() {
    const navigate = useNavigate();

    const [Item_group,setItem_Group]=useState('')


    async function submit(e){
        e.preventDefault();
        try{

            await axios.post("/itemgroup/addItemgroup",{
                Item_group
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
           
            <div className="bg-white p-3 rounded w-90">
            <h3>Add Item Group</h3>
            <form action="POST">
                <div className="mb-3">
                    <label htmlFor="itemgroup"><strong>Item_Group</strong></label>
                <input type="itemgroup" autoComplete="off" onChange={(e) => { setItem_Group(e.target.value) }} placeholder="Item Group" className="form-control rounded-0" />
                </div>
                <button type="submit" onClick={submit} className="btn btn-success w-100 rounded-0"> Submit </button>

            </form>
        </div>
        </div>
    );
}
