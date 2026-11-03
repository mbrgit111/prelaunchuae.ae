import Link from 'next/link';
import { copy } from '@/site';
import { getProjects } from '@/data';
import { getAreas } from '@/data/areas';
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

/** 4 · Stats strip on datum: every number is counted from the data at build time. */
export async function StatsStrip() {
  const s = await siteStats();
  const items = [
    { n: s.projects, label: `Launches listed across ${s.emirates.length} emirates` },
    { n: s.selling, label: 'Launching now' },
    { n: s.areas, label: 'Areas' },
    { n: s.developers, label: 'Developers' },
  ];
  return (
    <section aria-label={copy.home.stats.label} className="on-dark relative overflow-hidden bg-datum text-sand">
      <div aria-hidden="true" className="survey-grid pointer-events-none absolute inset-0 opacity-[0.1]" />
      <div className="container-site relative py-12 md:py-16">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {items.map((it, i) => (
            <div key={it.label} data-reveal style={{ '--i': i } as React.CSSProperties} className="border-l border-sage/40 pl-5">
              <dd className="text-figure text-[44px] leading-none md:text-[60px]"><Counter value={it.n} /></dd>
              <dt className="mt-3 text-sm text-muted-on-deep">{it.label}</dt>
            </div>
          ))}
        </dl>
        <p className="mt-10 text-xs text-muted-on-deep">
          {copy.home.stats.note} Data as of {new Date(s.fetchedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}.
          {s.handoverFrom ? ` Scheduled completions ${s.handoverFrom} to ${s.handoverTo}.` : ''}
        </p>
      </div>
    </section>
  );
}

/** 6 · Where to buy: the six areas with the most projects selling. */
export async function AreasSection() {
  const a = copy.home.areas;
  const areas = await getAreas();
  return (
    <Section id="areas" tone="white" label={a.label} title={a.title} intro={a.intro} action={<Link href="/areas" className="btn btn-secondary btn-sm">{a.action} ({areas.length}) <Icon name="arrow-right" className="size-4" /></Link>}>
      <ul className="swipe-row grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {areas.slice(0, 6).map((x, i) => <li key={x.slug} className="contents"><AreaCard area={x} index={i} /></li>)}
      </ul>
    </Section>
  );
}

const TYPES = [
  { type: 'apartment', label: 'Apartments', href: '/apartments' },
  { type: 'townhouse', label: 'Townhouses', href: '/townhouses' },
  { type: 'villa', label: 'Villas', href: '/villas' },
] as const;

/** 7 · Browse by type: counts and the lowest published price per type, each with a real project picture. */
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
    <Section id="types" tone="sand" label={t.label} title={t.title}>
      <ul className="swipe-row grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((c, i) => (
          <li key={c.type} data-reveal style={{ '--i': i } as React.CSSProperties}>
            <Link href={c.href} className="card card-lift group relative block overflow-hidden">
              <div className="relative aspect-[4/5] overflow-hidden bg-plot">
                {c.pic?.cover ? <DeferredImage src={c.pic.cover.src} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-700 ease-brand group-hover:scale-[1.04]" /> : null}
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-datum/90 via-datum/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 grid gap-1 p-6 text-sand">
                  <h3 className="text-h3 !text-[30px]">{c.label}</h3>
                  <p className="text-sm text-sand/85">{c.count} project{c.count === 1 ? '' : 's'}{c.from ? ` · from ${aed(c.from)}` : ''}</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-plot">Compare {c.label.toLowerCase()} <Icon name="arrow-right" className="size-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** 8 · Why Dubai: six general points, each flagged until MBR adds the source. */
export function WhyDubai({ linkToPage = true }: { linkToPage?: boolean }) {
  const w = copy.home.why;
  return (
    <Section
      id="why"
      tone="dark"
      label={w.label}
      title={w.title}
      intro={w.intro}
      action={linkToPage ? <Link href="/why-dubai" className="btn btn-secondary btn-sm">Why Dubai <Icon name="arrow-right" className="size-4" /></Link> : undefined}
    >
      <ul className="grid gap-px overflow-hidden rounded-brand-lg border border-sage/25 bg-sage/25 sm:grid-cols-2 lg:grid-cols-3">
        {w.cards.map((c, i) => (
          <li key={c.title} data-reveal style={{ '--i': i % 3 } as React.CSSProperties} className="grid content-start gap-4 bg-datum p-6 md:p-8">
            <Icon name={c.icon as IconName} className="size-7 text-plot" />
            <h3 className="text-h3">{c.title}</h3>
            <p className="text-[15px] text-muted-on-deep">{c.body}<Flag>{c.flag}</Flag></p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** 11 · When projects complete: one bar per scheduled year, across every listed project. */
export async function HandoverSection() {
  const h = copy.home.handover;
  const [timeline, s] = await Promise.all([handoverTimeline(), siteStats()]);
  if (!timeline.years.length) return null;
  const busiest = [...timeline.years].sort((a, b) => b.count - a.count)[0]!;
  return (
    <Section id="handover" tone="white" label={h.label} title={h.title} intro={h.intro}>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-start">
        <div className="grid content-start gap-5 text-[17px]">
          <p><strong className="font-semibold">{busiest.year}</strong> is the busiest scheduled year, with {busiest.count.toLocaleString('en-US')} of the {s.projects.toLocaleString('en-US')} projects due to complete.</p>
          {timeline.unknown ? <p className="text-muted">{timeline.unknown} project{timeline.unknown === 1 ? ' has' : 's have'} no completion date published yet.</p> : null}
          <p className="text-muted">Want a home you can move into sooner? Filter the list by completion year.</p>
          <Link href="/projects?sort=handover" className="btn btn-secondary justify-self-start">Soonest completions first <Icon name="arrow-right" className="size-[18px]" /></Link>
        </div>
        <HandoverChart years={timeline.years} ready={timeline.ready} />
      </div>
    </Section>
  );
}

/** 5b · Launch alerts: a short form right after the featured projects. */
export function AlertsBand() {
  const h = copy.home.hero;
  return (
    <section aria-labelledby="h-alerts" className="on-tint relative overflow-hidden bg-plot">
      <div aria-hidden="true" className="survey-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="container-site relative grid items-center gap-8 py-14 md:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="grid gap-4">
          <p className="text-label flex items-center gap-2.5"><span aria-hidden="true" className="size-2 bg-current" />New launches</p>
          <h2 id="h-alerts" className="text-h2">Hear about launches before they fill up</h2>
          <p className="text-lede text-ink/80">{h.formIntro}</p>
          <ul className="grid gap-2 text-[15px]">
            {['Launch prices and payment plans as released', 'Floor plans and the developer’s brochure', 'No spam: one advisor replies to your enquiry'].map((x) => (
              <li key={x} className="flex items-center gap-3"><Icon name="check" className="size-5 shrink-0 text-survey-deep" />{x}</li>
            ))}
          </ul>
        </div>
        <EnquiryForm source="hero" title={h.formTitle} compact headingLevel="h3" className="shadow-[0_30px_60px_-34px_rgb(14_20_18/0.45)]" />
      </div>
    </section>
  );
}
