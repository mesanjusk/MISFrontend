import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EditUser({ userId, closeModal }) {
    const [groupOptions, setGroupOptions] = useState([]);
    const [taskGroupOptions, setTaskGroupOptions] = useState([]);
    const [values, setValues] = useState({
        User_name: '',
        Mobile_number: '',
        User_group: '',
        Allowed_Task_Groups: [],
    });

    useEffect(() => {
        axios.get("/usergroup/GetUsergroupList")
            .then(res => {
                if (res.data.success) {
                    const options = res.data.result.map(item => item.User_group);
                    setGroupOptions(options);
                }
            })
            .catch(err => {
                console.error("Error fetching user group options:", err);
            });

        axios.get("/taskgroup/GetTaskgroupList")
            .then(res => {
                if (res.data.success) {
                    const taskOptions = res.data.result.map(t => t.Task_group);
                    setTaskGroupOptions(taskOptions);
                }
            })
            .catch(err => console.error("Error fetching task groups:", err));
    }, []);

    useEffect(() => {
        if (userId) {
            axios.get(`/user/${userId}`)
                .then(res => {
                    if (res.data.success) {
                        const user = res.data.result;
                        setValues({
                            User_name: user.User_name || '',
                            Mobile_number: user.Mobile_number || '',
                            User_group: user.User_group || '',
                            Allowed_Task_Groups: user.Allowed_Task_Groups || [],
                        });
                    }
                })
                .catch(err => console.log('Error fetching user data:', err));
        }
    }, [userId]);

    const handleTaskGroupChange = (e) => {
        const selected = Array.from(e.target.selectedOptions, option => option.value);
        setValues(prev => ({ ...prev, Allowed_Task_Groups: selected }));
    };

    const handleSaveChanges = (e) => {
        e.preventDefault();

        if (!values.User_name || !values.Mobile_number || !values.User_group) {
            alert('All fields are required.');
            return;
        }

        axios.put(`/user/update/${userId}`, { 
            User_name: values.User_name,
            Mobile_number: values.Mobile_number,
            User_group: values.User_group,
            Allowed_Task_Groups: values.Allowed_Task_Groups
        })
        .then(res => {
            if (res.data.success) {
                alert('User updated successfully!');
                closeModal(); 
            }
        })
        .catch(err => {
            console.log('Error updating user:', err);
        });
    };

    return (
        <div className="bg-white-100">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleSaveChanges}>
                <div className="self-start bg-white p-2 w-100 mb-2 rounded-lg">
                    <label>User Name</label> 
                    <br />
                    <input
                        type="text"
                        value={values.User_name}
                        onChange={(e) => setValues({ ...values, User_name: e.target.value })}
                        required
                    />
                    <br />
                    <label>Mobile Number</label>
                    <br />
                    <input
                        type="text"
                        value={values.Mobile_number}
                        onChange={(e) => setValues({ ...values, Mobile_number: e.target.value })}
                        required
                    />
                    <br />
                    <label>User Group</label>
                    <br />
                    <select
                        value={values.User_group}
                        onChange={(e) => setValues({ ...values, User_group: e.target.value })}
                        required
                    >
                        <option value="">Select Group</option>
                        {groupOptions.map((group, index) => (
                            <option key={index} value={group}>{group}</option>
                        ))}
                    </select>
                    <br />
                    <label>Allowed Task Groups</label>
                    <br />
                    <select
                        multiple
                        value={values.Allowed_Task_Groups}
                        onChange={handleTaskGroupChange}
                        className="w-full p-1 border rounded"
                    >
                        {taskGroupOptions.map((task, i) => (
                            <option key={i} value={task}>{task}</option>
                        ))}
                    </select>
                    <br />
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                    <br />
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                </div>
            </form>
        </div>
    );
}
