import { createHmac, timingSafeEqual } from 'node:crypto';

export const MAX_AGE_MS = 5 * 60 * 1000;

export type SignatureCheck = { ok: true } | { ok: false; reason: 'not_configured' | 'missing' | 'expired' | 'bad_signature' };

/**
 * Checks a refresh call from the MBR desk: header X-MBR-Signature = sha256=HMAC(secret, "<timestamp>.<body>").
 * A call older (or newer) than five minutes is refused, so a captured call cannot be replayed later.
 */
export function verifyRefresh(input: { secret: string | undefined; timestamp: string; signature: string; body: string; now?: number }): SignatureCheck {
  const { secret, timestamp, signature, body, now = Date.now() } = input;
  if (!secret) return { ok: false, reason: 'not_configured' };
  if (!timestamp || !signature) return { ok: false, reason: 'missing' };
  const age = Math.abs(now - Number(timestamp));
  if (!Number.isFinite(age) || age > MAX_AGE_MS) return { ok: false, reason: 'expired' };
  const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`);
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: 'bad_signature' };
  return { ok: true };
}

/** Keeps only addresses and tags that are safe to refresh. */
export function cleanRefreshTargets(payload: { paths?: unknown; tags?: unknown }) {
  const paths = (Array.isArray(payload.paths) ? payload.paths : []).filter(
    (p): p is string => typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') && p.length < 200,
  );
  const tags = (Array.isArray(payload.tags) ? payload.tags : []).filter((t): t is string => typeof t === 'string' && /^[a-z0-9:_-]{1,200}$/i.test(t));
  return { paths: paths.slice(0, 20), tags: tags.slice(0, 20) };
}
