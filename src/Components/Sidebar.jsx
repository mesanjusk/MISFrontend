import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Collapse,
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
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import { useAuth } from '../context/AuthContext';
import { ROUTE_ALIASES, ROUTES } from '../constants/routes';

const DRAWER_WIDTH = 280;
const DRAWER_COLLAPSED = 84;

export default function Sidebar({ desktopCollapsed, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate();
  const { userGroup, clearAuth } = useAuth();
  const [openGroup, setOpenGroup] = useState('Order');

  const menuGroups = useMemo(
    () => [
      {
        group: 'Customer',
        items: [
          { label: 'Ledger', path: '/customerReport' },
          { label: 'Add Customer', path: ROUTES.ADD_CUSTOMER },
          { label: 'Customer 360', path: ROUTES.CUSTOMER_360 },
        ],
      },
      {
        group: 'Item',
        items: [
          { label: 'Item Report', path: '/itemReport' },
          { label: 'Add Item', path: ROUTES.ADD_ITEM },
          { label: 'Add Item Group', path: ROUTES.ADD_ITEM_GROUP },
          ...(userGroup === 'Vendor' ? [{ label: 'Vendor Bills', path: ROUTES.VENDOR_BILLS }] : []),
        ],
      },
      {
        group: 'Task',
        items: [
          { label: 'Task Report', path: '/taskReport' },
          { label: 'Pending Task', path: ROUTES.PENDING_TASKS },
          { label: 'Add Task', path: ROUTES.ADD_TASK },
          { label: 'Add Task Group', path: ROUTES.ADD_TASK_GROUP },
        ],
      },
      {
        group: 'User',
        items: [
          { label: 'User Report', path: '/userReport' },
          { label: 'Add User', path: ROUTES.ADD_USER },
          { label: 'Add User Group', path: ROUTES.ADD_USER_GROUP },
          { label: 'Attendance', path: ROUTES.ATTENDANCE_REPORT },
        ],
      },
      {
        group: 'Order',
        items: [
          { label: 'Add Order', path: ROUTES.ADD_ORDER_V2 },
          { label: 'All Bills', path: ROUTES.ALL_BILLS },
          { label: 'Order Kanban', path: ROUTES.ORDER_KANBAN },
        ],
      },
      {
        group: 'Enquiry',
        items: [
          { label: 'Add Enquiry', path: ROUTES.ADD_ENQUIRY },
          { label: 'Add Note', path: ROUTE_ALIASES.ADD_NOTE_LOWER },
        ],
      },
      {
        group: 'Account',
        items: [
          { label: 'Payment Report', path: ROUTES.PAYMENT_REPORT },
          { label: 'Priority Report', path: ROUTES.PRIORITY_REPORT },
          { label: 'Add Payable', path: ROUTES.ADD_PAYABLE },
          { label: 'Add Receivable', path: ROUTES.ADD_RECEIVABLE },
        ],
      },
      {
        group: 'Transaction',
        items: [
          { label: 'All Trancation', path: ROUTES.ALL_TRANSACTION },
          { label: 'All Account', path: ROUTE_ALIASES.ALL_TRANSACTION_1_TYPO },
          { label: 'Outstanding', path: ROUTES.ALL_TRANSACTION_2 },
        ],
      },
      {
        group: 'WhatsApp',
        items: [{ label: 'Cloud API Dashboard', path: ROUTES.WHATSAPP_CLOUD }],
      },
      {
        group: 'Admin',
        items: userGroup === 'Admin User' ? [{ label: 'Call Logs', path: ROUTES.CALL_LOGS }] : [],
      },
    ],
    [userGroup],
  );

  const handleLogout = () => {
    clearAuth();
    onCloseMobile();
    navigate('/');
  };

  const drawerContent = (
    <Stack sx={{ height: '100%', bgcolor: 'primary.dark', color: 'primary.contrastText' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Avatar sx={{ bgcolor: 'secondary.main' }}>S</Avatar>
          {!desktopCollapsed && (
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>SANJU SK</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>Admin Dashboard</Typography>
            </Box>
          )}
        </Stack>
      </Stack>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

      <List sx={{ py: 1.5, px: 1.25, overflowY: 'auto', flexGrow: 1 }}>
        {menuGroups
          .filter((g) => g.items.length)
          .map((group) => {
            const expanded = openGroup === group.group && !desktopCollapsed;
            return (
              <Box key={group.group} sx={{ mb: 0.5 }}>
                <Tooltip title={desktopCollapsed ? group.group : ''} placement="right">
                  <ListItemButton
                    onClick={() => setOpenGroup((prev) => (prev === group.group ? null : group.group))}
                    sx={{ borderRadius: 2 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                      <FolderRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    {!desktopCollapsed && <ListItemText primary={group.group} />}
                    {!desktopCollapsed && (
                      <ExpandMoreRoundedIcon
                        sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>

                {!desktopCollapsed && (
                  <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <List disablePadding>
                      {group.items.map((item) => (
                        <ListItemButton
                          key={item.label}
                          sx={{ pl: 5, borderRadius: 2 }}
                          onClick={() => {
                            navigate(item.path);
                            onCloseMobile();
                          }}
                        >
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                )}
              </Box>
            );
          })}
      </List>

      <Box sx={{ p: 1.5 }}>
        <Button
          fullWidth
          color="inherit"
          variant="outlined"
          startIcon={<LogoutRoundedIcon />}
          onClick={handleLogout}
          sx={{ borderColor: 'rgba(255,255,255,0.35)' }}
        >
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
  desktopCollapsed: PropTypes.bool.isRequired,
  mobileOpen: PropTypes.bool.isRequired,
  onCloseMobile: PropTypes.func.isRequired,
};
