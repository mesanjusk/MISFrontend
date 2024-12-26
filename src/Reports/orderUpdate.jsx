import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UpdateDelivery from '../Pages/updateDelivery';
import AddNote from "../Pages/addNote";
import OrderPrint from "../Pages/orderPrint";

export default function OrderUpdate({ order, onClose }) {
  const navigate = useNavigate();
  const printRef = useRef();
  const [orders, setOrders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [customers, setCustomers] = useState({});
  const [taskOptions, setTaskOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false); 
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [latestDeliveryDate, setLatestDeliveryDate] = useState(""); 
  const [selectedOrder, setSelectedOrder] = useState(null);  
  const [values, setValues] = useState({
    id: order?._id || '',
    Customer_name: order?.Customer_name || '',
    Order_uuid: order?.Order_uuid || '',
    Order_Number: order?.Order_Number || '',
    Customer_uuid: order?.Customer_uuid || '',
    Remark: order?.Remark || '',
    Delivery_Date: order?.highestStatusTask?.Delivery_Date || '',
    Assigned: order?.highestStatusTask?.Assigned || '',
    Task: order?.highestStatusTask?.Task || '',
    CreatedAt: order?.highestStatusTask?.CreatedAt || new Date().toISOString().split("T")[0],
    Status: order?.Status || []
  });

  useEffect(() => {
    axios.get("/taskgroup/GetTaskgroupList")
      .then(res => {
        if (res.data.success) {
          const options = res.data.result.map(item => item.Task_group);
          setTaskOptions(options);
        }
      })
      .catch(err => {
        console.error("Error fetching task options:", err);
      });
  }, []);

  useEffect(() => {
    axios.get("/user/GetUserList")
      .then(res => {
        if (res.data.success) {
          const options = res.data.result.map(item => item.User_name);
          setUserOptions(options);
        }
      })
      .catch(err => {
        console.error("Error fetching user options:", err);
      });
  }, []);

  useEffect(() => {
    axios.get("/order/GetOrderList")
      .then(res => {
        if (res.data.success) {
          setOrders(res.data.result);
        } else {
          setOrders([]);
        }
      })
      .catch(err => console.log('Error fetching order list:', err));
  }, []);

  useEffect(() => {
    axios.get("/customer/GetCustomersList")
      .then(res => {
        if (res.data.success) {
          const customerMap = res.data.result.reduce((acc, customer) => {
            if (customer.Customer_uuid && customer.Customer_name && customer.Mobile_number) {
              acc[customer.Customer_uuid] = {
                Customer_name: customer.Customer_name,
                Mobile_number: customer.Mobile_number,
              };
            }
            return acc;
          }, {});
          setCustomers(customerMap);
        } else {
          setCustomers({});
        }
      })
      .catch(err => console.log('Error fetching customers list:', err));
  }, []);
  
 
  useEffect(() => {
    if (values.Order_uuid) {
      axios.get(`/note/${values.Order_uuid}`)
      .then(res => {
        if (res.data.success) {
          setNotes(res.data.result);
        } else {
          setNotes([]);
        }
      })
      .catch(err => {
        setNotes([]);
      });
    } else {
      console.warn("No Order_uuid provided, skipping notes fetch.");
    }
  }, [values.Order_uuid]);
  
  

  const handleSaveChanges = (e) => {
    e.preventDefault();

    if (!values.Task || !values.Assigned || !values.Delivery_Date) {
      alert('All fields are required.');
      return;
    }

    axios.post('/order/addStatus', {
      orderId: values.id,
      newStatus: {
        Task: values.Task,
        Assigned: values.Assigned,
        Delivery_Date: values.Delivery_Date,
        CreatedAt: values.CreatedAt,
      },
    })
      .then(res => {
        if (res.data.success) {
          alert('Order updated successfully!');
          onClose(); 
          navigate("/allOrder");  
        }
      })
      .catch(err => {
        console.log('Error updating order:', err);
      });
  };

  const handleEditClick = (order) => {
    setSelectedOrder(order); 
    setShowEditModal(true);  
  }

  const handleNoteClick = (order) => {
    setSelectedOrder(order); 
    setShowNoteModal(true);  
  }

  const handlePrintClick = (order) => {
    setSelectedOrder(order); 
    setShowPrintModal(true);  
  };
  

  useEffect(() => {
    if (order?.Status?.length) {
      const maxDeliveryDate = order.Status.reduce((latest, current) => {
        return new Date(current.Delivery_Date) > new Date(latest.Delivery_Date) ? current : latest;
      }, order.Status[0]);
      setLatestDeliveryDate(maxDeliveryDate.Delivery_Date);
    }
  }, [order]);

  const closeEditModal = () => {
    setShowEditModal(false); 
    setSelectedOrder(null);  
  };

  const closeNoteModal = () => {
    setShowNoteModal(false); 
    setSelectedOrder(null);  
  };

  const handleWhatsAppClick = (order) => {
    const customerUUID = order.Customer_uuid;
    const customer = customers[customerUUID];
  
    if (!customer) {
      alert("Customer information not found.");
      return;
    }
  
    const customerName = customer.Customer_name || "Customer";
    let phoneNumber = customer.Mobile_number || "";
  
    if (!phoneNumber) {
      alert("Phone number is missing.");
      return;
    }
  
    phoneNumber = String(phoneNumber); 
    
    const countryCode = "+91"; 
  
    phoneNumber = phoneNumber.replace(/\D/g, "");
   
    if (phoneNumber.length !== 10) {
      alert("Phone number is invalid.");
      return;
    }
  
    phoneNumber = `${countryCode}${phoneNumber}`;
  
    const message = `Hello ${customerName},%0AYour order with ID ${order.Order_Number} has been processed.%0ATotal Amount: ${order?.Amount},,%0AThank you!`;
  
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  
    window.open(whatsappURL, "_blank");
  };
  
  return (
    <>
<div className=" max-w-lg " >
      <div className="w-4/4 vh-100 pt-10 flex flex-col">
        <div className="px-1 pt-4 bg-green-200 grid grid-cols-12  items-center h-18"  >
          
          <div className="w-12 h-12 p-2 col-start-1 col-end-1 bg-gray-100 rounded-full flex items-center justify-center">
            <strong className="text-l text-gray-500">{values.Order_Number}</strong>
          </div>
          <div>
            <div className="p-2 col-start-2 col-end-5">
              <strong className="text-l text-gray-900">{values.Customer_name}</strong>
              <br />
            </div>        
            
          </div>
          <div className="p-2 col-start-7 col-end-7"><button onClick={() => handleEditClick(order)} className="btn">
                <svg className="h-6 w-6 text-blue-500" width="12" height="12" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z"/>
                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3l-11 11l-4 1l1 -4z"/>
                </svg>
              </button> </div>
            <div className="p-2 col-start-8 col-end-8"> <button onClick={() => handleNoteClick(order)} className="btn">
                <svg className="h-10 w-10 text-blue-500" width="30" height="30" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">                        
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="12" y1="9" x2="12" y2="15" />
                </svg>
              </button></div>
            <div className="p-2 col-start-9 col-end-9"> <button onClick={() => handlePrintClick(order)} className="btn">
  <svg
    className="h-10 w-10 text-blue-500"
    width="3"
    height="30"
    viewBox="0 0 24 24"
    strokeWidth="2"
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9V3h12v6" />
    <rect x="6" y="13" width="12" height="8" rx="2" />
  </svg>
</button></div>
            <div className="p-2 col-start-10 col-end-10">              
<button
  onClick={() => handleWhatsAppClick(order)}
  className="btn ml-2"
>
  <svg
    className="h-10 w-10 text-green-500"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    fill="currentColor"
  >
    <path d="M16 0C7.163 0 0 7.163 0 16c0 2.943.794 5.69 2.177 8.07L.019 32l8.202-2.125A15.94 15.94 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.449 23.021c-.398 1.125-2.306 2.069-3.15 2.188-.798.11-1.75.157-2.825-.16-.65-.16-1.488-.48-2.567-1.044a15.01 15.01 0 01-6.024-6.01c-.597-1.081-.933-1.94-1.097-2.59-.33-1.31-.285-2.374-.174-3.188.155-.868 1.03-2.54 2.15-2.91.396-.13.914-.064 1.214.46.17.303.398.652.642 1.057.286.458.607 1.06.744 1.353.26.52.086 1.072-.16 1.396l-.644.868c-.33.437-.693.694-.572 1.047.886 2.18 3.49 4.894 6.084 6.146.208.11.345.097.477-.048l.703-.698c.346-.347.787-.33 1.31-.197.413.108.974.435 1.558.808.487.325.945.643 1.227.907.39.367.672.72.744.918.235.653-.212 1.267-.498 1.747z" />
  </svg>
</button></div>
          <div>
            <div className="p-2 row-start-5 row-end-5">

           
              
              
 

            </div>  
            <div>
              <div className="p-2 col-start-2 col-end-4">
              {notes.filter(note => note.Order_uuid === values.Order_uuid).map((note, index) => (
                <div key={index}>
                  <strong className="text-sm text-gray-600">{note.Note_name}</strong>
                </div>
              ))}
             </div>     
            </div>     
          </div>
        </div>

        <div className="flex-1 overflow-y-scroll bg-gray-100 p-4">
          <div className="bg-green-100 p-3 mb-2 text-right-xs rounded-lg shadow-lg w-3/4 ml-auto">
            <p className="text-sm text-gray-600">{values.Remark}</p>
          </div>
          <div>
            {values.Status.length > 0 ? (
              values.Status.map((status, index) => (
                <div key={index}>
                  <div className="bg-white p-3 mb-2 rounded-lg shadow-lg w-3/4">
                    {new Date(status.CreatedAt).toLocaleDateString()}
                    <br />
                    {status.Task}
                    <br />
                    {status.Assigned}
                    <br />
                    {new Date(status.Delivery_Date).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div>No status data available</div>
            )}
          </div>

          <form onSubmit={handleSaveChanges}>
            <div className="">
              <div className="flex-grow p-2 border border-gray-300 rounded-lg">
                Update Job Status
                <select
                  className="form-control"
                  value={values.Task}
                  onChange={(e) => setValues({ ...values, Task: e.target.value })}
                >
                  <option value="">Select Task</option>
                  {taskOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="flex-grow border border-gray-300 rounded-lg">
                Update User
                <select
                  className="form-control"
                  value={values.Assigned}
                  onChange={(e) => setValues({ ...values, Assigned: e.target.value })}
                >
                  <option value="">Select User</option>
                  {userOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pb-14 border-t border-gray-300">
              <div className="flex items-center">
                <input
                  type="date"
                  value={values.Delivery_Date}
                  onChange={(e) => setValues({ ...values, Delivery_Date: e.target.value })}
                  placeholder="Delivery Date"
                  className="flex-grow p-2 border border-gray-300 rounded-lg"
                />
                
              </div>
              <div className="flex items-center">
              <button type="submit" className="ml-2 bg-green-500 text-white p-2 rounded-lg">
                  UPDATE
                </button>
                <button type="button" className="ml-2 bg-green-500 text-white p-2 rounded-lg" onClick={onClose}>Cancel</button>
                </div>
            </div>
          </form>
        </div>
      </div>
      </div>
      <div
  ref={printRef}
  className="order-print-content"
  style={{
    display: "none", 
    position: "absolute", 
    left: "-9999px",
    top: "-9999px",
  }}
>
  <OrderPrint 
    order={order} 
    latestDeliveryDate={latestDeliveryDate} 
    customerDetails={customers[order.Customer_uuid]} 
  />
</div>


      {showEditModal && (
        <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <UpdateDelivery order={selectedOrder} onClose={closeEditModal} />
        </div>
      )}

      {showNoteModal && (
        <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <AddNote order={selectedOrder} onClose={closeNoteModal} />
        </div>
      )}

      {showPrintModal && (
        <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <OrderPrint order={selectedOrder} />
        </div>
      )}

    </>
  );
}
