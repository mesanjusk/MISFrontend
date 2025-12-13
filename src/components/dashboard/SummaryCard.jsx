import React from "react";

const variantStyles = {
  primary: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  danger: "bg-rose-50 text-rose-700 ring-rose-100",
};

export default function SummaryCard({ title, value, icon: Icon, variant = "primary" }) {
  const badgeClass = variantStyles[variant] || variantStyles.primary;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        {Icon && (
          <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-xl ring-4 ${badgeClass}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
}
