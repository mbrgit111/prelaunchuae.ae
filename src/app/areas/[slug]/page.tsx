import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { copy } from '@/site';
import { getArea, getAreas, otherAreas } from '@/data/areas';
import { connectivity, handoverTimeline, planStats, topAmenities, typeCounts } from '@/data/insights';
import { aed } from '@/lib/format';
import { itemListSchema } from '@/lib/schema';
import { clip, fitTitle, pageMetadata } from '@/lib/seo';
import { PlaceList } from '@/components/sections/Connectivity';
import { LatestPosts } from '@/components/content/LatestPosts';
import { RegisterBand } from '@/components/sections/MoreSections';
import { Faq } from '@/components/ui/Faq';
import { HandoverChart } from '@/components/ui/HandoverChart';
import { Icon } from '@/components/ui/Icon';
import { JsonLd } from '@/components/ui/JsonLd';
import { PageHero } from '@/components/ui/PageHero';
import { HeroFigures, shortAed } from '@/components/pages/HeroFigures';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { Section } from '@/components/ui/Section';
import { pictureUrl } from '@/lib/image-loader';

export const dynamicParams = false;
// Kept until the project list changes (the API's refresh call), and a day at the most.
export const revalidate = 86400;
export const generateStaticParams = async () => (await getAreas()).map((a) => ({ slug: a.slug }));

const SHOWN = 12;
const TYPE = { apartment: ['Apartments', 'apartment'], townhouse: ['Townhouses', 'townhouse'], villa: ['Villas', 'villa'], commercial: ['Commercial', 'commercial'] } as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await getArea((await params).slug);
  if (!a) return {};
  const s = copy.seo.area({ area: a.name, projects: a.projects.length, minPrice: a.priceFrom });
  return pageMetadata({
    ...fitTitle(s.titles),
    description: clip(s.description),
    path: `/areas/${a.slug}`,
    image: a.cover ? { url: pictureUrl(a.cover.src), width: a.cover.width, height: a.cover.height, alt: `New launches in ${a.name}` } : undefined,
  });
}

