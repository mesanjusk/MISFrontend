import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InvoiceModal from "../Components/InvoiceModal";

export default function AddUsertask() {
    const navigate = useNavigate();

    const [Usertask_name, setUsertask_Name] = useState('');
    const [User, setUser] = useState('');
    const [Deadline, setDeadline] = useState('');
    const [Remark, setRemark] = useState('');
    const [userOptions, setUserOptions] = useState([]);
    const [isDeadlineChecked, setIsDeadlineChecked] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [invoiceItems, setInvoiceItems] = useState([]);
    const previewRef = useRef();

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

    const submit = async (e) => {
        e.preventDefault();

        if (!User || !Usertask_name) {
            alert("Please fill in both User and Task fields.");
            return;
        }

        const finalDeadline = isDeadlineChecked && Deadline
            ? Deadline
            : new Date().toLocaleDateString('en-CA'); // yyyy-mm-dd format

        try {
            const res = await axios.post("/usertask/addUsertask", {
                Usertask_name,
                User,
                Deadline: finalDeadline,
                Remark
            });

            if (res.data === "exist") {
                alert("Task already exists");
            } else if (res.data === "notexist") {
                alert("Task added successfully");
                setInvoiceItems([{ Item: Usertask_name, Quantity: 1, Rate: 0, Amount: 0 }]);
                setShowInvoiceModal(true);
            }
        } catch (e) {
            alert("Something went wrong.");
            console.error(e);
        }
    };

    const closeModal = () => {
        navigate("/Home");
    };

    const handleDeadlineCheckboxChange = () => {
        setIsDeadlineChecked(prev => !prev);
        setDeadline('');
    };

    return (
        <>
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => { setShowInvoiceModal(false); navigate('/home'); }}
          invoiceRef={previewRef}
          customerName={User}
          items={invoiceItems}
          remark={Remark}
        />
        <div className="min-h-screen bg-[#f0f2f5] flex justify-center items-center px-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-[#075e54]">Add User Task</h2>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block font-medium text-gray-700 mb-1">Select User</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                            value={User}
                            onChange={(e) => setUser(e.target.value)}
                        >
                            <option value="">-- Select User --</option>
                            {userOptions.map((option, index) => (
                                <option key={index} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-medium text-gray-700 mb-1">Task</label>
                        <input
                            type="text"
                            value={Usertask_name}
                            onChange={(e) => setUsertask_Name(e.target.value)}
                            placeholder="Enter task"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                            autoFocus
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={isDeadlineChecked}
                            onChange={handleDeadlineCheckboxChange}
                            className="h-4 w-4 text-[#25d366] focus:ring-[#25d366] border-gray-300 rounded"
                        />
                        <label className="text-gray-700">Add Deadline</label>
                    </div>

                    {isDeadlineChecked && (
                        <div>
                            <label className="block font-medium text-gray-700 mb-1">Deadline</label>
                            <input
                                type="date"
                                value={Deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block font-medium text-gray-700 mb-1">Remark</label>
                        <input
                            type="text"
                            value={Remark}
                            onChange={(e) => setRemark(e.target.value)}
                            placeholder="Add remark"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                        />
                    </div>

                    <div className="flex flex-col space-y-2">
                        <button
                            type="submit"
                            className="bg-[#25d366] hover:bg-[#128c7e] text-white font-medium py-2 rounded-lg transition"
                        >
                            Submit
                        </button>
                        <button
                            type="button"
                            className="bg-gray-400 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition"
                            onClick={closeModal}
                        >
                            Close
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
}
