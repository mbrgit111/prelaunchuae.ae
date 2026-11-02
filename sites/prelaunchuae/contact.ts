import type { ContactConfig } from '../types.ts';

/**
 * THE ONE FILE for the contact details of PrelaunchUAE: phone number and email, nothing else.
 * Header, footer, call and email buttons, schema markup, the contact page and the legal pages all read from here.
 * `npm run check:placeholders` lists anything still missing, and the live (production) build stops while a value is empty.
 */
export const contact: ContactConfig = {
  phone: {
    display: '+971 52 341 7272',
    e164: '+971523417272',
  },
  // Follows the other MBR sites (admin@<domain>). The mailbox must exist on prelaunchuae.com: confirm with MBR (NEEDS-FROM-MBR.md).
  email: 'admin@prelaunchuae.com',
  // Bot number for website WhatsApp chats (call/phone stays separate).
  whatsapp: { e164: '+971554308772' },
};
