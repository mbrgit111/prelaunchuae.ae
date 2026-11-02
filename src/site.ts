/**
 * Picks the site this deployment serves from NEXT_PUBLIC_SITE (default: prelaunchuae).
 * Add another domain by creating sites/<key>/ and registering it below.
 */
import type { Site } from '@sites/types';
import prelaunchuae from '@sites/prelaunchuae';

const registry: Record<string, Site> = { prelaunchuae };

const key = process.env.NEXT_PUBLIC_SITE ?? 'prelaunchuae';
const site = registry[key];
if (!site) throw new Error(`Unknown NEXT_PUBLIC_SITE "${key}". Register it in src/site.ts.`);

export default site;
export const config = site.config;
export const contact = site.contact;
export const compliance = site.compliance;
export const testimonials = site.testimonials;
export const copy = site.copy;
export const imagery = site.imagery;
