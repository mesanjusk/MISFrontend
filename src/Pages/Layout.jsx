import { Outlet, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Box, Fab, useMediaQuery } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import TaskRoundedIcon from '@mui/icons-material/TaskRounded';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import Sidebar from '../Components/Sidebar';
import TopNavbar from '../Components/TopNavbar';
import Footer from '../Components/Footer';
import FloatingButtons from '../Components/FloatingButtons';
import RightUtilityRail from '../components/layout/RightUtilityRail';

const DRAWER_WIDTH = 258;
const DRAWER_COLLAPSED = 70;

export default function Layout() {
  const navigate = useNavigate();
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [desktopCollapsed, setDesktopCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const buttonsList = useMemo(
    () => [
      { onClick: () => navigate('/addOrder1'), label: 'Order' },
      { onClick: () => navigate('/addTransaction'), label: 'Receipt' },
      { onClick: () => navigate('/addTransaction1'), label: 'Payment' },
      { onClick: () => navigate('/Followups'), label: 'Followups' },
      { onClick: () => navigate('/addUsertask'), label: 'Task' },
    ],
    [navigate],
  );

  const utilityActions = useMemo(
    () => [
      { label: 'Refresh', onClick: () => window.location.reload(), icon: <RefreshRoundedIcon fontSize="small" /> },
      { label: 'Tasks', onClick: () => navigate('/PendingTask'), icon: <TaskRoundedIcon fontSize="small" /> },
      { label: 'WhatsApp', onClick: () => navigate('/whatsapp-cloud'), icon: <ChatRoundedIcon fontSize="small" /> },
      { label: 'Transactions', onClick: () => navigate('/allTransaction'), icon: <ReceiptLongRoundedIcon fontSize="small" /> },
    ],
    [navigate],
  );

  const sidebarWidth = isDesktop ? (desktopCollapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH) : 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex' }}>
      <Sidebar
        desktopCollapsed={desktopCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          ml: { md: `${sidebarWidth}px` },
          transition: (theme) => theme.transitions.create('margin-left'),
          pr: { lg: 6 },
        }}
      >
        <TopNavbar
          onToggleSidebar={() => setMobileOpen((prev) => !prev)}
          onToggleDesktopCollapse={() => setDesktopCollapsed((prev) => !prev)}
          desktopCollapsed={desktopCollapsed}
        />

        <Box component="main" sx={{ px: { xs: 0.25, md: 1 }, py: 1, pb: { xs: 8.5, md: 1.5 } }}>
          <Box sx={{ maxWidth: 1640, mx: 'auto' }}><Outlet /></Box>
        </Box>

        <FloatingButtons buttonsList={buttonsList} />
        <Footer />
      </Box>

      <RightUtilityRail actions={utilityActions} />

      <Fab
        color="primary"
        aria-label="open menu"
        onClick={() => setMobileOpen(true)}
        size="small"
        sx={{ position: 'fixed', left: 10, bottom: 70, display: { xs: 'flex', md: 'none' }, zIndex: 1199 }}
      >
        <AddIcon fontSize="small" />
      </Fab>
    </Box>
  );
}
