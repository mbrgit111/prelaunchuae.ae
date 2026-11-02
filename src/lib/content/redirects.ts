/**
 * Redirect matching, as plain functions (no server code), so the request proxy and the tests share them.
 * The rules come from the desk: when an article's address changes, the old address is sent to the new one.
 */
import type { RedirectRule } from './types';

const clean = (path: string) => {
  const noQuery = path.split('?')[0] ?? path;
  const trimmed = noQuery.length > 1 ? noQuery.replace(/\/+$/, '') : noQuery;
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
};

/** The rule for this address, or null. Only same-site paths are ever followed, and a rule that points at itself is ignored. */
export function matchRedirect(rules: RedirectRule[], pathname: string): RedirectRule | null {
  const here = clean(pathname);
  for (const rule of rules) {
    if (!rule.to.startsWith('/') || rule.to.startsWith('//')) continue;
    if (clean(rule.from) === here && clean(rule.to) !== here) return rule;
  }
  return null;
}
