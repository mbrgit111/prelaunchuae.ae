/** Reads UTM tags from the address bar and keeps the first ones seen in this tab (sessionStorage, no cookies). */
import type { Utm } from './submitLead';

const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
const STORE = 'nc-utm';

export function readUtm(): Utm {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const fromUrl: Utm = {};
  for (const k of KEYS) {
    const v = params.get(k);
    if (v) fromUrl[k] = v.slice(0, 200);
  }
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORE) ?? '{}') as Utm;
    if (Object.keys(fromUrl).length && !Object.keys(stored).length) sessionStorage.setItem(STORE, JSON.stringify(fromUrl));
    return Object.keys(fromUrl).length ? fromUrl : stored;
  } catch {
    return fromUrl;
  }
}
