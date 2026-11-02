/**
 * Plain functions for filtering and paging a list of posts. No server code, so they are easy to test.
 * The page marker ("cursor") is the date and address of the last post shown, so it stays valid when new posts arrive.
 */
import type { PostCard } from './types';

export type ListFilter = { type?: 'blog' | 'news'; category?: string; author?: string; tag?: string };

export const encodeCursor = (card: Pick<PostCard, 'publishedAt' | 'slug'>) =>
  Buffer.from(`${card.publishedAt}|${card.slug}`, 'utf8').toString('base64url');

export function decodeCursor(raw: string | undefined): { at: string; slug: string } | null {
  if (!raw || raw.length > 300) return null;
  try {
    const [at, slug] = Buffer.from(raw, 'base64url').toString('utf8').split('|');
    return at && slug ? { at, slug } : null;
  } catch {
    return null;
  }
}

export const newestFirst = (a: PostCard, b: PostCard) => b.publishedAt.localeCompare(a.publishedAt) || b.slug.localeCompare(a.slug);

export function applyFilter(cards: PostCard[], filter: ListFilter): PostCard[] {
  return cards.filter(
    (card) =>
      (!filter.type || card.type === filter.type) &&
      (!filter.category || card.category?.slug === filter.category) &&
      (!filter.author || card.author?.slug === filter.author) &&
      (!filter.tag || card.tags.includes(filter.tag)),
  );
}

/** One page of a newest-first list that starts after the marker. */
export function pageOf(cards: PostCard[], cursor: string | undefined, size: number): { items: PostCard[]; nextCursor: string | null } {
  const sorted = [...cards].sort(newestFirst);
  const marker = decodeCursor(cursor);
  const start = marker
    ? sorted.findIndex((card) => card.publishedAt < marker.at || (card.publishedAt === marker.at && card.slug < marker.slug))
    : 0;
  const rest = start === -1 ? [] : sorted.slice(start);
  const items = rest.slice(0, size);
  const last = items[items.length - 1];
  return { items, nextCursor: rest.length > size && last ? encodeCursor(last) : null };
}

/** One numbered page of a newest-first list. Page 1 is the first. Used for plain "Load more" links that work without JavaScript. */
export function pageByNumber(cards: PostCard[], page: number, size: number): { items: PostCard[]; page: number; totalPages: number; hasNext: boolean } {
  const sorted = [...cards].sort(newestFirst);
  const totalPages = Math.max(1, Math.ceil(sorted.length / size));
  const safe = Number.isInteger(page) && page >= 1 ? page : 1;
  return { items: sorted.slice((safe - 1) * size, safe * size), page: safe, totalPages, hasNext: safe < totalPages };
}
