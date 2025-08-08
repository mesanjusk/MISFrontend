import PropTypes from 'prop-types';
import { FiLoader } from 'react-icons/fi';

// Simple spinner based on Feather's loader icon
export default function LoadingSpinner({ size = 24, className = 'text-primary' }) {
  return (
    <FiLoader
      className={`animate-spin ${className}`}
      size={size}
      aria-label="Loading"
    />
  );
}

LoadingSpinner.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string,
};
