import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '@/data';
import { aed } from '@/lib/format';
import { DeferredImage } from './DeferredImage';
import { Icon } from './Icon';

export const statusLabel: Record<Project['status'], string> = {
  'new-launch': 'New launch',
  available: 'Available',
  'coming-soon': 'Coming soon',
  'sold-out': 'Sold out',
};

/** Status tags: square gold-tint pills with a hairline edge; gold text for a launch, body text for an announced project. */
export const statusTone: Record<Project['status'], string> = {
  'new-launch': 'border border-line-strong bg-gold-tint text-gold',
  available: 'border border-line-strong bg-gold-tint text-gold',
  'coming-soon': 'border border-line-strong bg-gold-tint text-body',
  'sold-out': 'border border-line bg-surface text-muted',
};

export function priceText(p: Pick<Project, 'status' | 'priceFrom'>) {
  if (p.status === 'sold-out') return { label: 'Availability', value: 'Sold out', note: null };
  if (p.priceFrom) return { label: 'From', value: aed(p.priceFrom), note: 'Subject to availability' };
  return { label: 'Price', value: 'On request', note: null };
}

/** Project card: picture, status, developer, name, area, unit types, handover, payment plan, "From" price. */
export function ProjectCard({ p, index = 0, headingLevel = 'h3', defer = true, showArea = true }: {
  p: Project;
  index?: number;
  headingLevel?: 'h2' | 'h3';
  defer?: boolean;
  showArea?: boolean;
}) {
  const Img = defer ? DeferredImage : Image;
  const price = priceText(p);
  const H = headingLevel;
  return (
    <article data-reveal style={{ '--i': index % 3 } as React.CSSProperties} className="card card-lift group flex h-full min-w-0 flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-[inherit] bg-surface-2">
        {p.cover ? (
          <Img src={p.cover.src} alt={p.cover.alt} fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="img-zoom object-cover" />
        ) : (
          <div aria-hidden="true" className="gold-grid absolute inset-0" />
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className={`tag ${statusTone[p.status]}`}>{statusLabel[p.status]}</span>
          {p.hasPostHandover && p.status !== 'sold-out' ? <span className="tag border border-line-strong bg-page/85 text-body">Post-handover plan</span> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        <p className="text-label truncate">{p.developerName}</p>
        <H className="text-h3 -mt-1 transition-colors group-hover:text-gold-hover">
          <Link href={`/projects/${p.slug}`} className="after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none">
            {p.name}
          </Link>
        </H>
        {showArea ? (
          <p className="-mt-1.5 flex items-center gap-1.5 text-sm text-muted">
            <Icon name="pin" className="size-4 shrink-0 text-gold" />
            {p.communityName}
          </p>
        ) : null}
        <dl className="grid grid-cols-3 gap-3 border-y border-line py-3 text-[13px] leading-snug">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Unit types</dt>
            <dd className="mt-1 font-semibold text-body">{p.bedroomsLabel ?? (p.propertyTypeLabels.join(', ') || 'Details soon')}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Completion</dt>
            <dd className="mt-1 font-semibold text-body">{p.handover.label ?? 'To be announced'}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Payment plan</dt>
            <dd className="mt-1 font-semibold text-body">{p.paymentPlanLabel ?? 'On request'}</dd>
          </div>
        </dl>
        <div className="mt-auto flex items-end justify-between gap-4 pt-1">
          <p className="grid">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{price.label}</span>
            <strong className={`text-figure text-heading ${price.value.length > 14 ? 'text-lg' : 'text-[24px] leading-tight'}`}>{price.value}</strong>
          </p>
          <span aria-hidden="true" className="btn btn-primary btn-sm whitespace-nowrap group-hover:bg-gold-hover">
            View <Icon name="arrow-right" className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </article>
  );
}
