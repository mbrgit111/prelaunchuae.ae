import Link from 'next/link';
import { getCategories, getPostCards } from '@/lib/content';
import { allRoutes, type RouteEntry } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';

export const metadata = pageMetadata({ title: 'Sitemap', description: 'Every page on Net Capital: projects, areas, developers, guides and company pages.', path: '/site-map' });

// Kept until the project list changes (the API's refresh call), and a day at the most.
export const revalidate = 86400;

export default async function SiteMapPage() {
  const groups = new Map<string, RouteEntry[]>();
  for (const r of await allRoutes(await getPostCards(), await getCategories().catch(() => []))) groups.set(r.group, [...(groups.get(r.group) ?? []), r]);
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'Sitemap', path: '/site-map' }]} label="Sitemap" title="Every page" />
      <section className="on-white bg-white py-14 md:py-20">
        <div className="container-site grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {[...groups.entries()].map(([g, list]) => (
            <section key={g} aria-labelledby={`sm-${g}`}>
              <h2 id={`sm-${g}`} className="text-label mb-4">{g}</h2>
              <ul className="grid gap-2 text-[15px]">
                {list.map((r) => <li key={r.path}><Link href={r.path} className="hover:text-survey-deep">{r.name}</Link></li>)}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
