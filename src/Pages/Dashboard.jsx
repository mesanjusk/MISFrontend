import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Chip,
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
import SummaryCard from '../components/dashboard/SummaryCard';
import RoleWidget from '../components/dashboard/RoleWidget';
import AllAttandance from './AllAttandance';
import UserTask from './userTask';
import { useDashboardData } from '../hooks/useDashboardData';
import { useUserRole } from '../hooks/useUserRole';
import { EmptyState, ErrorState, LoadingState, PageContainer, SectionCard } from '../components/ui';

const toId = (order) => order?.Order_uuid || order?._id || order?.Order_id;

function OrderList({ items, emptyLabel }) {
  if (!items?.length) {
    return <EmptyState title={emptyLabel} />;
  }

  return (
    <Stack spacing={1}>
      {items.map((order) => (
        <Box key={toId(order)} sx={{ p: 1.25, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: 'background.paper' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Box>
              <Typography variant="body2" fontWeight={600}>{order?.Customer_name || 'Unknown'}</Typography>
              <Typography variant="caption" color="text.secondary">#{order?.Order_Number || '-'}</Typography>
            </Box>
            <Chip label={order?.highestStatusTask?.Task || 'Other'} color="primary" variant="outlined" />
          </Stack>
        </Box>
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
    <PageContainer title="Business Dashboard" subtitle="High-density operations overview for CRM, team and financial execution.">
      {(loading || summaryLoading) ? <LinearProgress /> : null}
      {data?.loadError ? <ErrorState message={data.loadError} /> : null}

      <Grid container spacing={1.5}>
        {summaryCards.map((card) => (
          <Grid key={card.title} item xs={12} sm={6} xl={3}>
            <SummaryCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={4}>
          <RoleWidget role={roleInfo?.role} userName={roleInfo?.userName} />
        </Grid>
        <Grid item xs={12} md={8}>
          <SectionCard title="Today Focus" subtitle="Execution and workload highlights">
            <Typography variant="body2">Smart workflow summary is live.</Typography>
            <Typography variant="caption" color="text.secondary">Use the action menu and reports tabs for rapid drill-down.</Typography>
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} lg={8}>
          <SectionCard title="My Pending Orders" subtitle="Priority pipeline requiring action">
            {loading ? <LoadingState label="Loading pending orders" /> : <OrderList items={data?.myPendingOrders} emptyLabel="No pending orders assigned." />}
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          {roleInfo?.isAdmin ? (
            <SectionCard title="Today Attendance" subtitle="Live team availability overview">
              <AllAttandance />
            </SectionCard>
          ) : (
            <SectionCard title="My Task Flow" subtitle="Assigned activity and updates">
              <UserTask />
            </SectionCard>
          )}
        </Grid>
      </Grid>
    </PageContainer>
  );
}

OrderList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  emptyLabel: PropTypes.string.isRequired,
};

OrderList.defaultProps = {
  items: [],
};
