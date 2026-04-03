import { Outlet, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Box, Fab, useMediaQuery } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Sidebar from '../Components/Sidebar';
import TopNavbar from '../Components/TopNavbar';
import Footer from '../Components/Footer';
import FloatingButtons from '../Components/FloatingButtons';

const DRAWER_WIDTH = 280;
const DRAWER_COLLAPSED = 84;

export default function Layout() {
  const navigate = useNavigate();
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
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
        }}
      >
        <TopNavbar
          onToggleSidebar={() => setMobileOpen((prev) => !prev)}
          onToggleDesktopCollapse={() => setDesktopCollapsed((prev) => !prev)}
          desktopCollapsed={desktopCollapsed}
        />

        <Box component="main" sx={{ px: { xs: 2, md: 3 }, py: 3, pb: { xs: 11, md: 4 } }}>
          <Box sx={{ maxWidth: 1600, mx: 'auto' }}><Outlet /></Box>
        </Box>

        <FloatingButtons buttonsList={buttonsList} />
        <Footer />
      </Box>

      <Fab
        color="primary"
        aria-label="open actions"
        onClick={() => setMobileOpen(true)}
        sx={{ position: 'fixed', left: 16, bottom: 80, display: { xs: 'flex', md: 'none' }, zIndex: 1199 }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
