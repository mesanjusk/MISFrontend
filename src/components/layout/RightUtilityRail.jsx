import PropTypes from 'prop-types';
import { IconButton, Paper, Stack, Tooltip } from '@mui/material';

export default function RightUtilityRail({ actions }) {
  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        right: 10,
        top: 78,
        zIndex: 1100,
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        px: 0.4,
        py: 0.5,
        display: { xs: 'none', lg: 'block' },
      }}
    >
      <Stack spacing={0.4}>
        {actions.map((action) => (
          <Tooltip key={action.label} title={action.label} placement="left">
            <IconButton
              size="small"
              aria-label={action.label}
              onClick={action.onClick}
              sx={{ width: 34, height: 34, borderRadius: 2 }}
            >
              {action.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Stack>
    </Paper>
  );
}

RightUtilityRail.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      icon: PropTypes.node.isRequired,
    }),
  ).isRequired,
};
