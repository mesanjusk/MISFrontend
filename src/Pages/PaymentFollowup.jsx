/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from '../apiClient.js';
import toast, { Toaster } from "react-hot-toast";
import {
  extractPhoneNumber,
  sendTemplateWithTextFallback,
} from "../utils/whatsapp.js";

const todayISO = () => new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd

/* ---------------- SearchableSelect (no extra libs) ---------------- */
function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [hi, setHi] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [query, options]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const commitSelect = (val) => {
    onChange?.(val);
    setQuery(val);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={rootRef} className="relative">
      <div
        className={`flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#25d366] ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-text"
        }`}
        onClick={() => !disabled && setOpen(true)}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHi(0);
          }}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHi((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setHi((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (open && filtered.length > 0) {
                commitSelect(filtered[hi]);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={searchPlaceholder}
          className="flex-1 outline-none"
          disabled={disabled}
          aria-autocomplete="list"
          aria-expanded={open}
          role="combobox"
        />
        {value ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              commitSelect("");
            }}
            className="text-gray-500 hover:text-gray-700"
            title="Clear"
          >
            ×
          </button>
        ) : (
          <span className="text-gray-400 select-none">{placeholder}</span>
        )}
        <span className="ml-auto text-gray-400">▾</span>
      </div>

      {open && (
        <ul
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500 select-none">
              No matches
            </li>
          ) : (
            filtered.map((opt, idx) => (
              <li
                key={opt + idx}
                role="option"
                aria-selected={value === opt}
                onMouseEnter={() => setHi(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commitSelect(opt);
                }}
                className={`px-3 py-2 cursor-pointer ${
                  idx === hi ? "bg-gray-100" : ""
                } ${value === opt ? "font-medium" : ""}`}
              >
                {opt}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

/* ---------------------- Page Component ---------------------- */
export default function PaymentFollowup() {
  const navigate = useNavigate();

  const [Customer, setCustomer] = useState("");
  const [Amount, setAmount] = useState("");
  const [Title, setTitle] = useState("");
  const [Remark, setRemark] = useState("");

  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerDetails, setCustomerDetails] = useState([]);

  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [mobileToSend, setMobileToSend] = useState("");
  const [sendWhatsAppAfterSave, setSendWhatsAppAfterSave] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isTransactionSaved, setIsTransactionSaved] = useState(false);

  const [isDateChecked, setIsDateChecked] = useState(false);
  const [Deadline, setDeadline] = useState(todayISO());

  const [submitting, setSubmitting] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    setIsAdminUser(localStorage.getItem("User_group") === "Admin User");

    const loadCustomers = async () => {
      const normalizeNames = (arr) =>
        Array.from(
          new Set(
            (arr || [])
              .map((it) =>
                (it.Customer_name ||
                  it.User_name ||
                  it.name ||
                  it.Name ||
                  "").toString().trim()
              )
              .filter(Boolean)
          )
        );

      try {
        const r1 = await axios.get("/customer/GetCustomerList");
        if (r1?.data?.success && Array.isArray(r1.data.result)) {
          setCustomerDetails(r1.data.result);
          setCustomerOptions(normalizeNames(r1.data.result));
          return;
        }
        throw new Error("Singular route returned unexpected response");
      } catch {
        try {
          const r2 = await axios.get("/customer/GetCustomersList");
          if (r2?.data?.success && Array.isArray(r2.data.result)) {
            setCustomerDetails(r2.data.result);
            setCustomerOptions(normalizeNames(r2.data.result));
            return;
          }
          throw new Error("Plural route returned unexpected response");
        } catch (err2) {
          const msg =
            err2?.response?.data?.message || err2?.message || "Unknown error";
          console.error("Error fetching customers:", msg, err2?.response?.data);
          toast.error("Unable to load customers: " + msg);
        }
      }
    };

    loadCustomers();
  }, []);

  const closeModal = () => navigate("/Home");

  const handleDateCheckboxChange = () => {
    setIsDateChecked((prev) => !prev);
    setDeadline(todayISO());
  };

  const sendWhatsApp = async (
    phone = mobileToSend,
    message = whatsAppMessage,
    customerData = null
  ) => {
    if (!phone) {
      toast.error("Customer phone number is required");
      return;
    }

    setIsSendingWhatsApp(true);

    try {
      const selectedCustomer =
        customerData ||
        customerDetails.find((item) => item.Customer_name === Customer);

      const customerLabel = selectedCustomer?.Customer_name || Customer || "Customer";

      const { data } = await sendTemplateWithTextFallback({
        axiosInstance: axios,
        phone,
        templateName: "outstanding_sk",
        bodyParameters: [customerLabel],
        fallbackMessage: message,
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

  const submit = async (e) => {
    e.preventDefault();

    if (!Customer) return toast.error("Please select a customer.");
    if (!customerOptions.includes(Customer)) {
      return toast.error("Please pick a customer from the suggestions.");
    }
    if (!Amount || Number(Amount) <= 0) {
      return toast.error("Please enter a valid amount.");
    }

    const finalDate =
      isAdminUser && isDateChecked ? (Deadline || todayISO()) : todayISO();

    try {
      setSubmitting(true);
      const res = await axios.post("/paymentfollowup/add", {
        Customer,
        Amount: Number(Amount),
        Title: Title?.trim(),
        Followup_date: finalDate,
        Remark: Remark?.trim(),
      });

      if (res.data === "exist") {
        toast.error("A similar follow-up already exists for this customer/date.");
      } else {
        const selectedCustomer = customerDetails.find(
          (item) => item.Customer_name === Customer
        );
        const phoneNumber = extractPhoneNumber(selectedCustomer);
        const message = `Hello ${Customer}, we will follow up with you for ₹${Number(Amount)}. Thank you!`;

        toast.success("Payment follow-up added.");
        setWhatsAppMessage(message);
        setMobileToSend(phoneNumber);
        setIsTransactionSaved(true);

        if (sendWhatsAppAfterSave) {
          await sendWhatsApp(phoneNumber, message, selectedCustomer);
        }
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Unknown error";
      console.error("Save follow-up error:", msg, err?.response?.data);
      toast.error("Something went wrong: " + msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6 relative">
          <button
            onClick={closeModal}
            className="absolute right-2 top-2 text-xl text-gray-400 hover:text-blue-500"
            type="button"
          >
            ×
          </button>

          <h2 className="text-xl font-semibold mb-4 text-center text-[#075e54]">
            Add Payment Follow-up
          </h2>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Select Customer
              </label>
              <SearchableSelect
                options={customerOptions}
                value={Customer}
                onChange={setCustomer}
                placeholder="Select customer"
                searchPlaceholder="Search customer..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {customerOptions.length} customer
                {customerOptions.length === 1 ? "" : "s"} available
              </p>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={Amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
              />
            </div>

            {isAdminUser && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isDateChecked}
                  onChange={handleDateCheckboxChange}
                  className="h-4 w-4 text-[#25d366] border-gray-300 rounded"
                />
                <label className="text-gray-700">Save Date</label>
              </div>
            )}

            {isAdminUser && isDateChecked && (
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={Deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                />
              </div>
            )}

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Short Title / Reason
              </label>
              <input
                type="text"
                value={Title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Pending invoice for July"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Remark
              </label>
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
                className="h-4 w-4 text-[#25d366] border-gray-300 rounded"
              />
              <label className="text-gray-700">Send WhatsApp after saving</label>
            </div>

            {isTransactionSaved && (
              <button
                type="button"
                onClick={() => sendWhatsApp()}
                disabled={isSendingWhatsApp}
                className="w-full bg-[#075e54] hover:bg-[#064c44] text-white font-medium py-2 rounded-lg transition disabled:opacity-60"
              >
                {isSendingWhatsApp ? "Sending WhatsApp..." : "Send WhatsApp Receipt"}
              </button>
            )}

            <div className="flex flex-col space-y-2">
              <button
                type="submit"
                disabled={submitting}
                className={`${
                  submitting ? "opacity-70 cursor-not-allowed" : ""
                } bg-[#25d366] hover:bg-[#128c7e] text-white font-medium py-2 rounded-lg transition`}
              >
                {submitting ? "Saving..." : "Submit"}
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