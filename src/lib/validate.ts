export type FieldErrors = Partial<Record<'name' | 'phone' | 'email' | 'consent', string>>;

export const validateName = (v: string) => (v.trim().length < 2 ? 'Please enter your name.' : undefined);
export function validatePhone(v: string) {
  const digits = v.replace(/\D/g, '');
  if (!digits) return 'Please enter your phone number.';
  if (digits.length < 7 || digits.length > 15 || /[^\d\s+()-]/.test(v)) return 'Please enter a valid phone number, with country code.';
  return undefined;
}
export function validateEmail(v: string) {
  if (!v.trim()) return 'Please enter your email address.';
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? undefined : 'Please enter a valid email address.';
}
export function validateLead(v: { name: string; phone: string; email: string; consent: boolean }): FieldErrors {
  const e: FieldErrors = {};
  const n = validateName(v.name);
  const p = validatePhone(v.phone);
  const m = validateEmail(v.email);
  if (n) e.name = n;
  if (p) e.phone = p;
  if (m) e.email = m;
  if (!v.consent) e.consent = 'Please confirm we may contact you.';
  return e;
}
