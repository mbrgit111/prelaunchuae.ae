import 'server-only';
import { NextResponse } from 'next/server';
import { config } from '@/site';
import { apiSettings } from '@/lib/content/settings';

const FAIL = 'We could not send your details. Please try again in a moment.';

/**
 * Same-origin forwarder: the browser posts to this site, the server passes the enquiry to the MBR lead desk with the
 * site's key. The desk only accepts origins registered for the site, so the request names this site's own address.
 */
export async function forwardLead(request: Request, path: '/v1/public/leads' | '/v1/public/partial-leads') {
  const { url, key } = apiSettings();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { message: FAIL } }, { status: 400 });
  }
  const origin = process.env.NODE_ENV === 'production' ? new URL(config.url).origin : 'http://localhost:3000';
  try {
    const res = await fetch(`${url}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Site-Key': key,
        Origin: origin,
        ...(path === '/v1/public/leads' ? { 'Idempotency-Key': request.headers.get('idempotency-key') || crypto.randomUUID() } : {}),
        ...(request.headers.get('user-agent') ? { 'User-Agent': request.headers.get('user-agent')! } : {}),
        ...(request.headers.get('referer') ? { Referer: request.headers.get('referer')! } : {}),
      },
      // The site's tag is set here, so a form can never file an enquiry under another site.
      body: JSON.stringify({ ...(body as Record<string, unknown>), siteTag: config.contentKey }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    if (!res.ok) return NextResponse.json({ error: { message: data?.error?.message || FAIL } }, { status: res.status });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: { message: FAIL } }, { status: 502 });
  }
}
