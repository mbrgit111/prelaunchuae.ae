import Link from 'next/link';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { PageHero } from '@/components/ui/PageHero';
import { RegisterBand } from '@/components/sections/MoreSections';
import type { NumberedPage } from '@/lib/content';
import type { Category } from '@/lib/content/types';
import { copy } from '@/site';
import { ArticleGrid } from './ArticleCard';

/** The address of page n of a list: /blog, /blog/page/2, /blog/page/3 ... */
export const pagePath = (base: string, page: number) => (page <= 1 ? base : `${base}/page/${page}`);

export function CategoryChips({ categories, current, allPath, allLabel = 'All' }: { categories: Pick<Category, 'name' | 'slug' | 'count'>[]; current?: string; allPath: string; allLabel?: string }) {
  const shown = categories.filter((c) => c.count > 0);
  if (shown.length === 0) return null;
  const chip = 'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold';
  return (
    <nav aria-label="Topics" className="mb-8">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link href={allPath} aria-current={current ? undefined : 'page'} className={`${chip} ${current ? 'border-line bg-white text-ink hover:border-ink' : 'border-ink bg-datum text-white'}`}>
            {allLabel}
          </Link>
        </li>
        {shown.map((c) => (
          <li key={c.slug}>
            <Link href={`/category/${c.slug}`} aria-current={current === c.slug ? 'page' : undefined} className={`${chip} ${current === c.slug ? 'border-ink bg-datum text-white' : 'border-line bg-white text-ink hover:border-ink'}`}>
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Plain links, no script: "Load more" goes to the next numbered page, "Newer" goes back. */
export function Pager({ base, page, totalPages, hasNext }: { base: string; page: number; totalPages: number; hasNext: boolean }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="More articles" className="mt-10 flex flex-wrap items-center gap-4">
      {page > 1 ? (
        <Link href={pagePath(base, page - 1)} rel="prev" prefetch={false} className="btn btn-secondary">
          Newer articles
        </Link>
      ) : null}
      {hasNext ? (
        <Link href={pagePath(base, page + 1)} rel="next" prefetch={false} className="btn btn-dark">
          Load more
        </Link>
      ) : null}
      <p className="text-sm text-muted">
        Page {page} of {totalPages}
      </p>
    </nav>
  );
}

export function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card grid max-w-2xl gap-3 p-8">
      <h2 className="text-h3">{title}</h2>
      <div className="text-muted">{children}</div>
    </div>
  );
}

/** Every list page (blog, news, one category, one author) is built from this, so they look and behave the same. */
export function Listing({
  crumbs,
  label,
  title,
  lede,
  data,
  base,
  chips,
  empty,
  before,
}: {
  crumbs: { name: string; path: string }[];
  label: string;
  title: string;
  lede?: React.ReactNode;
  data: NumberedPage;
  base: string;
  chips?: React.ReactNode;
  empty: React.ReactNode;
  before?: React.ReactNode;
}) {
  return (
    <>
      <PageHero crumbs={crumbs} label={label} title={title} lede={lede} />
      <section className="on-sand bg-sand py-14 md:py-20">
        <div className="container-site">
          {before}
          {chips}
          {data.items.length ? (
            <>
              <ArticleGrid cards={data.items} />
              <Pager base={base} page={data.page} totalPages={data.totalPages} hasNext={data.hasNext} />
            </>
          ) : (
            empty
          )}
          <Disclaimer className="mt-10 max-w-3xl">{copy.home.investment.disclaimer}</Disclaimer>
        </div>
      </section>
      <RegisterBand />
    </>
  );
}
