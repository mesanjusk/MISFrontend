import PropTypes from 'prop-types';

export default function InputField({
  label,
  type = 'text',
  className = '',
  icon: Icon,
  ...props
}) {
  return (
    <div className="mb-4 w-full">
      {label && (
        <label className="block text-sm font-medium text-text mb-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <Icon className="absolute left-3 text-gray-400" aria-hidden="true" />
        )}
        <input
          type={type}
          className={`w-full border border-gray-300 rounded-md p-2 ${Icon ? 'pl-10' : 'pl-3'} shadow-sm hover:border-secondary focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}

InputField.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  className: PropTypes.string,
  icon: PropTypes.elementType,
};
