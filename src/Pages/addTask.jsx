import React, {useEffect, useState} from 'react';
import { useNavigate } from "react-router-dom";
import { addTask, fetchTaskGroups } from '../services/taskService.js'

export default function AddTask({ closeModal }) {
    const navigate = useNavigate();

    const [Task_name,setTask_Name]=useState('')
    const [Task_group,setTask_Group]=useState('')
    const [groupOptions, setGroupOptions] = useState([]);

    useEffect(() => {
        fetchTaskGroups()
            .then(res => {
                if (res.data.success) {
                    const options = res.data.result.map(item => item.Task_group);
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
            await addTask({
                Task_name, Task_group
            })
            .then(res=>{
                if(res.data=="exist"){
                    alert("Task already exists")
                }
                else if(res.data=="notexist"){
                    alert("Task added successfully")
                    closeModal();
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
            <h2>Add Task</h2>

            <form action="POST">
                <div className="mb-3">
                    <label htmlFor="Taskname"><strong>Task Name</strong></label>
                <input type="Taskname" autoComplete="off" onChange={(e) => { setTask_Name(e.target.value) }} placeholder="Task Name" className="form-control rounded-0" />
                </div>              
                <div className="mb-3">
                <label htmlFor="Itemgroup"><strong>Item Group</strong></label>
                <select className="form-control rounded-0" onChange={(e) => setTask_Group(e.target.value)} value={Task_group}>
                            <option value="">Select Group</option>
                           
                               { groupOptions.map((option, index) => (
                                    <option key={index} value={option}>{option}</option>
                                ))
                            }
                        </select>
                </div>
                <button type="submit" onClick={submit} className="w-100 h-10 bg-blue-500 text-white shadow-lg flex items-center justify-center"> Submit </button>
                <button 
                        type="button" 
                        className="w-100 h-10 bg-red-500 text-white shadow-lg flex items-center justify-center"
                        onClick={closeModal}
                    >
                        Close
                    </button>
            </form>
            </div>
        </div>
    );
}

