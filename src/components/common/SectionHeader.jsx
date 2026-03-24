import PropTypes from "prop-types";

export default function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="text-xs text-indigo-600">{action}</div> : null}
    </div>
  );
}

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  action: PropTypes.node,
};
