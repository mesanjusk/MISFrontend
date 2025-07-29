import React, { useState } from 'react';

export default function OrderStepsModal({ order, onClose }) {
  const initialSteps = [
    { name: 'Designing', assignedTo: '', completed: false, charge: '', paymentStatus: 'Balance', paymentMode: 'Cash' },
    { name: 'Printing', assignedTo: '', completed: false, charge: '', paymentStatus: 'Balance', paymentMode: 'Cash' },
    { name: 'Delivery/Installation', assignedTo: '', completed: false, charge: '', paymentStatus: 'Balance', paymentMode: 'Cash' }
  ];

  const [steps, setSteps] = useState(initialSteps);

  const handleChange = (index, field, value) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  return (
    <div className="modal-overlay fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Order #{order?.Order_Number} Steps</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">X</button>
        </div>
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={idx} className="border rounded p-3 space-y-2">
              <div className="font-medium">{idx + 1}. {step.name}</div>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="Assigned User"
                value={step.assignedTo}
                onChange={(e) => handleChange(idx, 'assignedTo', e.target.value)}
              />
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={step.completed}
                    onChange={(e) => handleChange(idx, 'completed', e.target.checked)}
                  />
                  <span>Completed</span>
                </label>
                <input
                  type="number"
                  className="w-24 p-1 border rounded"
                  placeholder="Charge"
                  value={step.charge}
                  onChange={(e) => handleChange(idx, 'charge', e.target.value)}
                />
                <select
                  className="p-1 border rounded"
                  value={step.paymentStatus}
                  onChange={(e) => handleChange(idx, 'paymentStatus', e.target.value)}
                >
                  <option value="Paid">Paid</option>
                  <option value="Balance">Balance</option>
                </select>
                {step.paymentStatus === 'Paid' && (
                  <select
                    className="p-1 border rounded"
                    value={step.paymentMode}
                    onChange={(e) => handleChange(idx, 'paymentMode', e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 bg-green-500 text-white w-full py-2 rounded">Close</button>
      </div>
    </div>
  );
}
