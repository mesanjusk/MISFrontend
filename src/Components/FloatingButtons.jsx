import PropTypes from 'prop-types';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';

export default function FloatingButtons({ buttonsList = [] }) {
  return (
    <SpeedDial
      ariaLabel="quick actions"
      icon={<SpeedDialIcon openIcon={<AddCircleOutlineRoundedIcon />} />}
      sx={{ position: 'fixed', bottom: { xs: 78, md: 28 }, right: 24, zIndex: 1150 }}
      FabProps={{ color: 'primary' }}
    >
      {buttonsList.map((button) => (
        <SpeedDialAction
          key={button.label}
          icon={<AddCircleOutlineRoundedIcon fontSize="small" />}
          tooltipTitle={button.label}
          onClick={button.onClick}
        />
      ))}
    </SpeedDial>
  );
}

FloatingButtons.propTypes = {
  buttonsList: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
    }),
  ),
};
