import PropTypes from 'prop-types';
import MuiCard from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function Card({ className = '', children, ...props }) {
  return (
    <MuiCard className={className} {...props}>
      <CardContent>{children}</CardContent>
    </MuiCard>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};
