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
  
    if (!values.Task || !values.Assigned) {
      alert('Task & Assigned are required.');
      return;
    }
  
    const today = new Date().toISOString().split('T')[0];

    const updatedValues = {
      ...values,
      CreatedAt: new Date().toISOString(),
      Delivery_Date: values.Delivery_Date || today, 
    };
  
    axios.post('/order/addStatus', {
      orderId: values.id,
      newStatus: {
        Task: updatedValues.Task,
        Assigned: updatedValues.Assigned,
        Delivery_Date: updatedValues.Delivery_Date,
        CreatedAt: updatedValues.CreatedAt,
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

<div className="vh-100 pt-1 flex flex-col">
  {/* HEADER */}
  <div className="px-2 pt-2 bg-green-200 flex items-center justify-between rounded-b-md shadow-sm">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
        <strong className="text-gray-500">{values.Order_Number}</strong>
      </div>
      <div>
        <strong className="text-lg text-gray-900">{values.Customer_name}</strong>
        <div className="text-sm text-gray-600">
          {notes
            .filter(note => note.Order_uuid === values.Order_uuid)
            .map((note, index) => (
              <div key={index}>{note.Note_name}</div>
            ))}
        </div>
        
      </div>
    </div>

    <div className="flex gap-2">
      <button onClick={() => handleEditClick(order)} className="p-2 rounded-full bg-white shadow hover:bg-gray-100">
        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M16.5 3.5a2.1 2.1 0 013 3L8.5 17l-4 1 1-4z" />
        </svg>
      </button>
      <button onClick={() => handlePrintClick(order)} className="p-2 rounded-full bg-white shadow hover:bg-gray-100">
        Pr
        
      </button>
      <button onClick={() => handleWhatsAppClick(order)} className="p-2 rounded-full bg-white shadow hover:bg-gray-100">
        WP
        
      </button>
      
      <button onClick={() => handleNoteClick(order)} className="p-2 rounded-full bg-white shadow hover:bg-gray-100">
        <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="12" y1="9" x2="12" y2="15" />
        </svg>
      </button>
      <button onClick={() => handleUpdateClick(order)} className="p-2 rounded-full bg-white shadow hover:bg-gray-100">
        Ed
      </button>
    </div>
  </div>

  {/* MAIN BODY */}
  <div className="flex-1 overflow-y-scroll bg-gray-100 p-4">
    {/* Remark Section */}
    <div className="bg-green-100 p-3 mb-4 rounded-lg shadow w-3/4 ml-auto">
      <p className="text-sm text-gray-600">{values.Remark}</p>
    </div>

    {/* Status Updates */}
    {values.Status?.length > 0 ? (
      values.Status.map((status, index) => (
        <div key={index} className="bg-white p-3 mb-3 rounded-lg shadow w-3/4">
          <div className="text-sm text-gray-700">
            <div><strong>Date:</strong> {new Date(status.CreatedAt).toLocaleDateString()}</div>
            <div><strong>Task:</strong> {status.Task}</div>
            <div><strong>User:</strong> {status.Assigned}</div>
            <div><strong>Delivery:</strong> {new Date(status.Delivery_Date).toLocaleDateString()}</div>
          </div>
        </div>
      ))
    ) : (
      <div className="text-center text-gray-500">No status data available</div>
    )}

    {/* Update Form */}
    <form onSubmit={handleSaveChanges} className="mt-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Update Job Status</label>
          <select
            className="w-full border border-gray-300 rounded p-2"
            value={values.Task}
            onChange={(e) => setValues({ ...values, Task: e.target.value })}
          >
            <option value="">Select Task</option>
            {taskOptions.map((option, i) => (
              <option key={i} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Assign User</label>
          <select
            className="w-full border border-gray-300 rounded p-2"
            value={values.Assigned}
            onChange={(e) => setValues({ ...values, Assigned: e.target.value })}
          >
            <option value="">Select User</option>
            {userOptions.map((option, i) => (
              <option key={i} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center mt-6 gap-2">
          <input
            type="checkbox"
            id="advanceCheckbox"
            checked={isAdvanceChecked}
            onChange={handleAdvanceCheckboxChange}
          />
          <label htmlFor="advanceCheckbox" className="text-sm">Update Date</label>
        </div>

        {isAdvanceChecked && (
          <div className="md:col-span-3">
            <input
              type="date"
              className="w-full border border-gray-300 rounded p-2"
              value={values.Delivery_Date}
              onChange={(e) => setValues({ ...values, Delivery_Date: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2 mt-6">
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          UPDATE
        </button>
        <button type="button" className="bg-gray-300 text-black px-4 py-2 rounded" onClick={onClose}>
          Cancel
        </button>
       

        {values.Status?.length > 0 && taskId.length > 0 &&
          values.Status.reduce((acc, status) => {
            const match = taskId.find(task => task.Task_group === status.Task && task.Id === 1);
            if (match && !acc.includes(match.Task_group)) acc.push(match.Task_group);
            return acc;
          }, []).map((group, i) => (
            <button
              key={i}
              type="button"
              className="bg-indigo-500 text-white px-4 py-2 rounded"
              onClick={() => handleVendorClick(order)}
            >
              {group}
            </button>
          ))}
      </div>
    </form>
  </div>

  {/* HIDDEN PRINT DIV */}
  <div ref={printRef} style={{ display: "none", position: "absolute", left: "-9999px", top: "-9999px" }}>
    <OrderPrint order={order} latestDeliveryDate={latestDeliveryDate} customerDetails={customers[order.Customer_uuid]} />
  </div>

  {/* MODALS */}
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
      <OrderPrint order={selectedOrder} onClose={closePrintModal} />
    </div>
  )}

  {showVendorModal && (
    <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
      <Vendor order={selectedOrder} onClose={closeVendorModal} />
    </div>
  )}

  {showClickModal && (
    <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
      <VendorDetails order={selectedOrder} onClose={closeClickModal} />
    </div>
  )}
</div>


      )
      

    </>
  );
}
