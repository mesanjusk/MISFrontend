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
  normalizeWhatsAppPhone,
} from "../utils/whatsapp.js";
import {
  DEFAULT_TEMPLATE_LANGUAGE,
  WHATSAPP_TEMPLATES,
  buildPaymentReceivedParameters,
} from '../constants/whatsappTemplates';

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
      .then((res) => {
        if (res.data.success) {
          setAllCustomerOptions(res.data.result);
          const accountOptions = res.data.result.filter(
            (item) => item.Customer_group === "Bank and Account"
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
      const filtered = allCustomerOptions.filter((option) =>
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
    setIsDateChecked((prev) => !prev);
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

    const creditCustomer = allCustomerOptions.find(
      (c) => c.Customer_uuid === CreditCustomer
    );
    const debitCustomer = accountCustomerOptions.find(
      (c) => c.Customer_uuid === DebitCustomer
    );
    const todayDate = new Date().toISOString().split("T")[0];

    if (!creditCustomer || !debitCustomer) {
      return toast.error("Selected customer or payment mode is invalid.");
    }

    const finalTransactionDate =
      isAdminUser && isDateChecked ? (Transaction_date || todayDate) : todayDate;

    const journal = [
      {
        Account_id: debitCustomer.Customer_uuid,
        Type: 'Debit',
        Amount: Number(Amount),
      },
      {
        Account_id: creditCustomer.Customer_uuid,
        Type: 'Credit',
        Amount: Number(Amount),
      },
    ];

    const formData = new FormData();
    formData.append('Description', Description);
    formData.append('Total_Credit', Number(Amount));
    formData.append('Total_Debit', Number(Amount));
    formData.append('Payment_mode', debitCustomer.Customer_name);
    formData.append('Created_by', loggedInUser);
    formData.append('Transaction_date', finalTransactionDate);
    formData.append('Journal_entry', JSON.stringify(journal));
    if (selectedImage) formData.append('image', selectedImage);

    try {
      setLoading(true);

      const res = await addTransaction(formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        toast.success("Transaction saved.");

        const message = `Hello ${creditCustomer?.Customer_name || Customer_name}, your payment of ₹${Amount} has been recorded. Thank you!`;
        const phoneNumber = extractPhoneNumber(creditCustomer);

        setWhatsAppMessage(message);
        setMobileToSend(phoneNumber || '');
        setIsTransactionSaved(true);

        if (sendWhatsAppAfterSave) {
          await sendWhatsApp(phoneNumber, creditCustomer);
        }

        setInvoiceItems([
          {
            Item: Description || 'Payment',
            Quantity: 1,
            Rate: Number(Amount),
            Amount: Number(Amount),
          },
        ]);

        setShowInvoiceModal(true);

        if (isEmbeddedFlow) {
          closeModal();
        }
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

      const cleanPhone = normalizeWhatsAppPhone(phone);

      const payload = {
        to: cleanPhone,
        template_name: WHATSAPP_TEMPLATES.PAYMENT_RECEIVED,
        language: DEFAULT_TEMPLATE_LANGUAGE,
        components: [
          {
            type: "body",
            parameters: buildPaymentReceivedParameters({
              customerName: customerLabel,
              actionLabel: "payment",
              date: new Date().toLocaleDateString("en-IN"),
              amount: String(Amount || "0"),
              description: Description || "Payment received",
            }).map((text) => ({
              type: "text",
              text,
            })),
          },
        ],
      };

      const { data } = await axios.post('/api/whatsapp/send-template', payload);

      if (data?.success) {
        toast.success('WhatsApp template sent');
      } else {
        toast.error(data?.error || 'Failed to send WhatsApp template');
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.error || 'Failed to send WhatsApp template'
      );
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
            className="absolute right-3 top-3 rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:border-sky-400 hover:text-sky-600"
            type="button"
          >
            Close
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
                />

                {showOptions && filteredOptions.length > 0 && (
                  <ul className="absolute z-10 bg-white border w-full mt-1 rounded-md shadow max-h-52 overflow-auto">
                    {filteredOptions.map((option) => (
                      <li
                        key={option.Customer_uuid}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleOptionClick(option)}
                      >
                        {option.Customer_name} ({option.Mobile_number || option.mobile || option.phone || 'No mobile'})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={DebitCustomer}
              onChange={(e) => setDebitCustomer(e.target.value)}
            >
              <option value="">Select Payment Mode / Account</option>
              {accountCustomerOptions.map((option) => (
                <option key={option.Customer_uuid} value={option.Customer_uuid}>
                  {option.Customer_name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Amount"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={Amount}
              onChange={handleAmountChange}
            />

            <input
              type="text"
              placeholder="Description"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={Description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {isAdminUser && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isDateChecked}
                    onChange={handleDateCheckboxChange}
                  />
                  Change transaction date manually
                </label>

                {isDateChecked && (
                  <InputField
                    type="date"
                    value={Transaction_date}
                    onChange={(e) => setTransaction_date(e.target.value)}
                  />
                )}
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              onChange={handleFileChange}
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sendWhatsAppAfterSave}
                onChange={(e) => setSendWhatsAppAfterSave(e.target.checked)}
              />
              Send WhatsApp template after save
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={addCustomer}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Add Customer
              </button>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={loading || isSendingWhatsApp}
                className="rounded-lg bg-[#25d366] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5d] disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>

              {isTransactionSaved && (
                <button
                  type="button"
                  onClick={() => sendWhatsApp()}
                  disabled={isSendingWhatsApp}
                  className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {isSendingWhatsApp ? 'Sending...' : 'Send WhatsApp Template'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

AddTransaction1.propTypes = {
  onClose: PropTypes.func,
};