import type { ContactConfig } from '../types.ts';

/**
 * Contact details of PrelaunchUAE. DECIDED 3 Nov 2026 (MBR): no phone number, no WhatsApp, no email and no office address are
 * published. The only way to reach PrelaunchUAE is the enquiry form. Every button, footer line, schema field and legal line that
 * reads these values hides itself while they are null, so adding a value here would bring that channel back everywhere.
 */
export const contact: ContactConfig = {
  phone: { display: null, e164: null },
  email: null,
  whatsapp: { e164: null },
};
