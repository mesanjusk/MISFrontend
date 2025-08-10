// Import statements remain mostly unchanged
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import normalizeWhatsAppNumber from "../utils/normalizeNumber";
import { LoadingSpinner } from "../Components";
import InvoiceModal from "../Components/InvoiceModal";

const BASE_URL = "https://misbackend-e078.onrender.com";
// If you enforce Purchase in backend, keep this matching
const PURCHASE_ACCOUNT_ID = "PURCHASE_ACCOUNT_ID_HERE";

export default function UpdateDelivery({ onClose, order = {}, mode = "edit" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [orderId, setOrderId] = useState("");
  const [Customer_uuid, setCustomer_uuid] = useState("");
  const [items, setItems] = useState([
    { Item: "", Quantity: 0, Rate: 0, Amount: 0, Priority: "Normal", Remark: "" },
  ]);
  const [Customer_name, setCustomer_name] = useState("");
  const [customers, setCustomers] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerMap, setCustomerMap] = useState({});
  const [customerMobile, setCustomerMobile] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    const userNameFromState = location.state?.id;
    const logInUser = userNameFromState || localStorage.getItem("User_name");
    if (logInUser) setLoggedInUser(logInUser);
    else navigate("/login");
  }, [location.state, navigate]);

  useEffect(() => {
    if (mode === "edit" && (order?._id || order?.Order_id)) {
      setOrderId(order._id || order.Order_id);
      setCustomer_uuid(order.Customer_uuid || "");
      const seeded =
        Array.isArray(order.Items) && order.Items.length
          ? order.Items.map((it) => ({
              Item: it.Item || "",
              Quantity: Number(it.Quantity || 0),
              Rate: Number(it.Rate || 0),
              Amount: Number(it.Amount || 0),
              Priority: it.Priority || "Normal",
              Remark: it.Remark || "",
            }))
          : [{ Item: "", Quantity: 0, Rate: 0, Amount: 0, Priority: "Normal", Remark: "" }];
      setItems(seeded);
      setCustomer_name(order.Customer_name || "");
    }
  }, [order, mode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, itemRes] = await Promise.all([
          axios.get(`${BASE_URL}/customer/GetCustomersList`),
          axios.get(`${BASE_URL}/item/GetItemList`),
        ]);

        if (custRes.data.success) {
          setCustomers(custRes.data.result);
          const map = {};
          custRes.data.result.forEach((c) => (map[c.Customer_uuid] = c.Customer_name));
          setCustomerMap(map);
          const found = custRes.data.result.find((c) => c.Customer_uuid === Customer_uuid);
          if (found) {
            setCustomer_name(found.Customer_name);
            setCustomerMobile(found.Mobile_number);
          }
        }

        if (itemRes.data.success) {
          const options = itemRes.data.result.map((item) => item.Item_name);
          setItemOptions(options);
        }
      } catch {
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [Customer_uuid]);

  const handleItemChange = (index, key, value) => {
    const updated = [...items];

    if (key === "Quantity" || key === "Rate") {
      updated[index][key] = parseFloat(value) || 0;
    } else {
      updated[index][key] = value;
    }

    const qty = parseFloat(updated[index].Quantity) || 0;
    const rate = parseFloat(updated[index].Rate) || 0;
    updated[index].Amount = +(qty * rate).toFixed(2);

    setItems(updated);
  };

  const addNewItem = () => {
    if (items.some((i) => !i.Item || !i.Quantity || !i.Rate)) {
      toast.error("Please complete existing item rows first");
      return;
    }
    setItems([
      ...items,
      { Item: "", Quantity: 0, Rate: 0, Amount: 0, Priority: "Normal", Remark: "" },
    ]);
  };

  const validateForm = () => {
    if (!Customer_uuid) {
      toast.error("Please select a customer");
      return false;
    }
    for (const item of items) {
      if (!item.Item || item.Quantity <= 0 || item.Rate <= 0) {
        toast.error("Each item must have a name, quantity > 0 and rate > 0");
        return false;
      }
    }
    return true;
  };

  const submit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const url =
        mode === "edit"
          ? `${BASE_URL}/order/updateDelivery/${orderId}`
          : `${BASE_URL}/order/addDelivery`;

      const payload = { Customer_uuid, Items: items };

      const response = await axios[mode === "edit" ? "put" : "post"](url, payload);
      if (response.data.success) {
        const totalAmount = +items.reduce((s, i) => s + (Number(i.Amount) || 0), 0).toFixed(2);

        // Default to Purchase accounting (Debit Purchase, Credit Customer)
        const journal = [
          { Account_id: PURCHASE_ACCOUNT_ID, Type: "Debit", Amount: totalAmount },
          { Account_id: Customer_uuid, Type: "Credit", Amount: totalAmount },
        ];

        const transaction = await axios.post(`${BASE_URL}/transaction/addTransaction`, {
          Description: "Delivered",
          Order_number: order.Order_Number,
          Transaction_date: new Date().toISOString(),
          Total_Credit: totalAmount,
          Total_Debit: totalAmount,
          Payment_mode: "Purchase",
          Journal_entry: journal,
          Created_by: loggedInUser,
        });

        if (transaction.data.success) {
          toast.success("Order saved");
          setShowInvoiceModal(true);
        } else {
          toast.error("Transaction failed");
        }
      } else {
        toast.error("Order failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }

    setIsSubmitting(false);
  };

  const handleWhatsApp = async (pdfUrl = "") => {
    const totalAmount = items.reduce((sum, i) => sum + (Number(i.Amount) || 0), 0);
    const mobile =
      customerMobile || customers.find((c) => c.Customer_uuid === Customer_uuid)?.Mobile_number;

    if (!mobile) {
      toast.error("Customer mobile number not found");
      return;
    }

    const number = normalizeWhatsAppNumber(mobile);
    const message = `Hi ${customerMap[Customer_uuid] || Customer_name}, your order has been delivered. Amount: ₹${totalAmount}`;

    const payload = { number, message };
    if (pdfUrl) payload.mediaUrl = pdfUrl;

    try {
      const res = await axios.post(`${BASE_URL}/whatsapp/send-test`, payload);
      if (res.data?.success || res.status === 200) toast.success("✅ WhatsApp message sent");
      else {
        console.error("⚠️ WhatsApp API error response:", res.data);
        toast.error("❌ WhatsApp sending failed");
      }
    } catch (err) {
      console.error("❌ WhatsApp error:", err?.response?.data || err.message);
      toast.error("Error sending WhatsApp");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-center">
          <LoadingSpinner size={80} className="mb-4" />
          <h2 className="text-center text-gray-600">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="flex justify-center items-center bg-gray-100 min-h-screen">
        <div className="bg-white p-6 rounded shadow-md w-full max-w-3xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {mode === "edit" ? "Edit Order" : "New Delivery"}
            </h2>
            <button
              onClick={() => {
                setShowInvoiceModal(false);
                onClose?.();
              }}
              className="text-gray-500 hover:text-red-600"
            >
              ✕
            </button>
          </div>

          <form className="grid grid-cols-1 gap-4">
            <div>
              <label className="block font-semibold">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={Customer_uuid}
                onChange={(e) => setCustomer_uuid(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.Customer_uuid} value={c.Customer_uuid}>
                    {c.Customer_name}
                  </option>
                ))}
              </select>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                {/* Item */}
                <Select
                  className="md:col-span-2"
                  options={itemOptions.map((i) => ({ label: i, value: i }))}
                  value={item.Item ? { label: item.Item, value: item.Item } : null}
                  onChange={(opt) => handleItemChange(index, "Item", opt?.value || "")}
                  placeholder="Select item"
                />

                {/* Qty */}
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.Quantity}
                  onChange={(e) => handleItemChange(index, "Quantity", e.target.value)}
                  className="border p-2 rounded"
                />

                {/* Rate */}
                <input
                  type="number"
                  placeholder="Rate"
                  value={item.Rate}
                  onChange={(e) => handleItemChange(index, "Rate", e.target.value)}
                  className="border p-2 rounded"
                />

                {/* Amount */}
                <input
                  type="text"
                  value={item.Amount}
                  readOnly
                  className="border p-2 bg-gray-100 rounded"
                />

                {/* Remark */}
                <input
                  type="text"
                  placeholder="Remark (this line)"
                  value={item.Remark || ""}
                  onChange={(e) => handleItemChange(index, "Remark", e.target.value)}
                  className="md:col-span-6 border p-2 rounded"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={addNewItem}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              + Add Item
            </button>

            <button
              type="button"
              onClick={submit}
              disabled={isSubmitting}
              className={`py-2 rounded text-white ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Saving..." : "Submit"}
            </button>
          </form>
        </div>
      </div>

      {/* Reusable Invoice Modal */}
      <InvoiceModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        orderNumber={order.Order_Number}
        partyName={customerMap[Customer_uuid] || Customer_name}
        items={items}
        onWhatsApp={handleWhatsApp}
        onReady={() => {}}
      />
    </>
  );
}
