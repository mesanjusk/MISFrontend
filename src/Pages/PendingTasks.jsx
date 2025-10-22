// src/components/PendingTasks.js

import React from 'react';

const shimmerItems = Array.from({ length: 6 });

const formatDate = (value) => {
  if (!value) return 'No due date';
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
    }).format(d);
  } catch (e) {
    return value;
  }
};

export default function PendingTasks({ tasks = [], isLoading, onTaskClick }) {
  const pendingTasks = tasks.filter((task) => task.Status === 'Pending');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-heading__eyebrow">Work queue</p>
          <h3 className="text-xl font-semibold text-white">Pending tasks</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            Tap a card to open the task detail drawer and update the assignment status.
          </p>
        </div>
        <span className="chip bg-white/10 text-slate-100/90">
          {pendingTasks.length} open
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {shimmerItems.map((_, index) => (
            <div
              key={index}
              className="h-28 rounded-2xl border border-white/5 bg-white/5 shadow-inner shadow-black/20"
            >
              <div className="h-full w-full animate-pulse rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
            </div>
          ))}
        </div>
      ) : pendingTasks.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {pendingTasks.map((task) => {
            const assignedTo = task.User || task.Assigned_to || 'Unassigned';
            const dueDate = formatDate(task.Due_Date || task.Due_date || task.Date);

            return (
              <button
                type="button"
                key={task._id || task.Usertask_Number || task.id}
                onClick={() => onTaskClick?.(task)}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-primary/15 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/10" />
                </div>

                <div className="relative flex h-full flex-col justify-between">
                  <div>
                    <p className="line-clamp-2 text-sm font-semibold text-white">
                      {task.Usertask_name || 'Untitled task'}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Assigned to <span className="text-slate-200">{assignedTo}</span>
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-slate-100/90">
                      Pending
                    </span>
                    <span className="font-medium text-slate-200/90">{dueDate}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/60 px-6 py-12 text-center text-sm text-slate-400">
          No pending tasks available.
        </div>
      )}
    </div>
  );
}
