import PropTypes from 'prop-types';

const variantClasses = {
  primary:
    'bg-primary text-white hover:bg-secondary focus:ring-primary',
  secondary:
    'bg-secondary text-white hover:bg-primary focus:ring-secondary',
  danger:
    'bg-accent text-white hover:bg-red-600 focus:ring-accent',
};

const sizeClasses = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const classes = `${variantClasses[variant]} ${sizeClasses[size]} inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`;
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  children: PropTypes.node,
};
