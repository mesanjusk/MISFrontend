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
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
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
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{order?.Customer_name || 'Unknown'}</Typography>
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

function PipelineBars({ rows }) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <Stack spacing={0.85}>
      {rows.map((row) => {
        const value = Math.round((row.count / max) * 100);
        return (
          <Stack key={row.label} spacing={0.3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">{row.label}</Typography>
              <Typography variant="caption" fontWeight={700}>{row.count}</Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={value}
              sx={{
                height: 6,
                borderRadius: 999,
                bgcolor: 'action.hover',
              }}
            />
          </Stack>
        );
      })}
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
      {
        title: 'Visible Orders',
        value: data?.visibleOrders?.length ?? 0,
        icon: Inventory2RoundedIcon,
        variant: 'primary',
        trend: 'Based on role access and assignment',
      },
    ],
    [data?.summary?.activeOrders, data?.visibleOrders?.length, summaryApi],
  );

  const loading = data?.isOrdersLoading || data?.isTasksLoading;

  const pipelineRows = useMemo(() => {
    const keys = data?.columnOrder?.length ? data.columnOrder : Object.keys(data?.groupedOrders || {});
    return keys.slice(0, 6).map((label) => ({
      label,
      count: Array.isArray(data?.groupedOrders?.[label]) ? data.groupedOrders[label].length : 0,
    }));
  }, [data?.columnOrder, data?.groupedOrders]);

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <PageContainer
      title="Operations Dashboard"
      subtitle="Compact CRM command center for orders, teams and cashflow performance."
      actions={(
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="inherit" size="small" startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />} onClick={data?.refresh}>
            Refresh
          </Button>
          <Button variant="contained" size="small" endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}>
            View Reports
          </Button>
        </Stack>
      )}
    >
      {(loading || summaryLoading) ? <LinearProgress sx={{ borderRadius: 1 }} /> : null}
      {data?.loadError ? <ErrorState message={data.loadError} /> : null}

      <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap' }}>
        <Chip size="small" label={`Date: ${todayLabel}`} variant="outlined" />
        <Chip size="small" label={`Visible Orders: ${data?.visibleOrders?.length || 0}`} color="primary" variant="outlined" />
        <Chip size="small" label={`User: ${roleInfo?.userName || 'N/A'}`} variant="outlined" />
      </Stack>

      <Grid container spacing={1.25}>
        {summaryCards.map((card) => (
          <Grid key={card.title} item xs={12} sm={6} lg={4} xl={3}>
            <SummaryCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1.25}>
        <Grid item xs={12} lg={4}>
          <Stack spacing={1.25} sx={{ height: '100%' }}>
            <RoleWidget role={roleInfo?.role} userName={roleInfo?.userName} />
            <QuickActions />
          </Stack>
        </Grid>

        <Grid item xs={12} lg={8}>
          <SectionCard title="Execution Summary" subtitle="Live operational matrix and decision support" contentSx={{ p: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={12} md={6}>
                <StatusMatrix summaryApi={summaryApi} fallbackSummary={data?.summary} />
              </Grid>
              <Grid item xs={12} md={6}>
                <DataTableWrapper>
                  <Box sx={{ p: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.75 }}>Pipeline Distribution</Typography>
                    {pipelineRows.length ? <PipelineBars rows={pipelineRows} /> : <EmptyState title="No stage data available" />}
                  </Box>
                </DataTableWrapper>
              </Grid>
            </Grid>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Tip: Use quick actions for direct entry and reports for complete analysis.
            </Typography>
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={1.25}>
        <Grid item xs={12} lg={8}>
          <SectionCard title="My Pending Orders" subtitle="Priority pipeline requiring immediate action">
            {loading ? <LoadingState label="Loading pending orders" /> : <OrderList items={data?.myPendingOrders} emptyLabel="No pending orders assigned." />}
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <SectionCard
            title={roleInfo?.isAdmin ? 'Today Attendance' : 'My Task Flow'}
            subtitle={roleInfo?.isAdmin ? 'Live team availability overview' : 'Assigned activity and updates'}
            contentSx={{ p: 1 }}
            action={<Tooltip title="This panel remains functionally unchanged"><Chip size="small" label="Live" color="secondary" variant="outlined" /></Tooltip>}
          >
            {roleInfo?.isAdmin ? <AllAttandance /> : <UserTask />}
          </SectionCard>
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

PipelineBars.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    count: PropTypes.number,
  })).isRequired,
};
