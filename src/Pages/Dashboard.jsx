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
import { alpha } from '@mui/material/styles';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import axios from '../apiClient';
import SummaryCard from '../components/dashboard/SummaryCard';
import AllAttandance from './AllAttandance';
import UserTask from './userTask';
import { useDashboardData } from '../hooks/useDashboardData';
import { useUserRole } from '../hooks/useUserRole';
import {
  DataTableWrapper,
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  SectionCard,
} from '../components/ui';
import UpiPaymentDialog from '../components/dashboard/UpiPaymentDialog';

const toId = (order) => order?.Order_uuid || order?._id || order?.Order_id;
const todayDateKey = () => new Date().toISOString().split('T')[0];

const parseAmount = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatMoney = (value) => `₹${parseAmount(value).toLocaleString('en-IN')}`;

const normalizeDateValue = (value) => {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
};

const isWithinNextDays = (value, days = 3) => {
  const date = normalizeDateValue(value);
  if (!date) return false;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + days - 1);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
};

const isOverdueOrWithinNextDays = (value, days = 3) => {
  const date = normalizeDateValue(value);
  if (!date) return false;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return date < start || isWithinNextDays(date, days);
};

const getFollowupTiming = (value) => {
  const date = normalizeDateValue(value);
  if (!date) return 'default';

  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date();
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (target.getTime() < current.getTime()) return 'overdue';
  if (target.getTime() === current.getTime()) return 'today';
  return 'upcoming';
};

const normalizePaymentFollowup = (item = {}) => {
  const followupDate =
    item?.followup_date ||
    item?.Followup_date ||
    item?.FollowupDate ||
    item?.deadline ||
    item?.Deadline ||
    item?.date ||
    item?.Date ||
    null;

  return {
    id:
      item?._id ||
      item?.followup_uuid ||
      item?.Followup_uuid ||
      item?.Paymentfollowup_uuid ||
      `${item?.customer_name || item?.Customer_name || item?.Customer || 'followup'}-${followupDate || 'na'}`,
    customerName:
      item?.customer_name ||
      item?.Customer_name ||
      item?.Customer ||
      item?.customer ||
      '',
    amount: Number(item?.amount ?? item?.Amount ?? 0),
    title: item?.title || item?.Title || '',
    remark: item?.remark || item?.Remark || '',
    followupDate,
    status: item?.status || item?.Status || 'pending',
    createdBy: item?.created_by || item?.Created_by || item?.CreatedBy || '',
    raw: item,
  };
};

