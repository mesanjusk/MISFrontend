import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useAuth } from '../context/AuthContext';

export default function TopNavbar({ onToggleSidebar, onToggleDesktopCollapse, desktopCollapsed }) {
  const navigate = useNavigate();
  const { userName, userGroup, clearAuth } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState(null);

  const tabs = useMemo(
    () => [
      { label: 'Report', path: '/allOrder' },
      { label: 'Delivered', path: '/allDelivery' },
      { label: 'Vendor', path: '/AllVendors' },
      { label: 'Bills', path: '/allBills' },
    ],
    [],
  );

  useEffect(() => {
    if (!userName) navigate('/login');
  }, [navigate, userName]);

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  return (
    <AppBar
      position="sticky"
      color="inherit"
      sx={{
        backgroundColor: 'rgba(255,255,255,0.95)',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 58, md: 62 }, px: { xs: 1, md: 2 }, gap: 1 }}>
        <IconButton onClick={onToggleSidebar} sx={{ display: { md: 'none' } }}>
          <MenuRoundedIcon />
        </IconButton>
        <IconButton onClick={onToggleDesktopCollapse} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
          {desktopCollapsed ? <MenuRoundedIcon /> : <MenuOpenRoundedIcon />}
        </IconButton>

        <Stack sx={{ minWidth: 0, pr: 1 }}>
          <Typography variant="subtitle1" noWrap>
            CRM Operations Hub
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            Orders, follow-ups, WhatsApp, finance and team workflow
          </Typography>
        </Stack>

        <TextField
          size="small"
          placeholder="Search records, customer, order..."
          sx={{ display: { xs: 'none', lg: 'flex' }, minWidth: 280, maxWidth: 360, ml: 'auto' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={0.75} sx={{ display: { xs: 'none', xl: 'flex' } }}>
          {tabs.map((tab) => (
            <Chip
              key={tab.path}
              clickable
              label={
                <NavLink style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }} to={tab.path}>
                  {tab.label}
                </NavLink>
              }
              variant="outlined"
            />
          ))}
        </Stack>

        <IconButton>
          <NotificationsNoneRoundedIcon />
        </IconButton>

        <IconButton onClick={(event) => setMenuAnchor(event.currentTarget)}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            {userName ? userName.slice(0, 2).toUpperCase() : 'NA'}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2">{userName || 'Guest'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {userGroup || 'Unknown role'}
            </Typography>
          </Box>
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              handleLogout();
            }}
          >
            <LogoutRoundedIcon fontSize="small" sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

TopNavbar.propTypes = {
  onToggleSidebar: PropTypes.func.isRequired,
  onToggleDesktopCollapse: PropTypes.func.isRequired,
  desktopCollapsed: PropTypes.bool.isRequired,
};
