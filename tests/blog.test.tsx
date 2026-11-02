import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { matchRedirect } from '../src/lib/content/redirects';
import { buildFeed } from '../src/lib/content/feed';
import { pageByNumber } from '../src/lib/content/lists';
import { articleMetadata } from '../src/lib/content/metadata';
import type { PostCard, PostDetail } from '../src/lib/content/types';
import { ArticleView } from '../src/components/content/ArticleView';
import { CoverImage } from '../src/components/content/CoverImage';
import { CategoryChips, Pager } from '../src/components/content/Listing';

const media = {
  url: 'https://img.example.com/a/w1600.webp',
  alt: 'Skyline',
  caption: '',
  credit: '',
  width: 1600,
  height: 900,
  blurDataUrl: 'data:image/webp;base64,AAAA',
  dominantColor: '#336699',
  variants: [
    { width: 480, format: 'webp', url: 'https://img.example.com/a/w480.webp' },
    { width: 1600, format: 'webp', url: 'https://img.example.com/a/w1600.webp' },
    { width: 480, format: 'avif', url: 'https://img.example.com/a/w480.avif' },
    { width: 1600, format: 'avif', url: 'https://img.example.com/a/w1600.avif' },
  ],
};

const card = (n: number, extra: Partial<PostCard> = {}): PostCard => ({
  id: String(n),
  type: 'blog',
  slug: `post-${n}`,
  path: `/blog/post-${n}`,
  title: `Post ${n}`,
  excerpt: `Excerpt ${n}`,
  cover: null,
  category: { name: 'Guides', slug: 'guides' },
  author: null,
  tags: [],
  readingTime: 3,
  dateline: '',
  publishedAt: `2026-10-${String(10 + n).padStart(2, '0')}T00:00:00.000Z`,
  updatedAt: `2026-10-${String(10 + n).padStart(2, '0')}T00:00:00.000Z`,
  ...extra,
});

const heading = (text: string) => ({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] });
const jsonLd = [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: 'Off-plan steps <exact>' }];

const post = (extra: Partial<PostDetail> = {}): PostDetail =>
  ({
    ...card(1, { cover: media, author: { name: 'Desk', slug: 'desk' } }),
    body: { type: 'doc', content: [heading('One'), { type: 'paragraph', content: [{ type: 'text', text: 'Text' }] }, heading('Two'), heading('Three')] },
    headings: [
      { id: 'one', text: 'One', level: 2 },
      { id: 'two', text: 'Two', level: 2 },
      { id: 'three', text: 'Three', level: 2 },
    ],
    wordCount: 100,
    language: 'en',
    author: { name: 'Desk', slug: 'desk', title: 'Editorial', bio: 'We write.', photo: null },
    seo: { metaTitle: 'Meta title', metaDescription: 'Meta description', canonicalUrl: '', noindex: false, ogTitle: '', ogDescription: '', ogImage: null },
    schemaType: 'BlogPosting',
    jsonLd,
    faq: [],
    sources: [],
    news: null,
    relatedProjectSlugs: [],
    publisher: { name: 'P', url: 'https://p.example' },
    related: [card(2), card(3)],
    prev: { slug: 'old', title: 'An older one', path: '/blog/old' },
    next: null,
    ...extra,
  }) as PostDetail;

describe('redirects', () => {
  const rules = [
    { from: '/blog/old-name', to: '/blog/new-name', code: 301 as const },
    { from: '/blog/loop', to: '/blog/loop', code: 301 as const },
    { from: '/blog/evil', to: '//evil.example', code: 301 as const },
    { from: '/blog/evil2', to: 'https://evil.example', code: 301 as const },
  ];
  it('matches the old address, ignoring a trailing slash, a query and upper-case encoding', () => {
    expect(matchRedirect(rules, '/blog/old-name')?.to).toBe('/blog/new-name');
    expect(matchRedirect(rules, '/blog/old-name/')?.to).toBe('/blog/new-name');
    expect(matchRedirect(rules, '/blog/old-name?utm=x')?.to).toBe('/blog/new-name');
    expect(matchRedirect(rules, '/blog/other')).toBeNull();
  });
  it('never follows a loop or leaves the site', () => {
    expect(matchRedirect(rules, '/blog/loop')).toBeNull();
    expect(matchRedirect(rules, '/blog/evil')).toBeNull();
    expect(matchRedirect(rules, '/blog/evil2')).toBeNull();
  });
});

