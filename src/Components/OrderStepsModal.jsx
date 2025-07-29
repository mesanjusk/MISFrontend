import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

export default function OrderStepsModal({ order, onClose }) {
  const [steps, setSteps] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [taskRes, userRes, customerRes] = await Promise.all([
          axios.get("/taskgroup/GetTaskgroupList"),
          axios.get("/user/GetUserList"),
          axios.get("/customer/GetCustomersList"),
        ]);

        if (taskRes.data.success) {
          const filtered = taskRes.data.result.filter((t) => t.Id === 1);
          const list = filtered.map((item) => ({
            name: item.Task_group,
            assignedTo: "",
            completed: false,
            charge: "",
            paymentStatus: "Balance",
            paymentMode: "",
          }));
          setSteps(list);
        } else {
          setSteps([]);
        }

        if (userRes.data.success) {
          const users = userRes.data.result
            .filter((u) => u.User_group !== "Office User")
            .map((u) => u.User_name);
          setUserOptions(users);
        } else {
          setUserOptions([]);
        }

        if (customerRes.data.success) {
          const modes = customerRes.data.result
            .filter((c) => c.Customer_group === "Bank and Account")
            .map((c) => c.Customer_name);
          setPaymentOptions(modes);
        } else {
          setPaymentOptions([]);
        }
      } catch (err) {
        console.error("Failed to load step data:", err);
        setSteps([]);
        setUserOptions([]);
        setPaymentOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (index, field, value) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  return (
    <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Order #{order?.Order_Number} Steps
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500"
          >
            X
          </button>
        </div>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={idx} className="border rounded p-3 space-y-2">
              <div className="font-medium">
                {idx + 1}. {step.name}
              </div>
              <select
                className="w-full p-2 border rounded"
                value={step.assignedTo}
                onChange={(e) =>
                  handleChange(idx, "assignedTo", e.target.value)
                }
              >
                <option value="">Assign User</option>
                {userOptions.map((user, i) => (
                  <option key={i} value={user}>
                    {user}
                  </option>
                ))}
              </select>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={step.completed}
                    onChange={(e) =>
                      handleChange(idx, "completed", e.target.checked)
                    }
                  />
                  <span>Completed</span>
                </label>
                <input
                  type="number"
                  className="w-24 p-1 border rounded"
                  placeholder="Charge"
                  value={step.charge}
                  onChange={(e) => handleChange(idx, "charge", e.target.value)}
                />
                <select
                  className="p-1 border rounded"
                  value={step.paymentStatus}
                  onChange={(e) =>
                    handleChange(idx, "paymentStatus", e.target.value)
                  }
                >
                  <option value="Paid">Paid</option>
                  <option value="Balance">Balance</option>
                </select>
                {step.paymentStatus === "Paid" && (
                  <select
                    className="p-1 border rounded"
                    value={step.paymentMode}
                    onChange={(e) =>
                      handleChange(idx, "paymentMode", e.target.value)
                    }
                  >
                    <option value="">Payment Mode</option>
                    {paymentOptions.map((mode, i) => (
                      <option key={i} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
        <button
          onClick={onClose}
          className="mt-4 bg-green-500 text-white w-full py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}

OrderStepsModal.propTypes = {
  order: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
