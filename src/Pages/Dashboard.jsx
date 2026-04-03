import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import axios from '../apiClient';
import { LoadingSpinner } from '../Components';
import SectionHeader from '../components/common/SectionHeader';
import SummaryCard from '../components/dashboard/SummaryCard';
import RoleWidget from '../components/dashboard/RoleWidget';
import QuickActions from '../components/dashboard/QuickActions';
import CrmSidebarPanel from '../components/dashboard/CrmSidebarPanel';
import AllAttandance from './AllAttandance';
import UserTask from './userTask';
import { useDashboardData } from '../hooks/useDashboardData';
import { useUserRole } from '../hooks/useUserRole';

const toId = (order) => order?.Order_uuid || order?._id || order?.Order_id;

function OrderList({ items, emptyLabel }) {
  if (!items?.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <Stack spacing={1.25}>
      {items.map((order) => (
        <Card key={toId(order)} sx={{ p: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="body2" fontWeight={600}>{order?.Customer_name || 'Unknown'}</Typography>
              <Typography variant="caption" color="text.secondary">#{order?.Order_Number || '-'}</Typography>
            </Box>
            <Typography variant="caption" color="primary.main" fontWeight={700}>
              {order?.highestStatusTask?.Task || 'Other'}
            </Typography>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}

export default function Dashboard() {
  const roleInfo = useUserRole();
  const [summaryApi, setSummaryApi] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(true);

  const data = useDashboardData({
    role: roleInfo?.role,
    userName: roleInfo?.userName,
    isAdmin: roleInfo?.isAdmin,
  });

  useEffect(() => {
    let mounted = true;
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        const res = await axios.get('/dashboard/summary');
        if (!mounted) return;
        setSummaryApi(res?.data?.result || res?.data?.data || {});
      } catch {
        if (!mounted) return;
        setSummaryApi({});
      } finally {
        if (mounted) setSummaryLoading(false);
      }
    };

    fetchSummary();
    return () => {
      mounted = false;
    };
  }, []);

  const summaryCards = useMemo(
    () => [
      { title: 'Today Orders', value: summaryApi?.todayOrders ?? 0, icon: AssignmentRoundedIcon, variant: 'primary' },
      {
        title: 'Pending Orders',
        value: summaryApi?.pendingOrders ?? data?.summary?.activeOrders ?? 0,
        icon: BusinessRoundedIcon,
        variant: 'warning',
      },
      { title: 'Urgent Orders', value: summaryApi?.urgentOrders ?? 0, icon: PriorityHighRoundedIcon, variant: 'danger' },
      { title: 'Revenue Today', value: summaryApi?.revenueToday ?? 0, icon: CurrencyRupeeRoundedIcon, variant: 'success' },
      { title: 'Pending Payments', value: summaryApi?.pendingPayments ?? 0, icon: CreditCardRoundedIcon, variant: 'warning' },
    ],
    [data?.summary?.activeOrders, summaryApi],
  );

  const loading = data?.isOrdersLoading || data?.isTasksLoading;

  return (
    <Stack spacing={2.5}>
      {(loading || summaryLoading) ? <LinearProgress /> : null}
      {data?.loadError ? <Alert severity="error">{data.loadError}</Alert> : null}

      <Grid container spacing={2.5}>
        <Grid item xs={12} xl={9}>
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              {summaryCards.map((card) => (
                <Grid key={card.title} item xs={12} sm={6} xl={3}>
                  <SummaryCard {...card} />
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} lg={4}>
                <RoleWidget role={roleInfo?.role} userName={roleInfo?.userName} />
              </Grid>
              {roleInfo?.isAdmin ? (
                <Grid item xs={12} lg={4}>
                  <QuickActions />
                </Grid>
              ) : null}
              <Grid item xs={12} lg={roleInfo?.isAdmin ? 4 : 8}>
                <Card sx={{ p: 2.25, height: '100%' }}>
                  <SectionHeader title="Today" />
                  <Typography variant="body2">Smart workflow summary is live.</Typography>
                  <Typography variant="caption" color="text.secondary">Tap refresh below for latest updates.</Typography>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} lg={8}>
                <Card sx={{ p: 2.25 }}>
                  <SectionHeader title="My Pending Orders" />
                  {loading ? (
                    <Stack alignItems="center" py={4}>
                      <LoadingSpinner />
                    </Stack>
                  ) : (
                    <OrderList items={data?.myPendingOrders} emptyLabel="No pending orders assigned." />
                  )}
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Stack spacing={2}>
                  {roleInfo?.isAdmin ? (
                    <Card sx={{ p: 2.25 }}>
                      <SectionHeader title="Today Attendance" />
                      <AllAttandance />
                    </Card>
                  ) : (
                    <Card sx={{ p: 2.25 }}>
                      <SectionHeader title="My Task Flow" />
                      <UserTask />
                    </Card>
                  )}

                  <Card sx={{ p: 2.25 }}>
                    <SectionHeader title="Recent Updates" action={<Button size="small" onClick={data?.refresh}>Refresh</Button>} />
                    <OrderList items={data?.recentOrders} emptyLabel="No recent orders." />
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Grid>

        <Grid item xs={12} xl={3}>
          <CrmSidebarPanel />
        </Grid>
      </Grid>
    </Stack>
  );
}
