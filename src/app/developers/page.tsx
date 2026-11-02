import type { Metadata } from 'next';
import Link from 'next/link';
import { getDevelopers, getProjects } from '@/data';
import { pageMetadata } from '@/lib/seo';
import { RegisterBand } from '@/components/sections/MoreSections';
import { DevelopersDirectory, type DirectoryItem } from '@/components/forms/DevelopersDirectory';
import { PageHero } from '@/components/ui/PageHero';

export async function generateMetadata(): Promise<Metadata> {
  const developers = await getDevelopers();
  return pageMetadata({
    title: 'Off-Plan Developers in Dubai and the UAE',
    description: `${developers.length} developers with projects across Dubai and the UAE, from ${developers[0]?.name ?? 'the largest'} to newer names. See each developer’s projects, areas, prices and completion dates.`,
    path: '/developers',
  });
}

export default async function DevelopersPage() {
  const devs = await getDevelopers();
  const bySlug = new Map((await getProjects()).map((project) => [project.slug, project]));
  const items: DirectoryItem[] = devs.map((d) => {
    const ps = d.projectSlugs.map((slug) => bySlug.get(slug)).filter((project) => project !== undefined);
    const prices = ps.filter((p) => p.status !== 'sold-out' && p.priceFrom).map((p) => p.priceFrom!);
    return {
      slug: d.slug,
      name: d.name,
      projects: ps.length,
      selling: ps.filter((p) => p.status === 'available' || p.status === 'new-launch').length,
      from: prices.length ? Math.min(...prices) : null,
      logo: d.logo,
    };
  });
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'Developers', path: '/developers' }]} label={`${devs.length} developers · UAE`} title="Developers with projects across the UAE" lede={`${devs.length} developers have projects listed across Dubai and the other emirates. The largest are first; search for one, or open it to compare its projects, areas and prices.`} />
      <section aria-label="Developer list" className="on-sand bg-sand py-12 md:py-16">
        <div className="container-site">
          <DevelopersDirectory items={items} />
          <p className="mt-6 text-xs text-muted">Developer logos as supplied through the developers’ sales portal.</p>
        </div>
      </section>
      <RegisterBand />
    </>
  );
}
