import React from "react";
import { Link } from "react-router-dom";

const actions = [
  { title: "Add Order", path: "/addOrder", description: "Capture a new customer order." },
  { title: "Order Board", path: "/allOrder", description: "Open the full workflow board." },
  { title: "Customers", path: "/addCustomer", description: "Create or update customer records." },
  { title: "Team Tasks", path: "/PendingTasks", description: "Review pending team tasks." },
];

export default function QuickActions() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Admin Controls</p>
          <p className="text-base font-semibold text-slate-900">Quick Actions</p>
        </div>
        <span className="text-[11px] font-semibold text-slate-500">Operational</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2">
        {actions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:border-indigo-300 hover:bg-indigo-50"
          >
            <div>
              <p className="font-semibold text-slate-900">{action.title}</p>
              <p className="text-xs text-slate-600">{action.description}</p>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700">Open</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