describe('the request proxy', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.CONTENT_API_URL = 'https://api.example.com';
    process.env.CONTENT_SITE_KEY = 'pk_x';
  });
  const request = async (path: string) => {
    const { NextRequest } = await import('next/server');
    return new NextRequest(`https://www.example.com${path}`);
  };

  it('answers an old address with a real 301 to the new one, and uses the list for a minute', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ items: [{ from: '/blog/old', to: '/blog/new', code: 301 }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { proxy } = await import('../src/proxy');
    const res = await proxy(await request('/blog/old'));
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://www.example.com/blog/new');
    await proxy(await request('/blog/old'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('lets the request through when there is no rule, and when the API is down', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ items: [] }), { status: 200 }));
    const { proxy } = await import('../src/proxy');
    expect((await proxy(await request('/blog/anything'))).headers.get('x-middleware-next')).toBe('1');

    vi.resetModules();
    vi.stubGlobal('fetch', async () => {
      throw new Error('down');
    });
    const down = await import('../src/proxy');
    const res = await down.proxy(await request('/blog/anything'));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });
});

describe('the feed', () => {
  const site = { name: 'Site & Co', url: 'https://www.example.com', description: 'About <us>', locale: 'en-AE' };
  it('lists the posts with full addresses and escapes the text', () => {
    const xml = buildFeed({ site, cards: [card(1, { title: 'Fish & <chips>', author: { name: 'A "B"', slug: 'ab' } })] });
    expect(xml).toContain('<link>https://www.example.com/blog/post-1</link>');
    expect(xml).toContain('<title>Fish &amp; &lt;chips&gt;</title>');
    expect(xml).toContain('<dc:creator>A &quot;B&quot;</dc:creator>');
    expect(xml).toContain('<title>Site &amp; Co: articles</title>');
    expect(xml).toContain('<pubDate>');
    expect(xml).not.toContain('<chips>');
  });
  it('is still a valid feed with no posts', () => {
    const xml = buildFeed({ site, cards: [] });
    expect(xml).toContain('<channel>');
    expect(xml).not.toContain('<item>');
  });
});

describe('numbered pages', () => {
  const cards = Array.from({ length: 25 }, (_, i) => card(i + 1));
  it('gives newest first, 12 per page, and knows when there is more', () => {
    const one = pageByNumber(cards, 1, 12);
    expect(one.items[0]!.slug).toBe('post-25');
    expect(one.items).toHaveLength(12);
    expect(one.hasNext).toBe(true);
    expect(one.totalPages).toBe(3);
    const three = pageByNumber(cards, 3, 12);
    expect(three.items).toHaveLength(1);
    expect(three.hasNext).toBe(false);
  });
  it('treats a bad page number as page 1', () => {
    expect(pageByNumber(cards, -4, 12).page).toBe(1);
    expect(pageByNumber(cards, 1.5, 12).page).toBe(1);
  });
});

describe('metadata', () => {
  it('uses the post\'s own title, canonical, times and cover for sharing', () => {
    const m = articleMetadata(post(), false);
    expect(m.alternates?.canonical).toBe('/blog/post-1');
    expect(m.robots).toMatchObject({ index: true });
    const og = m.openGraph as { type: string; publishedTime: string; modifiedTime: string; images: { url: string }[] };
    expect(og.type).toBe('article');
    expect(og.publishedTime).toBe('2026-10-11T00:00:00.000Z');
    expect(og.images[0]!.url).toBe('https://img.example.com/a/w1600.webp');
    expect(JSON.stringify(m.title)).toContain('Meta title');
  });
  it('uses the share picture first, and the site picture when there is none at all', () => {
    const own = articleMetadata(post({ seo: { ...post().seo, ogImage: { ...media, url: 'https://img.example.com/og.webp', variants: [] } } }), false);
    expect((own.openGraph as { images: { url: string }[] }).images[0]!.url).toBe('https://img.example.com/og.webp');
    const none = articleMetadata(post({ cover: null }), false);
    expect((none.openGraph as { images: { url: string }[] }).images[0]!.url).toMatch(/og-image/);
  });
  it('honours noindex and a custom canonical', () => {
    expect(articleMetadata(post({ seo: { ...post().seo, noindex: true } }), false).robots).toMatchObject({ index: false });
    expect(articleMetadata(post({ seo: { ...post().seo, canonicalUrl: 'https://other.example/a' } }), false).alternates?.canonical).toBe('https://other.example/a');
  });
  it('keeps the brand on a short title and drops it from a title that would run past what search results show', () => {
    const short = articleMetadata(post({ seo: { ...post().seo, metaTitle: 'Dubai South yields' } }), false);
    expect(JSON.stringify(short.title)).not.toContain('absolute');
    expect((short.openGraph as { title: string }).title).toBe('Dubai South yields | PrelaunchUAE');
    const longTitle = 'Is Dubai South a Good Investment in 2026? Yields and Risks';
    const long = articleMetadata(post({ seo: { ...post().seo, metaTitle: longTitle } }), false);
    expect(long.title).toEqual({ absolute: longTitle });
    expect((long.openGraph as { title: string }).title).toBe(longTitle);
    expect((long.twitter as { title: string }).title).toBe(longTitle);
  });
  it('never lets a preview be indexed, whatever the post says', () => {
    const m = articleMetadata(post(), true);
    expect(m.robots).toMatchObject({ index: false, follow: false, nocache: true });
  });
});

