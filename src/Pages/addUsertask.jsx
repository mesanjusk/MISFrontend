import React, {useState, useEffect} from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios"

export default function AddUsertask() {
    const navigate = useNavigate();

    const [Usertask_name,setUsertask_Name]=useState('')
    const [User,setUser]=useState('')
    const [Deadline, setDeadline] = useState('');
    const [Remark, setRemark] = useState('');
    const [userOptions, setUserOptions] = useState([]);
    const [isDeadlineChecked, setIsDeadlineChecked] = useState(false);

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
        const finalDeadline = isDeadlineChecked && Deadline ? Deadline : new Date().toISOString().split('T')[0];
        try{
            await axios.post("/usertask/addUsertask",{
                Usertask_name, 
                User, 
                Deadline: finalDeadline, 
                Remark
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

     const handleDeadlineCheckboxChange = () => {
        setIsDeadlineChecked(prev => !prev); 
        setDeadline(''); 
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
                    <label htmlFor="task"><strong>Task</strong></label>
                <input type="task" autoComplete="off" onChange={(e) => { setUsertask_Name(e.target.value) }} placeholder="Task" className="form-control rounded-0" />
                </div> 
                <div className="mb-3 ">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="deadlineCheckbox"
                            checked={isDeadlineChecked}
                            onChange={handleDeadlineCheckboxChange}
                        />
                        <label className="form-check-label" htmlFor="deadlineCheckbox">
                            Deadline 
                        </label>
                    </div> 
                    {isDeadlineChecked && (            
                <div className="mb-3">
                    <label htmlFor="deadline"><strong>Deadline</strong></label>
                <input type="date" autoComplete="off" onChange={(e) => { setDeadline(e.target.value) }} placeholder="Date" className="form-control rounded-0" />
                </div> 
                )}
                  <div className="mb-3">
                    <label htmlFor="remark"><strong>Remark</strong></label>
                <input type="remark" autoComplete="off" onChange={(e) => { setRemark(e.target.value) }} placeholder="Remark" className="form-control rounded-0" />
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

