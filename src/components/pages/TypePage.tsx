import Link from 'next/link';
import { featuredProjects, type Project, type PropertyType } from '@/data';
import { Icon } from '@/components/ui/Icon';
import { aed } from '@/lib/format';
import { RegisterBand } from '@/components/sections/MoreSections';
import { Faq } from '@/components/ui/Faq';
import { PageHero } from '@/components/ui/PageHero';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { Section } from '@/components/ui/Section';

export const TYPES = {
  apartment: { slug: 'apartments', plural: 'Apartments', lower: 'apartments' },
  townhouse: { slug: 'townhouses', plural: 'Townhouses', lower: 'townhouses' },
  villa: { slug: 'villas', plural: 'Villas', lower: 'villas' },
} as const satisfies Partial<Record<PropertyType, { slug: string; plural: string; lower: string }>>;

export const BEDROOMS = [
  { slug: 'studio', label: 'Studio apartments', match: ['0'] },
  { slug: '1-bedroom', label: '1 bedroom apartments', match: ['1', '1.5'] },
  { slug: '2-bedroom', label: '2 bedroom apartments', match: ['2', '2.5'] },
  { slug: '3-bedroom', label: '3 bedroom apartments', match: ['3', '3.5'] },
  { slug: '4-bedroom-plus', label: '4 bedroom and larger apartments', match: ['4', '4.5', '5', '5.5', '6', '7', '8'] },
] as const;

/** Projects of a type (optionally a bedroom count), in the site's featured order. */
export const projectsOfType = async (type: keyof typeof TYPES, bedrooms?: readonly string[]) =>
  (await featuredProjects()).filter((p) => p.propertyTypes.includes(type) && (!bedrooms || p.bedrooms.some((b) => bedrooms.includes(b))));

const SHOWN = 24;

export function typeSummary(label: string, ps: Project[]) {
  const selling = ps.filter((p) => p.status === 'available' || p.status === 'new-launch');
  const prices = ps.filter((p) => p.status !== 'sold-out' && p.priceFrom).map((p) => p.priceFrom!);
  const years = ps.filter((p) => p.completion !== 'ready' && p.handover.year).map((p) => p.handover.year!);
  return [
    `${ps.length} launch${ps.length === 1 ? '' : 'es'} across the UAE offer ${label.toLowerCase()}, in ${new Set(ps.map((p) => p.communityName)).size} areas; ${selling.length} ${selling.length === 1 ? 'is' : 'are'} launching now.`,
    prices.length ? `Published starting prices begin at ${aed(Math.min(...prices))}, subject to availability.` : null,
    years.length ? `Scheduled completions run from ${Math.min(...years)} to ${Math.max(...years)}.` : null,
  ].filter(Boolean).join(' ');
}

export async function TypePage({ type, bedrooms }: { type: keyof typeof TYPES; bedrooms?: (typeof BEDROOMS)[number] }) {
  const t = TYPES[type];
  const label = bedrooms ? bedrooms.label : t.plural;
  const ps = await projectsOfType(type, bedrooms?.match);
  const path = bedrooms ? `/${t.slug}/${bedrooms.slug}` : `/${t.slug}`;
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Projects', path: '/projects' }, { name: t.plural, path: `/${t.slug}` }, ...(bedrooms ? [{ name: bedrooms.label, path }] : [])];
  const summary = typeSummary(label, ps);
  const prices = ps.filter((p) => p.status !== 'sold-out' && p.priceFrom).map((p) => p.priceFrom!);
  const byArea = [...ps.reduce((m, p) => m.set(p.communityName, (m.get(p.communityName) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  const faqs = [
    { q: `How many new launches offer ${label.toLowerCase()}?`, a: summary },
    ...(prices.length ? [{ q: `What do off-plan ${label.toLowerCase()} cost?`, a: `Published starting prices begin at ${aed(Math.min(...prices))}, subject to availability. Each project page lists the unit prices and sizes the developer has released.` }] : []),
    { q: `Where are ${label.toLowerCase()} being built?`, a: `Most projects are in ${byArea.slice(0, 5).map(([a, n]) => `${a} (${n})`).join(', ')}.` },
    { q: `Which developers build ${label.toLowerCase()}?`, a: `${[...new Set(ps.map((p) => p.developerName))].slice(0, 8).join(', ')}, among others.` },
  ];
  const filterHref = `/projects?type=${type}${bedrooms ? `&beds=${bedrooms.slug === '4-bedroom-plus' ? '4-bedroom-plus' : bedrooms.slug}` : ''}`;
  const bedroomLinks: (typeof BEDROOMS)[number][] = [];
  if (type === 'apartment' && !bedrooms) {
    for (const bedroom of BEDROOMS) {
      if ((await projectsOfType('apartment', bedroom.match)).length) bedroomLinks.push(bedroom);
    }
  }
  return (
    <>
      <PageHero crumbs={crumbs} label={`${label} · Dubai and the UAE`} title={`Off-plan ${label.toLowerCase()} in the UAE`} lede={summary}>
        {bedroomLinks.length ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {bedroomLinks.map((b) => <li key={b.slug}><Link href={`/apartments/${b.slug}`} className="inline-flex min-h-10 items-center rounded-full border border-sage/50 px-4 text-sm font-semibold text-sand hover:border-plot hover:text-plot">{b.label.replace(' apartments', '')}</Link></li>)}
          </ul>
        ) : null}
      </PageHero>
      <Section
        id="list"
        tone="sand"
        label={`${ps.length} projects`}
        title={`Compare ${label.toLowerCase()}`}
        action={ps.length > SHOWN ? <Link href={filterHref} className="link-accent">Filter all {ps.length} <Icon name="arrow-right" className="size-4" /></Link> : undefined}
      >
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ps.slice(0, SHOWN).map((p, i) => <li key={p.slug} className="contents"><ProjectCard p={p} index={i} /></li>)}
        </ul>
        {ps.length > SHOWN ? (
          <p className="mt-10 text-center"><Link href={filterHref} className="btn btn-dark">Search and filter all {ps.length} projects <Icon name="arrow-right" className="size-[18px]" /></Link></p>
        ) : null}
      </Section>
      <Section id="faq" tone="white" label="FAQ" title={`Off-plan ${label.toLowerCase()}: questions`}>
        <div className="max-w-4xl"><Faq items={faqs} /></div>
      </Section>
      <RegisterBand />
    </>
  );
}
