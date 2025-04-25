import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UpdateDelivery from '../Pages/updateDelivery';
import AddNote from "../Pages/addNote";
import OrderPrint from "../Pages/orderPrint";
import Vendor from '../Pages/vendor';
import VendorDetails from '../Pages/vendorDetails';
import EditOrder from './editOrder';

export default function OrderUpdate({ order, onClose }) {
  const navigate = useNavigate();
  const printRef = useRef();
  const [orders, setOrders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [customers, setCustomers] = useState({});
  const [taskOptions, setTaskOptions] = useState([]);
  const [taskId, setTaskId] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false); 
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showClickModal, setShowClickModal] = useState(false);
  const [latestDeliveryDate, setLatestDeliveryDate] = useState(""); 
   const [isAdvanceChecked, setIsAdvanceChecked] = useState(false);
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
          const filteredData = res.data.result.filter(item => item.Id === 1); 
          const options = res.data.result.map(item => item.Task_group);
          setTaskOptions(options);
          setTaskId(filteredData);
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

  const handleUpdateClick = (order) => {
    setSelectedOrder(order); 
    setShowUpdateModal(true);  
  }

  const handlePrintClick = (order) => {
    setSelectedOrder(order); 
    setShowPrintModal(true);  
  };

  const handleVendorClick = (order) => {
    setSelectedOrder(order); 
    setShowVendorModal(true);  
  };

  const handleClick = (order) => {
    setSelectedOrder(order); 
    setShowClickModal(true);  
  };
  
  const handleAdvanceCheckboxChange = () => {
    setIsAdvanceChecked(prev => {
        const newCheckedState = !prev;

        setValues(values => ({
            ...values,
            Delivery_Date: newCheckedState ? '' : new Date().toISOString().split('T')[0], 
        }));

        return newCheckedState;
    });
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

  const closeUpdateModal = () => {
    setShowUpdateModal(false); 
    setSelectedOrder(null);  
  };

  const closePrintModal = () => {
    setShowPrintModal(false); 
    setSelectedOrder(null); 
  };

  const closeVendorModal = () => {
    setShowVendorModal(false); 
    setSelectedOrder(null); 
  };

  const closeClickModal = () => {
    setShowClickModal(false); 
    setSelectedOrder(null); 
  };


  const handleWhatsAppClick = async (order) => {
    const customerUUID = order.Customer_uuid;
    const customer = customers[customerUUID];
  
    if (!customer) {
      alert("Customer information not found.");
      return;
    }
  
    const customerName = customer.Customer_name?.trim() || "Customer";
    let phoneNumber = customer.Mobile_number?.toString().trim() || "";
  
    if (!phoneNumber) {
      alert("Phone number is missing.");
      return;
    }
  
    phoneNumber = phoneNumber.replace(/\D/g, "");
  
    if (phoneNumber.length !== 10) {
      alert("Phone number must be 10 digits.");
      return;
    }
  
    const payload = {
      userName: customerName,
      mobile: phoneNumber,
      type: "order_update",
    };
  
    console.log("Sending payload:", payload); 
  
    try {
      const res = await fetch('https://misbackend-e078.onrender.com/usertask/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      const result = await res.json();
      console.log("Message sent:", result);
  
      if (result.error) {
        alert("Failed to send: " + result.error);
      } else {
        alert("Message sent successfully.");
      }
    } catch (error) {
      console.error("Request failed:", error);
      alert("Failed to send message.");
    }
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

              <div className="p-2 col-start-8 col-end-8"> <button onClick={() => handleUpdateClick(order)} className="btn">
                Edit
              </button></div>
              <div className="p-2 col-start-2 col-end-4">
              {notes.filter(note => note.Order_uuid === values.Order_uuid).map((note, index) => (
                <div key={index}>
                  <strong className="text-sm text-gray-600">{note.Note_name}</strong>
                </div>
              ))}
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
            <div className="mb-3 ">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="advanceCheckbox"
                            checked={isAdvanceChecked}
                            onChange={handleAdvanceCheckboxChange}
                        />
                        <label className="form-check-label" htmlFor="advanceCheckbox">
                            Update Date
                        </label>
                    </div>
                    {isAdvanceChecked && (
              <div className="flex items-center">
                <input
                  type="date"
                  value={values.Delivery_Date}
                  onChange={(e) => setValues({ ...values, Delivery_Date: e.target.value })}
                  placeholder="Delivery Date"
                  className="flex-grow p-2 border border-gray-300 rounded-lg"
                />
                
              </div>
               )}
              <div className="flex items-center">
            
              <button type="submit" className="ml-2 bg-green-500 text-white p-2 rounded-lg">
                  UPDATE
                </button>
                <button type="button" className="ml-2 bg-green-500 text-white p-2 rounded-lg" onClick={onClose}>Cancel</button>
                <button type="button" className="ml-2 bg-green-500 text-white p-2 rounded-lg" onClick={() => handlePrintClick(order)}>Print</button>
                <button type="button" className="ml-2 bg-green-500 text-white p-2 rounded-lg" onClick={() => handleWhatsAppClick(order)}>Share</button>
                {values.Status.length > 0 ? (
  values.Status.reduce((acc, status) => {
    const matchedTask = taskId.find(task => task.Task_group === status.Task && task.Id === 1);   
    if (matchedTask && !acc.includes(matchedTask.Task_group)) {
      acc.push(matchedTask.Task_group);
    }
    
    return acc;
  }, []).map((taskGroup, index) => {
    const matchedTask = taskId.find(task => task.Task_group === taskGroup && task.Id === 1);

    if (matchedTask) {
      return (
        <div key={index}>
          <button
            type="button"
            className="ml-2 bg-green-500 text-white p-2 rounded-lg"
            onClick={() => handleVendorClick(order)}
          >
           {matchedTask.Task_group} 
          </button>
        </div>
      );
    }
    return null; 
  })
) : (
  <div>No status data available</div>
)}

                <button type="button" className="ml-2 bg-green-500 text-white p-2 rounded-lg" onClick={() => handleClick(order)} style={{ display: 'none'}}>Click</button>
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

{showUpdateModal && (
        <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <EditOrder order={selectedOrder} onClose={closeUpdateModal} />
        </div>
      )}

      {showPrintModal && (
        <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <OrderPrint order={selectedOrder} onClose={closePrintModal}/>
        </div>
      )}

{showVendorModal && (
        <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <Vendor order={selectedOrder} onClose={closeVendorModal}/>
        </div>
      )}

{showClickModal && (
        <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <VendorDetails order={selectedOrder} onClose={closeClickModal}/>
        </div>
      )}

    </>
  );
}
