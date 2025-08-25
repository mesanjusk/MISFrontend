/* eslint-disable react/prop-types */
import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import AddCustomer from "./addCustomer";
import InvoiceModal from "../Components/InvoiceModal";
import { LoadingSpinner } from "../Components";

export default function AddOrder1() {
  const navigate = useNavigate();
  const location = useLocation();
  const previewRef = useRef();

  // Auth / user
  const [loggedInUser, setLoggedInUser] = useState("");

  // Customers (search + accounts list)
  const [Customer_name, setCustomer_Name] = useState("");
  const [Remark, setRemark] = useState("");
  const [customerOptions, setCustomerOptions] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);

  const [accountCustomerOptions, setAccountCustomerOptions] = useState([]);
  const [group, setGroup] = useState("");

  // Advance
  const [isAdvanceChecked, setIsAdvanceChecked] = useState(false);
  const [Amount, setAmount] = useState("");

  // Task Groups / Steps
  const [taskGroups, setTaskGroups] = useState([]);
  const [selectedTaskGroups, setSelectedTaskGroups] = useState([]);

  // WhatsApp + invoice
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [mobileToSend, setMobileToSend] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [createdOrder, setCreatedOrder] = useState(null); // keep created order data for preview if needed

  // UX
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  /* ----------- auth init ----------- */
  useEffect(() => {
    const userNameFromState = location.state?.id;
    const logInUser = userNameFromState || localStorage.getItem("User_name");
    if (logInUser) setLoggedInUser(logInUser);
    else navigate("/login");
  }, [location.state, navigate]);

  /* ----------- Load customers + ALL task groups ----------- */
  useEffect(() => {
    const fetchData = async () => {
      setOptionsLoading(true);
      try {
        const [customerRes, taskRes] = await Promise.all([
          axios.get(`/customer/GetCustomersList`),
          axios.get(`/taskgroup/GetTaskgroupList`),
        ]);

        if (customerRes.data?.success) {
          const all = customerRes.data.result || [];
          setCustomerOptions(all);
          const accountOptions = all.filter(
            (item) => item.Customer_group === "Bank and Account"
          );
          setAccountCustomerOptions(accountOptions);
        }

        if (taskRes.data?.success) {
          const allGroups = taskRes.data.result || [];
          setTaskGroups(allGroups);

         setSelectedTaskGroups([]);
        } else {
          setTaskGroups([]);
          setSelectedTaskGroups([]);
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

  /* ----------- Handlers ----------- */
  const handleTaskGroupToggle = (uuid) => {
    setSelectedTaskGroups((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  };

  const buildItemsFromRemark = (remark) => {
    const r = String(remark || "").trim();
    if (!r) return [];
    return [
      {
        Item: "Order Note",
        Quantity: 0,
        Rate: 0,
        Amount: 0,
        Priority: "Normal",
        Remark: r,
      },
    ];
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

  /* ----------- Submit ----------- */
  const canSubmit = useMemo(() => {
    const hasCustomer = Boolean(
      customerOptions.find((c) => c.Customer_name === Customer_name)
    );
    const advanceOk = !isAdvanceChecked ? true : Number(Amount) > 0 && Boolean(group);
    return hasCustomer && advanceOk;
  }, [Customer_name, customerOptions, isAdvanceChecked, Amount, group]);

  const submit = async (e) => {
    e.preventDefault();

    try {
      const customer = customerOptions.find(
        (opt) => opt.Customer_name === Customer_name
      );
      if (!customer) {
        toast.error("Invalid customer selection");
        return;
      }

      const steps = selectedTaskGroups.map((tgUuid) => {
        const g = taskGroups.find((t) => t.Task_group_uuid === tgUuid);
        return {
          uuid: tgUuid,
          label: g?.Task_group_name || g?.Task_group || "Unnamed Group",
          checked: true,
        };
      });

      // Create order
      const orderRes = await axios.post(`/order/addOrder`, {
        Customer_uuid: customer.Customer_uuid,
        Steps: steps,
        Items: buildItemsFromRemark(Remark),
      });

      if (!orderRes.data?.success) {
        toast.error("Failed to add order");
        return;
      }

      // Keep created order (if needed in preview)
      setCreatedOrder(orderRes.data.result || null);

      // Prepare invoice items
      const baseItems = buildItemsFromRemark(Remark);
      setInvoiceItems(baseItems);

      // WhatsApp message + phone
      const message = `Dear ${customer.Customer_name}, your order has been booked successfully.`;
      setWhatsAppMessage(message);
      setMobileToSend(customer.Mobile_number || "");

      // ✅ Open invoice modal immediately after submit
      setShowInvoiceModal(true);
      toast.success("Order Added");

      // Optional: record advance in background, then append to invoice list
      if (isAdvanceChecked && Amount && group) {
        const amt = Number(Amount || 0);
        if (Number.isNaN(amt) || amt <= 0) {
          toast.error("Enter a valid advance amount");
          return;
        }

        const payModeCustomer = accountCustomerOptions.find(
          (opt) => opt.Customer_uuid === group
        );

        const journal = [
          { Account_id: group, Type: "Debit", Amount: amt },
          { Account_id: customer.Customer_uuid, Type: "Credit", Amount: amt },
        ];

        try {
          const txnRes = await axios.post(
            `/transaction/addTransaction`,
            {
              Description: Remark || "Advance received",
              Transaction_date: new Date().toISOString().split("T")[0],
              Total_Credit: amt,
              Total_Debit: amt,
              Payment_mode: payModeCustomer?.Customer_name || "Advance",
              Journal_entry: journal,
              Created_by: loggedInUser,
            }
          );

          if (txnRes.data?.success) {
            setInvoiceItems((prev) => [
              ...prev,
              { Item: "Advance", Quantity: 1, Rate: amt, Amount: amt },
            ]);
            toast.success("Advance payment recorded");
          } else {
            toast.error("Transaction failed");
          }
        } catch {
          toast.error("Transaction failed");
        }
      }
    } catch (error) {
      console.error("Error during submit:", error);
      toast.error("Something went wrong");
    }
  };

  const sendMessageToAPI = async (name, phone, message) => {
    try {
      const { data: result } = await axios.post(`/usertask/send-message`, {
        mobile: phone,
        userName: name,
        type: "customer",
        message,
      });
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

  /* ----------- UI ----------- */
  return (
    <>
      {/* 🔁 IMPORTANT: use `open` prop (not isOpen) so the modal  appears */}
      <InvoiceModal
        open={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          navigate("/home");
        }}
        invoiceRef={previewRef}
        customerName={Customer_name}
        customerMobile={mobileToSend}
        items={invoiceItems}
        remark={Remark}
        order={createdOrder} // optional: pass created order to preview if your modal supports it
        onSendWhatsApp={sendWhatsApp}
      />

       <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white w-full max-w-2xl justify-between rounded-xl shadow-xl p-6 relative">
          <button
            onClick={() => navigate("/home")}
            className="absolute right-2 top-2 text-xl text-gray-400 hover:text-blue-500"
            type="button"
          >
            ×
          </button>

          <h2 className="text-xl font-semibold mb-4 text-center">New Order</h2>

          <form onSubmit={submit} className="space-y-4">
            {optionsLoading ? (
              <div className="flex justify-center items-center h-10">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="relative">
                <label className="block font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <input
                  type="text"
                  placeholder="Search by Customer Name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                  value={Customer_name}
                  onChange={handleInputChange}
                  onFocus={() => setShowOptions(true)}
                />
                <button
                  type="button"
                  onClick={handleCustomer}
                  className="absolute top-7 right-1 bg-[#25D366] text-white w-8 h-8 rounded-full flex items-center justify-center"
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

            <div>
              <label className="block font-medium text-gray-700 mb-1">Order</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                placeholder="Item Details / Note"
                value={Remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Steps</label>
              <div className="flex flex-wrap gap-2">
                {taskGroups
                  .filter((tg) => tg.Id === 1)
                  .map((tg) => {
                    const uuid = tg.Task_group_uuid;
                    const checked = selectedTaskGroups.includes(uuid);
                    return (
                      <label
                        key={uuid}
                        className="flex items-center gap-2 border px-2 py-1 rounded-md shadow-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleTaskGroupToggle(uuid)}
                          className="accent-[#25D366]"
                        />
                        <span>{tg.Task_group_name || tg.Task_group}</span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="advanceCheckbox"
                checked={isAdvanceChecked}
                onChange={handleAdvanceCheckboxChange}
                className="h-4 w-4 text-[#25d366] border-gray-300 rounded"
              />
              <label htmlFor="advanceCheckbox" className="text-gray-700">
                Advance
              </label>
            </div>

            {isAdvanceChecked && (
              <>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                    placeholder="Enter Amount"
                    value={Amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
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
              </>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full text-white font-medium py-2 rounded-lg transition ${
                canSubmit
                  ? "bg-[#25d366] hover:bg-[#128c7e]"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Submit
            </button>
          </form>
        </div>
      </div>

      {showCustomerModal && <AddCustomer onClose={exitModal} />}
    </>
  );
}
