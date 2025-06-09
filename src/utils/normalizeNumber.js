// src/utils/normalizeNumber.js
export default function normalizeWhatsAppNumber(number) {
  number = String(number).trim().replace(/\D/g, '');
  if (number.startsWith('91')) return number;
  return '91' + number.replace(/^0+/, '');
}
