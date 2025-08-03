import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaSpinner } from 'react-icons/fa';
import { Button, InputField, Card, ToastContainer, toast } from "../Components";
import InvoiceModal from "../Components/InvoiceModal";

export default function AddTransaction({ editMode, existingData, onClose, onSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [Description, setDescription] = useState('');
  const [Amount, setAmount] = useState('');
  const [Transaction_date, setTransaction_date] = useState('');
  const [group, setGroup] = useState('');
  const [customers, setCustomers] = useState('');
  const [Customer_name, setCustomer_Name] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDateChecked, setIsDateChecked] = useState(false);
  const [userGroup, setUserGroup] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');
  const [loading, setLoading] = useState(false);

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
    setUserGroup(localStorage.getItem("User_group") || '');
  }, [location.state, navigate]);

  useEffect(() => {
    axios.get("/customer/GetCustomersList")
      .then(res => {
        if (res.data.success) {
          setAllCustomerOptions(res.data.result);
          const accountOptions = res.data.result.filter(item => item.Customer_group === "Bank and Account");
          setAccountCustomerOptions(accountOptions);
        }
      }).catch(() => toast.error("Error fetching customers"));
  }, []);

  useEffect(() => {
    if (editMode && existingData) {
      setDescription(existingData.Description || "");
      setAmount(existingData.Total_Debit || existingData.Total_Credit || "");
      setTransaction_date(existingData.Transaction_date?.substring(0, 10) || "");
      setGroup(getCreditUuid(existingData) || "");
      setCustomers(getDebitUuid(existingData) || "");
      const customer = allCustomerOptions.find(c => c.Customer_uuid === getDebitUuid(existingData));
      setCustomer_Name(customer?.Customer_name || "");
      setIsDateChecked(!!existingData.Transaction_date);
    }
  }, [editMode, existingData, allCustomerOptions]);

  const getCreditUuid = (txn) =>
    txn.Journal_entry?.find(j => j.Type.toLowerCase() === "credit")?.Account_id;
  const getDebitUuid = (txn) =>
    txn.Journal_entry?.find(j => j.Type.toLowerCase() === "debit")?.Account_id;

  const handleFileChange = (e) => setSelectedImage(e.target.files[0]);

  const handleAmountChange = (e) => setAmount(e.target.value);

  const handleDateCheckboxChange = () => {
    setIsDateChecked(prev => !prev);
    setTransaction_date('');
  };

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
    setCustomers(option.Customer_uuid);
    setShowOptions(false);
  };

  const closeModal = () => {
    if (userGroup === "Office User" || userGroup === "Admin User") {
      onClose ? onClose() : navigate("/home");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!Amount || isNaN(Amount) || Amount <= 0) return toast.error("Enter valid amount.");
    if (!customers || !group) return toast.error("Select both Credit and Debit customer.");

    const Customer = allCustomerOptions.find(c => c.Customer_uuid === customers);
    const Group = accountCustomerOptions.find(c => c.Customer_uuid === group);
    const todayDate = new Date().toISOString().split("T")[0];

    const journal = [
      { Account_id: customers, Type: 'Debit', Amount: Number(Amount) },
      { Account_id: group, Type: 'Credit', Amount: Number(Amount) }
    ];

    const formData = new FormData();
    formData.append('Description', Description);
    formData.append('Total_Credit', Number(Amount));
    formData.append('Total_Debit', Number(Amount));
    formData.append('Payment_mode', Group.Customer_name);
    formData.append('Created_by', loggedInUser);
    formData.append('Transaction_date', Transaction_date || todayDate);
    formData.append('Journal_entry', JSON.stringify(journal));
    if (editMode && existingData?._id) formData.append('_id', existingData._id);
    if (selectedImage) formData.append('image', selectedImage);

    try {
      setLoading(true);
      const res = await axios.post("/transaction/addTransaction", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        toast.success("Transaction saved.");
        const message = `Hello ${Customer?.Customer_name}, we have received your payment of ₹${Amount} on ${Transaction_date || todayDate} via ${Group?.Customer_name}. Thank you!`;
        setWhatsAppMessage(message);
        setMobileToSend(Customer?.Mobile_number);
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
      onSuccess?.();
      onClose?.();
    }
  };

  const addCustomer = () => navigate("/addCustomer");

  return (
    <div className="flex items-center justify-center bg-secondary min-h-screen p-4">
      <ToastContainer />

      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => { setShowInvoiceModal(false); onSuccess?.(); onClose?.(); }}
        invoiceRef={previewRef}
        customerName={Customer_name}
        customerMobile={mobileToSend}
        items={invoiceItems}
        remark={Description}
        onSendWhatsApp={sendWhatsApp}
      />

      <Card className="w-full max-w-lg relative">
        <Button
          variant="secondary"
          className="absolute top-2 right-2 px-2 py-1"
          onClick={closeModal}
        >
          ✕
        </Button>

        <h2 className="text-xl font-semibold mb-4">{editMode ? "Edit Receipt" : "Add Receipt"}</h2>

        <form onSubmit={submit}>
          <div className="relative">
            <InputField
              label="Search by Customer Name"
              value={Customer_name}
              onChange={handleInputChange}
              onFocus={() => setShowOptions(true)}
              placeholder="Search by Customer Name"
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

          <Button onClick={addCustomer} type="button" className="mb-4">
            Add Customer
          </Button>

          <InputField
            label="Description"
            value={Description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />

          <InputField
            label="Amount"
            type="number"
            value={Amount}
            onChange={handleAmountChange}
            placeholder="Amount"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-text mb-1">Payment Mode</label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:border-primary focus:ring-1 focus:ring-primary"
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

          <InputField type="file" accept="image/*" onChange={handleFileChange} />

          <div className="mb-4 flex items-center space-x-2">
            <input
              id="saveDate"
              type="checkbox"
              className="h-4 w-4 text-primary border-gray-300 rounded"
              checked={isDateChecked}
              onChange={handleDateCheckboxChange}
            />
            <label htmlFor="saveDate" className="text-sm">Save Date</label>
          </div>

          {isDateChecked && (
            <InputField
              label="Date"
              type="date"
              value={Transaction_date}
              onChange={(e) => setTransaction_date(e.target.value)}
            />
          )}

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={
              loading ||
              !Amount ||
              isNaN(Amount) ||
              Amount <= 0 ||
              !customers ||
              !group
            }
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" /> Saving...
              </>
            ) : editMode ? (
              "Update"
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}

AddTransaction.propTypes = {
  editMode: PropTypes.bool,
  existingData: PropTypes.object,
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
};
