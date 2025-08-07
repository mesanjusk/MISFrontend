/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import 'bootstrap/dist/css/bootstrap.min.css';
import InvoiceModal from "../Components/InvoiceModal";
import { LoadingSpinner } from "../Components";

export default function AddTransaction1() {
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
  const [loggedInUser, setLoggedInUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [allCustomerOptions, setAllCustomerOptions] = useState([]);
  const [accountCustomerOptions, setAccountCustomerOptions] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);

  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [mobileToSend, setMobileToSend] = useState('');
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
  }, [location.state, navigate]);

  useEffect(() => {
    setOptionsLoading(true);
    axios.get("/customer/GetCustomersList")
      .then(res => {
        if (res.data.success) {
          setAllCustomerOptions(res.data.result);
          const accountOptions = res.data.result.filter(item => item.Customer_group === "Bank and Account");
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
      setShowOptions(false);
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

  const closeModal = () => navigate("/home");

  const submit = async (e) => {
    e.preventDefault();

    if (!Amount || isNaN(Amount) || Amount <= 0) return toast.error("Enter valid amount.");
    if (!CreditCustomer || !DebitCustomer) return toast.error("Select both Credit and Debit customer.");

    const creditCustomer = allCustomerOptions.find(c => c.Customer_uuid === CreditCustomer);
    const debitCustomer = accountCustomerOptions.find(c => c.Customer_uuid === DebitCustomer);
    const todayDate = new Date().toISOString().split("T")[0];

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
      const res = await axios.post("/transaction/addTransaction", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        toast.success("Transaction saved.");
        const message = `Hello ${creditCustomer.Customer_name}, we have received your payment of ₹${Amount} on ${Transaction_date || todayDate} via ${debitCustomer.Customer_name}. Thank you!`;
        setWhatsAppMessage(message);
        setMobileToSend(creditCustomer.Mobile_number);
        setInvoiceItems([{ Item: Description || 'Payment', Quantity: 1, Rate: Amount, Amount: Amount }]);
        setShowInvoiceModal(true);
      } else {
        toast.error("Failed to save transaction");
      }
    } catch {
      toast.error("Submission error");
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsApp = async () => {
    try {
      const res = await fetch('https://misbackend-e078.onrender.com/usertask/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: mobileToSend,
          userName: Customer_name,
          type: 'customer',
          message: whatsAppMessage,
        }),
      });
      const data = await res.json();
      if (data?.error) toast.error("❌ Failed to send WhatsApp message");
      else toast.success("✅ WhatsApp message sent successfully");
    } catch {
      toast.error("⚠️ Error sending WhatsApp");
    } finally {
      setShowInvoiceModal(false);
      navigate("/home");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
      <Toaster position="top-center" reverseOrder={false} />

      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        invoiceRef={previewRef}
        customerName={Customer_name}
        customerMobile={mobileToSend}
        items={invoiceItems}
        remark={Description}
        onSendWhatsApp={sendWhatsApp}
      />

      <div className="bg-white p-3 rounded w-90 position-relative">
        <button onClick={closeModal} className="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-2 px-2 py-0">
          ✕
        </button>

        <h2>Add Payment</h2>

        <form onSubmit={submit}>
          {optionsLoading ? (
            <div className="d-flex justify-content-center align-items-center mb-3" style={{ height: '38px' }}>
              <LoadingSpinner />
            </div>
          ) : (
            <div className="mb-3 position-relative">
              <input
                type="text"
                placeholder="Search by Customer Name"
                className="form-control mb-3"
                value={Customer_name}
                onChange={handleInputChange}
                onFocus={() => setShowOptions(true)}
              />
              {showOptions && filteredOptions.length > 0 && (
                <ul className="list-group position-absolute w-100 z-10">
                  {filteredOptions.map((option, index) => (
                    <li key={index} className="list-group-item list-group-item-action"
                      onClick={() => handleOptionClick(option)}>
                      {option.Customer_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button onClick={addCustomer} type="button" className="btn btn-primary mb-3">
            Add Customer
          </button>

          <div className="mb-3">
            <label><strong>Description</strong></label>
            <input
              type="text"
              value={Description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control"
              placeholder="Description"
            />
          </div>

          <div className="mb-3">
            <label><strong>Amount</strong></label>
            <input
              type="number"
              value={Amount}
              onChange={handleAmountChange}
              className="form-control"
              placeholder="Amount"
            />
          </div>

          {optionsLoading ? (
            <div className="d-flex justify-content-center align-items-center mb-3" style={{ height: '38px' }}>
              <LoadingSpinner />
            </div>
          ) : (
            <div className="mb-3">
              <label><strong>Payment Mode</strong></label>
              <select
                value={DebitCustomer}
                onChange={(e) => setDebitCustomer(e.target.value)}
                className="form-control"
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

          <input type="file" accept="image/*" onChange={handleFileChange} className="form-control mb-3" />

          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" checked={isDateChecked} onChange={handleDateCheckboxChange} />
            <label className="form-check-label">Save Date</label>
          </div>

          {isDateChecked && (
            <div className="mb-3">
              <label><strong>Date</strong></label>
              <input
                type="date"
                value={Transaction_date}
                onChange={(e) => setTransaction_date(e.target.value)}
                className="form-control"
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={loading || !Amount || isNaN(Amount) || Amount <= 0 || !CreditCustomer || !DebitCustomer}
          >
            {loading ? <><LoadingSpinner size={16} className="me-2" /> Saving...</> : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
