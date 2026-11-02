// No server-only marker here: the redirect proxy needs these two values too.

/**
 * The shared MBR backend: the lead desk, the blog and the project catalogue. Both values are public by design (the key
 * travels with every form), so the live ones are the defaults. Environment variables override them.
 */
export const LIVE_API = { url: 'https://mbrbackend.wellnessz.in', key: 'pk_placeholder_netcapital' } as const;

/** The API address and key. While developing on a laptop the local API (npm run dev:memory in mbr-lead-api) is the default. */
export function apiSettings() {
  const url = process.env.CONTENT_API_URL || process.env.LEAD_API_URL || process.env.NEXT_PUBLIC_LEAD_API_URL || '';
  const key = process.env.CONTENT_SITE_KEY || process.env.LEAD_SITE_KEY || process.env.NEXT_PUBLIC_LEAD_SITE_KEY || '';
  const dev = process.env.NODE_ENV !== 'production';
  return {
    url: (url || (dev ? 'http://localhost:4000' : LIVE_API.url)).replace(/\/$/, ''),
    key: key || LIVE_API.key,
  };
}
