import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SnapshotSchema } from '../src/lib/content/types';

let snapshot = SnapshotSchema.parse({ generatedAt: null });
vi.mock('next/headers', () => ({ draftMode: async () => ({ isEnabled: false }), cookies: async () => ({ get: () => undefined }) }));
vi.mock('../src/lib/content/snapshot', async () => ({
  readSnapshot: () => snapshot,
  snapshotHasContent: (s: typeof snapshot) => s.generatedAt !== null && (s.cards.length > 0 || Object.keys(s.posts).length > 0),
}));

const card = {
  id: 'snap1', type: 'blog', slug: 'saved-post', path: '/blog/saved-post', title: 'Saved post', excerpt: 'From the snapshot', cover: null, category: null, author: null,
  tags: [], readingTime: 1, dateline: '', publishedAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z',
};
const detail = { ...card, body: { type: 'doc', content: [] }, headings: [], seo: { metaTitle: 'a', metaDescription: 'b', canonicalUrl: '', noindex: false }, publisher: { name: 'P', url: 'https://p.example' } };

const down = () => vi.stubGlobal('fetch', async () => { throw new Error('connection refused'); });
const env = process.env as Record<string, string | undefined>;

beforeEach(() => {
  vi.resetModules();
  env.CONTENT_API_URL = 'https://api.example.com';
  env.CONTENT_SITE_KEY = 'pk_x';
  env.NODE_ENV = 'test';
  env.NEXT_PHASE = 'phase-production-build';
  snapshot = SnapshotSchema.parse({ generatedAt: null });
});
afterEach(() => vi.unstubAllGlobals());

describe('when the content API is down', () => {
  it('uses the saved snapshot for the list and for one article', async () => {
    snapshot = SnapshotSchema.parse({ generatedAt: '2026-10-01T00:00:00.000Z', cards: [card], posts: { 'saved-post': detail } });
    down();
    const { getAllCards, getPostDetail } = await import('../src/lib/content');
    const set = await getAllCards();
    expect(set.source).toBe('snapshot');
    expect(set.cards.map((c) => c.slug)).toContain('saved-post');
    expect(await getPostDetail('saved-post')).toMatchObject({ kind: 'api', source: 'snapshot' });
  });

  it('uses the older article files when there is no snapshot (build, laptop)', async () => {
    down();
    const { getAllCards } = await import('../src/lib/content');
    expect((await getAllCards()).source).toBe('files');
  });

  it('on the live site with nothing saved, passes the error up so the last good page stays', async () => {
    env.NODE_ENV = 'production';
    env.NEXT_PHASE = undefined;
    down();
    const { getAllCards, getPostDetail } = await import('../src/lib/content');
    await expect(getAllCards()).rejects.toThrow(/content_api_unreachable/);
    await expect(getPostDetail('anything-new')).rejects.toThrow();
  });

  it('uses the live MBR backend and the site key when no API settings are given', async () => {
    env.NODE_ENV = 'production';
    env.CONTENT_API_URL = '';
    env.LEAD_API_URL = '';
    env.NEXT_PUBLIC_LEAD_API_URL = '';
    env.CONTENT_SITE_KEY = '';
    env.LEAD_SITE_KEY = '';
    env.NEXT_PUBLIC_LEAD_SITE_KEY = '';
    const { apiSettings, LIVE_API } = await import('../src/lib/content/settings');
    expect(apiSettings()).toEqual({ url: LIVE_API.url, key: LIVE_API.key });
  });

  it('prefers the API when it answers, and still lists older file articles it does not replace', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ items: [card], nextCursor: null }), { status: 200 }));
    const { getAllCards } = await import('../src/lib/content');
    const set = await getAllCards();
    expect(set.source).toBe('api');
    expect(set.cards[0]!.id).toBeDefined();
    expect(set.cards.some((c) => c.slug === 'saved-post')).toBe(true);
  });

  it('treats a changed reply shape as "down", not as a broken page', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ items: [{ nonsense: true }], nextCursor: null }), { status: 200 }));
    const { getAllCards } = await import('../src/lib/content');
    expect((await getAllCards()).source).toBe('files');
  });
});
