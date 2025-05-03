// src/components/PendingTasks.js

import React from 'react';

export default function PendingTasks({ tasks = [], isLoading, onTaskClick }) {
  const pendingTasks = tasks.filter(task => task.Status === "Pending");

  return (
    <div className="px-4 py-2">
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 h-28 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pendingTasks.map((task, index) => (
            <div
              key={index}
              onClick={() => onTaskClick(task)}
              className="cursor-pointer bg-white border border-gray-200 rounded-xl shadow hover:shadow-md transition-all p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="bg-gray-100 text-gray-600 text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full">
                  {task.Usertask_Number}
                </div>
                <div
                  className={`text-xs font-medium px-2 py-0.5 rounded-full
                    ${task.Status === 'Completed'
                      ? 'bg-green-100 text-green-700'
                      : task.Status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'}
                  `}
                >
                  {task.Status}
                </div>
              </div>
              <div className="text-black font-semibold text-sm">{task.Usertask_name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(task.Date).toLocaleDateString()} – {task.Remark}
              </div>
              <div className="text-xs text-right text-gray-400 mt-2">
                Deadline: {new Date(task.Deadline).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
