export default function EmptyState({ title = 'No data', description = '' }) {
  return (
    <div className="flex h-full min-h-[220px] items-center justify-center p-6 text-center">
      <div>
        <p className="text-base font-semibold text-gray-700">{title}</p>
        {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
      </div>
    </div>
  );
}
