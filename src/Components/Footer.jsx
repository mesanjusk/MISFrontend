import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import TaskRoundedIcon from '@mui/icons-material/TaskRounded';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';

export default function Footer() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs = useMemo(
    () => [
      { label: 'Home', path: '/home', icon: <DashboardRoundedIcon fontSize="small" /> },
      { label: 'Orders', path: '/allOrder', icon: <DescriptionRoundedIcon fontSize="small" /> },
      { label: 'Tasks', path: '/PendingTask', icon: <TaskRoundedIcon fontSize="small" /> },
      { label: 'Bills', path: '/allBills', icon: <ReceiptLongRoundedIcon fontSize="small" /> },
      { label: 'Chat', path: '/whatsapp-cloud', icon: <ChatRoundedIcon fontSize="small" /> },
    ],
    [],
  );

  const active = tabs.find((tab) => pathname.toLowerCase().startsWith(tab.path.toLowerCase()))?.path ?? false;

  return (
    <Paper
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1100,
        display: { xs: 'block', md: 'none' },
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
      elevation={0}
    >
      <BottomNavigation value={active} onChange={(_, next) => next && navigate(next)} showLabels sx={{ minHeight: 57 }}>
        {tabs.map((tab) => (
          <BottomNavigationAction key={tab.path} value={tab.path} label={tab.label} icon={tab.icon} sx={{ minWidth: 0, px: 0.25 }} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
