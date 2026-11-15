import Link from 'next/link';
import { breadcrumbSchema } from '@/lib/schema';
import { JsonLd } from './JsonLd';

/** Breadcrumb trail. Every ground is dark now, so both tones read the same: muted links, gold on hover, the current page in body text. */
export function Breadcrumbs({ items, tone = 'light' }: { items: { name: string; path: string }[]; tone?: 'light' | 'dark' }) {
  return (
    <>
      <JsonLd data={breadcrumbSchema(items)} />
      <nav aria-label="Breadcrumb" data-tone={tone} className="text-[13px] text-muted">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {items.map((it, i) => (
            <li key={it.path} className="flex items-center gap-2">
              {i > 0 ? <span aria-hidden="true" className="text-gold/60">/</span> : null}
              {i === items.length - 1 ? (
                <span aria-current="page" className="text-body">{it.name}</span>
              ) : (
                <Link href={it.path} className="transition-colors hover:text-gold-hover">{it.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
