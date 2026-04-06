export const WHATSAPP_TEMPLATES = {
  AMOUNT_RECEIVED: 'amount_received_sk',
  AMOUNT_PAID: 'amount_payment_sk',
  ORDER_CONFIRMATION: 'order_new_sk',
  ORDER_COMPLETED: 'order_completed_sk',
  FOLLOWUP_FRIENDLY: 'followup_friendly_sk',
  FOLLOWUP_DUE_TODAY: 'followup_due_today_sk',
  PURCHASE_ORDER: 'purchase_order_sk',
  ATTENDANCE_MARKED: 'attendance_marked_sk',
  TASK_ASSIGNED: 'task_assigned_sk',
  OPENING_BALANCE_PAYABLE: 'opening_balance_payable_sk',
  OPENING_BALANCE_RECEIVABLE: 'opening_balance_receivable_sk',
};

export const DEFAULT_TEMPLATE_LANGUAGE = 'en_US';

export const buildAmountReceivedParameters = ({
  customerName = 'Customer',
  date = new Date().toLocaleDateString('en-IN'),
  amount = '0',
  reference = '-',
  description = 'Amount received',
} = {}) => [
  String(customerName || 'Customer'),
  String(date || new Date().toLocaleDateString('en-IN')),
  String(amount ?? '0'),
  String(reference || '-'),
  String(description || 'Amount received'),
];

export const buildAmountPaidParameters = ({
  customerName = 'Customer',
  date = new Date().toLocaleDateString('en-IN'),
  amount = '0',
  reference = '-',
  description = 'Amount paid',
} = {}) => [
  String(customerName || 'Customer'),
  String(date || new Date().toLocaleDateString('en-IN')),
  String(amount ?? '0'),
  String(reference || '-'),
  String(description || 'Amount paid'),
];

export const buildOrderNewParameters = ({
  customerName = 'Customer',
  orderNumber = '-',
  date = new Date().toLocaleDateString('en-IN'),
  amount = '0',
  details = 'Order details',
} = {}) => [
  String(customerName || 'Customer'),
  String(orderNumber || '-'),
  String(date || new Date().toLocaleDateString('en-IN')),
  String(amount ?? '0'),
  String(details || 'Order details'),
];

export const buildOrderCompletedParameters = ({
  customerName = 'Customer',
  orderNumber = '-',
} = {}) => [
  String(customerName || 'Customer'),
  String(orderNumber || '-'),
];

export const buildFollowupFriendlyParameters = ({
  customerName = 'Customer',
  amount = '0',
  expectedDate = new Date().toLocaleDateString('en-IN'),
  reference = '-',
} = {}) => [
  String(customerName || 'Customer'),
  String(amount ?? '0'),
  String(expectedDate || new Date().toLocaleDateString('en-IN')),
  String(reference || '-'),
];

export const buildFollowupDueTodayParameters = ({
  customerName = 'Customer',
  amount = '0',
  dueDate = new Date().toLocaleDateString('en-IN'),
  reference = '-',
} = {}) => [
  String(customerName || 'Customer'),
  String(amount ?? '0'),
  String(dueDate || new Date().toLocaleDateString('en-IN')),
  String(reference || '-'),
];

export const buildPurchaseOrderParameters = ({
  vendorName = 'Vendor',
  poNumber = '-',
  date = new Date().toLocaleDateString('en-IN'),
  amount = '0',
  details = 'Purchase details',
} = {}) => [
  String(vendorName || 'Vendor'),
  String(poNumber || '-'),
  String(date || new Date().toLocaleDateString('en-IN')),
  String(amount ?? '0'),
  String(details || 'Purchase details'),
];

export const buildAttendanceMarkedParameters = ({
  employeeName = 'Team Member',
  date = new Date().toLocaleDateString('en-IN'),
  checkInTime = '-',
  status = 'Present',
} = {}) => [
  String(employeeName || 'Team Member'),
  String(date || new Date().toLocaleDateString('en-IN')),
  String(checkInTime || '-'),
  String(status || 'Present'),
];

export const buildTaskAssignedParameters = ({
  employeeName = 'Team Member',
  taskTitle = 'New Task',
  assignedDate = new Date().toLocaleDateString('en-IN'),
  dueDate = '-',
  assignedBy = 'Admin',
} = {}) => [
  String(employeeName || 'Team Member'),
  String(taskTitle || 'New Task'),
  String(assignedDate || new Date().toLocaleDateString('en-IN')),
  String(dueDate || '-'),
  String(assignedBy || 'Admin'),
];

export const buildOpeningBalancePayableParameters = ({
  customerName = 'Customer',
  asOnDate = new Date().toLocaleDateString('en-IN'),
  amount = '0',
  description = 'Opening balance payable',
} = {}) => [
  String(customerName || 'Customer'),
  String(asOnDate || new Date().toLocaleDateString('en-IN')),
  String(amount ?? '0'),
  String(description || 'Opening balance payable'),
];

export const buildOpeningBalanceReceivableParameters = ({
  customerName = 'Customer',
  asOnDate = new Date().toLocaleDateString('en-IN'),
  amount = '0',
  description = 'Opening balance receivable',
} = {}) => [
  String(customerName || 'Customer'),
  String(asOnDate || new Date().toLocaleDateString('en-IN')),
  String(amount ?? '0'),
  String(description || 'Opening balance receivable'),
];