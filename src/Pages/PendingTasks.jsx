// src/components/PendingTasks.js

import React from 'react';

export default function PendingTasks({ tasks = [], isLoading, onTaskClick }) {
  const pendingTasks = tasks.filter(task => task.Status === "Pending");

  return (
    <div className="bg-[#e5ddd5] px-4 py-2">
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className=" h-28 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : pendingTasks.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
          {pendingTasks.map((task) => (
            <div
              key={task._id || task.Usertask_Number} // Use unique identifier if available
              onClick={() => onTaskClick(task)}
              className="cursor-pointer bg-white border border-gray-200 rounded-xl shadow hover:shadow-md transition-all p-2"
            >
              
              <div className="text-black font-semibold text-m">{task.Usertask_name}</div>
              <div className="text-xs text-gray-500 mt-1">
                
              </div>
              
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">No pending tasks available.</div>
      )}
    </div>
  );
}
