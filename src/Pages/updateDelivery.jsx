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
  const [invoiceUrl, setInvoiceUrl] = useState('');


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
  // 📌 Upload invoice after modal is shown and previewRef is ready
  useEffect(() => {
    const uploadInvoice = async () => {
      // Wait for DOM to settle
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!previewRef.current) {
        console.warn("⚠️ previewRef not ready");
        return;
      }

      try {
        const element = previewRef.current;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [74, 105] });
        pdf.addImage(imgData, 'JPEG', 0, 0, 74, 105);

        const pdfBlob = pdf.output('blob');
        const cloudForm = new FormData();
        const fileName = `${order.Order_Number || 'invoice'}.pdf`;

        cloudForm.append('file', pdfBlob, fileName);
        cloudForm.append('upload_preset', 'missk_invoice');

        const res = await axios.post(
          'https://api.cloudinary.com/v1_1/dadcprflr/raw/upload',
          cloudForm
        );

        const pdfUrl = res.data.secure_url;
        setInvoiceUrl(pdfUrl);
        toast.success('Invoice uploaded');
      } catch (err) {
        console.error("❌ Invoice upload error:", err);
        toast.error('Upload failed');
      }
    };

    if (showInvoiceModal) {
      uploadInvoice();
    }
  }, [showInvoiceModal]);




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
      const url = mode === 'edit'
        ? `${BASE_URL}/order/updateDelivery/${orderId}`
        : `${BASE_URL}/order/addDelivery`;

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



 const sendWhatsApp = async (pdfUrl = '') => {
  const totalAmount = items.reduce((sum, i) => sum + i.Amount, 0);
  const mobile = customerMobile || customers.find(c => c.Customer_uuid === Customer_uuid)?.Mobile_number;

  if (!mobile) {
    toast.error('Customer mobile number not found');
    return;
  }

  const number = normalizeWhatsAppNumber(mobile);
  const message = `Hi ${customerMap[Customer_uuid] || Customer_name}, your order has been delivered. Amount: ₹${totalAmount}`;
  
  const payload = { number, message };
  if (pdfUrl && pdfUrl.length > 0) {
    payload.mediaUrl = pdfUrl;
  }

  try {
    console.log("📤 Sending WhatsApp payload:", payload);
    const res = await axios.post(`${BASE_URL}/whatsapp/send-test`, payload);

    if (res.data?.success || res.status === 200) {
      toast.success('✅ WhatsApp message sent');
    } else {
      console.error("⚠️ WhatsApp API error response:", res.data);
      toast.error('❌ WhatsApp sending failed');
    }
  } catch (err) {
    console.error("❌ WhatsApp error:", err?.response?.data || err.message);
    toast.error('Error sending WhatsApp');
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
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [74, 105]
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, 74, 105);
    const fileName = `${order.Order_Number || 'invoice'}.pdf`;
    pdf.save(fileName);
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
            <button onClick={() => { setShowInvoiceModal(false); onClose(); }}  className="text-gray-500 hover:text-red-600">✕</button>
            
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
            <div ref={previewRef} className="mx-auto w-[320px] border bg-white p-4 text-[12px] rounded shadow-md">

              <div className="text-center border-b pb-2">

                <h2 className="text-lg font-bold">S.K. Digital</h2>
                <p>Infront of Santoshi Mata Mandir</p>
                <p>Krishnapura Ward, Gondia</p>
              </div>

              <div className="mt-2">
                <p><strong>Bill No:</strong> {order.Order_Number || '432'}</p>

                <p><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</p>
              </div>

              <table className="w-full text-left mt-2">
                <thead>
                  <tr className="border-b">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-right">Qty</th>
                    <th className="py-1 text-right">Rate</th>
                    <th className="py-1 text-right">Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{item.Item}</td>
                      <td className="py-1 text-right">{item.Quantity}</td>
                      <td className="py-1 text-right">₹{item.Rate}</td>
                      <td className="py-1 text-right">₹{item.Amount}</td>
                    </tr>
                  ))}
                </tbody>

              </table>

              <hr className="my-1" />

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₹{items.reduce((sum, i) => sum + i.Amount, 0)}</span>
              </div>
              <div className="mt-3 text-center">
                <p className="text-sm font-semibold">Scan to Pay via UPI</p>
                <img src="/qr.png" alt="UPI QR" className="mx-auto h-24" />
              </div>
            </div>


            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  if (!invoiceUrl) {
                    toast.error("Invoice not ready yet");
                    return;
                  }
                  sendWhatsApp(invoiceUrl);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                WhatsApp
              </button>


              <button onClick={handlePrint} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                Print
              </button>
              <button onClick={handlePDF} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                Download 
              </button>
              
            </div>
          </div>
        </div>
      )}
    </>
  );
}
