import Link from 'next/link';
import { breadcrumbSchema } from '@/lib/schema';
import { JsonLd } from './JsonLd';

export function Breadcrumbs({ items, tone = 'light' }: { items: { name: string; path: string }[]; tone?: 'light' | 'dark' }) {
  return (
    <>
      <JsonLd data={breadcrumbSchema(items)} />
      <nav aria-label="Breadcrumb" className={`text-sm ${tone === 'dark' ? 'text-white/70' : 'text-muted'}`}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {items.map((it, i) => (
            <li key={it.path} className="flex items-center gap-2">
              {i > 0 ? <span aria-hidden="true">/</span> : null}
              {i === items.length - 1 ? (
                <span aria-current="page" className={tone === 'dark' ? 'text-white' : 'text-ink'}>{it.name}</span>
              ) : (
                <Link href={it.path} className={tone === 'dark' ? 'hover:text-plot' : 'hover:text-survey-deep'}>{it.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
