import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { copy } from '@/site';
import { featuredProjects, getDeveloper, getDevelopers } from '@/data';
import { Icon } from '@/components/ui/Icon';
import { clip, fitTitle, pageMetadata } from '@/lib/seo';
import { slugify } from '@/data/normalise';
import { LatestPosts } from '@/components/content/LatestPosts';
import { RegisterBand } from '@/components/sections/MoreSections';
import { LogoMark } from '@/components/ui/LogoMark';
import { PageHero } from '@/components/ui/PageHero';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { Section } from '@/components/ui/Section';

// The 60 developers with most projects are made at build time; the others the first time someone opens them.
export const dynamicParams = true;
// Kept until the project list changes (the API's refresh call), and a day at the most.
export const revalidate = 86400;
export const generateStaticParams = async () => (await getDevelopers()).slice(0, 60).map((d) => ({ slug: d.slug }));

const load = async (slug: string) => {
  const d = await getDeveloper(slug);
  if (!d) return null;
  // In the site's featured order, so new launches come first.
  const mine = new Set(d.projectSlugs);
  return { d, projects: (await featuredProjects()).filter((p) => mine.has(p.slug)) };
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const x = await load((await params).slug);
  if (!x) return {};
  // Own wording for some developers (copy.seo.developers), only while the projects it names are listed here
  const own = copy.seo.developers[x.d.slug];
  if (own && own.needs.every((s) => x.d.projectSlugs.includes(s))) return pageMetadata({ title: own.title, description: own.description, absoluteTitle: true, path: `/developers/${x.d.slug}` });
  return pageMetadata({
    ...fitTitle([`${x.d.name} New Launches in the UAE`, `${x.d.name} New Launches`, `${x.d.name} Projects`, x.d.name]),
    description: clip(copy.developerIntro(x.d, x.projects)),
    path: `/developers/${x.d.slug}`,
  });
}

export default async function DeveloperPage({ params }: { params: Promise<{ slug: string }> }) {
  const x = await load((await params).slug);
  if (!x) notFound();
  const { d, projects } = x;
  const others = (await getDevelopers()).filter((o) => o.slug !== d.slug).slice(0, 12);
  const SHOWN = 24;
  const areas = [...projects.reduce((m, p) => m.set(p.communityName, (m.get(p.communityName) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'Developers', path: '/developers' }, { name: d.name, path: `/developers/${d.slug}` }]} label="Developer" title={d.name} lede={copy.developerIntro(d, projects)}>
        {d.logo ? <LogoMark logo={d.logo} name={d.name} frame="hero" /> : null}
      </PageHero>
      <Section
        id="projects"
        tone="sand"
        label={`${projects.length} project${projects.length === 1 ? '' : 's'}${areas.length > 1 ? ` · ${areas.length} areas` : ''}`}
        title={`${d.name} projects`}
        highlight="projects"
        action={projects.length > SHOWN ? <Link href={`/projects?developer=${d.slug}`} className="btn btn-primary">See all {projects.length} projects <Icon name="arrow-right" className="size-[18px]" /></Link> : undefined}
      >
        {areas.length > 1 ? (
          <ul className="mb-8 flex flex-wrap gap-2">
            {areas.map(([name, n]) => <li key={name}><Link href={`/projects?developer=${d.slug}&area=${slugify(name)}`} className="chip gap-2">{name}<span className="font-normal tabular-nums opacity-70">{n}</span></Link></li>)}
          </ul>
        ) : null}
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, SHOWN).map((p, i) => <li key={p.slug} className="contents"><ProjectCard p={p} index={i} /></li>)}
        </ul>
      </Section>
      <Section
        id="other-developers"
        tone="white"
        label="Developers"
        title="Other developers"
        highlight="developers"
        action={<Link href="/developers" className="btn btn-secondary">All developers <Icon name="arrow-right" className="size-[18px]" /></Link>}
      >
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((o) => (
            <li key={o.slug}>
              <Link href={`/developers/${o.slug}`} className="card card-lift group flex h-full items-center gap-4 p-4">
                <LogoMark logo={o.logo} name={o.name} frame="card" labelled={false} />
                <span className="grid min-w-0 gap-1">
                  <span className="truncate font-semibold text-heading transition-colors group-hover:text-gold">{o.name}</span>
                  <span className="text-sm tabular-nums text-muted">{o.projectSlugs.length} project{o.projectSlugs.length === 1 ? '' : 's'}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
      <LatestPosts label="Reading" title={`Guides about ${x.d.name}`} highlight={x.d.name} filter={{ tag: x.d.slug }} tone="sand" />
      <RegisterBand />
    </>
  );
}
