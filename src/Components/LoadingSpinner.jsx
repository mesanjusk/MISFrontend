export default function LoadingSpinner({ size = 'h-10 w-10', className = '' }) {
  return (
    <div className={`animate-spin rounded-full border-4 border-blue-500 border-t-transparent ${size} ${className}`}></div>
  );
}
