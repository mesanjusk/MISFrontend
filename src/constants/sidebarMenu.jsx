import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import { ROUTES } from './routes';

export const SIDEBAR_GROUPS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: ROUTES.HOME, icon: <DashboardRoundedIcon fontSize="small" />, roles: ['all'] },
      { label: 'Attendance', path: ROUTES.ATTENDANCE, icon: <EventAvailableRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner', 'Designer', 'DataEntry', 'OfficeStaff'] },
      { label: 'Order Tasks', path: ROUTES.PENDING_TASKS, icon: <AssignmentRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'My Day', path: ROUTES.MY_TASKS, icon: <AssignmentRoundedIcon fontSize="small" />, roles: ['all'] },
    ],
  },
  {
    label: 'Operations Center',
    items: [
      { label: 'New Order', path: ROUTES.ORDERS_NEW, icon: <AddShoppingCartRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner', 'DataEntry'] },
      { label: 'Order Board', path: ROUTES.ORDERS_BOARD, icon: <AssignmentRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner', 'Designer'] },
      { label: 'Purchase Orders', path: ROUTES.PURCHASE_ORDERS, icon: <RequestQuoteRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'Operations Center', path: ROUTES.BUSINESS_CONTROL, icon: <HubRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'New Enquiry', path: ROUTES.ENQUIRIES_NEW, icon: <AddShoppingCartRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner', 'DataEntry'] },
      { label: 'Deliveries', path: '/allDelivery', icon: <AssignmentRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner', 'OfficeStaff'] },
      { label: 'Receipt Entry', path: ROUTES.RECEIPT, icon: <ReceiptLongRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner', 'Accounts'] },
      { label: 'Payment Entry', path: ROUTES.PAYMENT, icon: <PaymentsRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner', 'Accounts'] },
      { label: 'Record Expense', path: ROUTES.ADD_PAYABLE, icon: <PaymentsRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner', 'Accounts'] },
      { label: 'Record Income', path: ROUTES.ADD_RECEIVABLE, icon: <PaymentsRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner', 'Accounts'] },
      { label: 'Payment Reminders', path: ROUTES.FOLLOWUPS, icon: <ReceiptLongRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner', 'Accounts'] },
      { label: 'Add Note', path: ROUTES.ADD_NOTE, icon: <AssignmentRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
    ],
  },
  {
    label: 'Masters',
    items: [
      { label: 'Add Customer', path: ROUTES.ADD_CUSTOMER, icon: <PersonAddRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'Add User', path: ROUTES.ADD_USER, icon: <GroupRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'Add User Group', path: ROUTES.ADD_USER_GROUP, icon: <GroupRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'Add Item', path: ROUTES.ADD_ITEM, icon: <Inventory2RoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'Add Item Group', path: ROUTES.ADD_ITEM_GROUP, icon: <Inventory2RoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'Add Task Master', path: ROUTES.ADD_TASK, icon: <AssignmentRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'Add Task Group', path: ROUTES.ADD_TASK_GROUP, icon: <AssignmentRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'Vendors', path: ROUTES.ALL_VENDORS, icon: <StorefrontRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
    ],
  },
  {
    label: 'WhatsApp',
    items: [
      { label: 'WhatsApp', path: ROUTES.WHATSAPP, icon: <ChatRoundedIcon fontSize="small" />, roles: ['all'] },
      { label: 'Flow Builder', path: ROUTES.FLOW_BUILDER, icon: <HubRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'], adminOnly: true },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Orders Report', path: ROUTES.REPORTS_ORDERS, icon: <AnalyticsRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'Account Book', path: ROUTES.ALL_TRANSACTION, icon: <AnalyticsRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner', 'Accounts'] },
      { label: 'Cash Ledger', path: ROUTES.CASH_LEDGER, icon: <AnalyticsRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner', 'Accounts'] },
      { label: 'Aging Report', path: ROUTES.AGING_REPORT, icon: <AnalyticsRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner', 'Accounts'] },
      { label: 'Customers Report', path: ROUTES.REPORTS_CUSTOMERS, icon: <AnalyticsRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'Payments Report', path: ROUTES.PAYMENT_REPORT, icon: <AnalyticsRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner', 'Accounts'] },
      { label: 'Items Report', path: ROUTES.REPORTS_ITEMS, icon: <AnalyticsRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'Tasks Report', path: ROUTES.REPORTS_TASKS, icon: <AnalyticsRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'Users Report', path: ROUTES.REPORTS_USERS, icon: <AnalyticsRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'Vendor Bills', path: ROUTES.VENDOR_BILLS, icon: <AnalyticsRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
      { label: 'All Vendors', path: ROUTES.ALL_VENDORS, icon: <AnalyticsRoundedIcon fontSize="small" />, roles: ['Admin', 'Owner'] },
    ],
  },
];
