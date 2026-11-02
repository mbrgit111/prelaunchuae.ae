/** Real links built only from sites/<site>/contact.ts. A missing value gives null, never a made-up number. */
import { config, contact } from '@/site';

/** Show "[... FROM MBR]" markers where a value is missing. Preview only; the live build refuses to run with it on. */
export const showPlaceholders = process.env.PREVIEW_PLACEHOLDERS === 'true';

export const telHref = () => (contact.phone.e164 ? `tel:${contact.phone.e164.replace(/[^\d+]/g, '')}` : null);
export const mailHref = () => (contact.email ? `mailto:${contact.email}` : null);

/** The first message of a WhatsApp chat started from the site. */
export const WA_TEXT = `Hello ${config.name}, I would like advice on new launch projects.`;

/** A WhatsApp chat with the site's number, the first message typed in (the visitor still presses send). */
export const waHref = (text: string = WA_TEXT) => {
  const n = contact.whatsapp?.e164?.replace(/\D/g, '');
  return n ? `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}` : null;
};
