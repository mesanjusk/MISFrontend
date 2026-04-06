import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Chip,
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
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import axios from '../apiClient';
import SummaryCard from '../components/dashboard/SummaryCard';
import AllAttandance from './AllAttandance';
import { useDashboardData } from '../hooks/useDashboardData';
import { useUserRole } from '../hooks/useUserRole';
import { DataTableWrapper, EmptyState, ErrorState, LoadingState, PageContainer, SectionCard } from '../components/ui';

const toId = (order) => order?.Order_uuid || order?._id || order?.Order_id;
const toLower = (value = '') => String(value).trim().toLowerCase();
const enquiryStages = new Set(['enquiry', 'enquiries', 'inquiry', 'lead']);

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

function UserWisePendingTable({ rows }) {
  if (!rows?.length) {
    return <EmptyState title="No user wise pending data available." />;
  }

  return (
    <DataTableWrapper>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell align="right">Pending Orders</TableCell>
            <TableCell>Active Task</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.user} hover>
              <TableCell sx={{ fontWeight: 600 }}>{row.user}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>{row.pendingCount}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap">
                  {row.tasks.map((task) => (
                    <Chip
                      key={`${row.user}-${task.label}`}
                      size="small"
                      variant="outlined"
                      label={`${task.label}: ${task.count}`}
                    />
                  ))}
                </Stack>
              </TableCell>
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

  const todayEnquiryCount = useMemo(
    () => data?.visibleOrders?.filter((order) => enquiryStages.has(toLower(order?.highestStatusTask?.Task))).length ?? 0,
    [data?.visibleOrders],
  );

  const oldPendingOrders = useMemo(
    () => Math.max((data?.summary?.activeOrders ?? 0) - (data?.summary?.pendingToday ?? 0), 0),
    [data?.summary?.activeOrders, data?.summary?.pendingToday],
  );

  const summaryCards = useMemo(
    () => [
      {
        title: 'Todays New Orders',
        value: summaryApi?.todayOrders ?? data?.summary?.pendingToday ?? 0,
        icon: AssignmentRoundedIcon,
        variant: 'primary',
        trend: 'Fresh orders added today',
      },
      {
        title: 'Old Pending Orders',
        value: oldPendingOrders,
        icon: PendingActionsRoundedIcon,
        variant: 'warning',
        trend: 'Backlog before today',
      },
      {
        title: 'Todays Delivery',
        value: summaryApi?.deliveredToday ?? data?.summary?.deliveredToday ?? 0,
        icon: LocalShippingRoundedIcon,
        variant: 'success',
        trend: 'Completed delivery today',
      },
      {
        title: 'Todays Revenue',
        value: summaryApi?.revenueToday ?? 0,
        icon: CurrencyRupeeRoundedIcon,
        variant: 'success',
        trend: 'Billing booked today',
      },
      {
        title: 'Today Payment Reciviable',
        value: summaryApi?.pendingPayments ?? summaryApi?.todayPaymentReceivable ?? 0,
        icon: PaymentsRoundedIcon,
        variant: 'warning',
        trend: 'Receivable amount to collect',
      },
      {
        title: 'Today Enquiry',
        value: summaryApi?.todayEnquiry ?? todayEnquiryCount,
        icon: SupportAgentRoundedIcon,
        variant: 'primary',
        trend: 'Enquiry stage orders visible today',
      },
    ],
    [data?.summary?.deliveredToday, data?.summary?.pendingToday, oldPendingOrders, summaryApi, todayEnquiryCount],
  );

  const userWisePending = useMemo(() => {
    const grouped = (data?.activeOrders || []).reduce((acc, order) => {
      const user = order?.highestStatusTask?.Assigned || 'Unassigned';
      const task = order?.highestStatusTask?.Task || 'Other';

      if (!acc[user]) {
        acc[user] = {
          user,
          pendingCount: 0,
          taskMap: {},
        };
      }

      acc[user].pendingCount += 1;
      acc[user].taskMap[task] = (acc[user].taskMap[task] || 0) + 1;
      return acc;
    }, {});

    return Object.values(grouped)
      .map((row) => ({
        user: row.user,
        pendingCount: row.pendingCount,
        tasks: Object.entries(row.taskMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([label, count]) => ({ label, count })),
      }))
      .sort((a, b) => b.pendingCount - a.pendingCount);
  }, [data?.activeOrders]);

  const loading = data?.isOrdersLoading || data?.isTasksLoading;

  return (
    <PageContainer>
      {(loading || summaryLoading) ? <LinearProgress sx={{ borderRadius: 1 }} /> : null}
      {data?.loadError ? <ErrorState message={data.loadError} /> : null}

      <Stack direction="row" justifyContent="flex-end">
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />}
          onClick={data?.refresh}
        >
          Refresh
        </Button>
      </Stack>

      <Grid container spacing={1.25}>
        {summaryCards.map((card) => (
          <Grid key={card.title} item xs={12} sm={6} md={4} lg={2}>
            <SummaryCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1.25}>
        <Grid item xs={12} lg={4}>
          <SectionCard
            title="User Wise Attendance"
            subtitle="Today attendance grouped by user"
            contentSx={{ p: 1 }}
          >
            <AllAttandance />
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={8}>
          <SectionCard title="My Pending Order" subtitle="Orders that need action now">
            {loading ? <LoadingState label="Loading pending orders" /> : <OrderList items={data?.myPendingOrders} emptyLabel="No pending orders assigned." />}
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard title="User Wise Pending & Task" subtitle="Pending order count and active task distribution by user">
        {loading ? <LoadingState label="Loading user wise pending data" /> : <UserWisePendingTable rows={userWisePending} />}
      </SectionCard>
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

UserWisePendingTable.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      user: PropTypes.string.isRequired,
      pendingCount: PropTypes.number.isRequired,
      tasks: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          count: PropTypes.number.isRequired,
        }),
      ).isRequired,
    }),
  ),
};

UserWisePendingTable.defaultProps = {
  rows: [],
};
