import { getAllCards } from '@/lib/content';
import { buildFeed } from '@/lib/content/feed';
import { config } from '@/site';

export const revalidate = 600;

/** /feed.xml: the 30 newest articles as an RSS feed, with the same freshness as the pages. */
export async function GET() {
  const { cards } = await getAllCards();
  const xml = buildFeed({
    site: { name: config.name, url: config.url, description: config.description, locale: config.locale },
    cards: cards.slice(0, 30),
  });
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}

