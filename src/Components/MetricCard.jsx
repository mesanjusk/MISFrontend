import React from 'react';
import PropTypes from 'prop-types';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

const classNames = (...classes) => classes.filter(Boolean).join(' ');

export default function MetricCard({ label, value, icon: Icon, data, onClick }) {
  const Component = onClick ? 'button' : 'article';
  const displayValue =
    value === null || value === undefined || value === '' ? '—' : value;

  return (
    <Component
      aria-label={label}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={classNames(
        'group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-left text-slate-100 shadow-ambient transition-all duration-200',
        onClick &&
          'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-primary/70 hover:-translate-y-1 hover:shadow-2xl',
        !onClick && 'hover:-translate-y-0.5 hover:shadow-2xl'
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70 transition-all duration-200 group-hover:opacity-100"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/15" />
        <div className="absolute -top-24 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 left-0 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-300/90">
            {label}
          </span>
          <span className="text-3xl font-semibold tracking-tight text-white">{displayValue}</span>
        </div>

        {Icon && (
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-primary transition-all duration-200 group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-white">
            <Icon size={22} aria-hidden="true" />
          </span>
        )}
      </div>

      {data && data.length > 0 && (
        <div className="relative mt-6 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Component>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  icon: PropTypes.elementType,
  data: PropTypes.arrayOf(PropTypes.object),
  onClick: PropTypes.func,
};
