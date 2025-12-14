import PropTypes from 'prop-types';

export default function EmptyState({ message, className = '', children }) {
  return (
    <div className={`text-center text-gray-500 py-4 ${className}`}>
      <p>{message}</p>
      {children}
    </div>
  );
}

EmptyState.propTypes = {
  message: PropTypes.node.isRequired,
  className: PropTypes.string,
  children: PropTypes.node,
};
