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
    <div className="min-h-screen bg-[#f0f2f5] flex justify-center items-center px-4">
  <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
    {/* Header Info */}
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-base">
        <strong className="text-gray-500">{values.Order_Number}</strong>
      </div>
      <div>
        <strong className="text-lg text-gray-900">{values.Customer_name}</strong>
        {values.Remark && (
          <div className="text-xs text-gray-500 mt-0.5">{values.Remark}</div>
        )}
        <div className="text-xs text-gray-600">
          {notes
            .filter(note => note.Order_uuid === values.Order_uuid)
            .map((note, index) => (
              <div key={index}>{note.Note_name}</div>
            ))}
        </div>
      </div>
    </div>

    {/* Action Buttons Row */}
    <div className="flex flex-wrap gap-2 my-3">
      <EditOrder order={order} />
      <Print order={order} />
      <WhatsApp order={order} />
      <Note order={order} />
      <EditCustomer order={order} />
    </div>

    {/* Status Table */}
    {values.Status?.length > 0 ? (
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full w-full bg-white rounded-lg shadow border text-xs">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left font-bold text-gray-700">#</th>
              <th className="px-2 py-2 text-left font-bold text-gray-700">Date</th>
              <th className="px-2 py-2 text-left font-bold text-gray-700">Task</th>
              <th className="px-2 py-2 text-left font-bold text-gray-700">User</th>
              <th className="px-2 py-2 text-left font-bold text-gray-700">Delivery</th>
            </tr>
          </thead>
          <tbody>
            {values.Status.map((status, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-2 py-2">{idx + 1}</td>
                <td className="px-2 py-2">{status.CreatedAt ? new Date(status.CreatedAt).toLocaleDateString() : "-"}</td>
                <td className="px-2 py-2">{status.Task || "-"}</td>
                <td className="px-2 py-2">{status.Assigned || "-"}</td>
                <td className="px-2 py-2">{status.Delivery_Date ? new Date(status.Delivery_Date).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-center text-gray-500 mb-6 text-sm">No status data available</div>
    )}

    {/* Update Form */}
    <form onSubmit={handleSaveChanges} className="space-y-4">
      <div>
        <label className="block font-medium text-gray-700 mb-1">Update Job Status</label>
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
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
        <label className="block font-medium text-gray-700 mb-1">Assign User</label>
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
          value={values.Assigned}
          onChange={(e) => setValues({ ...values, Assigned: e.target.value })}
        >
          <option value="">Select User</option>
          {userOptions.map((option, i) => (
            <option key={i} value={option}>{option}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="advanceCheckbox"
          checked={isAdvanceChecked}
          onChange={handleAdvanceCheckboxChange}
          className="h-4 w-4 text-[#25d366] focus:ring-[#25d366] border-gray-300 rounded"
        />
        <label htmlFor="advanceCheckbox" className="text-gray-700">Update Date</label>
      </div>
      {isAdvanceChecked && (
        <div>
          <label className="block font-medium text-gray-700 mb-1">Delivery Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
            value={values.Delivery_Date}
            onChange={(e) => setValues({ ...values, Delivery_Date: e.target.value })}
          />
        </div>
      )}
      <div className="flex flex-col space-y-2">
        <button
          type="submit"
          className="bg-[#25d366] hover:bg-[#128c7e] text-white font-medium py-2 rounded-lg transition"
        >
          Update
        </button>
        <button
          type="button"
          className="bg-gray-400 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition"
          onClick={onClose}
        >
          Cancel
        </button>
        {/* Vendor group buttons */}
        {values.Status?.length > 0 && taskId.length > 0 &&
          values.Status.reduce((acc, status) => {
            const match = taskId.find(task => task.Task_group === status.Task && task.Id === 1);
            if (match && !acc.includes(match.Task_group)) acc.push(match.Task_group);
            return acc;
          }, []).map((group, i) => (
            <button
              key={i}
              type="button"
              className="bg-indigo-500 text-white font-medium py-2 rounded-lg transition"
              onClick={() => handleVendorClick(order)}
            >
              {group}
            </button>
          ))}
      </div>
    </form>

    {/* Modals */}
    {showVendorModal && (
      <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <Vendor order={selectedOrder} onClose={closeVendorModal} />
      </div>
    )}
    {showClickModal && (
      <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <VendorDetails order={selectedOrder} onClose={closeClickModal} />
      </div>
    )}
  </div>
</div>


  );
}
