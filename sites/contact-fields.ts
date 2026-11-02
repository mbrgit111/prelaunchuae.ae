/** Which contact values exist, which are required for the live site. Used by `npm run check:placeholders`. */
import type { ContactConfig } from './types.ts';

export interface ContactField {
  key: string;
  label: string;
  required: boolean;
  value: (c: ContactConfig) => unknown;
}

export const contactFields: ContactField[] = [
  { key: 'phone.display', label: 'Phone number (as shown)', required: true, value: (c) => c.phone.display },
  { key: 'phone.e164', label: 'Phone number (dialling format, e.g. +971523417272)', required: true, value: (c) => c.phone.e164 },
  { key: 'email', label: 'Email address', required: true, value: (c) => c.email },
];

export const isFilled = (v: unknown) => v !== null && v !== undefined && v !== '' && v !== 0;
export const contactGaps = (c: ContactConfig) => contactFields.filter((f) => !isFilled(f.value(c)));
