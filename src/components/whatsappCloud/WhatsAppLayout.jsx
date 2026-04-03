import { Box, Paper } from '@mui/material';
import PropTypes from 'prop-types';

export default function WhatsAppLayout({ sidebar, main, details }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
        borderRadius: 3,
        bgcolor: 'background.paper',
        height: 'calc(100vh - 13rem)',
        minHeight: 580,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: details ? '340px minmax(0, 1fr) 280px' : '340px minmax(0, 1fr)' },
          height: '100%',
        }}
      >
        <Box sx={{ borderRight: { lg: (theme) => `1px solid ${theme.palette.divider}` } }}>{sidebar}</Box>
        <Box sx={{ minHeight: 0, borderRight: { lg: details ? (theme) => `1px solid ${theme.palette.divider}` : 'none' } }}>{main}</Box>
        {details ? <Box sx={{ display: { xs: 'none', xl: 'block' }, minHeight: 0 }}>{details}</Box> : null}
      </Box>
    </Paper>
  );
}

WhatsAppLayout.propTypes = {
  sidebar: PropTypes.node.isRequired,
  main: PropTypes.node.isRequired,
  details: PropTypes.node,
};

WhatsAppLayout.defaultProps = {
  details: null,
};
