import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";
import EditUser from './editUser';
import AddUser from '../Pages/addUser'; 

const UserReport = () => {
    const [users, setUsers] = useState({});
    const [userNames, setUserNames] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showEditModal, setShowEditModal] = useState(false); 
    const [selectedUserId, setSelectedUserId] = useState(null); 
    const [showDeleteModal, setShowDeleteModal] = useState(false); 
    const [selectedUser, setSelectedUser] = useState(null); 
    const [showAddModal, setShowAddModal] = useState(false); 
    const [userGroup, setUserGroup] = useState(''); 
    const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

    useEffect(() => {
        const fetchUserGroup = async () => {
            const group = localStorage.getItem("User_group");
            setUserGroup(group);
        };

        fetchUserGroup();

        axios.get("/user/GetUserList")
            .then(res => {
                if (res.data.success) {
                    const userMap = res.data.result.reduce((acc, user) => {
                        if (user.User_uuid && user.User_name && user.Mobile_number) { 
                            acc[user._id] = {
                                name: user.User_name,
                                mobile: user.Mobile_number,
                                group: user.User_group,
                                userUuid: user.User_uuid 
                            };
                        }
                        return acc;
                    }, {});
                    
                    setUsers(userMap);
                    setUserNames(Object.values(userMap).map(c => c.name));
                } else {
                    setUsers({});
                }
            })
            .catch(err => console.log('Error fetching users list:', err));
    }, []);
    
    const handleEdit = (userId) => {
        setSelectedUserId(userId); 
        setShowEditModal(true); 
    };

    const handleDeleteClick = (userId) => {
        const userToDelete = users[userId];
        if (userToDelete) {
            setSelectedUser(userToDelete);
            setShowDeleteModal(true);
            setDeleteErrorMessage(''); 
        } else {
            console.error('User not found for ID:', userId);
        }
    };
    

    const handleDeleteConfirm = (userId) => {
        axios.delete(`/user/Delete/${userId}`) 
            .then(res => {
                if (res.data.success) {
                    setUsers(prevUser => {
                        const newUser = { ...prevUser };
                        delete newUser[userId]; 
                        return newUser;
                    });
                } else {
                    console.log('Error deleting user:', res.data.message);
                }
            })
            .catch(err => console.log('Error deleting user:', err));
        setShowDeleteModal(false); 
    };
    

    const handleDeleteCancel = () => {
        setShowDeleteModal(false); 
    };

    const handleAddUser = () => {
        setShowAddModal(true); 
    };

    return (
        <>
            <TopNavbar />
            <div className="pt-12 pb-20">
                <div className="d-flex flex-wrap bg-white w-100 max-w-md p-2 mx-auto">
                    <label>
                        Search by User Name or Group
                        <input
                            list="userNames"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by user name or group"
                        />
                    </label>
                </div>
                <div className="d-flex flex-wrap bg-white w-100 max-w-md p-2 mx-auto">
                    <button onClick={handleAddUser} type="button" className="p-3 rounded-full text-white bg-green-500 mb-3">
                        <svg className="h-8 w-8 text-white-500" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">  
                            <path stroke="none" d="M0 0h24v24H0z"/>  
                            <circle cx="12" cy="12" r="9" />  
                            <line x1="9" y1="12" x2="15" y2="12" />  
                            <line x1="12" y1="9" x2="12" y2="15" />
                        </svg>
                    </button>
                </div>
                <main className="flex flex-1 p-1 overflow-y-auto">
                    <div className="w-100 max-w-md mx-auto">
                        {Object.keys(users).length > 0 ? (
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Mobile</th>
                                        {userGroup === "Admin User" && <th>Actions</th>} 
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(users)
                                        .filter(([id, user]) =>
                                            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (user.group && user.group.toLowerCase().includes(searchTerm.toLowerCase()))
                                        )
                                        .map(([id, user]) => (
                                            <tr key={id}>
                                                <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>
                                                    {user.name}
                                                </td>
                                                <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>
                                                    {user.mobile}
                                                </td>
                                                <td>
                                                    {userGroup === "Admin User" && (
                                                        <button onClick={() => handleDeleteClick(id)} className="btn">
                                                            <svg className="h-6 w-6 text-red-500" width="12" height="12" viewBox="0 0 22 22" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">  
                                                                <path stroke="none" d="M0 0h24v24H0z"/>  
                                                                <line x1="4" y1="7" x2="20" y2="7" />  
                                                                <line x1="10" y1="11" x2="10" y2="17" />  
                                                                <line x1="14" y1="11" x2="14" y2="17" />  
                                                                <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />  
                                                                <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No data available for the selected filters.</p>
                        )}
                    </div>
                </main>
            </div>

            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <EditUser userId={selectedUserId} closeModal={() => setShowEditModal(false)} />
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4>Are you sure you want to delete {selectedUser?.name}?</h4>
                        <div className="modal-actions">
                            <button onClick={handleDeleteConfirm} className="btn btn-danger">Yes</button>
                            <button onClick={handleDeleteCancel} className="btn btn-secondary">Cancel</button>
                        </div>
                        {deleteErrorMessage && <p className="text-red-500">{deleteErrorMessage}</p>}
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <AddUser closeModal={() => setShowAddModal(false)} /> 
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
};

export default UserReport;
