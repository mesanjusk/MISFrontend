import PropTypes from 'prop-types';

// Basic container card used across the app to provide consistent styling
export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow p-4 ${className}`}
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
