export default function normalizeWhatsAppNumber(input) {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return '91' + digits;
  return digits;
}
