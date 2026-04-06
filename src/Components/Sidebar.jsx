import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import ShoppingBagRoundedIcon from '@mui/icons-material/ShoppingBagRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';

const DRAWER_WIDTH = 258;
const DRAWER_COLLAPSED = 72;

export default function Sidebar({ desktopCollapsed, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { clearAuth } = useAuth();

  const menuItems = useMemo(
    () => [
      { label: 'Home', path: ROUTES.HOME, icon: <HomeRoundedIcon fontSize="small" /> },
      { label: 'Attendance', path: ROUTES.ATTENDANCE, icon: <EventAvailableRoundedIcon fontSize="small" /> },
      { label: 'Tasks', path: ROUTES.PENDING_TASKS, icon: <TaskAltRoundedIcon fontSize="small" /> },
      { label: 'Enquiry', path: ROUTES.ENQUIRIES_NEW, icon: <SupportAgentRoundedIcon fontSize="small" /> },
      { label: 'Orders', path: ROUTES.ORDERS_NEW, icon: <ShoppingBagRoundedIcon fontSize="small" /> },
      { label: 'Delivery', path: '/allDelivery', icon: <LocalShippingRoundedIcon fontSize="small" /> },
      { label: 'Receipt', path: ROUTES.RECEIPT, icon: <ReceiptLongRoundedIcon fontSize="small" /> },
      { label: 'Payment', path: ROUTES.PAYMENT, icon: <PaymentsRoundedIcon fontSize="small" /> },
      { label: 'Add Recievable', path: ROUTES.ADD_RECEIVABLE, icon: <AccountBalanceWalletRoundedIcon fontSize="small" /> },
      { label: 'Add Payable', path: ROUTES.ADD_PAYABLE, icon: <PaymentsRoundedIcon fontSize="small" /> },
      { label: 'Followups', path: ROUTES.FOLLOWUPS, icon: <ReceiptLongRoundedIcon fontSize="small" /> },
      { label: 'Vendors', path: ROUTES.VENDORS, icon: <StorefrontRoundedIcon fontSize="small" /> },
      { label: 'WhatsApp', path: ROUTES.WHATSAPP, icon: <ChatRoundedIcon fontSize="small" /> },
      { label: 'Reports', path: ROUTES.REPORTS_ORDERS, icon: <AnalyticsRoundedIcon fontSize="small" /> },
      { label: 'Settings', path: ROUTES.ADD_CUSTOMER, icon: <SettingsRoundedIcon fontSize="small" /> },
    ],
    [],
  );

  const handleNavigate = (path) => {
    navigate(path);
    onCloseMobile();
  };

  const handleLogout = () => {
    clearAuth();
    onCloseMobile();
    navigate('/');
  };

  const drawerContent = (
    <Stack sx={{ height: '100%', bgcolor: '#0f172a', color: '#e2e8f0' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 1.1 }}>
        <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
          <Avatar sx={{ bgcolor: '#38bdf8', color: '#0f172a', width: 34, height: 34, fontWeight: 800 }}>M</Avatar>
          {!desktopCollapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap color="#f8fafc">MIS Pro</Typography>
              <Typography variant="caption" color="rgba(226,232,240,0.72)" noWrap>Print business command center</Typography>
            </Box>
          )}
        </Stack>
      </Stack>
      <Divider sx={{ borderColor: 'rgba(148,163,184,0.18)' }} />

      <List sx={{ py: 0.75, px: 0.75, overflowY: 'auto', flexGrow: 1 }}>
        {menuItems.map((item) => {
          const selected = pathname === item.path || pathname.startsWith(`${item.path}/`);
          return (
            <Tooltip key={item.path} title={desktopCollapsed ? item.label : ''} placement="right">
              <ListItemButton
                selected={selected}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  minHeight: 36,
                  mb: 0.45,
                  borderRadius: 2,
                  '&.Mui-selected': { bgcolor: 'rgba(56,189,248,0.18)', color: '#f8fafc' },
                  '&:hover': { bgcolor: 'rgba(56,189,248,0.10)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 30, color: selected ? '#38bdf8' : 'rgba(226,232,240,0.72)' }}>
                  {item.icon}
                </ListItemIcon>
                {!desktopCollapsed && (
                  <ListItemText primary={item.label} primaryTypographyProps={{ variant: 'body2', fontWeight: 600, noWrap: true }} />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      <Box sx={{ p: 1 }}>
        <Button fullWidth color="inherit" variant="outlined" startIcon={<LogoutRoundedIcon fontSize="small" />} onClick={handleLogout}>
          {!desktopCollapsed ? 'Logout' : ''}
        </Button>
      </Box>
    </Stack>
  );

  return (
    <>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          width: desktopCollapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH,
          '& .MuiDrawer-paper': {
            width: desktopCollapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH,
            overflowX: 'hidden',
            transition: (theme) => theme.transitions.create('width'),
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onCloseMobile}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

Sidebar.propTypes = {
  desktopCollapsed: PropTypes.bool,
  mobileOpen: PropTypes.bool,
  onCloseMobile: PropTypes.func,
};

Sidebar.defaultProps = {
  desktopCollapsed: false,
  mobileOpen: false,
  onCloseMobile: () => {},
};
