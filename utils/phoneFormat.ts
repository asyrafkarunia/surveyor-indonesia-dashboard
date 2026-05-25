/**
 * Formats an Indonesian phone number for WhatsApp API compatibility.
 * 
 * Handles common Indonesian phone number formats:
 * - "08xxx" → "628xxx" (removes leading 0, adds 62)
 * - "+628xxx" → "628xxx" (removes + sign)
 * - "628xxx" → "628xxx" (already correct)
 * - Non-numeric characters (dashes, spaces, parentheses) are stripped
 * 
 * @param phone - Raw phone number string from user input
 * @returns Formatted phone number ready for WhatsApp API (digits only, starting with 62)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Handle "08xx" → "628xx"
  if (digits.startsWith('0')) {
    digits = '62' + digits.substring(1);
  }

  // If it doesn't start with 62, prepend it (edge case: user typed just "8xxx")
  if (!digits.startsWith('62') && digits.length >= 9) {
    digits = '62' + digits;
  }

  return digits;
}

/**
 * Formats a phone number for display with the +62 prefix.
 * Useful for showing the normalized number to the user.
 * 
 * @param phone - Raw phone number string
 * @returns Display-friendly formatted phone, e.g. "+62 812-9663-4703"
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = formatPhoneForWhatsApp(phone);
  
  if (digits.length < 10) return phone; // too short, return as-is

  // Format: +62 XXX-XXXX-XXXX
  const local = digits.substring(2); // remove '62'
  if (local.length <= 3) return `+62 ${local}`;
  if (local.length <= 7) return `+62 ${local.substring(0, 3)}-${local.substring(3)}`;
  return `+62 ${local.substring(0, 3)}-${local.substring(3, 7)}-${local.substring(7)}`;
}
