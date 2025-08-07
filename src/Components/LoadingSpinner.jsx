import PropTypes from 'prop-types';

export default function LoadingSpinner({ size = 24, className = 'text-primary' }) {
  return (
    <div
      className={`animate-spin rounded-full border-4 border-current border-t-transparent ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

LoadingSpinner.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string,
};
