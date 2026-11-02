import type { Metadata } from 'next';
import Link from 'next/link';
import { copy, imagery } from '@/site';
import { getProject } from '@/data';
import { areasByEmirate, getAreas } from '@/data/areas';
import { siteStats } from '@/data/insights';
import { aed } from '@/lib/format';
import { itemListSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';
import { RegisterBand } from '@/components/sections/MoreSections';
import { AreaCard } from '@/components/ui/AreaCard';
import { JsonLd } from '@/components/ui/JsonLd';
import { PageHero } from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';

// Kept until the project list changes (the API's refresh call), and a day at the most.
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const s = await siteStats();
  return pageMetadata({ ...copy.seo.areas({ areas: s.areas, projects: s.projects }), absoluteTitle: true, path: '/areas' });
}

/** Every community in the portal: the busiest as cards, then each emirate's areas A to Z. */
export default async function AreasPage() {
  const a = copy.pages.areas;
  const [areas, emirates] = await Promise.all([getAreas(), areasByEmirate()]);
  const top = areas.slice(0, 12);
  return (
    <>
      <JsonLd data={itemListSchema('UAE off-plan areas', areas.map((x) => ({ name: x.name, path: `/areas/${x.slug}` })))} />
      <PageHero
        crumbs={[{ name: 'Home', path: '/' }, { name: a.title, path: '/areas' }]}
        label={`${areas.length} areas · ${emirates.length} emirates`}
        title={a.h1}
        lede={a.lede}
        image={(await getProject(imagery.guide))?.cover}
      />
      <Section id="largest" tone="sand" label="Most launches" title="The busiest areas for new launches">
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((x, i) => <li key={x.slug} className="contents"><AreaCard area={x} index={i} /></li>)}
        </ul>
      </Section>
      <Section id="all" tone="white" label="By emirate" title={`All ${areas.length} areas`}>
        <nav aria-label="Jump to an emirate" className="mb-10 flex flex-wrap gap-2">
          {emirates.map((e) => <a key={e.slug} href={`#emirate-${e.slug}`} className="chip gap-2">{e.emirate}<span className="font-normal text-muted">{e.areas.length}</span></a>)}
        </nav>
        <div className="grid gap-14">
          {emirates.map((e) => (
            <section key={e.slug} id={`emirate-${e.slug}`} aria-labelledby={`h-emirate-${e.slug}`} className="scroll-mt-28">
              <h3 id={`h-emirate-${e.slug}`} className="text-h3 mb-4 flex items-baseline justify-between gap-4 border-b border-line-strong pb-3">
                {e.emirate}<span className="font-sans text-sm font-normal text-muted">{e.projects.toLocaleString('en-US')} projects · {e.areas.length} areas</span>
              </h3>
              <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
                {[...e.areas].sort((x, y) => x.name.localeCompare(y.name)).map((x) => (
                  <li key={x.slug}>
                    <Link href={`/areas/${x.slug}`} className="flex min-h-11 items-center justify-between gap-4 border-b border-line/70 py-2 hover:text-survey-deep">
                      <span className="font-semibold leading-snug">{x.name}</span>
                      <span className="shrink-0 text-right text-sm tabular-nums text-muted">{x.selling} selling{x.priceFrom ? ` · from ${aed(x.priceFrom).replace('AED ', 'AED\u00a0')}` : ''}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Section>
      <RegisterBand />
    </>
  );
}
