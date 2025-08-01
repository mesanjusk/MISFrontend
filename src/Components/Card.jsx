import PropTypes from 'prop-types';

export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-card p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};
