import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
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
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import axios from '../apiClient';
import SummaryCard from '../components/dashboard/SummaryCard';
import AllAttandance from './AllAttandance';
import UserTask from './userTask';
import { useDashboardData } from '../hooks/useDashboardData';
import { useUserRole } from '../hooks/useUserRole';
import { DataTableWrapper, EmptyState, ErrorState, LoadingState, PageContainer, SectionCard } from '../components/ui';

const toId = (order) => order?.Order_uuid || order?._id || order?.Order_id;
const toLower = (value = '') => String(value).trim().toLowerCase();
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

function SmallScrollableTable({ columns, rows, emptyLabel, renderRow, maxHeight = 320 }) {
  return (
    <DataTableWrapper>
      <Box sx={{ maxHeight, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align || 'left'} sx={{ whiteSpace: 'nowrap' }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {!rows?.length ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
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
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [followups, setFollowups] = useState([]);
  const [followupsLoading, setFollowupsLoading] = useState(true);

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

  useEffect(() => {
    let mounted = true;

    const fetchTasks = async () => {
      try {
        setTasksLoading(true);
        const res = await axios.get('/usertask/GetUsertaskList');
        if (!mounted) return;
        setTasks(Array.isArray(res?.data?.result) ? res.data.result : []);
      } catch (error) {
        console.error('Error fetching dashboard tasks:', error);
        if (mounted) setTasks([]);
      } finally {
        if (mounted) setTasksLoading(false);
      }
    };

    fetchTasks();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const endpoints = [
      '/paymentfollowup/GetPaymentfollowupList',
      '/paymentfollowup/GetPaymentFollowupList',
      '/paymentfollowup/get',
      '/paymentfollowup/list',
      '/paymentfollowup/GetList',
    ];

    const fetchFollowups = async () => {
      try {
        setFollowupsLoading(true);
        let rows = [];

        for (const endpoint of endpoints) {
          try {
            const res = await axios.get(endpoint);
            const result = res?.data?.result || res?.data?.data || res?.data;
            if (Array.isArray(result)) {
              rows = result;
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
    () => summaryApi?.todayDelivery ?? summaryApi?.deliveredToday ?? data?.summary?.deliveredToday ?? 0,
    [data?.summary?.deliveredToday, summaryApi],
  );

  const todayRevenue = useMemo(
    () => summaryApi?.revenueToday ?? summaryApi?.todayRevenue ?? 0,
    [summaryApi],
  );

  const todayReceivable = useMemo(
    () => summaryApi?.pendingPayments ?? summaryApi?.paymentReceivableToday ?? summaryApi?.receivableToday ?? 0,
    [summaryApi],
  );

  const todayEnquiry = useMemo(
    () => summaryApi?.todayEnquiry ?? summaryApi?.todayEnquiries ?? summaryApi?.enquiryToday ?? 0,
    [summaryApi],
  );

  const summaryCards = useMemo(
    () => [
      {
        title: 'Todays New Orders',
        value: summaryApi?.todayOrders ?? data?.summary?.pendingToday ?? 0,
        icon: AssignmentRoundedIcon,
        variant: 'primary',
        trend: 'New orders added today',
      },
      {
        title: 'Old Pending Orders',
        value: oldPendingOrders,
        icon: AutorenewRoundedIcon,
        variant: 'warning',
        trend: 'Pending orders before today',
      },
      {
        title: 'Todays Delivery',
        value: todayDeliveryCount,
        icon: LocalShippingRoundedIcon,
        variant: 'success',
        trend: 'Deliveries planned or closed today',
      },
      {
        title: 'Todays Revenue',
        value: todayRevenue,
        icon: CurrencyRupeeRoundedIcon,
        variant: 'success',
        trend: 'Revenue recorded today',
      },
      {
        title: 'Today Payment Reciviable',
        value: todayReceivable,
        icon: CreditCardRoundedIcon,
        variant: 'warning',
        trend: 'Amount still to collect',
      },
      {
        title: 'Today Enquiry',
        value: todayEnquiry,
        icon: SupportAgentRoundedIcon,
        variant: 'primary',
        trend: 'Fresh enquiries for today',
      },
    ],
    [data?.summary?.pendingToday, oldPendingOrders, summaryApi, todayDeliveryCount, todayEnquiry, todayReceivable, todayRevenue],
  );

  const assignedTasks = useMemo(() => {
    const taskRows = (tasks || []).filter((task) => toLower(task?.Status) !== 'completed');
    const scopedRows = roleInfo?.isAdmin
      ? taskRows
      : taskRows.filter((task) => toLower(task?.User) === toLower(roleInfo?.userName));

    return scopedRows.sort((a, b) => {
      const dateA = normalizeDateValue(a?.Deadline || a?.CreatedAt || a?.createdAt)?.getTime() || 0;
      const dateB = normalizeDateValue(b?.Deadline || b?.CreatedAt || b?.createdAt)?.getTime() || 0;
      return dateA - dateB;
    });
  }, [roleInfo?.isAdmin, roleInfo?.userName, tasks]);

  const followupRows = useMemo(() => {
    const rows = (followups || []).filter((item) =>
      isWithinNextDays(item?.Followup_date || item?.Deadline || item?.Date, 3),
    );

    return rows.sort((a, b) => {
      const dateA = normalizeDateValue(a?.Followup_date || a?.Deadline || a?.Date)?.getTime() || 0;
      const dateB = normalizeDateValue(b?.Followup_date || b?.Deadline || b?.Date)?.getTime() || 0;
      return dateA - dateB;
    });
  }, [followups]);

  const loading = data?.isOrdersLoading || data?.isTasksLoading;

  return (
    <PageContainer>
      {(loading || summaryLoading || tasksLoading || followupsLoading) ? (
        <LinearProgress sx={{ borderRadius: 1 }} />
      ) : null}
      {data?.loadError ? <ErrorState message={data.loadError} /> : null}

      <Grid container spacing={1.25}>
        {summaryCards.map((card) => (
          <Grid key={card.title} item xs={12} sm={6} md={4} lg={2}>
            <SummaryCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1.25}>
        <Grid item xs={12} lg={5}>
          <SectionCard
            title={roleInfo?.isAdmin ? 'User Wise Attendance' : 'My Attendance'}
            subtitle={roleInfo?.isAdmin ? 'All users attendance for today' : 'Mark attendance and view today status'}
            contentSx={{ p: 1 }}
          >
            {roleInfo?.isAdmin ? <AllAttandance /> : <UserTask />}
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={7}>
          <SectionCard
            title={roleInfo?.isAdmin ? 'Assigned Tasks - All Users' : 'Assigned Tasks'}
            subtitle={roleInfo?.isAdmin ? 'Pending and in-progress tasks across users' : 'Your assigned tasks'}
            contentSx={{ p: 1 }}
          >
            {tasksLoading ? (
              <LoadingState label="Loading assigned tasks" />
            ) : (
              <SmallScrollableTable
                columns={[
                  { key: 'task', label: 'Task' },
                  { key: 'user', label: 'User' },
                  { key: 'status', label: 'Status' },
                  { key: 'deadline', label: 'Deadline' },
                ]}
                rows={assignedTasks}
                emptyLabel="No assigned tasks found."
                maxHeight={320}
                renderRow={(task) => (
                  <TableRow key={task?._id || task?.Usertask_Number || `${task?.User}-${task?.Usertask_name}`} hover>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {task?.Usertask_name || task?.Task_name || task?.Title || 'Untitled Task'}
                      </Typography>
                      {!!task?.Description && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {task.Description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{task?.User || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={task?.Status || 'Pending'}
                        color={toLower(task?.Status) === 'pending' ? 'warning' : 'primary'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatTaskDate(task?.Deadline)}</TableCell>
                  </TableRow>
                )}
              />
            )}
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={1.25}>
        <Grid item xs={12} lg={7}>
          <SectionCard title="My Pending Order" subtitle="Priority pipeline requiring immediate action">
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
            title="Payment Followups - Next 3 Days"
            subtitle="Small scrollable table for near-term collection followups"
            contentSx={{ p: 1 }}
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
                emptyLabel="No payment followups in next 3 days."
                maxHeight={320}
                renderRow={(item, index) => (
                  <TableRow key={item?._id || item?.Paymentfollowup_uuid || `${item?.Customer}-${index}`} hover>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {item?.Customer || item?.Customer_name || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {item?.Title || item?.Remark || 'Follow-up'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {formatMoney(item?.Amount)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {formatFollowupDate(item?.Followup_date || item?.Deadline || item?.Date)}
                    </TableCell>
                  </TableRow>
                )}
              />
            )}
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
};

SmallScrollableTable.defaultProps = {
  rows: [],
  maxHeight: 320,
};
