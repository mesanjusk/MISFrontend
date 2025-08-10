/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import AddCustomer from "./addCustomer";
import InvoiceModal from "../Components/InvoiceModal";
import { LoadingSpinner } from "../Components";

const BASE_URL = "https://misbackend-e078.onrender.com";

export default function AddOrder1() {
  const navigate = useNavigate();
  const location = useLocation();

  const [Customer_name, setCustomer_Name] = useState("");
  const [Remark, setRemark] = useState("");
  const [customerOptions, setCustomerOptions] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [isAdvanceChecked, setIsAdvanceChecked] = useState(false);
  const [Amount, setAmount] = useState("");
  const [loggedInUser, setLoggedInUser] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [accountCustomerOptions, setAccountCustomerOptions] = useState([]);
  const [group, setGroup] = useState(""); // payment account uuid

  const [taskGroups, setTaskGroups] = useState([]);
  const [selectedTaskGroups, setSelectedTaskGroups] = useState([]);
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [mobileToSend, setMobileToSend] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const previewRef = useRef();
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    const userNameFromState = location.state?.id;
    const logInUser = userNameFromState || localStorage.getItem("User_name");
    if (logInUser) setLoggedInUser(logInUser);
    else navigate("/login");
  }, [location.state, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setOptionsLoading(true);
      try {
        const [customerRes, taskRes] = await Promise.all([
          axios.get(`${BASE_URL}/customer/GetCustomersList`),
          axios.get(`${BASE_URL}/taskgroup/GetTaskgroupList`),
        ]);

        if (customerRes.data.success) {
          const all = customerRes.data.result || [];
          setCustomerOptions(all);
          const accountOptions = all.filter((item) => item.Customer_group === "Bank and Account");
          setAccountCustomerOptions(accountOptions);
        }

        if (taskRes.data.success) {
          const filtered = (taskRes.data.result || []).filter((tg) => tg.Id === 1);
          setTaskGroups(filtered);
        }
      } catch (e) {
        console.error(e);
        toast.error("Error fetching data");
      } finally {
        setOptionsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTaskGroupToggle = (uuid) => {
    setSelectedTaskGroups((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  };

  // ✅ Build Items so the note is saved as Items[0].Remark
  const buildItemsFromRemark = (remark) => {
    const r = String(remark || "").trim();
    if (!r) return [];
    return [
      {
        Item: "Order Note", // non-empty or backend will drop it
        Quantity: 0,
        Rate: 0,
        Amount: 0,
        Priority: "Normal",
        Remark: r,
      },
    ];
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      const customer = customerOptions.find((opt) => opt.Customer_name === Customer_name);
      const payModeCustomer = accountCustomerOptions.find((opt) => opt.Customer_uuid === group);

      if (!customer) {
        toast.error("Invalid customer selection");
        return;
      }

      const steps = selectedTaskGroups.map((tgUuid) => {
        const g = taskGroups.find((t) => t.Task_group_uuid === tgUuid);
        return {
          label: g?.Task_group_name || g?.Task_group || "Unnamed Group",
          checked: true,
        };
      });

      // ✅ Send Items so remark persists
      const orderResponse = await axios.post(`${BASE_URL}/order/addOrder`, {
        Customer_uuid: customer.Customer_uuid,
        Steps: steps,
        Items: buildItemsFromRemark(Remark),
      });

      if (!orderResponse.data.success) {
        toast.error("Failed to add order");
        return;
      }

      // Optional: create advance transaction
      if (isAdvanceChecked && Amount && group) {
        const amt = Number(Amount || 0);
        if (Number.isNaN(amt) || amt <= 0) {
          toast.error("Enter a valid advance amount");
          return;
        }

        const journal = [
          { Account_id: group, Type: "Debit", Amount: amt },
          { Account_id: customer.Customer_uuid, Type: "Credit", Amount: amt },
        ];

        const transactionResponse = await axios.post(`${BASE_URL}/transaction/addTransaction`, {
          Description: Remark || "Advance received",
          Transaction_date: new Date().toISOString().split("T")[0],
          Total_Credit: amt,
          Total_Debit: amt,
          Payment_mode: payModeCustomer?.Customer_name || "Advance",
          Journal_entry: journal,
          Created_by: loggedInUser,
        });

        if (!transactionResponse.data.success) {
          toast.error("Transaction failed");
          return;
        }

        toast.success("Order & Payment Added");
        setInvoiceItems([{ Item: "Advance", Quantity: 1, Rate: amt, Amount: amt }]);
      } else {
        toast.success("Order Added");
        setInvoiceItems([]);
      }

      const message = `Dear ${customer.Customer_name}, your order has been booked successfully.`;
      setWhatsAppMessage(message);
      setMobileToSend(customer.Mobile_number || "");
      setShowInvoiceModal(true);
    } catch (error) {
      console.error("Error during submit:", error);
      toast.error("Something went wrong");
    }
  };

  const sendMessageToAPI = async (name, phone, message) => {
    try {
      const res = await fetch(`${BASE_URL}/usertask/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: phone,
          userName: name,
          type: "customer",
          message,
        }),
      });
      const result = await res.json();
      if (result?.error) toast.error("Failed to send message");
      else toast.success("WhatsApp message sent");
    } catch {
      toast.error("Failed to send WhatsApp");
    }
  };

  const sendWhatsApp = async () => {
    await sendMessageToAPI(Customer_name, mobileToSend, whatsAppMessage);
    setShowInvoiceModal(false);
    navigate("/home");
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setCustomer_Name(value);
    if (value) {
      const filtered = customerOptions.filter((opt) =>
        (opt.Customer_name || "").toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
      setShowOptions(true);
    } else {
      setShowOptions(false);
    }
  };

  const handleOptionClick = (opt) => {
    setCustomer_Name(opt.Customer_name);
    setShowOptions(false);
  };

  const handleAdvanceCheckboxChange = () => {
    setIsAdvanceChecked((prev) => !prev);
    setAmount("");
  };

  const handleCustomer = () => setShowCustomerModal(true);
  const exitModal = () => setShowCustomerModal(false);
  const closeModal = () => navigate("/home");

  return (
    <>
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          navigate("/home");
        }}
        invoiceRef={previewRef}
        customerName={Customer_name}
        customerMobile={mobileToSend}
        items={invoiceItems}
        remark={Remark}
        onSendWhatsApp={sendWhatsApp}
      />

      <div className="flex justify-center items-center bg-[#f0f2f5] min-h-screen text-[#111b21] px-4">
        <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-6 relative">
          <button
            onClick={closeModal}
            className="absolute right-2 top-2 text-xl text-gray-400 hover:text-red-600"
          >
            ×
          </button>

          <h2 className="text-xl font-semibold mb-4 text-center">New Order</h2>

          <form onSubmit={submit}>
            {/* Customer Search */}
            {optionsLoading ? (
              <div className="flex justify-center items-center h-10 mb-4">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="mb-4 relative">
                <input
                  type="text"
                  placeholder="Search by Customer Name"
                  className="w-full p-2 rounded-md border border-gray-300 focus:outline-none"
                  value={Customer_name}
                  onChange={handleInputChange}
                  onFocus={() => setShowOptions(true)}
                />
                <button
                  type="button"
                  onClick={handleCustomer}
                  className="absolute top-1 right-1 bg-[#25D366] text-white w-8 h-8 rounded-full flex items-center justify-center"
                  title="Add Customer"
                >
                  +
                </button>
                {showOptions && filteredOptions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border mt-1 rounded-md shadow max-h-60 overflow-auto">
                    {filteredOptions.map((option, index) => (
                      <li
                        key={index}
                        className="px-4 py-2 hover:bg-[#f0f2f5] cursor-pointer"
                        onClick={() => handleOptionClick(option)}
                      >
                        {option.Customer_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Order note (used for Items[0].Remark + WhatsApp) */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Order</label>
              <input
                type="text"
                className="w-full p-2 rounded-md border border-gray-300"
                placeholder="Item Details / Note"
                value={Remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>

            {/* Advance */}
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="advanceCheckbox"
                className="accent-[#25D366]"
                checked={isAdvanceChecked}
                onChange={handleAdvanceCheckboxChange}
              />
              <label htmlFor="advanceCheckbox">Advance</label>
            </div>

            {isAdvanceChecked && (
              <>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Amount</label>
                  <input
                    type="number"
                    className="w-full p-2 rounded-md border border-gray-300"
                    placeholder="Enter Amount"
                    value={Amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                {optionsLoading ? (
                  <div className="flex justify-center items-center h-10 mb-4">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block mb-1 font-medium">Payment Mode</label>
                    <select
                      className="w-full p-2 rounded-md border border-gray-300"
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                    >
                      <option value="">Select Payment</option>
                      {accountCustomerOptions.map((c, i) => (
                        <option key={i} value={c.Customer_uuid}>
                          {c.Customer_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Task Groups (Id === 1) */}
            {optionsLoading ? (
              <div className="flex justify-center items-center h-10 mb-4">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block mb-1 font-medium">Task Groups</label>
                <div className="flex flex-wrap gap-2">
                  {taskGroups.map((tg) => (
                    <label
                      key={tg.Task_group_uuid}
                      className="flex items-center gap-2 border px-2 py-1 rounded-md shadow-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTaskGroups.includes(tg.Task_group_uuid)}
                        onChange={() => handleTaskGroupToggle(tg.Task_group_uuid)}
                        className="accent-[#25D366]"
                      />
                      <span>{tg.Task_group_name || tg.Task_group || "Unnamed Group"}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#25D366] py-2 rounded-md font-medium text-white hover:bg-[#20c95c]"
            >
              Submit
            </button>
          </form>
        </div>
      </div>

      {showCustomerModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <AddCustomer onClose={exitModal} />
        </div>
      )}
    </>
  );
}
