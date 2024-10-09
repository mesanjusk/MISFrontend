import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EditUser({ userId, closeModal }) {
    const [groupOptions, setGroupOptions] = useState([]);
    const [values, setValues] = useState({
        User_name: '',
        Mobile_number: '',
        User_group: '',
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
                        });
                    }
                })
                .catch(err => console.log('Error fetching user data:', err));
        }
    }, [userId]);

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
                <br></br>
                <input
                    type="text"
                    value={values.User_name}
                    onChange={(e) => setValues({ ...values, User_name: e.target.value })}
                    required
                />
               <br></br>
               <label>Mobile Number</label>
                <br></br>
                <input
                    type="text"
                    value={values.Mobile_number}
                    onChange={(e) => setValues({ ...values, Mobile_number: e.target.value })}
                    required
                
                />
                 <br></br>
                <label>User Group</label>
                <br></br>
                <select
                    value={values.User_group}
                    onChange={(e) => setValues({ ...values, User_group: e.target.value })}
                    required
                >
                    {groupOptions.map((group, index) => (
                        <option key={index} value={group}>
                            {group}
                        </option>
                    ))}
                </select>
                <br></br>
                <button type="submit" className="btn btn-primary">Save Changes</button>
                    <br></br>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                </div>
            </form>
        </div>
    );
}
