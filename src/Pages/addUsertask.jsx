import React, {useState, useEffect} from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios"

export default function AddUsertask() {
    const navigate = useNavigate();

    const [Usertask_name,setUsertask_Name]=useState('')
    const [User,setUser]=useState('')
     const [userOptions, setUserOptions] = useState([]);

     useEffect(() => {
        axios.get("/user/GetUserList")
            .then(res => {
                if (res.data.success) {
                    const filteredUsers = res.data.result
                        .filter(item => item.User_group === "Office User")
                        .map(item => item.User_name);
                    setUserOptions(filteredUsers);
                }
            })
            .catch(err => {
                console.error("Error fetching user options:", err);
            });
    }, []);
    
    async function submit(e){
        e.preventDefault();
        try{
            await axios.post("/usertask/addUsertask",{
                Usertask_name, User
            })
            .then(res=>{
                if(res.data=="exist"){
                    alert("Task already exists")
                }
                else if(res.data=="notexist"){
                    alert("Task added successfully")
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
    const closeModal = () => {
        navigate("/home");
     };

    return (
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
           
            <div className="bg-white p-3 rounded w-90">
            <h2>Add Usertask</h2>

            <form action="POST">
                <div className="mb-3">
                    <label htmlFor="name"><strong>Users</strong></label>
                    <select className="form-control rounded-0" onChange={(e) => setUser(e.target.value)} value={User}>
                            <option value="">Select User</option>
                           
                               { userOptions.map((option, index) => (
                                    <option key={index} value={option}>{option}</option>
                                ))
                            }
                        </select>
                </div>     
                <div className="mb-3">
                    <label htmlFor="name"><strong>Name</strong></label>
                <input type="name" autoComplete="off" onChange={(e) => { setUsertask_Name(e.target.value) }} placeholder="Name" className="form-control rounded-0" />
                </div>              
              
                <button type="submit" onClick={submit} className="btn bg-green-500 w-100 text-white rounded-0"> Submit </button>
                <button 
                        type="button" 
                        className="btn bg-red-500 w-100 text-white rounded-0"
                        onClick={closeModal}
                    >
                        Close
                    </button>
            </form>
            </div>
        </div>
    );
}

