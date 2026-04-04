import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from "react-router-dom";
import axios from '../apiClient.js';
import toast, { Toaster } from "react-hot-toast";
import InvoiceModal from "../Components/InvoiceModal";
import { LoadingSpinner } from "../Components";
import { fetchCustomers } from "../services/customerService.js";
import { addTransaction } from "../services/transactionService.js";
import {
  extractPhoneNumber,
  sendTemplateWithTextFallback,
} from "../utils/whatsapp.js";

export default function AddTransaction1({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [Description, setDescription] = useState('');
  const [Amount, setAmount] = useState('');
  const [Transaction_date, setTransaction_date] = useState('');
  const [Customer_name, setCustomer_Name] = useState('');
  const [CreditCustomer, setCreditCustomer] = useState('');
  const [DebitCustomer, setDebitCustomer] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDateChecked, setIsDateChecked] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [allCustomerOptions, setAllCustomerOptions] = useState([]);
  const [accountCustomerOptions, setAccountCustomerOptions] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);

  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [mobileToSend, setMobileToSend] = useState('');
  const [sendWhatsAppAfterSave, setSendWhatsAppAfterSave] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isTransactionSaved, setIsTransactionSaved] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const previewRef = useRef();

  useEffect(() => {
    const userNameFromState = location.state?.id || localStorage.getItem('User_name');
    if (userNameFromState) {
      setLoggedInUser(userNameFromState);
    } else {
      navigate("/login");
    }
    setIsAdminUser(localStorage.getItem("User_group") === "Admin User");
  }, [location.state, navigate]);

  useEffect(() => {
    setOptionsLoading(true);
    fetchCustomers()
      .then(res => {
        if (res.data.success) {
          setAllCustomerOptions(res.data.result);
          const accountOptions = res.data.result.filter(
            item => item.Customer_group === "Bank and Account"
          );
          setAccountCustomerOptions(accountOptions);
        }
      })
      .catch(() => toast.error("Error fetching customers"))
      .finally(() => setOptionsLoading(false));
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setCustomer_Name(value);
    if (value) {
      const filtered = allCustomerOptions.filter(option =>
        option.Customer_name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
      setShowOptions(true);
    } else {
      setFilteredOptions([]);
      setShowOptions(false);
      setCreditCustomer('');
    }
  };

  const handleOptionClick = (option) => {
    setCustomer_Name(option.Customer_name);
    setCreditCustomer(option.Customer_uuid);
    setShowOptions(false);
  };

  const handleFileChange = (e) => setSelectedImage(e.target.files[0]);

  const handleDateCheckboxChange = () => {
    setIsDateChecked(prev => !prev);
    setTransaction_date('');
  };

  const handleAmountChange = (e) => setAmount(e.target.value);

  const addCustomer = () => navigate("/addCustomer");

  const closeModal = () => (onClose ? onClose() : navigate("/home"));
  const isEmbeddedFlow = typeof onClose === "function";

  const submit = async (e) => {
    e.preventDefault();

    if (!Amount || isNaN(Amount) || Number(Amount) <= 0) {
      return toast.error("Enter valid amount.");
    }
    if (!CreditCustomer || !DebitCustomer) {
      return toast.error("Select both Credit and Debit customer.");
    }

    const creditCustomer = allCustomerOptions.find(c => c.Customer_uuid === CreditCustomer);
    const debitCustomer = accountCustomerOptions.find(c => c.Customer_uuid === DebitCustomer);
    const todayDate = new Date().toISOString().split("T")[0];

    if (!creditCustomer || !debitCustomer) {
      return toast.error("Selected customer or payment mode is invalid.");
    }

    const journal = [
      { Account_id: debitCustomer.Customer_uuid, Type: 'Debit', Amount: Number(Amount) },
      { Account_id: creditCustomer.Customer_uuid, Type: 'Credit', Amount: Number(Amount) }
    ];

    const formData = new FormData();
    formData.append('Description', Description);
    formData.append('Total_Credit', Number(Amount));
    formData.append('Total_Debit', Number(Amount));
    formData.append('Payment_mode', debitCustomer.Customer_name);
    formData.append('Created_by', loggedInUser);
    formData.append('Transaction_date', Transaction_date || todayDate);
    formData.append('Journal_entry', JSON.stringify(journal));
    if (selectedImage) formData.append('image', selectedImage);

    try {
      setLoading(true);
      const res = await addTransaction(formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        toast.success("Transaction saved.");
        const message = `Hello ${creditCustomer?.Customer_name || Customer_name}, your payment of ₹${Amount} has been recorded. Thank you!`;
        const phoneNumber = extractPhoneNumber(creditCustomer);

        setWhatsAppMessage(message);
        setMobileToSend(phoneNumber);
        setIsTransactionSaved(true);

        if (sendWhatsAppAfterSave) {
          await sendWhatsApp(phoneNumber, message, creditCustomer);
        }

        setInvoiceItems([
          {
            Item: Description || 'Payment',
            Quantity: 1,
            Rate: Number(Amount),
            Amount: Number(Amount)
          }
        ]);
        setShowInvoiceModal(true);
        if (isEmbeddedFlow) closeModal();
      } else {
        toast.error("Failed to save transaction");
      }
    } catch {
      toast.error("Submission error");
    } finally {
      setLoading(false);
    }
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
        allCustomerOptions.find((c) => c.Customer_uuid === CreditCustomer);

      const customerLabel =
        selectedCustomer?.Customer_name || Customer_name || 'Customer';

      const { data } = await sendTemplateWithTextFallback({
        axiosInstance: axios,
        phone,
        templateName: 'payment',
        bodyParameters: [customerLabel],
        fallbackMessage: message,
      });

      if (data?.success) {
        toast.success('WhatsApp message sent');
      } else {
        toast.error(data?.error || 'Failed to send WhatsApp message');
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to send WhatsApp message');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />

      <InvoiceModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        invoiceRef={previewRef}
        customerName={Customer_name}
        customerMobile={mobileToSend}
        items={invoiceItems}
        remark={Description}
        onSendWhatsApp={sendWhatsApp}
      />

      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-6 relative">
          <button
            onClick={closeModal}
            className="absolute right-2 top-2 text-xl text-gray-400 hover:text-blue-500"
            type="button"
          >
            ×
          </button>

          <h2 className="text-xl font-semibold mb-4 text-center">Add Payment</h2>

          <form onSubmit={submit} className="space-y-4">
            {optionsLoading ? (
              <div className="flex justify-center items-center h-10">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Customer Name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                  value={Customer_name}
                  onChange={handleInputChange}
                  onFocus={() => {
                    if (filteredOptions.length > 0) setShowOptions(true);
                  }}
                />
                {showOptions && filteredOptions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border rounded-md max-h-40 overflow-y-auto">
                    {filteredOptions.map((option, index) => (
                      <li
                        key={index}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleOptionClick(option)}
                      >
                        {option.Customer_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <button
              onClick={addCustomer}
              type="button"
              className="bg-[#25D366] text-white w-8 h-8 rounded-full flex items-center justify-center"
            >
              +
            </button>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={Description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                placeholder="Description"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                value={Amount}
                onChange={handleAmountChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                placeholder="Amount"
              />
            </div>

            {optionsLoading ? (
              <div className="flex justify-center items-center h-10">
                <LoadingSpinner />
              </div>
            ) : (
              <div>
                <label className="block font-medium text-gray-700 mb-1">Payment Mode</label>
                <select
                  value={DebitCustomer}
                  onChange={(e) => setDebitCustomer(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                  required
                >
                  <option value="">Select Payment</option>
                  {accountCustomerOptions.map((cust, i) => (
                    <option key={i} value={cust.Customer_uuid}>
                      {cust.Customer_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-lg p-2"
            />

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
                <label className="block font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={Transaction_date}
                  onChange={(e) => setTransaction_date(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={sendWhatsAppAfterSave}
                onChange={(e) => setSendWhatsAppAfterSave(e.target.checked)}
                className="h-4 w-4 text-[#25d366] border-gray-300 rounded"
              />
              <label className="text-gray-700">Send WhatsApp after saving</label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="w-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full bg-[#25d366] hover:bg-[#128c7e] text-white font-medium py-2 rounded-lg transition"
                disabled={
                  loading ||
                  !Amount ||
                  isNaN(Amount) ||
                  Number(Amount) <= 0 ||
                  !CreditCustomer ||
                  !DebitCustomer
                }
              >
                {loading ? (
                  <>
                    <LoadingSpinner size={16} className="mr-2" /> Saving...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </div>

            {isTransactionSaved && (
              <button
                type="button"
                onClick={() => sendWhatsApp()}
                disabled={isSendingWhatsApp}
                className="w-full bg-[#075e54] hover:bg-[#064c44] text-white font-medium py-2 rounded-lg transition disabled:opacity-60"
              >
                {isSendingWhatsApp ? 'Sending WhatsApp...' : 'Send WhatsApp Receipt'}
              </button>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

AddTransaction1.propTypes = {
  onClose: PropTypes.func,
};
