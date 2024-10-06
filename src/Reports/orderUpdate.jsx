import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UpdateDelivery from '../Pages/updateDelivery';

export default function OrderUpdate({ order, onClose }) {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState({});
  const [taskOptions, setTaskOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false); 
  const [selectedOrder, setSelectedOrder] = useState(null);  
  const [values, setValues] = useState({
    id: order?._id || '',
    Customer_name: order?.Customer_name || '',
    Order_Number: order?.Order_Number || '',
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
            if (customer.Customer_uuid && customer.Customer_name) {
              acc[customer.Customer_uuid] = customer.Customer_name;
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

  const closeEditModal = () => {
    setShowEditModal(false); 
    setSelectedOrder(null);  
  };

  return (
    <>
    <div className="w-4/4 h-full pt-10 flex flex-col">
      <div className="p-3 bg-green-200 grid grid-cols-5 gap-1 items-center ">
        <button type="button" onClick={onClose}>X</button>
        <div className="w-12 h-12 p-2 col-start-1 col-end-1 bg-gray-100 rounded-full flex items-center justify-center">
          <strong className="text-l text-gray-500">{values.Order_Number}</strong>
        </div>
        <div>
          <div className="p-2 col-start-2 col-end-4">
            <strong className="text-l text-gray-900">{values.Customer_name}</strong>
            <br />
          </div>        
        </div>
        <div>
          <div className="p-2 row-start-2 row-end-4">
            <button onClick={() => handleEditClick(order)} className="btn">
              <svg className="h-6 w-6 text-blue-500" width="12" height="12" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z"/>
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3l-11 11l-4 1l1 -4z"/>
              </svg>
            </button>
            <br />
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
              <button type="submit" className="ml-2 bg-green-500 text-white p-2 rounded-lg">
                UPDATE
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    {showEditModal && (
      <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
        <UpdateDelivery order={selectedOrder} onClose={closeEditModal} />
      </div>
    )}
    </>
  );
}
