import React from "react";

export default function SectionHeader({ title, action }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {action && <div className="text-xs text-indigo-600">{action}</div>}
    </div>
  );
}