function OrderList({ items, emptyLabel }) {
  if (!items?.length) {
    return <EmptyState title={emptyLabel} />;
  }

  return (
    <Stack spacing={0.6}>
      {items.map((order) => (
        <Box
          key={toId(order)}
          sx={{
            p: 0.9,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 1.5,
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={0.75}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {order?.Customer_name || 'Unknown'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Order #{order?.Order_Number || '-'}
              </Typography>
            </Box>
            <Chip
              label={order?.highestStatusTask?.Task || 'Other'}
              color="primary"
              size="small"
              variant="outlined"
            />
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

function SmallScrollableTable({ columns, rows, emptyLabel, renderRow, maxHeight = 320, tableSx }) {
  return (
    <DataTableWrapper>
      <Box sx={{ maxHeight, overflow: 'auto' }}>
        <Table stickyHeader size="small" sx={tableSx}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align || 'left'}
                  sx={{ whiteSpace: 'nowrap', py: 0.8 }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {!rows?.length ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyLabel}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map(renderRow)
            )}
          </TableBody>
        </Table>
      </Box>
    </DataTableWrapper>
  );
}

function formatTaskDate(value) {
  const dt = normalizeDateValue(value);
  if (!dt) return '—';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatFollowupDate(value) {
  const dt = normalizeDateValue(value);
  if (!dt) return '—';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const roleInfo = useUserRole();
  const [summaryApi, setSummaryApi] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [followups, setFollowups] = useState([]);
  const [followupsLoading, setFollowupsLoading] = useState(true);
  const [showUpiDialog, setShowUpiDialog] = useState(false);

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
        const res = await axios.get('/dashboard/summary', {
          params: {
            userName: roleInfo?.userName || '',
            isAdmin: Boolean(roleInfo?.isAdmin),
            role: roleInfo?.role || '',
          },
        });
        if (!mounted) return;
        setSummaryApi(res?.data?.result || {});
      } catch {
        if (!mounted) return;
        setSummaryApi({});
      } finally {
        if (mounted) setSummaryLoading(false);
      }
    };

    if (roleInfo?.userName || roleInfo?.isAdmin) {
      fetchSummary();
    }

    return () => {
      mounted = false;
    };
  }, [roleInfo?.isAdmin, roleInfo?.role, roleInfo?.userName]);

  useEffect(() => {
    let mounted = true;

    const endpoints = [
      '/paymentfollowup/GetPaymentfollowupList',
      '/paymentfollowup/getPaymentfollowupList',
      '/paymentfollowup/GetPaymentFollowupList',
      '/paymentfollowup/GetFollowupList',
      '/paymentfollowup/list',
      '/paymentfollowup/get',
      '/paymentfollowup/GetList',
      '/paymentfollowup/all',
    ];

    const fetchFollowups = async () => {
      try {
        setFollowupsLoading(true);
        let rows = [];

        for (const endpoint of endpoints) {
          try {
            const res = await axios.get(endpoint);
            const apiRows = Array.isArray(res?.data?.result)
              ? res.data.result
              : Array.isArray(res?.data?.data)
              ? res.data.data
              : Array.isArray(res?.data?.rows)
              ? res.data.rows
              : Array.isArray(res?.data)
              ? res.data
              : [];
            if (apiRows.length) {
              rows = apiRows.map(normalizePaymentFollowup);
              break;
            }
          } catch {
            // try next endpoint
          }
        }

        if (!mounted) return;
        setFollowups(rows);
      } catch (error) {
        console.error('Error fetching payment followups:', error);
        if (mounted) setFollowups([]);
      } finally {
        if (mounted) setFollowupsLoading(false);
      }
    };

    fetchFollowups();
    return () => {
      mounted = false;
    };
  }, []);

  const oldPendingOrders = useMemo(() => {
    const today = todayDateKey();
    return (data?.activeOrders || []).filter((order) => {
      const createdAt = order?.highestStatusTask?.CreatedAt;
      if (!createdAt) return true;
      const dt = normalizeDateValue(createdAt);
      if (!dt) return true;
      return dt.toISOString().split('T')[0] !== today;
    }).length;
  }, [data?.activeOrders]);

  const todayDeliveryCount = useMemo(
    () => summaryApi?.todayDelivery ?? 0,
    [summaryApi],
  );

  const todayRevenue = useMemo(
    () => summaryApi?.todayRevenue ?? 0,
    [summaryApi],
  );

  const todayReceivable = useMemo(
    () => summaryApi?.pendingPayments ?? 0,
    [summaryApi],
  );

  const todayEnquiry = useMemo(
    () => summaryApi?.todayEnquiry ?? 0,
    [summaryApi],
  );

  const summaryCards = useMemo(
    () => [
      {
        title: 'New Orders',
        value: summaryApi?.todayOrdersCount ?? 0,
        icon: AssignmentRoundedIcon,
        variant: 'primary',
      },
      {
        title: 'Pending',
        value: oldPendingOrders,
        icon: AutorenewRoundedIcon,
        variant: 'warning',
      },
      {
        title: 'Delivery',
        value: todayDeliveryCount,
        icon: LocalShippingRoundedIcon,
        variant: 'success',
      },
      {
        title: 'Revenue',
        value: todayRevenue,
        icon: CurrencyRupeeRoundedIcon,
        variant: 'success',
      },
      {
        title: 'Receivable',
        value: todayReceivable,
        icon: CreditCardRoundedIcon,
        variant: 'warning',
      },
      {
        title: 'Enquiry',
        value: todayEnquiry,
        icon: SupportAgentRoundedIcon,
        variant: 'primary',
      },
    ],
    [oldPendingOrders, summaryApi, todayDeliveryCount, todayEnquiry, todayReceivable, todayRevenue],
  );

  const assignedTasks = useMemo(() => {
    return Array.isArray(summaryApi?.assignedTasks) ? summaryApi.assignedTasks : [];
  }, [summaryApi]);

  const followupRows = useMemo(() => {
    const rows = (followups || []).filter((item) =>
      isOverdueOrWithinNextDays(item?.followupDate, 3),
    );

    return rows.sort((a, b) => {
      const dateA = normalizeDateValue(a?.followupDate)?.getTime() || 0;
      const dateB = normalizeDateValue(b?.followupDate)?.getTime() || 0;
      return dateA - dateB;
    });
  }, [followups]);

  const userWiseTaskRows = useMemo(() => {
    return Array.isArray(summaryApi?.userWiseAssignedTasks) ? summaryApi.userWiseAssignedTasks : [];
  }, [summaryApi]);

  const loading = data?.isOrdersLoading || data?.isTasksLoading;

  return (
    <PageContainer
      title=""
      subtitle=""
      sx={{
        '& .MuiContainer-root, & .MuiBox-root': {
          maxWidth: '100%',
        },
      }}
      contentSx={{
        px: { xs: 0.75, sm: 1, md: 1.25 },
        py: 0.75,
      }}
      actions={
        <Button
          size="small"
          variant="contained"
          startIcon={<QrCode2RoundedIcon fontSize="small" />}
          onClick={() => setShowUpiDialog(true)}
          sx={{
            minHeight: 32,
            px: 1.25,
            borderRadius: 1.75,
            boxShadow: 'none',
          }}
        >
          UPI Payment
        </Button>
      }
    >
      {(loading || summaryLoading || followupsLoading) ? (
        <LinearProgress sx={{ borderRadius: 1, mb: 0.75 }} />
      ) : null}

      {data?.loadError ? <ErrorState message={data.loadError} /> : null}

      <Grid container spacing={0.9} sx={{ mb: 0.9 }}>
        {summaryCards.map((card) => (
          <Grid key={card.title} item xs={6} sm={4} md={4} lg={2}>
            <SummaryCard
              {...card}
              trend=""
              sx={{
                '& .MuiCard-root, &': {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={0.9} sx={{ mb: 0.9 }}>
        <Grid item xs={12} lg={5}>
          <SectionCard
            title={roleInfo?.isAdmin ? 'Attendance' : 'My Attendance'}
            contentSx={{ p: 0.8 }}
          >
            {roleInfo?.isAdmin ? <AllAttandance /> : <UserTask />}
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={7}>
          <SectionCard
            title={roleInfo?.isAdmin ? 'All Assigned Tasks' : 'My Assigned Tasks'}
            contentSx={{ p: 0.8 }}
          >
            {summaryLoading ? (
              <LoadingState label="Loading assigned tasks" />
            ) : (
              <SmallScrollableTable
                columns={[
                  { key: 'task', label: 'Task' },
                  { key: 'type', label: 'Type' },
                  { key: 'user', label: 'User' },
                  { key: 'deadline', label: 'Deadline' },
                ]}
                rows={assignedTasks}
                emptyLabel="No assigned tasks found."
                maxHeight={280}
                tableSx={{
                  '& .MuiTableCell-root': {
                    py: 0.55,
                    px: 1,
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    fontWeight: 600,
                    bgcolor: 'background.paper',
                  },
                }}
                renderRow={(task) => (
                  <TableRow key={`${task?.source}-${task?.id}`} hover>
                    <TableCell sx={{ minWidth: 160 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {task?.title || 'Untitled Task'}
                      </Typography>
                      {!!task?.subtitle && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {task.subtitle}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                      {task?.source || '—'}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {task?.assignedTo || '—'}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {formatTaskDate(task?.dueDate)}
                    </TableCell>
                  </TableRow>
                )}
              />
            )}
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={0.9} sx={{ mb: 0.9 }}>
        <Grid item xs={12} lg={7}>
          <SectionCard title="Pending Orders" contentSx={{ p: 0.8 }}>
            {loading ? (
              <LoadingState label="Loading pending orders" />
            ) : (
              <OrderList
                items={data?.myPendingOrders}
                emptyLabel={roleInfo?.isAdmin ? 'No pending orders available.' : 'No pending orders assigned.'}
              />
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={5}>
          <SectionCard
            title="Payment Followups"
            contentSx={{ p: 0.8 }}
            action={
              <Stack direction="row" spacing={0.5}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ReceiptLongRoundedIcon fontSize="small" />}
                  href="/accounts/followups"
                  sx={{ minHeight: 30, px: 1 }}
                >
                  Open
                </Button>
              </Stack>
            }
          >
            {followupsLoading ? (
              <LoadingState label="Loading payment followups" />
            ) : (
              <SmallScrollableTable
                columns={[
                  { key: 'customer', label: 'Customer' },
                  { key: 'amount', label: 'Amount', align: 'right' },
                  { key: 'date', label: 'Date' },
                ]}
                rows={followupRows}
                emptyLabel="No overdue or near-term payment followups."
                maxHeight={280}
                tableSx={{
                  '& .MuiTableCell-root': {
                    py: 0.55,
                    px: 1,
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    fontWeight: 600,
                    bgcolor: 'background.paper',
                  },
                }}
                renderRow={(item) => {
                  const timing = getFollowupTiming(item?.followupDate);
                  const rowSx = (theme) => {
                    if (timing === 'overdue') return { bgcolor: alpha(theme.palette.error.main, 0.08) };
                    if (timing === 'today') return { bgcolor: alpha(theme.palette.warning.main, 0.1) };
                    if (timing === 'upcoming') return { bgcolor: alpha(theme.palette.info.main, 0.06) };
                    return {};
                  };

                  return (
                    <TableRow key={item?.id} hover sx={rowSx}>
                      <TableCell sx={{ minWidth: 160 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {item?.customerName || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {item?.title || item?.remark || 'Follow-up'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {formatMoney(item?.amount)}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatFollowupDate(item?.followupDate)}
                      </TableCell>
                    </TableRow>
                  );
                }}
              />
            )}
          </SectionCard>
        </Grid>
      </Grid>

      {roleInfo?.isAdmin ? (
        <Grid container spacing={0.9}>
          <Grid item xs={12}>
            <SectionCard
              title="User Wise Assigned Tasks"
              contentSx={{ p: 0.8 }}
            >
              {summaryLoading ? (
                <LoadingState label="Loading user wise assigned task summary" />
              ) : (
                <SmallScrollableTable
                  columns={[
                    { key: 'user', label: 'User' },
                    { key: 'group', label: 'Group' },
                    { key: 'orderTasks', label: 'Order', align: 'right' },
                    { key: 'userTasks', label: 'Usertask', align: 'right' },
                    { key: 'total', label: 'Total', align: 'right' },
                  ]}
                  rows={userWiseTaskRows}
                  emptyLabel="No pending assigned tasks found."
                  maxHeight={240}
                  tableSx={{
                    '& .MuiTableCell-root': {
                      py: 0.55,
                      px: 1,
                    },
                    '& .MuiTableHead-root .MuiTableCell-root': {
                      fontWeight: 600,
                      bgcolor: 'background.paper',
                    },
                  }}
                  renderRow={(row) => (
                    <TableRow key={row.user} hover>
                      <TableCell sx={{ minWidth: 160 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {row.user}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.group || '—'}</TableCell>
                      <TableCell align="right">{row.orderTasks}</TableCell>
                      <TableCell align="right">{row.userTasks}</TableCell>
                      <TableCell align="right">
                        <Chip size="small" label={row.total} color="primary" variant="outlined" sx={{ height: 22 }} />
                      </TableCell>
                    </TableRow>
                  )}
                />
              )}
            </SectionCard>
          </Grid>
        </Grid>
      ) : null}

      <UpiPaymentDialog open={showUpiDialog} onClose={() => setShowUpiDialog(false)} />
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

SmallScrollableTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      align: PropTypes.string,
    }),
  ).isRequired,
  rows: PropTypes.arrayOf(PropTypes.any),
  emptyLabel: PropTypes.string.isRequired,
  renderRow: PropTypes.func.isRequired,
  maxHeight: PropTypes.number,
  tableSx: PropTypes.object,
};

SmallScrollableTable.defaultProps = {
  rows: [],
  maxHeight: 320,
  tableSx: undefined,
};