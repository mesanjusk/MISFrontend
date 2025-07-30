import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Vendor from "../Pages/vendor";
import VendorDetails from "../Pages/vendorDetails";
import EditOrder from "../Components/editOrder";
import Print from "../Components/print";
import WhatsApp from "../Components/whatsApp";
import Note from "../Components/note";
import EditCustomer from "../Components/editCustomer";
import OrderHeader from "../Components/OrderHeader";
import OrderActionButtons from "../Components/OrderActionButtons";
import StatusTable from "../Components/StatusTable";

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
    id: order?._id || "",
    Customer_name: order?.Customer_name || "",
    Order_uuid: order?.Order_uuid || "",
    Order_Number: order?.Order_Number || "",
    Customer_uuid: order?.Customer_uuid || "",
    Remark: order?.Remark || "",
    Delivery_Date: order?.highestStatusTask?.Delivery_Date || "",
    Assigned: order?.highestStatusTask?.Assigned || "",
    Task: order?.highestStatusTask?.Task || "",
    CreatedAt:
      order?.highestStatusTask?.CreatedAt ||
      new Date().toISOString().split("T")[0],
    Status: order?.Status || [],
  });

  // Fetch dropdown options and related data
  useEffect(() => {
    axios
      .get("/taskgroup/GetTaskgroupList")
      .then((res) => {
        if (res.data.success) {
          const filteredData = res.data.result.filter((item) => item.Id === 1);
          const options = res.data.result.map((item) => item.Task_group);
          setTaskOptions(
            options.length ? options : ["Packing", "Delivery", "Billing"],
          ); // fallback for demo
          setTaskId(filteredData);
        }
      })
      .catch(() => setTaskOptions(["Packing", "Delivery", "Billing"])); // fallback for demo
  }, []);

  useEffect(() => {
    axios
      .get("/user/GetUserList")
      .then((res) => {
        if (res.data.success) {
          const options = res.data.result.map((item) => item.User_name);
          setUserOptions(options.length ? options : ["Ravi", "Amit", "Priya"]); // fallback for demo
        }
      })
      .catch(() => setUserOptions(["Ravi", "Amit", "Priya"])); // fallback for demo
  }, []);

  useEffect(() => {
    axios
      .get("/order/GetOrderList")
      .then((res) => {
        if (res.data.success) setOrders(res.data.result);
        else setOrders([]);
      })
      .catch(() => setOrders([]));
  }, []);

  useEffect(() => {
    axios
      .get("/customer/GetCustomersList")
      .then((res) => {
        if (res.data.success) {
          const customerMap = res.data.result.reduce((acc, customer) => {
            if (
              customer.Customer_uuid &&
              customer.Customer_name &&
              customer.Mobile_number
            ) {
              acc[customer.Customer_uuid] = {
                Customer_name: customer.Customer_name,
                Mobile_number: customer.Mobile_number,
              };
            }
            return acc;
          }, {});
          setCustomers(customerMap);
        } else setCustomers({});
      })
      .catch(() => setCustomers({}));
  }, []);

  useEffect(() => {
    if (values.Order_uuid) {
      axios
        .get(`/note/${values.Order_uuid}`)
        .then((res) => {
          if (res.data.success) setNotes(res.data.result);
          else setNotes([]);
        })
        .catch(() => setNotes([]));
    } else {
      setNotes([]);
    }
  }, [values.Order_uuid]);

  useEffect(() => {
    axios
      .get("/user/GetUserList")
      .then((res) => {
        if (res.data.success) {
          const groupMap = {};
          res.data.result.forEach((u) => {
            u.Allowed_Task_Groups?.forEach((group) => {
              if (!groupMap[group]) groupMap[group] = [];
              groupMap[group].push(u.User_name);
            });
          });
          setUserOptions(groupMap);
        }
      })
      .catch(() => setUserOptions({}));
  }, []);

  const handleSaveChanges = (e) => {
    e.preventDefault();
    if (!values.Task || !values.Assigned) {
      alert("Task & Assigned are required.");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const updatedValues = {
      ...values,
      CreatedAt: new Date().toISOString(),
      Delivery_Date: values.Delivery_Date || today,
    };
    axios
      .post("/order/addStatus", {
        orderId: values.id,
        newStatus: {
          Task: updatedValues.Task,
          Assigned: updatedValues.Assigned,
          Delivery_Date: updatedValues.Delivery_Date,
          CreatedAt: updatedValues.CreatedAt,
        },
      })
      .then((res) => {
        if (res.data.success) {
          alert("Order updated successfully!");
          onClose();
          navigate("/home");
        }
      })
      .catch((err) => {
        alert("Error updating order");
        console.log("Error updating order:", err);
      });
  };

  const handleVendorClick = (order) => {
    setSelectedOrder(order);
    setShowVendorModal(true);
  };

  const handleAdvanceCheckboxChange = () => {
    setIsAdvanceChecked((prev) => {
      const newCheckedState = !prev;
      setValues((values) => ({
        ...values,
        Delivery_Date: newCheckedState
          ? ""
          : new Date().toISOString().split("T")[0],
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
        <OrderHeader values={values} notes={notes} />

        {/* Action Buttons Row */}
        <OrderActionButtons order={order} />

        {/* Status Table */}
        <StatusTable status={values.Status} />

        {/* Update Form */}
        <form onSubmit={handleSaveChanges} className="space-y-4">
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Update Job Status
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
              value={values.Task}
              onChange={(e) => setValues({ ...values, Task: e.target.value })}
            >
              <option value="">Select Task</option>
              {taskOptions.map((option, i) => (
                <option key={i} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Assign User
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
              value={values.Assigned}
              onChange={(e) =>
                setValues({ ...values, Assigned: e.target.value })
              }
            >
              <option value="">Select User</option>
              {(userOptions[values.Task] || []).map((user, i) => (
                <option key={i} value={user}>
                  {user}
                </option>
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
            <label htmlFor="advanceCheckbox" className="text-gray-700">
              Update Date
            </label>
          </div>
          {isAdvanceChecked && (
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Delivery Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                value={values.Delivery_Date}
                onChange={(e) =>
                  setValues({ ...values, Delivery_Date: e.target.value })
                }
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
            {values.Status?.length > 0 &&
              taskId.length > 0 &&
              values.Status.reduce((acc, status) => {
                const match = taskId.find(
                  (task) => task.Task_group === status.Task && task.Id === 1,
                );
                if (match && !acc.includes(match.Task_group))
                  acc.push(match.Task_group);
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
