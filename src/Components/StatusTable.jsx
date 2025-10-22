import React from "react";

export default function StatusTable({ status }) {
  if (!status || status.length === 0) {
    return (
      <div className="mb-6 rounded-3xl border border-dashed border-white/10 bg-slate-900/60 px-6 py-8 text-center text-sm text-slate-400">
        No status data available
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-ambient">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-primary/15 via-transparent to-secondary/15 text-xs uppercase tracking-[0.22em] text-slate-200/90">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Task</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Delivery</th>
            </tr>
          </thead>
          <tbody>
            {status.map((s, idx) => (
              <tr
                key={idx}
                className="border-t border-white/5 transition hover:bg-white/5"
              >
                <td className="px-4 py-3 text-slate-200">{idx + 1}</td>
                <td className="px-4 py-3 text-slate-200">
                  {s.CreatedAt
                    ? new Date(s.CreatedAt).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-3 text-slate-200">{s.Task || "-"}</td>
                <td className="px-4 py-3 text-slate-200">{s.Assigned || "-"}</td>
                <td className="px-4 py-3 text-slate-200">
                  {s.Delivery_Date
                    ? new Date(s.Delivery_Date).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
