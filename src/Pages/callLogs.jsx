import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CallUpdate from "../Pages/callUpdate";

export default function CallLogs() {
    const navigate = useNavigate();
    const [date, setDate] = useState("");
    const [logs, setLogs] = useState([]);
    const [selectedCallId, setSelectedCallId] = useState(null);
    const [showCallModal, setShowCallModal] = useState(false); 
    

    const formatDate = (timestamp) => {
        const dateObj = new Date(timestamp);
        return dateObj.toLocaleString(); 
    };

    async function submit(e) {
        e.preventDefault();
        try {
          
            const timestamp = new Date(date).getTime();

            const response = await axios.post("https://contacts.btgondia.com/logs/userLogs",
                {
                    user_uuid: "69ee87d1-23fa-4eb4-87fe-73b6222e80dc",
                    user_mobile: "+919372333633",
                    date: timestamp,
                    page: 0
                },
                {
                    headers: { "Content-Type": "application/json" }
                }
            );

            console.log("API Response:", response.data);

            if (response.data.success) {
                setLogs(response.data.logs);
            } else {
                alert("Failed to fetch logs.");
            }
        } catch (error) {
            console.error("API Error:", error);
            alert("Error fetching call logs. Check console for details.");
        }
    }

    const closeModal = () => {
        navigate("/home");
    };

    const handleCallClick = (log) => {
        setSelectedCallId(log);
        setShowCallModal(true);
    };

    const closeCallModal = () => {
        setShowCallModal(false); 
        setSelectedCallId(null);  
      };

    return (
        <>
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
            <div className="bg-white p-3 rounded w-90">
                <h2>Call Logs</h2>
                <form onSubmit={submit}>
                    <div className="mb-3">
                        <label htmlFor="date"><strong>Date</strong></label>
                        <input
                            type="date"
                            autoComplete="off"
                            onChange={(e) => setDate(e.target.value)}
                            placeholder="Date"
                            className="form-control rounded-0"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn bg-green-500 w-100 text-white rounded-0"
                    >
                        Submit
                    </button>
                    <button
                        type="button"
                        className="btn bg-red-500 w-100 text-white rounded-0"
                        onClick={closeModal}
                    >
                        Close
                    </button>
                </form>

                {logs.length > 0 && (
                    <div className="mt-4" >
                        <h3>Call Logs</h3>
                        <table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Cached Name</th>
                                    <th>Caller ID</th>
                                    <th>Type</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, index) => (
                                    <tr key={index} onClick={() => handleCallClick(log)}>
                                        <td>{log.cachedName}</td>
                                        <td>{log.callerId}</td>
                                        <td>{log.type}</td>
                                        <td>{log.duration}</td>
                                        
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
        {showCallModal && (
                        <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center ">
                             <CallUpdate log={selectedCallId} onClose={closeCallModal} />
                        </div>
        )}
        </>
    );
}
