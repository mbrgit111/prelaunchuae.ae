/**
 * Blog and news for this site. One place decides where content comes from:
 *
 *   1. the MBR content API (posts written in the desk), cached 10 minutes and refreshed on publish;
 *   2. content-snapshot.json, the copy saved at build time, if the API cannot be reached;
 *   3. data/posts.json, the older articles. They stay until the migration is confirmed, and they show whenever
 *      the API has no post with the same address.
 *
 * On a live site a failing API never replaces a good page with a thinner one: with no snapshot to fall back on,
 * the error is passed up and Next.js keeps serving the last page that worked.
 */
import 'server-only';
import { cookies, draftMode } from 'next/headers';
import { getPosts } from '@/data';
import type { Post } from '@/data';
import { apiSettings, fetchContent, postTag, type ApiResult } from './client';
import { applyFilter, newestFirst, pageByNumber, pageOf, type ListFilter } from './lists';
import { readSnapshot, snapshotHasContent } from './snapshot';
import {
  AuthorSchema,
  CategoryListSchema,
  PostDetailSchema,
  PostListSchema,
  RedirectListSchema,
  SitemapListSchema,
  type Author,
  type Category,
  type ContentSource,
  type PostCard,
  type PostDetail,
  type RedirectRule,
  type SitemapEntry,
} from './types';

export * from './types';
export type { ListFilter } from './lists';
export const PREVIEW_COOKIE = 'mbr_preview';
export const PAGE_SIZE = 12;

const isBuild = () => process.env.NEXT_PHASE === 'phase-production-build';
const isLiveRuntime = () => process.env.NODE_ENV === 'production' && !isBuild();
const apiConfigured = () => Boolean(apiSettings().url && apiSettings().key);

/**
 * The API could not answer. Use the saved snapshot if it has something. On a live site with nothing saved,
 * throw so the last good page stays up. Anywhere else (build, laptop, not set up) the older files are used.
 */
function mustThrow(result: Extract<ApiResult<unknown>, { ok: false }>): boolean {
  return result.status === 0 && result.reason !== 'not_configured' && isLiveRuntime() && apiConfigured();
}

// ---------- The older articles in data/posts.json ----------

