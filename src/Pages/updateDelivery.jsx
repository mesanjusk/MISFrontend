// Import statements remain unchanged
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import normalizeWhatsAppNumber from '../utils/normalizeNumber';

const BASE_URL = 'https://misbackend-e078.onrender.com';

export default function UpdateDelivery({ onClose, order = {}, mode = 'edit' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const previewRef = useRef();

  const [orderId, setOrderId] = useState('');
  const [Customer_uuid, setCustomer_uuid] = useState('');
  const [items, setItems] = useState([{ Item: '', Quantity: '', Rate: '', Amount: 0 }]);
  const [Remark, setRemark] = useState('');
  const [Customer_name, setCustomer_name] = useState('');
  const [customers, setCustomers] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerMap, setCustomerMap] = useState({});
  const [customerMobile, setCustomerMobile] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userNameFromState = location.state?.id;
    const logInUser = userNameFromState || localStorage.getItem('User_name');
    if (logInUser) setLoggedInUser(logInUser);
    else navigate('/login');
  }, [location.state, navigate]);

  useEffect(() => {
    if (mode === 'edit' && (order?._id || order?.Order_id)) {
      setOrderId(order._id || order.Order_id);
      setCustomer_uuid(order.Customer_uuid || '');
      setItems(order.Items || [{ Item: '', Quantity: '', Rate: '', Amount: 0 }]);
      setRemark(order.Remark || '');
      setCustomer_name(order.Customer_name || '');
    }
  }, [order, mode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, itemRes] = await Promise.all([
          axios.get(`${BASE_URL}/customer/GetCustomersList`),
          axios.get(`${BASE_URL}/item/GetItemList`)
        ]);

        if (custRes.data.success) {
          setCustomers(custRes.data.result);
          const map = {};
          custRes.data.result.forEach(c => {
            map[c.Customer_uuid] = c.Customer_name;
          });
          setCustomerMap(map);
          const found = custRes.data.result.find(c => c.Customer_uuid === Customer_uuid);
          if (found) {
            setCustomer_name(found.Customer_name);
            setCustomerMobile(found.Mobile_number);
          }
        }

        if (itemRes.data.success) {
          const options = itemRes.data.result.map(item => item.Item_name);
          setItemOptions(options);
        }
      } catch {
        toast.error('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [Customer_uuid]);

  const handleItemChange = (index, key, value) => {
    const updated = [...items];
    updated[index][key] = value;
    if (key === 'Quantity' || key === 'Rate') {
      const qty = parseFloat(updated[index].Quantity) || 0;
      const rate = parseFloat(updated[index].Rate) || 0;
      updated[index].Amount = qty * rate;
    }
    setItems(updated);
  };

  const addNewItem = () => {
    if (items.some(i => !i.Item || !i.Quantity || !i.Rate)) {
      toast.error('Please complete existing item rows first');
      return;
    }
    setItems([...items, { Item: '', Quantity: '', Rate: '', Amount: 0 }]);
  };

  const validateForm = () => {
    if (!Customer_uuid || items.some(i => !i.Item || !i.Quantity || !i.Rate)) {
      toast.error('Please fill all required fields');
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const url = mode === 'edit' ? `${BASE_URL}/order/updateDelivery/${orderId}` : `${BASE_URL}/order/addDelivery`;
      const payload = {
        Customer_uuid,
        Items: items,
        Remark
      };

      const response = await axios[mode === 'edit' ? 'put' : 'post'](url, payload);
      if (response.data.success) {
        const totalAmount = items.reduce((sum, i) => sum + i.Amount, 0);
        const journal = [
          { Account_id: Customer_uuid, Type: 'Credit', Amount: +totalAmount },
          { Account_id: '6c91bf35-e9c4-4732-a428-0310f56bd0a7', Type: 'Debit', Amount: +totalAmount },
        ];

        const transaction = await axios.post(`${BASE_URL}/transaction/addTransaction`, {
          Description: 'Delivered',
          Transaction_date: new Date().toISOString(),
          Total_Credit: +totalAmount,
          Total_Debit: +totalAmount,
          Payment_mode: 'Sale',
          Journal_entry: journal,
          Created_by: loggedInUser,
        });

        if (transaction.data.success) {
          toast.success('Order saved');
          setShowInvoiceModal(true);
        } else {
          toast.error('Transaction failed');
        }
      } else {
        toast.error('Order failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    }
    setIsSubmitting(false);
  };

  const sendWhatsApp = async () => {
    const totalAmount = items.reduce((sum, i) => sum + i.Amount, 0);
    if (customerMobile) {
      const number = normalizeWhatsAppNumber(customerMobile);
      await axios.post(`${BASE_URL}/whatsapp/send-test`, {
        number,
        message: `Hi ${customerMap[Customer_uuid] || Customer_name}, your order has been delivered. Amount: ₹${totalAmount}`
      });
      toast.success('WhatsApp sent');
    } else {
      toast.warn('Customer mobile number not found');
    }
  };

  const handlePrint = () => {
    const printContents = previewRef.current.innerHTML;
    const win = window.open('', '', 'height=600,width=800');
    win.document.write('<html><head><title>Invoice</title></head><body>');
    win.document.write(printContents);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  const handlePDF = async () => {
    const element = previewRef.current;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 10, 10);
    pdf.save('invoice.pdf');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-center">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-20 w-20 mb-4 animate-spin"></div>
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
            <h2 className="text-xl font-bold">{mode === 'edit' ? 'Edit Order' : 'New Delivery'}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-red-600">✕</button>
          </div>

          <form className="grid grid-cols-1 gap-4">
            <div>
              <label className="block font-semibold">Customer <span className="text-red-500">*</span></label>
              <select value={Customer_uuid} onChange={(e) => setCustomer_uuid(e.target.value)} className="w-full border p-2 rounded">
                <option value="">Select customer</option>
                {customers.map(c => (
                  <option key={c.Customer_uuid} value={c.Customer_uuid}>{c.Customer_name}</option>
                ))}
              </select>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                <Select
                  options={itemOptions.map(i => ({ label: i, value: i }))}
                  value={item.Item ? { label: item.Item, value: item.Item } : null}
                  onChange={(opt) => handleItemChange(index, 'Item', opt.value)}
                  placeholder="Select item"
                />
                <input type="number" placeholder="Qty" value={item.Quantity} onChange={(e) => handleItemChange(index, 'Quantity', e.target.value)} className="border p-2 rounded" />
                <input type="number" placeholder="Rate" value={item.Rate} onChange={(e) => handleItemChange(index, 'Rate', e.target.value)} className="border p-2 rounded" />
                <input type="text" value={item.Amount} readOnly className="border p-2 bg-gray-100 rounded" />
              </div>
            ))}
            <button type="button" onClick={addNewItem} className="bg-green-500 text-white px-3 py-1 rounded">+ Add Item</button>

            <div>
              <label className="block font-semibold">Remark</label>
              <input type="text" value={Remark} onChange={(e) => setRemark(e.target.value)} className="w-full border p-2 rounded" />
            </div>

            <button type="button" onClick={submit} disabled={isSubmitting} className={`py-2 rounded text-white ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isSubmitting ? 'Saving...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>

      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-3xl p-6 rounded-lg shadow-xl relative">
            <button className="absolute top-2 right-3 text-xl" onClick={() => setShowInvoiceModal(false)}>✕</button>
            <div ref={previewRef} className="p-6 bg-white space-y-4 border rounded shadow-md">
              <div className="text-center mb-4">
                <h2 className="text-3xl font-bold text-gray-800">🧾 My Printing Company</h2>
                <p className="text-sm text-gray-500">123 Business Street, Your City, State, 123456</p>
                <p className="text-sm text-gray-500">GSTIN: 22AAAAA0000A1Z5 | Phone: +91-9999999999</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Invoice To:</strong></p>
                  <p>{customerMap[Customer_uuid] || Customer_name}</p>
                  {customerMobile && <p>📞 {customerMobile}</p>}
                </div>
                <div className="text-right">
                  <p><strong>Invoice Date:</strong> {new Date().toLocaleDateString('en-GB')}</p>
                  <p><strong>Order No:</strong> #{String(orderId || '').slice(-6).toUpperCase()}</p>
                </div>
              </div>

              <table className="w-full mt-4 border-t border-b text-sm">
                <thead>
                  <tr className="bg-gray-200 text-left">
                    <th className="p-2">#</th>
                    <th className="p-2">Item</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">{item.Item}</td>
                      <td className="p-2 text-right">{item.Quantity}</td>
                      <td className="p-2 text-right">₹{item.Rate}</td>
                      <td className="p-2 text-right">₹{item.Amount}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan="4" className="p-2 text-right">Total</td>
                    <td className="p-2 text-right">₹{items.reduce((sum, i) => sum + i.Amount, 0)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-4">
                <p><strong>Remark:</strong> {Remark || 'N/A'}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={sendWhatsApp} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                📩 Send WhatsApp
              </button>
              <button onClick={handlePrint} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                🖨️ Print
              </button>
              <button onClick={handlePDF} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                📄 Download PDF
              </button>
              <button onClick={() => { setShowInvoiceModal(false); onClose(); }} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                ❌ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
