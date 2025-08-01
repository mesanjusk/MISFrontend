/* eslint-disable react/prop-types */

export default function InputField({
  label,
  type = 'text',
  className = '',
  ...props
}) {
  return (
    <div className="mb-4 w-full">
      {label && (
        <label className="block text-sm font-medium text-text mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`w-full border border-gray-300 rounded-md p-2 shadow-sm hover:border-secondary focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
        {...props}
      />
    </div>
  );
}
