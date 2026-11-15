import Image from 'next/image';
import Link from 'next/link';
import type { Area } from '@/data/areas';
import { aed } from '@/lib/format';
import { DeferredImage } from './DeferredImage';
import { Icon } from './Icon';

/** One community: its cover, name, launches, lowest price and completion years. */
export function AreaCard({ area, index = 0, headingLevel = 'h3', defer = true }: { area: Area; index?: number; headingLevel?: 'h2' | 'h3'; defer?: boolean }) {
  const H = headingLevel;
  const Img = defer ? DeferredImage : Image;
  const years = area.handoverFrom ? (area.handoverFrom === area.handoverTo ? String(area.handoverFrom) : `${area.handoverFrom}–${area.handoverTo}`) : null;
  return (
    <article data-reveal style={{ '--i': index % 3 } as React.CSSProperties} className="card card-lift group relative flex h-full min-w-0 flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        {area.cover ? (
          <Img src={area.cover.src} alt="" fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="img-zoom object-cover" />
        ) : (
          <div aria-hidden="true" className="gold-grid absolute inset-0" />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-page/90 via-page/20 to-transparent" />
        <p className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3 text-white">
          <span className="text-figure text-[40px] leading-none text-gold">{area.selling || area.projects.length}</span>
          <span className="pb-1 text-right text-[11px] font-bold uppercase tracking-[0.16em] text-body">{area.selling ? 'launching now' : 'coming soon'}</span>
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <H className="text-h3 transition-colors group-hover:text-gold-hover">
          <Link href={`/areas/${area.slug}`} className="after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none">{area.name}</Link>
        </H>
        <p className="text-sm text-muted">
          {area.emirate} · {area.developers.length} developer{area.developers.length === 1 ? '' : 's'}{years ? ` · completions ${years}` : ''}
        </p>
        <p className="mt-auto flex items-end justify-between gap-3 pt-3">
          <span className="grid">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">From</span>
            <strong className="text-figure text-heading">{area.priceFrom ? aed(area.priceFrom) : 'On request'}</strong>
          </span>
          <span aria-hidden="true" className="btn btn-primary btn-sm group-hover:bg-gold-hover">View area <Icon name="arrow-right" className="size-4 transition-transform group-hover:translate-x-1" /></span>
        </p>
      </div>
    </article>
  );
}
