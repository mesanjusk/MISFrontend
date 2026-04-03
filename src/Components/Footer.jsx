import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';

export default function Footer() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs = useMemo(
    () => [
      { label: 'Report', path: '/allOrder', icon: <DescriptionRoundedIcon /> },
      { label: 'Delivered', path: '/allDelivery', icon: <LocalShippingRoundedIcon /> },
      { label: 'Vendor', path: '/AllVendors', icon: <ApartmentRoundedIcon /> },
      { label: 'Bills', path: '/allBills', icon: <ReceiptLongRoundedIcon /> },
    ],
    [],
  );

  const active = tabs.find((tab) => pathname.startsWith(tab.path))?.path ?? false;

  return (
    <Paper sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1100, display: { xs: 'block', md: 'none' } }} elevation={8}>
      <BottomNavigation value={active} onChange={(_, next) => next && navigate(next)} showLabels>
        {tabs.map((tab) => (
          <BottomNavigationAction key={tab.path} value={tab.path} label={tab.label} icon={tab.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
