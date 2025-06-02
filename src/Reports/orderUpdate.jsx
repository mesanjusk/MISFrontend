import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Vendor from '../Pages/vendor';
import VendorDetails from '../Pages/vendorDetails';
import EditOrder from '../Components/editOrder';
import Print from '../Components/print';
import WhatsApp from '../Components/whatsApp';
import Note from '../Components/note';
import EditCustomer from '../Components/editCustomer';

export default function OrderUpdate({ order, onClose }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [customers, setCustomers] = useState({});
  const [taskOptions, setTaskOptions] = useState([]);
  const [taskId, setTaskId] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showClickModal, setShowClickModal] = useState(false);
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
          navigate("/home");
        }
      })
      .catch(err => {
        console.log('Error updating order:', err);
      });
  };

  const handleVendorClick = (order) => {
    setSelectedOrder(order); 
    setShowVendorModal(true);  
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

  const closeVendorModal = () => {
    setShowVendorModal(false); 
    setSelectedOrder(null); 
  };

  const closeClickModal = () => {
    setShowClickModal(false); 
    setSelectedOrder(null); 
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
      <EditOrder order={order} />
      <Print order={order} />
      <WhatsApp  order={order} />    
     <Note order={order} />
      <EditCustomer order={order} />
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
      

    </>
  );
}
