import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanRefreshTargets, verifyRefresh } from '../src/lib/content/signature';

const SECRET = 'test-secret-value';
const sign = (secret: string, timestamp: string, body: string) => `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;
const body = JSON.stringify({ event: 'post.published', paths: ['/blog/x'], tags: ['post:x'] });

describe('refresh signature', () => {
  const now = 1_800_000_000_000;
  const ts = String(now);

  it('accepts a correctly signed, fresh call', () => {
    expect(verifyRefresh({ secret: SECRET, timestamp: ts, signature: sign(SECRET, ts, body), body, now })).toEqual({ ok: true });
  });
  it('refuses an expired call, in the past or the future', () => {
    const old = String(now - 6 * 60_000);
    expect(verifyRefresh({ secret: SECRET, timestamp: old, signature: sign(SECRET, old, body), body, now })).toEqual({ ok: false, reason: 'expired' });
    const future = String(now + 6 * 60_000);
    expect(verifyRefresh({ secret: SECRET, timestamp: future, signature: sign(SECRET, future, body), body, now })).toEqual({ ok: false, reason: 'expired' });
  });
  it('refuses a tampered body, a wrong secret, a wrong timestamp and a short signature', () => {
    const signature = sign(SECRET, ts, body);
    expect(verifyRefresh({ secret: SECRET, timestamp: ts, signature, body: body.replace('x', 'y'), now })).toEqual({ ok: false, reason: 'bad_signature' });
    expect(verifyRefresh({ secret: 'other', timestamp: ts, signature, body, now })).toEqual({ ok: false, reason: 'bad_signature' });
    expect(verifyRefresh({ secret: SECRET, timestamp: String(now - 1000), signature, body, now })).toEqual({ ok: false, reason: 'bad_signature' });
    expect(verifyRefresh({ secret: SECRET, timestamp: ts, signature: 'sha256=abc', body, now })).toEqual({ ok: false, reason: 'bad_signature' });
  });
  it('refuses unsigned calls and says when no secret is set', () => {
    expect(verifyRefresh({ secret: SECRET, timestamp: '', signature: '', body, now })).toEqual({ ok: false, reason: 'missing' });
    expect(verifyRefresh({ secret: undefined, timestamp: ts, signature: sign(SECRET, ts, body), body, now })).toEqual({ ok: false, reason: 'not_configured' });
  });
  it('keeps only safe paths and tags', () => {
    expect(cleanRefreshTargets({ paths: ['/ok', '//evil.com', 'nope', 5], tags: ['post:a', 'bad tag!', 'posts'] })).toEqual({ paths: ['/ok'], tags: ['post:a', 'posts'] });
  });
});

describe('revalidate route', () => {
  const calls = { tags: [] as string[], paths: [] as string[] };
  beforeEach(() => {
    calls.tags = [];
    calls.paths = [];
    vi.resetModules();
    vi.doMock('next/cache', () => ({ revalidateTag: (t: string) => calls.tags.push(t), revalidatePath: (p: string) => calls.paths.push(p) }));
    process.env.REVALIDATE_SECRET = SECRET;
  });

  const call = async (headers: Record<string, string>, payload = body) => {
    const { POST } = await import('../src/app/api/revalidate/route');
    return POST(new Request('http://localhost/api/revalidate', { method: 'POST', body: payload, headers }));
  };

  it('refreshes tags and paths for a valid call', async () => {
    const t = String(Date.now());
    const res = await call({ 'x-mbr-timestamp': t, 'x-mbr-signature': sign(SECRET, t, body) });
    expect(res.status).toBe(200);
    expect(calls).toEqual({ tags: ['post:x'], paths: ['/blog/x'] });
  });
  it('touches nothing for unsigned, tampered or expired calls', async () => {
    const t = String(Date.now());
    expect((await call({})).status).toBe(401);
    expect((await call({ 'x-mbr-timestamp': t, 'x-mbr-signature': sign(SECRET, t, body) }, body.replace('x', 'y'))).status).toBe(401);
    const old = String(Date.now() - 10 * 60_000);
    expect((await call({ 'x-mbr-timestamp': old, 'x-mbr-signature': sign(SECRET, old, body) })).status).toBe(401);
    expect(calls).toEqual({ tags: [], paths: [] });
  });
});
