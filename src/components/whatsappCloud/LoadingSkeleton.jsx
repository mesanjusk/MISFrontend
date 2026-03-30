export default function LoadingSkeleton({ lines = 6 }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-lg bg-gray-200" />
      ))}
    </div>
  );
}
