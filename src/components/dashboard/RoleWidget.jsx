import PropTypes from 'prop-types';
import { Avatar, Card, Stack, Typography } from '@mui/material';
import { ROLE_TYPES } from '../../constants/roles';

const roleCopy = {
  [ROLE_TYPES.ADMIN]: 'Full operational control including cancellations and workflow oversight.',
  [ROLE_TYPES.OFFICE]: 'Focus on your assigned orders and keep them moving today.',
  default: 'Stay on top of your tasks and keep work flowing.',
};

export default function RoleWidget({ role, userName }) {
  const subtitle = roleCopy[role] || roleCopy.default;

  return (
    <Card sx={{ p: 2.25 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar sx={{ bgcolor: 'primary.main' }}>{(userName || 'U').slice(0, 1)}</Avatar>
        <div>
          <Typography variant="caption" color="text.secondary">Current Role</Typography>
          <Typography variant="subtitle1">{role || 'User'}</Typography>
          <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
        </div>
      </Stack>
    </Card>
  );
}

RoleWidget.propTypes = {
  role: PropTypes.string,
  userName: PropTypes.string,
};
