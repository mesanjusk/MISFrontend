import PropTypes from 'prop-types';

export default function Table({ columns = [], data = [] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-ambient">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.accessor} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-200/90">
                  {col.Header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-sm text-slate-400">
                  No records available
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-t border-white/5 transition hover:bg-white/5"
                >
                  {columns.map((col) => (
                    <td key={col.accessor} className="px-4 py-3 text-sm text-slate-200">
                      {row[col.accessor] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      Header: PropTypes.node.isRequired,
      accessor: PropTypes.string.isRequired,
    })
  ),
  data: PropTypes.arrayOf(PropTypes.object),
};
