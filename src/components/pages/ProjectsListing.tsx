import Link from 'next/link';
import { config } from '@/site';
import { featuredProjects, getDevelopers } from '@/data';
import { areasByEmirate, getAreas } from '@/data/areas';
import { handoverTimeline, siteStats, typeCounts } from '@/data/insights';
import { itemListSchema } from '@/lib/schema';
import { ProjectsExplorer } from '@/components/forms/ProjectsExplorer';
import { RegisterBand } from '@/components/sections/MoreSections';
import { Icon } from '@/components/ui/Icon';
import { JsonLd } from '@/components/ui/JsonLd';
import { PageHero } from '@/components/ui/PageHero';
import { ProjectCard } from '@/components/ui/ProjectCard';

export const PER_PAGE = 24;
const TYPE_LABEL = { apartment: 'Apartments', townhouse: 'Townhouses', villa: 'Villas', commercial: 'Commercial' } as const;

export const pageCount = async () => Math.ceil((await featuredProjects()).length / PER_PAGE);
export const pagePath = (n: number) => (n <= 1 ? '/projects' : `/projects/page/${n}`);

/** Page links: first, last, and two either side of the current page. */
function Pager({ page, pages }: { page: number; pages: number }) {
  const nums = [...new Set([1, page - 2, page - 1, page, page + 1, page + 2, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return (
    <nav aria-label="Project pages" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? <Link href={pagePath(page - 1)} rel="prev" className="chip gap-1.5"><Icon name="arrow-right" className="size-4 rotate-180" />Previous</Link> : null}
      {nums.map((n, i) => (
        <span key={n} className="contents">
          {i > 0 && n - nums[i - 1]! > 1 ? <span aria-hidden="true" className="px-1 text-muted">…</span> : null}
          <Link href={pagePath(n)} aria-current={n === page ? 'page' : undefined} className="chip min-w-10 justify-center tabular-nums">{n}</Link>
        </span>
      ))}
      {page < pages ? <Link href={pagePath(page + 1)} rel="next" className="chip gap-1.5">Next<Icon name="arrow-right" className="size-4" /></Link> : null}
    </nav>
  );
}

/** The project list, page by page (24 cards each), with the explorer's search and filters above it. */
export async function ProjectsListing({ page }: { page: number }) {
  const [all, developers, areas, emirates, s, types, timeline, pages] = await Promise.all([
    featuredProjects(), getDevelopers(), getAreas(), areasByEmirate(), siteStats(), typeCounts(), handoverTimeline(), pageCount(),
  ]);
  const list = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Projects', path: '/projects' }, ...(page > 1 ? [{ name: `Page ${page}`, path: pagePath(page) }] : [])];
  const years = timeline.years;
  return (
    <>
      <JsonLd data={itemListSchema(`New launch projects in the ${config.community.name}${page > 1 ? `, page ${page}` : ''}`, list.map((p) => ({ name: p.name, path: `/projects/${p.slug}` })))} />
      <PageHero
        crumbs={crumbs}
        label={`Dubai and the UAE · New launches${page > 1 ? ` · Page ${page} of ${pages}` : ''}`}
        title="New launches across the UAE"
        lede={`${s.projects.toLocaleString('en-US')} pre-launch projects in ${s.areas} areas across ${s.emirates.length} emirates, from ${s.developers} developers: ${s.selling.toLocaleString('en-US')} launching now and ${s.comingSoon} announced. Projects already on sale or sold out are not listed. Search, or filter by emirate, area, type, budget, completion and developer.`}
      />
      <section aria-label="Project list" className="on-sand bg-sand py-12 md:py-16">
        <div className="container-site">
          <ProjectsExplorer
            total={all.length}
            emirateOptions={emirates.map((e) => ({ value: e.slug, label: `${e.emirate} (${e.projects})` }))}
            areaOptions={[...areas].sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ value: a.slug, label: `${a.name} (${a.projects.length})` }))}
            developerOptions={[...developers].sort((a, b) => a.name.localeCompare(b.name)).map((d) => ({ value: d.slug, label: `${d.name} (${d.projectSlugs.length})` }))}
            typeOptions={types.filter((t) => t.count).map((t) => ({ value: t.type, label: TYPE_LABEL[t.type] }))}
            handoverOptions={[
              ...(timeline.ready ? [{ value: 'ready', label: 'Ready' }] : []),
              ...years.slice(0, 6).map((y) => ({ value: String(y.year), label: String(y.year) })),
              ...(years.length > 6 ? [{ value: `${years[6]!.year}+`, label: `${years[6]!.year}+` }] : []),
            ]}
          >
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {list.map((p, i) => <li key={p.slug} className="contents"><ProjectCard p={p} index={i} headingLevel="h2" /></li>)}
            </ul>
            <Pager page={page} pages={pages} />
          </ProjectsExplorer>
        </div>
      </section>
      <RegisterBand />
    </>
  );
}
