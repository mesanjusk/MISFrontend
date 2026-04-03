import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Avatar, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import PropTypes from 'prop-types';

const getInitials = (value) => {
  const source = String(value || '').trim();
  if (!source) return 'NA';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

export default function ChatHeader({ conversation, isLoading, onRefresh, windowOpen, onBack }) {
  const isWindowOpen = Boolean(windowOpen);

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        px: 2,
        py: 1.2,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 3,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0 }}>
        <IconButton onClick={onBack} sx={{ display: { lg: 'none' } }} size="small">
          <ArrowBackRoundedIcon fontSize="small" />
        </IconButton>
        <Avatar sx={{ bgcolor: '#16a34a', width: 38, height: 38, fontSize: 13 }}>
          {getInitials(conversation?.displayName || conversation?.contact)}
        </Avatar>
        <Stack sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap fontWeight={700}>{conversation?.displayName || 'Select a conversation'}</Typography>
          <Typography variant="caption" noWrap color="text.secondary">{conversation?.secondaryLabel || conversation?.contact || 'No contact selected'}</Typography>
          {conversation ? (
            <Chip
              size="small"
              label={isWindowOpen ? 'Active (24h open)' : 'Outside 24h window'}
              color={isWindowOpen ? 'success' : 'error'}
              sx={{ mt: 0.4, maxWidth: 'fit-content', height: 20 }}
            />
          ) : null}
        </Stack>
      </Stack>

      <Tooltip title="Refresh messages">
        <span>
          <IconButton size="small" onClick={onRefresh} disabled={isLoading}>
            <RefreshRoundedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

ChatHeader.propTypes = {
  conversation: PropTypes.shape({
    displayName: PropTypes.string,
    contact: PropTypes.string,
    secondaryLabel: PropTypes.string,
  }),
  isLoading: PropTypes.bool,
  onRefresh: PropTypes.func,
  windowOpen: PropTypes.bool,
  onBack: PropTypes.func,
};

ChatHeader.defaultProps = {
  conversation: null,
  isLoading: false,
  onRefresh: undefined,
  windowOpen: false,
  onBack: undefined,
};
