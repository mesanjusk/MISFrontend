// src/components/PendingTasks.js

import React from 'react';
import { EmptyState, Loader } from '../Components';

export default function PendingTasks({ tasks = [], isLoading, onTaskClick }) {
  const pendingTasks = tasks.filter((task) => task.Status === 'Pending');

  return (
    <div className="px-4 py-2">
      {isLoading ? (
        <div className="py-6 flex justify-center">
          <Loader message="Loading pending tasks..." />
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
        <EmptyState message="No pending tasks available." className="py-6" />
      )}
    </div>
  );
}
