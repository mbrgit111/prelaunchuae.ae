import { describe, expect, it } from 'vitest';
import { applyFilter, decodeCursor, encodeCursor, pageOf } from '../src/lib/content/lists';
import type { PostCard } from '../src/lib/content/types';

const card = (n: number, extra: Partial<PostCard> = {}): PostCard => ({
  id: `id${n}`,
  type: 'blog',
  slug: `post-${n}`,
  path: `/blog/post-${n}`,
  title: `Post ${n}`,
  excerpt: '',
  cover: null,
  category: null,
  author: null,
  tags: [],
  readingTime: 1,
  dateline: '',
  publishedAt: `2026-10-${String(n).padStart(2, '0')}T00:00:00.000Z`,
  updatedAt: `2026-10-${String(n).padStart(2, '0')}T00:00:00.000Z`,
  ...extra,
});

describe('lists', () => {
  const cards = [1, 2, 3, 4, 5].map((n) => card(n, n % 2 ? { category: { name: 'Guides', slug: 'guides' } } : { type: 'news' }));

  it('pages newest first and the marker continues where the last page ended', () => {
    const first = pageOf(cards, undefined, 2);
    expect(first.items.map((c) => c.slug)).toEqual(['post-5', 'post-4']);
    const second = pageOf(cards, first.nextCursor ?? undefined, 2);
    expect(second.items.map((c) => c.slug)).toEqual(['post-3', 'post-2']);
    const third = pageOf(cards, second.nextCursor ?? undefined, 2);
    expect(third.items.map((c) => c.slug)).toEqual(['post-1']);
    expect(third.nextCursor).toBeNull();
  });

  it('keeps its place when a newer post arrives between pages', () => {
    const first = pageOf(cards, undefined, 2);
    const withNew = [...cards, card(9)];
    expect(pageOf(withNew, first.nextCursor ?? undefined, 2).items.map((c) => c.slug)).toEqual(['post-3', 'post-2']);
  });

  it('filters by type and category, and ignores a broken marker', () => {
    expect(applyFilter(cards, { type: 'news' }).map((c) => c.slug)).toEqual(['post-2', 'post-4']);
    expect(applyFilter(cards, { category: 'guides' })).toHaveLength(3);
    expect(decodeCursor('%%%')).toBeNull();
    expect(pageOf(cards, 'garbage', 2).items[0]?.slug).toBe('post-5');
    expect(decodeCursor(encodeCursor(card(3)))).toEqual({ at: card(3).publishedAt, slug: 'post-3' });
  });
});
