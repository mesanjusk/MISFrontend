import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopNavbar from "../Pages/topNavbar";
import Footer from "../Pages/footer";
import EditItem from './editItem';
import AddItem from '../Pages/addItem';

const ItemReport = () => {
    const [item, setItem] = useState({});
    const [itemNames, setItemNames] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [userGroup, setUserGroup] = useState('');
    const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

    useEffect(() => {
        const fetchUserGroup = async () => {
            const group = localStorage.getItem("User_group");
            setUserGroup(group);
        };

        fetchUserGroup();

        axios.get("item/GetItemList")
            .then(res => {
                if (res.data.success) {
                    const itemMap = res.data.result.reduce((acc, item) => {
                        if (item.Item_name) {
                            acc[item._id] = {
                                name: item.Item_name,
                                group: item.Item_group
                            };
                        }
                        return acc;
                    }, {});
                    setItem(itemMap);
                    setItemNames(Object.values(itemMap).map(c => c.name));
                } else {
                    setItem({});
                }
            })
            .catch(err => console.log('Error fetching item list:', err));
    }, []);

    const handleEdit = (itemId) => {
        setSelectedItemId(itemId);
        setShowEditModal(true);
    };

    const handleDeleteClick = (itemId) => {
        setSelectedItem({ ...item[itemId], _id: itemId });
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = (itemId) => {
        axios.delete(`/item/Delete/${itemId}`)
            .then(res => {
                if (res.data.success) {
                    setItem(prevItem => {
                        const newItem = { ...prevItem };
                        delete newItem[itemId];
                        return newItem;
                    });
                } else {
                    console.log('Error deleting item:', res.data.message);
                }
            })
            .catch(err => console.log('Error deleting item:', err));
        setShowDeleteModal(false);
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
    };

    const handleAddItem = () => {
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

            <div className="print-content">
                <div className="pt-12 pb-20">
                    <div className="d-flex flex-wrap bg-white w-100 max-w-md p-2 mx-auto">
                        <label>
                            Search by Item Name or Group
                            <input
                                list="itemNames"
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
                    <button onClick={handleAddItem} type="button" className="p-3 rounded-full text-white bg-green-500 mb-3">
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
                            {Object.keys(item).length > 0 ? (
                                <table className="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Group</th>
                                            {userGroup === "Admin User" && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(item)
                                            .filter(([id, item]) =>
                                                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                (item.group && item.group.toLowerCase().includes(searchTerm.toLowerCase()))
                                            )
                                            .map(([id, item]) => (
                                                <tr key={id}>
                                                    <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>
                                                        {item.name}
                                                    </td>
                                                    <td onClick={() => handleEdit(id)} style={{ cursor: 'pointer' }}>
                                                        {item.group}
                                                    </td>
                                                    {userGroup === "Admin User" && (
                                                        <td>
                                                            <button onClick={() => handleDeleteClick(id)} className="btn">
                                                                <svg className="h-6 w-6 text-red-500" width="12" height="12" viewBox="0 0 22 22" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path stroke="none" d="M0 0h24v24H0z" />
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
            </div>
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <EditItem itemId={selectedItemId} closeModal={() => setShowEditModal(false)} />
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4>Are you sure you want to delete {selectedItem?.name}?</h4>
                        <div className="modal-actions">
                            <button onClick={() => handleDeleteConfirm(selectedItem?._id)} className="btn btn-danger">Yes</button>
                            <button onClick={handleDeleteCancel} className="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <AddItem closeModal={() => setShowAddModal(false)} /> 
                    </div>
                </div>
            )}
            <div className="no-print">
                <Footer />
            </div>
        </>
    );
};

export default ItemReport;