const fileCard = (post: Post): PostCard => ({
  id: `file:${post.slug}`,
  type: /news/i.test(post.category) ? 'news' : 'blog',
  slug: post.slug,
  path: `/${/news/i.test(post.category) ? 'news' : 'blog'}/${post.slug}`,
  title: post.title,
  excerpt: post.excerpt,
  cover: post.image ? { url: post.image, alt: post.imageAlt ?? '', caption: '', credit: '', width: 0, height: 0, blurDataUrl: '', dominantColor: '', variants: [] } : null,
  category: { name: post.category, slug: post.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') },
  author: null,
  tags: [],
  readingTime: 1,
  dateline: '',
  publishedAt: post.date.length === 10 ? `${post.date}T00:00:00.000Z` : post.date,
  updatedAt: post.date.length === 10 ? `${post.date}T00:00:00.000Z` : post.date,
});

export const isFileSlug = async (slug: string) => (await getPosts()).some((post) => post.slug === slug);

// ---------- Lists ----------

export type CardSet = { cards: PostCard[]; source: ContentSource };

/** Every published post, newest first: API (or snapshot) posts, then older file articles the API does not replace. */
export async function getAllCards(): Promise<CardSet> {
  let cards: PostCard[] = [];
  let source: ContentSource = 'files';

  let cursor: string | undefined;
  let failure: Extract<ApiResult<unknown>, { ok: false }> | null = null;
  const fromApi: PostCard[] = [];
  for (let page = 0; page < 20; page += 1) {
    const result = await fetchContent(`/posts?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, PostListSchema, { tags: ['posts:list'] });
    if (!result.ok) {
      failure = result;
      break;
    }
    fromApi.push(...result.data.items);
    cursor = result.data.nextCursor ?? undefined;
    if (!cursor) break;
  }

  if (!failure) {
    cards = fromApi;
    source = 'api';
  } else {
    const snap = readSnapshot();
    if (snapshotHasContent(snap)) {
      cards = snap.cards;
      source = 'snapshot';
    } else if (mustThrow(failure)) {
      throw new Error(`content_api_${failure.reason}`);
    }
  }

  const taken = new Set(cards.map((card) => card.slug));
  const older = (await getPosts()).filter((post) => !taken.has(post.slug)).map(fileCard);
  return { cards: [...cards, ...older].sort(newestFirst), source };
}

export type PostPage = { items: PostCard[]; nextCursor: string | null; total: number; source: ContentSource };

export async function listPosts(filter: ListFilter & { cursor?: string; size?: number } = {}): Promise<PostPage> {
  const { cards, source } = await getAllCards();
  const matching = applyFilter(cards, filter);
  const page = pageOf(matching, filter.cursor, filter.size ?? PAGE_SIZE);
  return { ...page, total: matching.length, source };
}

export type NumberedPage = { items: PostCard[]; page: number; totalPages: number; hasNext: boolean; total: number; source: ContentSource };

/** One numbered page (1, 2, 3...). The "Load more" link on a list points at the next number. */
export async function listPostsPage(filter: ListFilter, page: number, size = PAGE_SIZE): Promise<NumberedPage> {
  const { cards, source } = await getAllCards();
  const matching = applyFilter(cards, filter);
  return { ...pageByNumber(matching, page, size), total: matching.length, source };
}

/** Posts that name a project (set in the desk). For the "Reading about this project" block. API only: files and snapshots carry no such link. */
export async function getProjectPosts(projectSlug: string, count = 3): Promise<PostCard[]> {
  if (!/^[a-z0-9-]{1,90}$/.test(projectSlug)) return [];
  const result = await fetchContent(`/posts?limit=${count}&project=${encodeURIComponent(projectSlug)}`, PostListSchema, { tags: ['posts:list'] });
  return result.ok ? result.data.items : [];
}

/** The most recent posts for "latest" blocks on other pages. */
export async function latestPosts(count: number, filter: ListFilter = {}): Promise<PostCard[]> {
  return (await listPosts({ ...filter, size: count })).items;
}

// ---------- One article ----------

export type PostResult =
  | { kind: 'api'; post: PostDetail; source: ContentSource; preview: boolean }
  | { kind: 'file'; post: Post };

export async function getPostDetail(slug: string): Promise<PostResult | null> {
  // A person with a preview link sees the unpublished version, fetched fresh every time and never cached.
  const draft = await draftMode();
  if (draft.isEnabled) {
    const token = (await cookies()).get(PREVIEW_COOKIE)?.value;
    if (token) {
      const preview = await fetchContent(`/preview/${encodeURIComponent(token)}`, PostDetailSchema, { preview: true });
      if (preview.ok && preview.data.slug === slug) return { kind: 'api', post: preview.data, source: 'api', preview: true };
    }
  }

  const result = await fetchContent(`/posts/${encodeURIComponent(slug)}`, PostDetailSchema, { tags: [postTag(slug)] });
  if (result.ok) return { kind: 'api', post: result.data, source: 'api', preview: false };

  if (result.status === 0) {
    const saved = readSnapshot().posts[slug];
    if (saved) return { kind: 'api', post: saved, source: 'snapshot', preview: false };
    if (mustThrow(result) && !(await isFileSlug(slug))) throw new Error(`content_api_${result.reason}`);
  }
  const file = (await getPosts()).find((post) => post.slug === slug);
  return file ? { kind: 'file', post: file } : null;
}

// ---------- Categories, authors, redirects, sitemap ----------

export async function getCategories(): Promise<Category[]> {
  const result = await fetchContent('/categories', CategoryListSchema, { tags: ['posts:categories'] });
  if (result.ok) return result.data.items;
  const saved = readSnapshot().categories;
  if (saved.length) return saved;
  if (mustThrow(result as Extract<ApiResult<unknown>, { ok: false }>)) throw new Error(`content_api_${result.reason}`);
  return [];
}

export async function getAuthor(slug: string): Promise<Author | null> {
  const result = await fetchContent(`/authors/${encodeURIComponent(slug)}`, AuthorSchema, { tags: [`author:${slug}`] });
  if (result.ok) return result.data;
  if (result.status === 404) return null;
  const saved = readSnapshot().authors[slug];
  if (saved) return saved;
  if (mustThrow(result)) throw new Error(`content_api_${result.reason}`);
  return null;
}

export async function getRedirects(): Promise<RedirectRule[]> {
  const result = await fetchContent('/redirects', RedirectListSchema, { tags: ['posts:redirects'] });
  if (result.ok) return result.data.items;
  return readSnapshot().redirects;
}

/** Addresses and last-changed dates of live posts. Older file articles are added when the API does not list them. */
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const result = await fetchContent('/sitemap-posts', SitemapListSchema, { tags: ['posts:sitemap'] });
  let entries: SitemapEntry[] = [];
  if (result.ok) entries = result.data.items;
  else {
    entries = readSnapshot().sitemap;
    if (!entries.length && mustThrow(result as Extract<ApiResult<unknown>, { ok: false }>)) throw new Error(`content_api_${result.reason}`);
  }
  const taken = new Set(entries.map((entry) => entry.path));
  const older = (await getPosts())
    .map(fileCard)
    .filter((card) => !taken.has(card.path))
    .map((card) => ({ path: card.path, type: card.type, lastmod: card.updatedAt }));
  return [...entries, ...older];
}

// ---------- Which source is active ----------

export async function getContentStatus() {
  const settings = apiSettings();
  const probe = await fetchContent('/posts?limit=1', PostListSchema, { preview: true });
  const snap = readSnapshot();
  const { source, cards } = await getAllCards().catch(() => ({ source: 'files' as ContentSource, cards: [] as PostCard[] }));
  return {
    activeSource: source,
    api: { configured: apiConfigured(), url: settings.url ? new URL(settings.url).origin : '', reachable: probe.ok, reason: probe.ok ? 'ok' : probe.reason },
    snapshot: { generatedAt: snap.generatedAt, posts: snap.cards.length },
    files: { posts: (await getPosts()).length },
    shown: { total: cards.length },
  };
}

// ---------- Older callers (sitemap, site map page) ----------

export interface PostCardView {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  updatedAt: string;
  isNews: boolean;
  path: string;
  source: 'api' | 'file';
}

export async function getPostCards(): Promise<PostCardView[]> {
  const { cards } = await getAllCards();
  return cards.map((card) => ({
    slug: card.slug,
    title: card.title,
    excerpt: card.excerpt,
    category: card.type === 'news' ? 'News' : (card.category?.name ?? 'Insights'),
    date: card.publishedAt,
    updatedAt: card.updatedAt,
    isNews: card.type === 'news',
    path: card.path,
    source: card.id.startsWith('file:') ? 'file' : 'api',
  }));
}

/** Is there anything to show on /blog? Never throws: if the API cannot be asked, the link stays (the page has its own empty state). */
export async function hasPosts(): Promise<boolean> {
  try {
    return (await getAllCards()).cards.length > 0;
  } catch {
    return true;
  }
}
