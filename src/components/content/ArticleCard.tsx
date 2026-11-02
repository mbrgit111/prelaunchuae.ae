import Link from 'next/link';
import type { PostCard } from '@/lib/content/types';
import { CoverImage } from './CoverImage';

export const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dubai' });
export const longDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dubai' });

/** One article in a grid. The whole card is one link (the title), with the cover as a decoration. */
export function ArticleCard({ card, priority = false, headingLevel = 'h2' }: { card: PostCard; priority?: boolean; headingLevel?: 'h2' | 'h3' }) {
  const H = headingLevel;
  const label = card.type === 'news' ? `News${card.dateline ? ` · ${card.dateline}` : ''}` : (card.category?.name ?? 'Insights');
  return (
    <article className="card card-lift group relative flex h-full flex-col overflow-hidden">
      {card.cover ? (
        <CoverImage media={card.cover} alt="" sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" priority={priority} aspect="16 / 10" className="rounded-t-[inherit]" />
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="text-label">
          {label} · <time dateTime={card.publishedAt}>{shortDate(card.publishedAt)}</time>
        </p>
        <H className="text-h3">
          <Link href={card.path} className="after:absolute after:inset-0">
            {card.title}
          </Link>
        </H>
        {card.excerpt ? <p className="text-[15px] text-muted">{card.excerpt}</p> : null}
        <p className="mt-auto pt-1 text-sm text-muted">{card.readingTime} min read</p>
      </div>
    </article>
  );
}

export function ArticleGrid({ cards, headingLevel = 'h2' }: { cards: PostCard[]; headingLevel?: 'h2' | 'h3' }) {
  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, i) => (
        <li key={card.id}>
          <ArticleCard card={card} priority={i < 2} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
