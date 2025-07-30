import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddUser({ closeModal }) {
    const navigate = useNavigate();

    const [User_name, setUser_Name] = useState('');
    const [Password, setPassword] = useState('');
    const [Mobile_number, setMobile_Number] = useState('');
    const [User_group, setUser_Group] = useState('');
    const [Allowed_Task_Groups, setAllowed_Task_Groups] = useState([]);
    const [groupOptions, setGroupOptions] = useState([]);
    const [taskGroupOptions, setTaskGroupOptions] = useState([]);

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

        axios.get("/taskgroup/GetTaskgroupList")
            .then(res => {
                if (res.data.success) {
                    const taskOptions = res.data.result.map(item => item.Task_group);
                    setTaskGroupOptions(taskOptions);
                }
            })
            .catch(err => {
                console.error("Error fetching task groups:", err);
            });
    }, []);

    const handleTaskGroupChange = (e) => {
        const selected = Array.from(e.target.selectedOptions, option => option.value);
        setAllowed_Task_Groups(selected);
    };

    async function submit(e) {
        e.preventDefault();

        if (!User_name || !Password || !Mobile_number || !User_group) {
            alert("All fields are required");
            return;
        }

        try {
            const response = await axios.post("/user/addUser", {
                User_name,
                Password,
                Mobile_number,
                User_group,
                Allowed_Task_Groups
            });

            if (response.data === "exist") {
                alert("User already exists");
            } else if (response.data === "notexist") {
                alert("User added successfully");
                if (closeModal) closeModal();
                else navigate("/home");
            }
        } catch (e) {
            alert("Error submitting form");
            console.log(e);
        }
    }

    return (
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
            <div className="bg-white p-3 rounded w-90">
                <h2>Add User</h2>
                <form onSubmit={submit}>
                    <div className="mb-3">
                        <label><strong>User Name</strong></label>
                        <input
                            type="text"
                            autoComplete="off"
                            onChange={(e) => setUser_Name(e.target.value)}
                            placeholder="User Name"
                            className="form-control rounded-0"
                        />
                    </div>
                    <div className="mb-3">
                        <label><strong>Password</strong></label>
                        <input
                            type="password"
                            autoComplete="off"
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="form-control rounded-0"
                        />
                    </div>
                    <div className="mb-3">
                        <label><strong>Mobile Number</strong></label>
                        <input
                            type="text"
                            autoComplete="off"
                            onChange={(e) => setMobile_Number(e.target.value)}
                            placeholder="Mobile Number"
                            className="form-control rounded-0"
                        />
                    </div>
                    <div className="mb-3">
                        <label><strong>User Group</strong></label>
                        <select
                            className="form-control rounded-0"
                            onChange={(e) => setUser_Group(e.target.value)}
                            value={User_group}
                        >
                            <option value="">Select Group</option>
                            {groupOptions.map((option, index) => (
                                <option key={index} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label><strong>Allowed Task Groups</strong></label>
                        <select
                            multiple
                            className="form-control rounded-0"
                            onChange={handleTaskGroupChange}
                            value={Allowed_Task_Groups}
                        >
                            {taskGroupOptions.map((task, index) => (
                                <option key={index} value={task}>{task}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-success w-100 rounded-0">Submit</button>
                    {closeModal && (
                        <button type="button" className="btn btn-secondary mt-2 w-100 rounded-0" onClick={closeModal}>Cancel</button>
                    )}
                </form>
            </div>
        </div>
    );
}
