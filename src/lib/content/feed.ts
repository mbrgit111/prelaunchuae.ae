import type { PostCard } from './types';

export const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** RSS 2.0, built from the list cards. Plain function so it can be tested. Only addresses on the site itself are used as links. */
export function buildFeed({ site, cards }: { site: { name: string; url: string; description: string; locale: string }; cards: PostCard[] }): string {
  const abs = (path: string) => new URL(path, site.url).toString();
  const newest = cards[0]?.updatedAt ?? cards[0]?.publishedAt;
  const items = cards
    .map(
      (card) => `    <item>
      <title>${escapeXml(card.title)}</title>
      <link>${escapeXml(abs(card.path))}</link>
      <guid isPermaLink="true">${escapeXml(abs(card.path))}</guid>
      <pubDate>${new Date(card.publishedAt).toUTCString()}</pubDate>
      ${card.excerpt ? `<description>${escapeXml(card.excerpt)}</description>` : ''}
      ${card.category ? `<category>${escapeXml(card.category.name)}</category>` : ''}
      ${card.author ? `<dc:creator>${escapeXml(card.author.name)}</dc:creator>` : ''}
    </item>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(site.name)}: articles</title>
    <link>${escapeXml(site.url)}</link>
    <description>${escapeXml(site.description)}</description>
    <language>${escapeXml(site.locale)}</language>
    ${newest ? `<lastBuildDate>${new Date(newest).toUTCString()}</lastBuildDate>` : ''}
    <atom:link href="${escapeXml(abs('/feed.xml'))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}
