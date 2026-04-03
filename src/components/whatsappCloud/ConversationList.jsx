import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import PropTypes from 'prop-types';
import {
  Avatar,
  Badge,
  Box,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

const getInitials = (value) => {
  const source = String(value || '').trim();
  if (!source) return 'NA';

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
};

const formatConversationTime = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  const isToday = new Date().toDateString() === date.toDateString();
  if (isToday) {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

const mediaTypeIcon = (type) => {
  const safe = String(type || '').toLowerCase();
  if (safe === 'image') return '🖼️';
  if (safe === 'video') return '🎬';
  if (safe === 'audio') return '🎵';
  if (safe === 'document') return '📄';
  if (safe === 'sticker') return '😊';
  return '';
};

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  search,
  onSearch,
  onRefresh,
}) {
  return (
    <Stack sx={{ height: '100%', minHeight: 0, bgcolor: 'background.paper' }}>
      <Stack spacing={1.5} sx={{ p: 2, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontSize={18} fontWeight={700}>Chats</Typography>
          <Tooltip title="Refresh conversations">
            <span>
              <IconButton size="small" onClick={onRefresh}><SyncRoundedIcon fontSize="small" /></IconButton>
            </span>
          </Tooltip>
        </Stack>
        <TextField
          value={search}
          size="small"
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search name or number"
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
          }}
        />
      </Stack>

      <Box sx={{ minHeight: 0, flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <Typography sx={{ px: 3, py: 8 }} align="center" color="text.secondary" variant="body2">
            No conversations found.
          </Typography>
        ) : (
          <List disablePadding>
            {conversations.map((conversation) => {
              const isActive = activeConversationId === conversation.id;
              const hasUnread = conversation.unreadCount > 0;

              return (
                <ListItemButton
                  key={conversation.id}
                  selected={isActive}
                  onClick={() => onSelectConversation(conversation.id)}
                  sx={{ py: 1.25, px: 2, alignItems: 'flex-start' }}
                >
                  <Badge
                    color="success"
                    badgeContent={hasUnread ? conversation.unreadCount : 0}
                    overlap="circular"
                  >
                    <Avatar sx={{ bgcolor: '#16a34a', width: 42, height: 42, fontSize: 14 }}>
                      {getInitials(conversation.displayName || conversation.contact)}
                    </Avatar>
                  </Badge>

                  <ListItemText
                    sx={{ ml: 1.5, my: 0 }}
                    primary={
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Typography noWrap variant="subtitle2" fontWeight={700}>{conversation.displayName}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatConversationTime(conversation.lastTimestamp)}</Typography>
                      </Stack>
                    }
                    secondary={
                      <Typography noWrap variant="body2" color={hasUnread ? 'text.primary' : 'text.secondary'} fontWeight={hasUnread ? 600 : 400}>
                        {mediaTypeIcon(conversation.lastMessageType)} {conversation.lastMessage || 'No message'}
                      </Typography>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
    </Stack>
  );
}

ConversationList.propTypes = {
  conversations: PropTypes.arrayOf(PropTypes.object),
  activeConversationId: PropTypes.string,
  onSelectConversation: PropTypes.func.isRequired,
  search: PropTypes.string,
  onSearch: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
};

ConversationList.defaultProps = {
  conversations: [],
  activeConversationId: '',
  search: '',
  onRefresh: undefined,
};
