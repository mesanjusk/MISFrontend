import { Box, Skeleton, Stack } from '@mui/material';
import PropTypes from 'prop-types';

export default function LoadingSkeleton({ lines = 6 }) {
  return (
    <Stack spacing={1.5} sx={{ p: 2 }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={52} />
      ))}
      <Box sx={{ height: 8 }} />
    </Stack>
  );
}

LoadingSkeleton.propTypes = {
  lines: PropTypes.number,
};

LoadingSkeleton.defaultProps = {
  lines: 6,
};
