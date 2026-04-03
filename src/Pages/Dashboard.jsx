import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import axios from '../apiClient';
import SummaryCard from '../components/dashboard/SummaryCard';
import RoleWidget from '../components/dashboard/RoleWidget';
import QuickActions from '../components/dashboard/QuickActions';
import AllAttandance from './AllAttandance';
import UserTask from './userTask';
import { useDashboardData } from '../hooks/useDashboardData';
import { useUserRole } from '../hooks/useUserRole';
import { DataTableWrapper, EmptyState, ErrorState, LoadingState, PageContainer, SectionCard } from '../components/ui';

const toId = (order) => order?.Order_uuid || order?._id || order?.Order_id;

function OrderList({ items, emptyLabel }) {
  if (!items?.length) {
    return <EmptyState title={emptyLabel} />;
  }

  return (
    <Stack spacing={0.8}>
      {items.map((order) => (
        <Box
          key={toId(order)}
          sx={{
            p: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 1.5,
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Box>
              <Typography variant="body2" fontWeight={600}>{order?.Customer_name || 'Unknown'}</Typography>
              <Typography variant="caption" color="text.secondary">Order #{order?.Order_Number || '-'}</Typography>
            </Box>
            <Chip label={order?.highestStatusTask?.Task || 'Other'} color="primary" size="small" variant="outlined" />
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

function StatusMatrix({ summaryApi, fallbackSummary }) {
  const rows = [
    ['Open Pipeline', summaryApi?.pendingOrders ?? fallbackSummary?.activeOrders ?? 0],
    ['Created Today', summaryApi?.todayOrders ?? fallbackSummary?.pendingToday ?? 0],
    ['Delivered Today', fallbackSummary?.deliveredToday ?? 0],
    ['Cancelled Today', fallbackSummary?.cancelledToday ?? 0],
    ['Urgent', summaryApi?.urgentOrders ?? 0],
  ];

  return (
    <DataTableWrapper>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Metric</TableCell>
            <TableCell align="right">Count</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(([metric, value]) => (
            <TableRow key={metric}>
              <TableCell>{metric}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableWrapper>
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
      {
        title: 'Today Orders',
        value: summaryApi?.todayOrders ?? 0,
        icon: AssignmentRoundedIcon,
        variant: 'primary',
        trend: 'New entries captured today',
      },
      {
        title: 'Pending Orders',
        value: summaryApi?.pendingOrders ?? data?.summary?.activeOrders ?? 0,
        icon: BusinessRoundedIcon,
        variant: 'warning',
        trend: 'Open operational queue',
      },
      {
        title: 'Urgent Orders',
        value: summaryApi?.urgentOrders ?? 0,
        icon: PriorityHighRoundedIcon,
        variant: 'danger',
        trend: 'Prioritize immediate follow-up',
      },
      {
        title: 'Revenue Today',
        value: summaryApi?.revenueToday ?? 0,
        icon: CurrencyRupeeRoundedIcon,
        variant: 'success',
        trend: 'Billing captured in current day',
      },
      {
        title: 'Pending Payments',
        value: summaryApi?.pendingPayments ?? 0,
        icon: CreditCardRoundedIcon,
        variant: 'warning',
        trend: 'Collections pending confirmation',
      },
    ],
    [data?.summary?.activeOrders, summaryApi],
  );

  const loading = data?.isOrdersLoading || data?.isTasksLoading;

  return (
    <PageContainer
      title="Operations Dashboard"
      subtitle="Compact CRM command center for orders, teams and cashflow performance."
      actions={<Button variant="contained" size="small" endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}>View Reports</Button>}
    >
      {(loading || summaryLoading) ? <LinearProgress sx={{ borderRadius: 1 }} /> : null}
      {data?.loadError ? <ErrorState message={data.loadError} /> : null}

      <Grid container spacing={1.25}>
        {summaryCards.map((card) => (
          <Grid key={card.title} item xs={12} sm={6} lg={4} xl={3}>
            <SummaryCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1.25} sx={{ mt: 0.25 }}>
        <Grid item xs={12} lg={4}>
          <Stack spacing={1.25} sx={{ height: '100%' }}>
            <RoleWidget role={roleInfo?.role} userName={roleInfo?.userName} />
            <QuickActions />
          </Stack>
        </Grid>

        <Grid item xs={12} lg={8}>
          <SectionCard title="Execution Summary" subtitle="Live operational matrix and decision support" contentSx={{ p: 1 }}>
            <Stack spacing={1}>
              <StatusMatrix summaryApi={summaryApi} fallbackSummary={data?.summary} />
              <Divider />
              <Typography variant="caption" color="text.secondary">
                Tip: Use quick actions for direct entry and reports for complete analysis.
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={1.25} sx={{ mt: 0.25 }}>
        <Grid item xs={12} lg={8}>
          <SectionCard title="My Pending Orders" subtitle="Priority pipeline requiring immediate action">
            {loading ? <LoadingState label="Loading pending orders" /> : <OrderList items={data?.myPendingOrders} emptyLabel="No pending orders assigned." />}
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          {roleInfo?.isAdmin ? (
            <SectionCard title="Today Attendance" subtitle="Live team availability overview" contentSx={{ p: 1 }}>
              <AllAttandance />
            </SectionCard>
          ) : (
            <SectionCard title="My Task Flow" subtitle="Assigned activity and updates" contentSx={{ p: 1 }}>
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

StatusMatrix.propTypes = {
  summaryApi: PropTypes.object,
  fallbackSummary: PropTypes.object,
};
