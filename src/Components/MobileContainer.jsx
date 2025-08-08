import PropTypes from 'prop-types';

/**
 * Utility wrapper that constrains content width for mobile screens
 * while centering it on larger displays.
 */
export default function MobileContainer({ className = '', children, ...props }) {
  return (
    <div className={`w-full max-w-md mx-auto px-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

MobileContainer.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};
