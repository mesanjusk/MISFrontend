import React, {useEffect, useState} from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios"

export default function AddUser() {
    const navigate = useNavigate();

    const [User_name,setUser_Name]=useState('')
    const [Password,setPassword]=useState('')
    const [Mobile_number,setMobile_Number]=useState('')
    const [User_group,setUser_Group]=useState('')
    const [groupOptions, setGroupOptions] = useState([]);

    useEffect(() => {
        axios.get("/usergroup/GetUsergroupList")
            .then(res => {
                if (res.data.success) {
                    const options = res.data.result.map(item => item.User_group);
                    setGroupOptions(options); 
                }
            })
            .catch(err => {
                console.error("Error fetching group options:", err);
            });
    }, []);

    async function submit(e){
        e.preventDefault();
        try{
            await axios.post("/user/addUser",{
                User_name, Password, Mobile_number, User_group
            })
            .then(res=>{
                if(res.data=="exist"){
                    alert("User already exists")
                }
                else if(res.data=="notexist"){
                    alert("User added successfully")
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
            <h2>Add User</h2>

            <form action="POST">
                <div className="mb-3">
                    <label htmlFor="Username"><strong>User Name</strong></label>
                <input type="Username" autoComplete="off" onChange={(e) => { setUser_Name(e.target.value) }} placeholder="User Name" className="form-control rounded-0" />
                </div>
                <div className="mb-3">
                    <label htmlFor="password"><strong>Password</strong></label>
                <input type="password" autoComplete="off" onChange={(e) => { setPassword(e.target.value) }} placeholder="Password" className="form-control rounded-0" />
                </div>
                <div className="mb-3">
                <label htmlFor="mobilenumber"><strong>Mobile Number</strong></label>
                <input type="mobilenumber" autoComplete="off" onChange={(e) => { setMobile_Number(e.target.value) }} placeholder="Mobile Number" className="form-control rounded-0" />
                </div>                
                <div className="mb-3">
                <label htmlFor="Usergroup"><strong>User Group</strong></label>
                <select className="form-control rounded-0" onChange={(e) => setUser_Group(e.target.value)} value={User_group}>
                            <option value="">Select Group</option>
                           
                               { groupOptions.map((option, index) => (
                                    <option key={index} value={option}>{option}</option>
                                ))
                            }
                        </select>
                </div>
                <button type="submit" onClick={submit} className="btn btn-success w-100 rounded-0"> Submit </button>

            </form>
            </div>
        </div>
    );
}

