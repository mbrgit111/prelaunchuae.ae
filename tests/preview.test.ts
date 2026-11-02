import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = new Map<string, { value: string; options: Record<string, unknown> }>();
let draftOn = false;

vi.mock('next/headers', () => ({
  draftMode: async () => ({ enable: () => (draftOn = true), disable: () => (draftOn = false), get isEnabled() { return draftOn; } }),
  cookies: async () => ({ set: (name: string, value: string, options: Record<string, unknown>) => jar.set(name, { value, options }), delete: (name: string) => jar.delete(name), get: (name: string) => (jar.has(name) ? { value: jar.get(name)!.value } : undefined) }),
}));

const GOOD = 'a'.repeat(32);
const postJson = {
  id: '1', type: 'blog', slug: 'secret-draft', path: '/blog/secret-draft', title: 'Secret draft', excerpt: '', cover: null, category: null, tags: [], readingTime: 1,
  dateline: '', publishedAt: '2026-10-07T00:00:00.000Z', updatedAt: '2026-10-07T00:00:00.000Z', body: { type: 'doc', content: [] }, headings: [],
  seo: { metaTitle: 'x', metaDescription: 'y', canonicalUrl: '', noindex: true }, publisher: { name: 'P', url: 'https://p.example' },
};

beforeEach(() => {
  jar.clear();
  draftOn = false;
  vi.resetModules();
  process.env.CONTENT_API_URL = 'https://api.example.com';
  process.env.CONTENT_SITE_KEY = 'pk_x';
});

const open = async (token: string) => {
  const { GET } = await import('../src/app/api/preview/route');
  return GET(new Request(`https://www.example.com/api/preview?token=${token}`));
};

describe('preview', () => {
  it('turns on draft mode for a good token, never caches, and is never indexable', async () => {
    const seen: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      seen.push({ url, init });
      return new Response(JSON.stringify(postJson), { status: 200 });
    });
    const res = await open(GOOD);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://www.example.com/blog/secret-draft');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-robots-tag')).toContain('noindex');
    expect(draftOn).toBe(true);
    expect(jar.get('mbr_preview')?.options).toMatchObject({ httpOnly: true, sameSite: 'lax', maxAge: 1800 });
    expect(seen[0]!.url).toBe(`https://api.example.com/v1/public/preview/${GOOD}`);
    expect(seen[0]!.init?.cache).toBe('no-store');
  });

  it('refuses a malformed, unknown or expired token and leaves draft mode off', async () => {
    vi.stubGlobal('fetch', async () => new Response('{}', { status: 404 }));
    expect((await open('short')).status).toBe(401);
    expect((await open(GOOD)).status).toBe(401);
    expect(draftOn).toBe(false);
    expect(jar.size).toBe(0);
  });

  it('says "not available" (not "expired") when the API is down', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('down');
    });
    expect((await open(GOOD)).status).toBe(503);
    expect(draftOn).toBe(false);
  });

  it('shows the unpublished post only to a browser with preview on, and only for the right address', async () => {
    vi.stubGlobal('fetch', async (url: string) => (String(url).includes('/preview/') ? new Response(JSON.stringify(postJson), { status: 200 }) : new Response('{}', { status: 404 })));
    const { getPostDetail } = await import('../src/lib/content');
    expect(await getPostDetail('secret-draft')).toBeNull(); // everyone else: not found
    await open(GOOD);
    const seen = await getPostDetail('secret-draft');
    expect(seen).toMatchObject({ kind: 'api', preview: true });
    expect(await getPostDetail('some-other-post')).toBeNull();
  });

  it('exit turns preview off and removes the cookie', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify(postJson), { status: 200 }));
    await open(GOOD);
    const { POST } = await import('../src/app/api/preview/exit/route');
    await POST(new Request('https://www.example.com/api/preview/exit', { method: 'POST' }));
    expect(draftOn).toBe(false);
    expect(jar.has('mbr_preview')).toBe(false);
  });
});
