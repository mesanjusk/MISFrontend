import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AddUser({ closeModal }) {
    const navigate = useNavigate();

    const [User_name, setUser_Name] = useState('');
    const [Password, setPassword] = useState('');
    const [Mobile_number, setMobile_Number] = useState('');
    const [User_group, setUser_Group] = useState('');
    const [Allowed_Task_Groups, setAllowed_Task_Groups] = useState([]);
    const [groupOptions, setGroupOptions] = useState([]);
    const [taskGroupOptions, setTaskGroupOptions] = useState([]);
    const [passwordStrength, setPasswordStrength] = useState("");

    useEffect(() => {
        axios.get("/usergroup/GetUsergroupList")
            .then(res => {
                if (res.data.success) {
                    const options = res.data.result.map(item => item.User_group);
                    setGroupOptions(options); 
                }
            });

        axios.get("/taskgroup/GetTaskgroupList")
            .then(res => {
                if (res.data.success) {
                    const taskOptions = res.data.result.map(item => item.Task_group);
                    setTaskGroupOptions(taskOptions);
                }
            });
    }, []);

    const handleTaskGroupChange = (e) => {
        const selected = Array.from(e.target.selectedOptions, option => option.value);
        setAllowed_Task_Groups(selected);
    };

    const evaluatePasswordStrength = (password) => {
        if (password.length < 6) return "Weak";
        if (/[A-Z]/.test(password) && /\d/.test(password) && /[@$!%*?&#]/.test(password)) return "Strong";
        return "Medium";
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        setPasswordStrength(evaluatePasswordStrength(value));
    };

    async function submit(e) {
        e.preventDefault();

        const phonePattern = /^[6-9]\d{9}$/;

        if (!User_name || !Password || !Mobile_number || !User_group) {
            toast.error("All fields are required");
            return;
        }

        if (!phonePattern.test(Mobile_number)) {
            toast.error("Enter a valid 10-digit mobile number starting with 6-9");
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
                toast.warning("User already exists");
            } else if (response.data === "notexist") {
                toast.success("User added successfully");
                setTimeout(() => {
                    if (closeModal) closeModal();
                    else navigate("/home");
                }, 1500);
            }
        } catch (e) {
            toast.error("Error submitting form");
            console.log(e);
        }
    }

    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case "Weak": return "text-danger";
            case "Medium": return "text-warning";
            case "Strong": return "text-success";
            default: return "text-muted";
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
            <ToastContainer position="top-center" />
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
                            className="form-control"
                        />
                    </div>
                    <div className="mb-3">
                        <label><strong>Password</strong></label>
                        <input
                            type="password"
                            autoComplete="off"
                            value={Password}
                            onChange={handlePasswordChange}
                            placeholder="Password"
                            className="form-control"
                        />
                        {Password && (
                            <small className={getPasswordStrengthColor()}>
                                Strength: {passwordStrength}
                            </small>
                        )}
                    </div>
                    <div className="mb-3">
                        <label><strong>Mobile Number</strong></label>
                        <input
                            type="text"
                            autoComplete="off"
                            onChange={(e) => setMobile_Number(e.target.value)}
                            placeholder="Mobile Number"
                            className="form-control"
                        />
                    </div>
                    <div className="mb-3">
                        <label><strong>User Group</strong></label>
                        <select
                            className="form-control"
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
                            className="form-control"
                            onChange={handleTaskGroupChange}
                            value={Allowed_Task_Groups}
                        >
                            {taskGroupOptions.map((task, index) => (
                                <option key={index} value={task}>{task}</option>
                            ))}
                        </select>
                        <small className="text-muted">Hold Ctrl (Cmd on Mac) to select multiple</small>
                    </div>
                    <button type="submit" className="btn btn-success w-100">Submit</button>
                    {closeModal && (
                        <button type="button" className="btn btn-secondary mt-2 w-100" onClick={closeModal}>Cancel</button>
                    )}
                </form>
            </div>
        </div>
    );
}
