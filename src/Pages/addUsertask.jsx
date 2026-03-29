import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import axios from '../apiClient.js';
import InvoiceModal from "../Components/InvoiceModal";
import { extractPhoneNumber, sendWhatsAppText } from "../utils/whatsapp.js";

export default function AddUsertask() {
    const navigate = useNavigate();

    const [Usertask_name, setUsertask_Name] = useState('');
    const [User, setUser] = useState('');
    const [Deadline, setDeadline] = useState('');
    const [Remark, setRemark] = useState('');
    const [userOptions, setUserOptions] = useState([]);
    const [orderOptions, setOrderOptions] = useState([]);
    const [LinkedOrder, setLinkedOrder] = useState('');
    const [TaskStatus, setTaskStatus] = useState('pending');
    const [isDeadlineChecked, setIsDeadlineChecked] = useState(false);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [whatsAppMessage, setWhatsAppMessage] = useState('');
    const [mobileToSend, setMobileToSend] = useState('');
    const [sendWhatsAppAfterSave, setSendWhatsAppAfterSave] = useState(false);
    const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
    const [isTransactionSaved, setIsTransactionSaved] = useState(false);
    const previewRef = useRef();

    useEffect(() => {
        setIsAdminUser(localStorage.getItem("User_group") === "Admin User");
        axios.get("/user/GetUserList")
            .then(res => {
                if (res.data.success) {
                    const filteredUsers = res.data.result
                        .filter(item => item.User_group === "Office User");
                    setUserOptions(filteredUsers);
                }
            })
            .catch(err => {
                console.error("Error fetching user options:", err);
            });

        axios.get('/order/GetOrderList?page=1&limit=200')
            .then(res => {
                if (res?.data?.success) {
                    setOrderOptions(res?.data?.result || []);
                }
            })
            .catch(() => setOrderOptions([]));
    }, []);

    const submit = async (e) => {
        e.preventDefault();

        if (!User || !Usertask_name) {
            toast.error("Please fill in both User and Task fields.");
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
                Remark,
                LinkedOrder,
                TaskStatus
            });

            if (res.data === "exist") {
                toast.error("Task already exists");
            } else if (res.data === "notexist") {
                const selectedUser = userOptions.find((option) => option.User_name === User);
                const phoneNumber = extractPhoneNumber(selectedUser);
                const message = `Hello ${User}, your task has been created successfully. Thank you!`;

                toast.success("Task added successfully");
                setWhatsAppMessage(message);
                setMobileToSend(phoneNumber);
                setIsTransactionSaved(true);

                if (sendWhatsAppAfterSave) {
                    await sendWhatsApp(phoneNumber, message);
                }

                setInvoiceItems([{ Item: Usertask_name, Quantity: 1, Rate: 0, Amount: 0 }]);
                setShowInvoiceModal(true);
            }
        } catch (e) {
            toast.error("Something went wrong.");
            console.error(e);
        }
    };

    const sendWhatsApp = async (phone = mobileToSend, message = whatsAppMessage) => {
        if (!phone) {
            toast.error("Customer phone number is required");
            return;
        }

        setIsSendingWhatsApp(true);

        try {
            const { data } = await sendWhatsAppText({
                axiosInstance: axios,
                phone,
                message,
            });

            if (data?.success) {
                toast.success("WhatsApp message sent");
            } else {
                toast.error(data?.error || "Failed to send WhatsApp message");
            }
        } catch (error) {
            toast.error(error?.response?.data?.error || "Failed to send WhatsApp message");
        } finally {
            setIsSendingWhatsApp(false);
        }
    };

    const closeModal = () => {
        navigate("/Home");
    };

    const handleDeadlineCheckboxChange = () => {
        setIsDeadlineChecked(prev => !prev);
        setDeadline('');
    };


    const statusText = useMemo(() => ({
        pending: 'Pending',
        in_progress: 'In Progress',
        done: 'Done',
    }[TaskStatus] || 'Pending'), [TaskStatus]);

    const toggleStatus = () => {
        setTaskStatus((prev) => {
            if (prev === 'pending') return 'in_progress';
            if (prev === 'in_progress') return 'done';
            return 'pending';
        });
    };

    return (
        <>
        <Toaster position="top-center" reverseOrder={false} />
        <InvoiceModal
          open={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            navigate('/home');
          }}
          invoiceRef={previewRef}
          customerName={User}
          customerMobile={mobileToSend}
          items={invoiceItems}
          remark={Remark}
          onSendWhatsApp={sendWhatsApp}
        />
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6 relative">
            <button
              onClick={closeModal}
              className="absolute right-2 top-2 text-xl text-gray-400 hover:text-blue-500"
              type="button"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-4 text-center text-[#075e54]">Add User Task</h2>
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
                    <option key={index} value={option.User_name}>{option.User_name}</option>
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

              {isAdminUser && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isDeadlineChecked}
                    onChange={handleDeadlineCheckboxChange}
                    className="h-4 w-4 text-[#25d366] focus:ring-[#25d366] border-gray-300 rounded"
                  />
                  <label className="text-gray-700">Save Date</label>
                </div>
              )}

              {isAdminUser && isDeadlineChecked && (
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
                <label className="block font-medium text-gray-700 mb-1">Linked Order</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                  value={LinkedOrder}
                  onChange={(e) => setLinkedOrder(e.target.value)}
                >
                  <option value="">-- Select Order --</option>
                  {orderOptions?.map((option) => (
                    <option key={option?._id || option?.Order_uuid} value={option?.Order_uuid || option?._id || ''}>
                      #{option?.Order_Number || '-'} - {option?.Customer_name || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Task Status</p>
                  <p className="text-xs text-slate-500">{statusText}</p>
                </div>
                <button
                  type="button"
                  onClick={toggleStatus}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs hover:bg-white"
                >
                  Toggle Status
                </button>
              </div>

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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={sendWhatsAppAfterSave}
                  onChange={(e) => setSendWhatsAppAfterSave(e.target.checked)}
                  className="h-4 w-4 text-[#25d366] focus:ring-[#25d366] border-gray-300 rounded"
                />
                <label className="text-gray-700">Send WhatsApp after saving</label>
              </div>

              {isTransactionSaved && (
                <button
                  type="button"
                  onClick={() => sendWhatsApp()}
                  disabled={isSendingWhatsApp}
                  className="bg-[#075e54] hover:bg-[#064c44] text-white font-medium py-2 rounded-lg transition disabled:opacity-60"
                >
                  {isSendingWhatsApp ? 'Sending WhatsApp...' : 'Send WhatsApp Receipt'}
                </button>
              )}

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