/** One community: its projects, what is being built, how buyers pay, who builds there, drive times and FAQ. */
export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const a = await getArea((await params).slug);
  if (!a) notFound();
  const ps = a.projects;
  const [plans, timeline, amenities, places, types, others] = await Promise.all([
    planStats(ps), handoverTimeline(ps), topAmenities(12, ps), connectivity(ps), typeCounts(ps), otherAreas(a.slug, 14),
  ]);
  const devCounts = [...ps.reduce((m, p) => m.set(p.developerSlug, { name: p.developerName, n: (m.get(p.developerSlug)?.n ?? 0) + 1 }), new Map<string, { name: string; n: number }>())]
    .sort((x, y) => y[1].n - x[1].n);
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Areas', path: '/areas' }, { name: a.name, path: `/areas/${a.slug}` }];
  const faqs = copy.areaFaqs(a.name, ps);
  const years = a.handoverFrom ? (a.handoverFrom === a.handoverTo ? String(a.handoverFrom) : `${a.handoverFrom}–${String(a.handoverTo).slice(2)}`) : '—';
  const toc: [string, string][] = [
    ['projects', 'Projects'],
    ['building', 'What is being built'],
    ...(plans.projectsWithPlans ? [['plans', 'Payment plans'] as [string, string]] : []),
    ['developers', 'Developers'],
    ...(amenities.length ? [['living', 'Amenities'] as [string, string]] : []),
    ...(places.length ? [['connectivity', 'Drive times'] as [string, string]] : []),
    ['faq', 'FAQ'],
  ];
  return (
    <>
      <JsonLd data={[itemListSchema(`New launches in ${a.name}`, ps.slice(0, SHOWN).map((p) => ({ name: p.name, path: `/projects/${p.slug}` })))]} />
      <PageHero crumbs={crumbs} label={`Area guide · ${a.emirate}`} title={`New launches in ${a.name}`} highlight={a.name} lede={copy.areaIntro(a.name, ps)} image={a.cover}>
        <HeroFigures
          items={[
            [a.selling, 'launching now'],
            [a.developers.length, a.developers.length === 1 ? 'developer' : 'developers'],
            [shortAed(a.priceFrom), 'from, AED'],
            [years, 'completions'],
          ]}
        />
      </PageHero>

      <nav aria-label="On this page" className="on-white sticky top-[72px] z-20 border-y border-line bg-page/92 backdrop-blur-md">
        <ul className="container-site flex gap-1 overflow-x-auto py-2 text-[12px] font-bold uppercase tracking-[0.12em]">
          {toc.map(([id, l]) => <li key={id}><a href={`#${id}`} className="inline-flex min-h-11 items-center whitespace-nowrap border-b-2 border-transparent px-3 text-body transition-colors hover:border-gold hover:text-gold">{l}</a></li>)}
        </ul>
      </nav>

      <Section
        id="projects"
        tone="sand"
        label={`${ps.length} launch${ps.length === 1 ? '' : 'es'}`}
        title={`Launches in ${a.name}`}
        highlight={a.name}
        action={ps.length > SHOWN ? <Link href={`/projects?area=${a.slug}`} className="btn btn-primary">Compare all {ps.length} projects <Icon name="arrow-right" className="size-[18px]" /></Link> : undefined}
      >
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ps.slice(0, SHOWN).map((p, i) => <li key={p.slug} className="contents"><ProjectCard p={p} index={i} showArea={false} /></li>)}
        </ul>
      </Section>

      <Section id="building" tone="white" label="Supply" title="What is being built" highlight="built">
        <div className="grid gap-8 lg:grid-cols-2">
          <ul className="grid content-start gap-3">
            {types.filter((t) => t.count).map((t) => (
              <li key={t.type}>
                <Link href={`/projects?area=${a.slug}&type=${TYPE[t.type][1]}`} className="card card-lift group flex items-center justify-between gap-4 p-5">
                  <span className="text-h3">{TYPE[t.type][0]}</span>
                  <span className="arrow-link">{t.count} project{t.count === 1 ? '' : 's'} <Icon name="arrow-right" className="size-4" /></span>
                </Link>
              </li>
            ))}
            {a.priceFrom ? <li className="text-sm text-muted">The lowest published starting price in {a.name} is {aed(a.priceFrom)}, subject to availability.</li> : null}
          </ul>
          <HandoverChart years={timeline.years} ready={timeline.ready} />
        </div>
      </Section>

      {plans.projectsWithPlans ? (
        <Section id="plans" tone="sand" label="Payment plans" title={`How buyers pay in ${a.name}`} highlight="pay">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="card border-t-2 border-t-gold p-6"><p className="text-figure text-[44px] leading-none text-gold">{plans.projectsWithPlans}</p><p className="mt-2 text-muted">project{plans.projectsWithPlans === 1 ? ' publishes' : 's publish'} a payment plan ({plans.plans} plan{plans.plans === 1 ? '' : 's'} in total)</p></div>
            <div className="card border-t-2 border-t-gold p-6"><p className="text-figure text-[44px] leading-none text-gold">{plans.withPostHandover}</p><p className="mt-2 text-muted">offer payments after handover</p></div>
            <div className="card border-t-2 border-t-gold p-6"><p className="text-label">Most common splits</p><ul className="mt-2 grid gap-1">{plans.common.map((c) => <li key={c.split} className="flex justify-between tabular-nums"><strong className="font-semibold text-heading">{c.split}</strong><span className="text-muted">{c.count} plan{c.count === 1 ? '' : 's'}</span></li>)}</ul></div>
          </div>
          {plans.dldPercent ? <p className="mt-6 text-[15px] text-muted">Where schedules list fees, a Dubai Land Department (DLD) registration fee of {plans.dldPercent}% is due at booking ({plans.dldPlans} plan{plans.dldPlans === 1 ? '' : 's'}).</p> : null}
        </Section>
      ) : null}

      <Section id="developers" tone="white" label="Developers" title={`Who is building in ${a.name}`} highlight="building">
        <ul className="flex flex-wrap gap-2">
          {devCounts.map(([slug, d]) => <li key={slug}><Link href={`/developers/${slug}`} className="chip gap-2">{d.name}<span className="font-normal tabular-nums opacity-70">{d.n}</span></Link></li>)}
        </ul>
      </Section>

      {amenities.length ? (
        <Section id="living" tone="sand" label="Amenities" title="What developers build in, most often" highlight="most often">
          <ul className="flex flex-wrap gap-2">
            {amenities.map((x) => <li key={x.name} className="inline-flex min-h-10 items-center gap-2 border border-line bg-surface px-4 text-sm text-body"><Icon name="check" className="size-4 text-gold" />{x.name}<span className="text-muted">· {x.count}</span></li>)}
          </ul>
        </Section>
      ) : null}

      {places.length ? (
        <Section id="connectivity" tone="white" label="Drive times" title="Distances listed by the developers" highlight="Distances">
          <PlaceList rows={places.slice(0, 9)} />
        </Section>
      ) : null}

      <Section id="faq" tone={places.length ? 'sand' : 'white'} label="FAQ" title={`${a.name}: questions`} highlight="questions">
        <div className="max-w-4xl"><Faq items={faqs} /></div>
      </Section>

      <Section id="more-areas" tone={places.length ? 'white' : 'sand'} label="More areas" title="Compare with other areas" highlight="other areas">
        <ul className="flex flex-wrap gap-2">
          {others.map((o) => <li key={o.slug}><Link href={`/areas/${o.slug}`} className="chip gap-2">{o.name}<span className="font-normal tabular-nums opacity-70">{o.projects.length}</span></Link></li>)}
          <li><Link href="/areas" className="btn btn-primary btn-sm">All areas <Icon name="arrow-right" className="size-4" /></Link></li>
        </ul>
      </Section>
      <LatestPosts label="Reading" title={`Guides about ${a.name}`} highlight={a.name} filter={{ tag: a.slug }} tone="sand" />
      <RegisterBand />
    </>
  );
}
