/* eslint-disable react/prop-types */
import { Box, Skeleton, Stack } from '@mui/material';

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
