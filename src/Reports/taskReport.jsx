import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";
import EditTask from './editTask';
import AddTask from '../Pages/addTask';

const TaskReport = () => {
    const [task, setTask] = useState({});
    const [taskNames, setTaskNames] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showEditModal, setShowEditModal] = useState(false); 
    const [selectedTaskId, setSelectedTaskId] = useState(null); 
    const [showDeleteModal, setShowDeleteModal] = useState(false); 
    const [selectedTask, setSelectedTask] = useState(null); 
    const [showAddModal, setShowAddModal] = useState(false); 
    const [userGroup, setUserGroup] = useState(''); 
    const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

    useEffect(() => {
        const fetchUserGroup = async () => {
            const group = localStorage.getItem("User_group");
            setUserGroup(group);
        };

        fetchUserGroup();

        axios.get("task/GetTaskList")
            .then(res => {
                if (res.data.success) {
                    const taskMap = res.data.result.reduce((acc, task) => {
                        if (task.Task_name) {
                            acc[task._id] = {
                                name: task.Task_name,
                                group: task.Task_group 
                            };
                        }
                        return acc;
                    }, {});
                    setTask(taskMap);
                    setTaskNames(Object.values(taskMap).map(c => c.name));
                } else {
                    setTask({});
                }
            })
            .catch(err => console.log('Error fetching task list:', err));
    }, []);

    const handleEdit = (taskId) => {
        setSelectedTaskId(taskId); 
        setShowEditModal(true); 
    };

    const handleDeleteClick = (taskId) => {
        setSelectedTask({ ...task[taskId], _id: taskId }); 
        setShowDeleteModal(true); 
    };
    
    const handleDeleteConfirm = (taskId) => {
        axios.delete(`/task/Delete/${taskId}`) 
            .then(res => {
                if (res.data.success) {
                    setTask(prevTask => {
                        const newTask = { ...prevTask };
                        delete newTask[taskId]; 
                        return newTask;
                    });
                } else {
                    console.log('Error deleting task:', res.data.message);
                }
            })
            .catch(err => console.log('Error deleting task:', err));
        setShowDeleteModal(false); 
    };  

    const handleDeleteCancel = () => {
        setShowDeleteModal(false); 
    };

    const handleAddTask = () => {
        setShowAddModal(true); 
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
             <div className="no-print">
                <TopNavbar />
            </div>
            <div className="pt-12 pb-20">
                <div className="d-flex flex-wrap bg-white w-100 max-w-md p-2 mx-auto">
                    <label>
                        Search by Task Name or Group
                        <input
                            list="taskNames"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by task name or group"
                        />
                    </label>
                    <button onClick={handlePrint} className="btn">
                            <svg className="h-8 w-8 text-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9V3h12v6M6 15h12m-6 0v6m0 0H9m3 0h3" />
                            </svg>
                        </button>
                </div>
                <div className="d-flex flex-wrap bg-white w-100 max-w-md p-2 mx-auto">
                    <button onClick={handleAddTask} type="button" className="p-3 rounded-full text-white bg-green-500 mb-3">
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
                        {Object.keys(task).length > 0 ? (
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Group</th>
                                        {userGroup === "Admin User" && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(task)
                                        .filter(([id, task]) =>
                                            task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (task.group && task.group.toLowerCase().includes(searchTerm.toLowerCase()))
                                        )
                                        .map(([id, task]) => (
                                            <tr key={id}>
                                                <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>
                                                    {task.name}
                                                </td>
                                                <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>
                                                    {task.group}
                                                </td>
                                                {userGroup === "Admin User" && (
                                                    <td>
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
                                                    </td>
                                                )}
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
                        <EditTask taskId={selectedTaskId} closeModal={() => setShowEditModal(false)} />
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4>Are you sure you want to delete {selectedTask?.name}?</h4>
                        <div className="modal-actions">
                            <button onClick={() => handleDeleteConfirm(selectedTask?._id)} className="btn btn-danger">Yes</button>
                            <button onClick={handleDeleteCancel} className="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <AddTask closeModal={() => setShowAddModal(false)} /> 
                    </div>
                </div>
            )}

            <div className="no-print">
                <Footer />
            </div>
        </>
    );
};

export default TaskReport;
