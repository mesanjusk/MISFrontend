import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import ShoppingBagRoundedIcon from '@mui/icons-material/ShoppingBagRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded';
import { useAuth } from '../context/AuthContext';
import { ROUTE_ALIASES, ROUTES } from '../constants/routes';

const DRAWER_WIDTH = 258;
const DRAWER_COLLAPSED = 72;

const iconByGroup = {
  Customer: <PersonOutlineRoundedIcon fontSize="small" />,
  Item: <Inventory2OutlinedIcon fontSize="small" />,
  Task: <TaskAltRoundedIcon fontSize="small" />,
  User: <GroupRoundedIcon fontSize="small" />,
  Order: <ShoppingBagRoundedIcon fontSize="small" />,
  Enquiry: <SupportAgentRoundedIcon fontSize="small" />,
  Account: <PaymentsRoundedIcon fontSize="small" />,
  Transaction: <ReceiptLongRoundedIcon fontSize="small" />,
  WhatsApp: <ChatRoundedIcon fontSize="small" />,
  Admin: <AdminPanelSettingsRoundedIcon fontSize="small" />,
};

export default function Sidebar({ desktopCollapsed, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
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
      { group: 'WhatsApp', items: [{ label: 'Cloud API Dashboard', path: ROUTES.WHATSAPP_CLOUD }] },
      { group: 'Admin', items: userGroup === 'Admin User' ? [{ label: 'Call Logs', path: ROUTES.CALL_LOGS }] : [] },
    ],
    [userGroup],
  );

  const handleLogout = () => {
    clearAuth();
    onCloseMobile();
    navigate('/');
  };

  const drawerContent = (
    <Stack sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 1.1 }}>
        <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', width: 34, height: 34 }}>M</Avatar>
          {!desktopCollapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>MIS CRM</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>Compact operations panel</Typography>
            </Box>
          )}
        </Stack>
      </Stack>
      <Divider />

      <List sx={{ py: 0.75, px: 0.75, overflowY: 'auto', flexGrow: 1 }}>
        {menuGroups.filter((g) => g.items.length).map((group) => {
          const expanded = openGroup === group.group && !desktopCollapsed;
          const selectedGroup = group.items.some((item) => pathname.startsWith(item.path));

          return (
            <Box key={group.group} sx={{ mb: 0.45 }}>
              <Tooltip title={desktopCollapsed ? group.group : ''} placement="right">
                <ListItemButton
                  selected={selectedGroup}
                  onClick={() => {
                    if (desktopCollapsed) {
                      navigate(group.items[0].path);
                      onCloseMobile();
                      return;
                    }
                    setOpenGroup((prev) => (prev === group.group ? null : group.group));
                  }}
                  sx={{
                    minHeight: 34,
                    '&.Mui-selected': { bgcolor: 'action.selected' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 30, color: selectedGroup ? 'primary.main' : 'text.secondary' }}>
                    {iconByGroup[group.group]}
                  </ListItemIcon>
                  {!desktopCollapsed && (
                    <ListItemText
                      primary={group.group}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600, noWrap: true }}
                    />
                  )}
                  {!desktopCollapsed && <ExpandMoreRoundedIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s', color: 'text.secondary' }} />}
                </ListItemButton>
              </Tooltip>

              {!desktopCollapsed && (
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {group.items.map((item) => {
                      const selected = pathname.startsWith(item.path);
                      return (
                        <ListItemButton
                          key={item.label}
                          selected={selected}
                          sx={{ pl: 3, minHeight: 30, '&.Mui-selected': { bgcolor: 'action.selected' } }}
                          onClick={() => {
                            navigate(item.path);
                            onCloseMobile();
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 18, color: 'text.secondary' }}>
                            <FiberManualRecordRoundedIcon sx={{ fontSize: 7 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ variant: 'caption', fontSize: 12, noWrap: true }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>

      <Box sx={{ p: 1 }}>
        <Button
          fullWidth
          color="inherit"
          variant="outlined"
          startIcon={<LogoutRoundedIcon fontSize="small" />}
          onClick={handleLogout}
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
