import PropTypes from 'prop-types';

export default function LoadingSpinner({ size = 24, className = '' }) {
  return (
    <div
      className={`animate-spin rounded-full border-4 border-current border-t-transparent text-blue-500 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

LoadingSpinner.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string,
};
