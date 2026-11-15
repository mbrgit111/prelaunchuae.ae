import Link from 'next/link';
import { copy } from '@/site';
import { featuredProjects, getProjects } from '@/data';
import { areaSlug, getAreas } from '@/data/areas';
import { handoverTimeline, siteStats, typeCounts } from '@/data/insights';
import { aed } from '@/lib/format';
import { EnquiryForm } from '../forms/EnquiryForm';
import { AreaCard } from '../ui/AreaCard';
import { Counter } from '../ui/Counter';
import { DeferredImage } from '../ui/DeferredImage';
import { Flag } from '../ui/Flag';
import { HandoverChart } from '../ui/HandoverChart';
import { Icon, type IconName } from '../ui/Icon';
import { Section } from '../ui/Section';
import { Accent, Check, Head, More } from './MoreSections';

/** Stats strip: every number is counted from the data. Gold figures between gold hairline rules, on a faint gold grid. */
export async function StatsStrip() {
  const s = await siteStats();
  const items = [
    { n: s.projects, label: `Launches listed across ${s.emirates.length} emirates` },
    { n: s.selling, label: 'Launching now' },
    { n: s.areas, label: 'Areas' },
    { n: s.developers, label: 'Developers' },
  ];
  return (
    <section aria-label={copy.home.stats.label} className="on-dark relative overflow-hidden border-y border-line bg-band text-body">
      <div aria-hidden="true" className="gold-grid pointer-events-none absolute inset-0" />
      <div className="container-site relative py-12 md:py-16">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {items.map((it, i) => (
            <div key={it.label} data-reveal style={{ '--i': i } as React.CSSProperties} className="flex flex-col-reverse border-l border-gold/40 pl-5">
              <dt className="mt-3 text-xs font-bold uppercase tracking-label text-muted">{it.label}</dt>
              <dd className="text-figure text-[44px] leading-none text-gold md:text-[60px]"><Counter value={it.n} /></dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 text-xs text-muted">
          {copy.home.stats.note} Data as of {new Date(s.fetchedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}.
          {s.handoverFrom ? ` Scheduled completions ${s.handoverFrom} to ${s.handoverTo}.` : ''}
        </p>
      </div>
    </section>
  );
}

/** Launch alerts: a warm moment band with a short form, right after the featured launches. */
export function AlertsBand() {
  const h = copy.home.hero;
  const a = copy.home.alerts;
  return (
    <section aria-labelledby="h-alerts" className="on-dark warm-band relative overflow-hidden border-y border-line text-body">
      <div aria-hidden="true" className="gold-glow pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="gold-grid grid-fade pointer-events-none absolute inset-0" />
      <div className="container-site relative grid items-center gap-10 py-16 md:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="grid gap-5">
          <p><span className="eyebrow-line-start">{a.label}</span></p>
          <h2 id="h-alerts" className="text-h2"><Accent text={a.title} word={a.accent} /></h2>
          <p className="text-lede text-body">{h.formIntro}</p>
          <ul className="mt-1 grid gap-3 text-[15px]">
            {a.points.map((x) => (
              <li key={x} className="flex items-center gap-3"><Check />{x}</li>
            ))}
          </ul>
        </div>
        <EnquiryForm source="hero" title={h.formTitle} compact headingLevel="h3" className="!border-t-[3px] !border-t-gold shadow-[0_32px_80px_rgb(0_0_0/0.5)]" />
      </div>
    </section>
  );
}

/** Emirates with at least this many launches get a card (the others are too small to compare). */
const EMIRATE_MIN = 5;

/** Launches by emirate: one card per emirate, counted from the projects. Each opens the project list filtered to it. */
export async function EmiratesSection() {
  const e = copy.home.emirates;
  const featured = await featuredProjects();
  const byEmirate = new Map<string, typeof featured>();
  for (const p of featured) byEmirate.set(p.emirate, [...(byEmirate.get(p.emirate) ?? []), p]);
  const cards = [...byEmirate.entries()]
    .map(([name, ps]) => {
      const prices = ps.filter((p) => p.status !== 'sold-out' && p.priceFrom).map((p) => p.priceFrom!);
      return {
        name,
        // Same value as the explorer's emirate filter (areaSlug of the project's emirate).
        slug: areaSlug(name),
        launches: ps.length,
        areas: new Set(ps.map((p) => p.communityName)).size,
        developers: new Set(ps.map((p) => p.developerName)).size,
        from: prices.length ? Math.min(...prices) : null,
        cover: ps.find((p) => p.cover)?.cover ?? null,
      };
    })
    .filter((c) => c.launches >= EMIRATE_MIN)
    .sort((a, b) => b.launches - a.launches);
  if (cards.length < 2) return null;
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
  return (
    <Section id="emirates" labelledBy="h-emirates" tone="white">
      <Head id="h-emirates" label={e.label} title={e.title} accent={e.accent} intro={e.intro} />
      <ul className={`swipe-row grid grid-cols-1 gap-6 sm:grid-cols-2 ${cards.length >= 3 ? 'lg:grid-cols-3' : ''}`}>
        {cards.map((c, i) => (
          <li key={c.slug} data-reveal style={{ '--i': i % 3 } as React.CSSProperties}>
            <article className="card card-lift group relative flex h-full flex-col overflow-hidden">
              <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
                {c.cover ? (
                  <DeferredImage src={c.cover.src} alt="" fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="img-zoom object-cover" />
                ) : (
                  <div aria-hidden="true" className="gold-grid absolute inset-0" />
                )}
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-page/90 via-page/20 to-transparent" />
                <p className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
                  <span className="text-figure text-[44px] leading-none text-gold">{c.launches}</span>
                  <span className="pb-1 text-right text-xs font-bold uppercase tracking-label text-white/85">launches</span>
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5 md:p-6">
                <h3 className="text-h3">
                  <Link href={`/projects?emirate=${c.slug}`} className="after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none">{c.name}</Link>
                </h3>
                <p className="text-sm text-muted">{plural(c.areas, 'area')} · {plural(c.developers, 'developer')}</p>
                <p className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
                  <span className="grid">
                    <span className="text-xs text-muted">From</span>
                    <strong className="font-semibold tabular-nums text-heading">{c.from ? aed(c.from) : 'On request'}</strong>
                  </span>
                  <span aria-hidden="true" className="arrow-link">{e.cardAction} <Icon name="arrow-right" className="size-4" /></span>
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Where to buy: the six areas with the most launches. */
export async function AreasSection() {
  const a = copy.home.areas;
  const areas = await getAreas();
  return (
    <Section id="areas" labelledBy="h-areas" tone="sand">
      <Head id="h-areas" label={a.label} title={a.title} accent={a.accent} intro={a.intro} />
      <ul className="swipe-row grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {areas.slice(0, 6).map((x, i) => <li key={x.slug} className="contents"><AreaCard area={x} index={i} /></li>)}
      </ul>
      <More href="/areas">{a.action} ({areas.length})</More>
    </Section>
  );
}

const TYPES = [
  { type: 'apartment', label: 'Apartments', href: '/apartments' },
  { type: 'townhouse', label: 'Townhouses', href: '/townhouses' },
  { type: 'villa', label: 'Villas', href: '/villas' },
] as const;

/** Browse by type: tall picture cards with the count and lowest published price per type. */
export async function TypesSection() {
  const t = copy.home.types;
  const [ps, counts] = await Promise.all([getProjects(), typeCounts()]);
  const cards = TYPES.map((x) => {
    const list = ps.filter((p) => p.propertyTypes.includes(x.type));
    const prices = list.filter((p) => p.priceFrom).map((p) => p.priceFrom!);
    // Picture: a project of only this type (a villa community shows villas, not a tower).
    const pic = list.find((p) => p.cover && p.propertyTypes.length === 1 && p.gallery.length >= 3) ?? list.find((p) => p.cover);
    return { ...x, count: counts.find((c) => c.type === x.type)?.count ?? 0, from: prices.length ? Math.min(...prices) : null, pic };
  }).filter((c) => c.count);
  return (
    <Section id="types" labelledBy="h-types" tone="white">
      <Head id="h-types" label={t.label} title={t.title} accent={t.accent} />
      <ul className="swipe-row grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((c, i) => (
          <li key={c.type} data-reveal style={{ '--i': i } as React.CSSProperties}>
            <Link href={c.href} className="card card-lift group relative block overflow-hidden">
              <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
                {c.pic?.cover ? <DeferredImage src={c.pic.cover.src} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="img-zoom object-cover" /> : <div aria-hidden="true" className="gold-grid absolute inset-0" />}
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-page via-page/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 grid gap-2 p-6 md:p-7">
                  <p className="text-label">{c.count} project{c.count === 1 ? '' : 's'}</p>
                  <h3 className="text-h3 !text-[30px] text-heading">{c.label}</h3>
                  <p className="text-sm text-body">{c.from ? `From ${aed(c.from)}` : 'Prices on request'}</p>
                  <span className="arrow-link mt-2">{t.action} {c.label.toLowerCase()} <Icon name="arrow-right" className="size-4" /></span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Why Dubai: six general points on surface cards with ghost numerals, each flagged until MBR adds the source. */
export function WhyDubai({ linkToPage = true }: { linkToPage?: boolean }) {
  const w = copy.home.why;
  return (
    <Section id="why" labelledBy="h-why" tone="white">
      <Head id="h-why" label={w.label} title={w.title} accent={w.accent} intro={w.intro} center />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {w.cards.map((c, i) => (
          <li key={c.title} data-reveal style={{ '--i': i % 3 } as React.CSSProperties} className="card card-lift grid content-start gap-5 overflow-hidden px-7 py-9 md:px-8 md:py-10">
            <span aria-hidden="true" className="text-figure pointer-events-none absolute right-6 top-4 select-none text-[5rem] leading-none text-gold/[0.07]">{String(i + 1).padStart(2, '0')}</span>
            <span aria-hidden="true" className="relative grid size-14 place-items-center border border-gold/20 bg-gold/[0.08] text-gold">
              <Icon name={c.icon as IconName} className="size-6" />
            </span>
            <h3 className="text-h3 relative text-heading">{c.title}</h3>
            <p className="relative text-sm leading-[1.7] text-muted">{c.body}<Flag>{c.flag}</Flag></p>
          </li>
        ))}
      </ul>
      {linkToPage ? <More href="/why-dubai">Why Dubai</More> : null}
    </Section>
  );
}

/** When projects complete: one bar per scheduled year, across every listed project. */
export async function HandoverSection() {
  const h = copy.home.handover;
  const [timeline, s] = await Promise.all([handoverTimeline(), siteStats()]);
  if (!timeline.years.length) return null;
  const busiest = [...timeline.years].sort((a, b) => b.count - a.count)[0]!;
  return (
    <Section id="handover" labelledBy="h-handover" tone="sand">
      <Head id="h-handover" label={h.label} title={h.title} accent={h.accent} intro={h.intro} />
      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-start">
        <div className="grid content-start gap-5 text-[17px]">
          <p><strong className="text-figure text-gold">{busiest.year}</strong> is the busiest scheduled year, with {busiest.count.toLocaleString('en-US')} of the {s.projects.toLocaleString('en-US')} projects due to complete.</p>
          {timeline.unknown ? <p className="text-muted">{timeline.unknown} project{timeline.unknown === 1 ? ' has' : 's have'} no completion date published yet.</p> : null}
          <p className="text-muted">Want a home you can move into sooner? Filter the list by completion year.</p>
          <Link href="/projects?sort=handover" className="btn btn-secondary justify-self-start">Soonest completions first <Icon name="arrow-right" className="size-4" /></Link>
        </div>
        <HandoverChart years={timeline.years} ready={timeline.ready} />
      </div>
    </Section>
  );
}
