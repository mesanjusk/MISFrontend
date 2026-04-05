export const WHATSAPP_TEMPLATES = {
  PAYMENT_RECEIVED: 'payment_received_sk',
  ORDER_CONFIRMATION: 'payment_received_sk',
  FOLLOWUP: 'payment_received_sk',
};

export const DEFAULT_TEMPLATE_LANGUAGE = 'en_US';

export const buildPaymentReceivedParameters = ({
  customerName = 'Customer',
  actionLabel = 'payment',
  date = new Date().toLocaleDateString('en-IN'),
  amount = '0',
  description = 'Payment received',
} = {}) => [
  String(customerName || 'Customer'),
  String(actionLabel || 'payment'),
  String(date || new Date().toLocaleDateString('en-IN')),
  String(amount ?? '0'),
  String(description || 'Payment received'),
];
