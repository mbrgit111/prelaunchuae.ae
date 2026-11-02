import { NextResponse, type NextRequest } from 'next/server';
import { apiSettings } from '@/lib/content/settings';
import { matchRedirect } from '@/lib/content/redirects';
import type { RedirectRule } from '@/lib/content/types';

/**
 * Sends old article addresses to their new ones with a real 301 (or 302). The rules come from the desk and are kept
 * in memory for a minute, so a visit costs nothing extra. If the list cannot be loaded the request simply carries on.
 */
let cache: { at: number; rules: RedirectRule[] } = { at: 0, rules: [] };
const TTL_MS = 60_000;

async function rules(): Promise<RedirectRule[]> {
  if (Date.now() - cache.at < TTL_MS) return cache.rules;
  const { url, key } = apiSettings();
  if (!url || !key) return cache.rules;
  try {
    const res = await fetch(`${url}/v1/public/redirects`, { headers: { 'X-Site-Key': key, Accept: 'application/json' }, signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const body = (await res.json()) as { items?: RedirectRule[] };
      cache = { at: Date.now(), rules: Array.isArray(body.items) ? body.items : [] };
    } else cache = { ...cache, at: Date.now() - TTL_MS + 10_000 }; // try again in 10 seconds
  } catch {
    cache = { ...cache, at: Date.now() - TTL_MS + 10_000 };
  }
  return cache.rules;
}

export async function proxy(request: NextRequest) {
  const hit = matchRedirect(await rules(), request.nextUrl.pathname);
  if (!hit) return NextResponse.next();
  return NextResponse.redirect(new URL(hit.to, request.url), hit.code === 302 ? 302 : 301);
}

// Only the article paths. Everything else on the site never touches this.
export const config = { matcher: ['/blog/:path+', '/news/:path+'] };
