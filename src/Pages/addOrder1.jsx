import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AddCustomer from "./addCustomer";

export default function AddOrder1() {
    const navigate = useNavigate();

    const [Customer_name, setCustomer_Name] = useState('');
    const [Customer_uuid, setCustomer_uuid] = useState('');
    const [userGroup, setUserGroup] = useState("");
    const [Remark, setRemark] = useState('');
    const [customerOptions, setCustomerOptions] = useState([]);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [showOptions, setShowOptions] = useState(false);
    const [isAdvanceChecked, setIsAdvanceChecked] = useState(false);
    const [Amount, setAmount] = useState('');
    const [cashPaymentModeUuid, setCashPaymentModeUuid] = useState(null);
    const [loggedInUser, setLoggedInUser] = useState('');
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [accountCustomerOptions, setAccountCustomerOptions] = useState([]);
    const [group, setGroup] = useState('');

    useEffect(() => {
        const userNameFromState = location.state?.id;
        const logInUser = userNameFromState || localStorage.getItem('User_name');
        if (logInUser) setLoggedInUser(logInUser);
        else navigate("/login");
    }, [location.state, navigate]);

    useEffect(() => {
        const group = localStorage.getItem("User_group");
        setUserGroup(group);
    }, []);

    useEffect(() => {
        axios.get("/customer/GetCustomersList").then(res => {
            if (res.data.success) {
                setCustomerOptions(res.data.result);
                const accountOptions = res.data.result.filter(item => item.Customer_group === "Account");
                setAccountCustomerOptions(accountOptions);
            }
        }).catch(err => console.error("Error fetching customer options:", err));

        axios.get("/payment_mode/GetPaymentList").then(res => {
            if (res.data.success) {
                const cashPaymentMode = res.data.result.find(mode => mode.Payment_name === "Cash");
                if (cashPaymentMode) {
                    setCashPaymentModeUuid(cashPaymentMode.Payment_mode_uuid);
                }
            }
        }).catch(err => console.error("Error fetching payment modes:", err));
    }, []);

    const submit = async () => {
      try {
          const customer = customerOptions.find(option => option.Customer_name === Customer_name);
          const Group = accountCustomerOptions.find(option => option.Customer_uuid === group);
          if (!customer) {
              alert("Invalid Customer selection.");
              return null;
          }
  
          const orderResponse = await axios.post("/order/addOrder", {
              Customer_uuid: customer.Customer_uuid,
              Remark: Remark,
          });
  
          if (orderResponse.data.success) {
              if (isAdvanceChecked && Amount && group) {
                  const journal = [
                      { Account_id: group, Type: 'Debit', Amount: Number(Amount) },
                      { Account_id: customer.Customer_uuid, Type: 'Credit', Amount: Number(Amount) }
                  ];
  
                  const transactionResponse = await axios.post("/transaction/addTransaction", {
                      Description: Remark,
                      Total_Credit: Number(Amount),
                      Total_Debit: Number(Amount),
                      Payment_mode: Group.Customer_name,
                      Journal_entry: journal,
                      Created_by: loggedInUser
                  });
  
                  if (!transactionResponse.data.success) {
                      alert("Failed to add Transaction.");
                      return null;
                  }
              }
  
              // return info needed for WhatsApp
              return {
                  name: customer.Customer_name,
                  phone: customer.Mobile_number,
                  amount: Amount,
                  remark: Remark
              };
  
          } else {
              alert("Failed to add Order.");
              return null;
          }
  
      } catch (e) {
          console.error("Error adding Order or Transaction:", e);
          return null;
      }
  };
  
  const handleWhatsAppClick = async () => {
    try {
        const whatsappInfo = await submit();
        if (!whatsappInfo) return;

        const { name, phone, amount, remark } = whatsappInfo;

        if (!phone) {
            alert("Customer phone number is missing.");
            return;
        }

        const message = `Dear ${name}, your order has been booked successfully.`;

        const confirmed = window.confirm(`Send WhatsApp message to ${name}?\n\n"${message}"`);
        if (!confirmed) return;

        // Call your API to send message
        await sendMessageToAPI(name, phone, message);

        // Optional: Redirect to order page
        navigate("/allOrder");

    } catch (error) {
        console.error("Failed to process WhatsApp order flow:", error);
    }
};

  const sendMessageToAPI = async (name, phone, message) => {
    const payload = {
        mobile: phone,
        userName: name,
        type: 'customer',
        message: message,
    };

    try {
        const res = await fetch('https://misbackend-e078.onrender.com/usertask/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to send message: ${errorText}`);
        }

        const result = await res.json();
        if (result.error) {
            alert("Failed to send: " + result.error);
        } else {
            alert("Message sent successfully.");
        }
    } catch (error) {
        console.error("Request failed:", error);
        alert("Failed to send message: " + error.message);
    }
};
  
    const handleInputChange = (e) => {
        const value = e.target.value;
        setCustomer_Name(value);
        if (value) {
            const filtered = customerOptions.filter(option =>
                option.Customer_name.toLowerCase().includes(value.toLowerCase()));
            setFilteredOptions(filtered);
            setShowOptions(true);
        } else {
            setShowOptions(false);
        }
    };

    const handleOptionClick = (option) => {
        setCustomer_Name(option.Customer_name);
        setCustomer_uuid(option.Customer_uuid);
        setShowOptions(false);
    };

    const handleAdvanceCheckboxChange = () => {
        setIsAdvanceChecked(prev => !prev);
        setAmount('');
    };

    const handleCustomer = () => setShowCustomerModal(true);
    const exitModal = () => setShowCustomerModal(false);

    const closeModal = () => {
        if (userGroup === "Office User") navigate("/home");
        else if (userGroup === "Admin User") navigate("/adminHome");
    };

    return (
        <>
            <div className="flex justify-center items-center bg-[#f0f2f5] min-h-screen text-[#111b21] px-4">
  <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-6">
    <h2 className="text-xl font-semibold mb-4 text-center">Add Order</h2>

    <form onSubmit={submit}>
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search by Customer Name"
          className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#25D366]"
          value={Customer_name}
          onChange={handleInputChange}
          onFocus={() => setShowOptions(true)}
        />
        {showOptions && filteredOptions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md mt-1 shadow-md">
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

      <button onClick={handleCustomer} type="button" className="mb-4 bg-[#25D366] text-white px-4 py-2 rounded-md hover:bg-[#20c95c]">
        Add New Customer
      </button>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Order</label>
        <input
          type="text"
          className="w-full p-2 rounded-md border border-gray-300"
          placeholder="Item Details"
          value={Remark}
          onChange={(e) => setRemark(e.target.value)}
        />
      </div>

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
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Payment Mode</label>
            <select
              className="w-full p-2 rounded-md border border-gray-300"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              <option value="">Select Payment</option>
              {accountCustomerOptions.map((customer, index) => (
                <option key={index} value={customer.Customer_uuid}>
                  {customer.Customer_name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <button type="submit" className="w-full bg-[#25D366] py-2 rounded-md font-medium text-white hover:bg-[#20c95c]">
        Submit
      </button>
      
      
    <button type="button" onClick={handleWhatsAppClick} className="w-full bg-[#25D366] py-2 rounded-md font-medium text-white hover:bg-[#20c95c] mt-2">
        WhatsApp
    </button>


      <button type="button" onClick={closeModal} className="w-full mt-2 bg-red-500 py-2 rounded-md text-white font-medium hover:bg-red-600">
        Close
      </button>
    </form>
  </div>
</div>
 {showCustomerModal && (
        <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <AddCustomer onClose={exitModal} />
        </div>
      )}
            
        </>
    );
}
