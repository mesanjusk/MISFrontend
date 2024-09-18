import React, {useState} from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios"

export default function AddPriority() {
    const navigate = useNavigate();

    const [Priority_name,setPriority_Name]=useState('')

    async function submit(e){
        e.preventDefault();
        try{
            await axios.post("/priority/addPriority",{
                Priority_name
            })
            .then(res=>{
                if(res.data=="exist"){
                    alert("Priority already exists")
                }
                else if(res.data=="notexist"){
                    alert("Priority added successfully")
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
            <h2>Add Priority</h2>

            <form action="POST">
                <div className="mb-3">
                    <label htmlFor="Priorityname"><strong>Priority Name</strong></label>
                <input type="Priorityname" autoComplete="off" onChange={(e) => { setPriority_Name(e.target.value) }} placeholder="Priority Name" className="form-control rounded-0" />
                </div>              
                
                <button type="submit" onClick={submit} className="btn btn-success w-100 rounded-0"> Submit </button>

            </form>
            </div>
        </div>
    );
}

