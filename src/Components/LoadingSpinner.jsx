import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';

export default function LoadingSpinner({ size = 24, className = '' }) {
  return <CircularProgress size={size} className={className} />;
}

LoadingSpinner.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string,
};