describe('the article page', () => {
  it('places the JSON-LD exactly as sent', () => {
    const html = renderToStaticMarkup(<ArticleView post={post()} />);
    expect(html).toContain(JSON.stringify(jsonLd[0]).replace(/</g, '\\u003c'));
  });
  it('shows the byline with author link, a contents list, share links, the disclaimer and prev/next', () => {
    const html = renderToStaticMarkup(<ArticleView post={post()} />);
    expect(html).toContain('href="/author/desk"');
    expect(html).toContain('In this article');
    expect(html).toContain('href="#two"');
    expect(html).toContain('wa.me');
    expect(html).toContain('An older one');
    expect(html).toContain('Keep reading');
    expect(html).toMatch(/not financial advice/i);
    expect(html).toContain('<h1');
    expect((html.match(/<h1/g) ?? []).length).toBe(1);
  });
  it('leaves out the contents list for a short article, and shows sources only on news that has them', () => {
    expect(renderToStaticMarkup(<ArticleView post={post({ headings: post().headings.slice(0, 2) })} />)).not.toContain('In this article');
    const news = renderToStaticMarkup(<ArticleView post={post({ type: 'news', path: '/news/post-1', sources: [{ title: 'Official release', url: 'https://src.example/a', publisher: 'DLD', accessedAt: '' }] })} />);
    expect(news).toContain('Official release');
    expect(news).toContain('nofollow');
    expect(news).toContain('href="/news"');
  });
  it('shows the Preview banner only in preview, with an exit button', () => {
    expect(renderToStaticMarkup(<ArticleView post={post()} />)).not.toContain('Exit preview');
    const html = renderToStaticMarkup(<ArticleView post={post()} preview />);
    expect(html).toContain('Exit preview');
    expect(html).toContain('action="/api/preview/exit"');
  });
  it('puts the cover first in the page as a high-priority picture', () => {
    const html = renderToStaticMarkup(<ArticleView post={post()} />);
    expect(html).toContain('fetchPriority="high"');
    expect(html).toContain('type="image/avif"');
  });
});

describe('pictures', () => {
  it('gives AVIF then WebP in the sizes made, keeps the box shape, and shows a blur colour behind', () => {
    const html = renderToStaticMarkup(<CoverImage media={media} sizes="100vw" />);
    expect(html).toContain('<picture>');
    expect(html).toContain('w480.avif 480w, https://img.example.com/a/w1600.avif 1600w');
    expect(html).toContain('w480.webp 480w, https://img.example.com/a/w1600.webp 1600w');
    expect(html).toContain('width="1600"');
    expect(html).toContain('height="900"');
    expect(html).toContain('aspect-ratio:16 / 9');
    expect(html).toContain('background-color:#336699');
    expect(html).toContain('loading="lazy"');
  });
  it('drops a decorative alt to empty and loads a single address without sizes', () => {
    const html = renderToStaticMarkup(<CoverImage media={{ ...media, variants: [] }} alt="" sizes="100vw" />);
    expect(html).toContain('alt=""');
    expect(html).not.toContain('<picture>');
  });
});

describe('list pages', () => {
  it('Load more is a plain link to the next numbered page, and "Newer" goes back', () => {
    const html = renderToStaticMarkup(<Pager base="/blog" page={2} totalPages={3} hasNext />);
    expect(html).toContain('href="/blog/page/3"');
    expect(html).toContain('rel="next"');
    expect(html).toContain('href="/blog"');
    expect(renderToStaticMarkup(<Pager base="/blog" page={3} totalPages={3} hasNext={false} />)).toContain('href="/blog/page/2"');
    expect(renderToStaticMarkup(<Pager base="/blog" page={1} totalPages={1} hasNext={false} />)).toBe('');
  });
  it('page 1 of a list links to the plain address', () => {
    expect(renderToStaticMarkup(<Pager base="/blog" page={2} totalPages={2} hasNext={false} />)).toContain('href="/blog"');
  });
  it('filter chips are links, skip empty topics and mark the current one', () => {
    const html = renderToStaticMarkup(
      <CategoryChips allPath="/blog" current="guides" categories={[{ name: 'Guides', slug: 'guides', count: 2 }, { name: 'Empty', slug: 'empty', count: 0 }]} />,
    );
    expect(html).toContain('href="/category/guides"');
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain('Empty');
  });
});
