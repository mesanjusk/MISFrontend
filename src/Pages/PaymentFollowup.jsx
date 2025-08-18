/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function PaymentFollowup() {
  const navigate = useNavigate();

  const [Customer, setCustomer] = useState("");
  const [Amount, setAmount] = useState("");
  const [Title, setTitle] = useState(""); // short reason/subject
  const [Remark, setRemark] = useState("");
  const [customerOptions, setCustomerOptions] = useState([]);

  const [isDeadlineChecked, setIsDeadlineChecked] = useState(false);
  const [Deadline, setDeadline] = useState("");

  useEffect(() => {
    // Expecting your existing endpoint that returns customer list.
    // Shape is flexible; we try common fields.
    axios
      .get("/customer/GetCustomerList")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data?.result)) {
          const opts = res.data.result
            .filter(Boolean)
            .map((it) => {
              // Try common naming variants your app might use
              return (
                it.Customer_name ||
                it.customer_name ||
                it.Name ||
                it.name ||
                it.title ||
                ""
              );
            })
            .filter(Boolean);
          setCustomerOptions([...new Set(opts)]);
        }
      })
      .catch((err) => {
        console.error("Error fetching customers:", err);
      });
  }, []);

  const closeModal = () => {
    navigate("/Home");
  };

  const handleDeadlineCheckboxChange = () => {
    setIsDeadlineChecked((p) => !p);
    setDeadline("");
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!Customer) {
      alert("Please select a customer.");
      return;
    }
    if (!Amount || Number(Amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const finalDate =
      isDeadlineChecked && Deadline
        ? Deadline
        : new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd

    try {
      const res = await axios.post("/paymentfollowup/add", {
        Customer,
        Amount: Number(Amount),
        Title: Title?.trim(),
        Followup_date: finalDate,
        Remark: Remark?.trim(),
      });

      if (res.data === "exist") {
        alert("A similar follow-up already exists for this customer and date.");
      } else if (res.data === "notexist") {
        alert("Payment follow-up added.");
        navigate("/Home");
      } else if (res.data?.success) {
        alert("Payment follow-up added.");
        navigate("/Home");
      } else {
        alert("Unexpected response from server.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while saving the follow-up.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6 relative">
        <button
          onClick={closeModal}
          className="absolute right-2 top-2 text-xl text-gray-400 hover:text-blue-500"
          type="button"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center text-[#075e54]">
          Add Payment Follow-up
        </h2>

        <form onSubmit={submit} className="space-y-4">
          {/* Customer */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Select Customer
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
              value={Customer}
              onChange={(e) => setCustomer(e.target.value)}
            >
              <option value="">-- Select Customer --</option>
              {customerOptions.map((c, idx) => (
                <option key={idx} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={Amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
            />
          </div>

          {/* Title/Reason */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Short Title / Reason
            </label>
            <input
              type="text"
              value={Title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Pending invoice for July"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
            />
          </div>

          {/* Deadline / Follow-up date */}
          <div className="flex items-center space-x-2">
            <input
              id="deadlineToggle"
              type="checkbox"
              checked={isDeadlineChecked}
              onChange={handleDeadlineCheckboxChange}
              className="h-4 w-4 text-[#25d366] focus:ring-[#25d366] border-gray-300 rounded"
            />
            <label htmlFor="deadlineToggle" className="text-gray-700">
              Set Follow-up Date
            </label>
          </div>

          {isDeadlineChecked && (
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Follow-up Date
              </label>
              <input
                type="date"
                value={Deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
              />
            </div>
          )}

          {/* Remark */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Remark
            </label>
            <input
              type="text"
              value={Remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Add remark"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2">
            <button
              type="submit"
              className="bg-[#25d366] hover:bg-[#128c7e] text-white font-medium py-2 rounded-lg transition"
            >
              Submit
            </button>
            <button
              type="button"
              className="bg-gray-400 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition"
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
