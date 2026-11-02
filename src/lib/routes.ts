/** Every public page, used by sitemap.xml and the HTML sitemap. */
import 'server-only';
import { config } from '@/site';
import { getDevelopers, getProjects } from '@/data';
import { getAreas } from '@/data/areas';
import { pageCount, pagePath } from '@/components/pages/ProjectsListing';
import type { Category, PostCardView } from '@/lib/content';
import { BEDROOMS, TYPES, projectsOfType } from '@/components/pages/TypePage';

export interface RouteEntry { path: string; name: string; group: string; lastModified?: string; priority: number }

/** Pass the published posts (from getPostCards) so desk posts are listed too. */
export async function allRoutes(posts: PostCardView[] = [], categories: Pick<Category, 'name' | 'slug' | 'count'>[] = []): Promise<RouteEntry[]> {
  const projects = await getProjects();
  const developers = await getDevelopers();
  const fetched = projects.reduce((m, p) => (p.updatedAt > m ? p.updatedAt : m), '');
  const typeRoutes: RouteEntry[] = [];
  for (const [kind, meta] of Object.entries(TYPES)) {
    if ((await projectsOfType(kind as keyof typeof TYPES)).length) {
      typeRoutes.push({ path: `/${meta.slug}`, name: `Off-plan ${meta.lower}`, group: 'Property types', priority: 0.7 });
    }
  }
  const bedroomRoutes: RouteEntry[] = [];
  for (const bedroom of BEDROOMS) {
    if ((await projectsOfType('apartment', bedroom.match)).length) {
      bedroomRoutes.push({ path: `/apartments/${bedroom.slug}`, name: bedroom.label.charAt(0).toUpperCase() + bedroom.label.slice(1), group: 'Property types', priority: 0.6 });
    }
  }
  const r: RouteEntry[] = [
    { path: '/', name: 'Home', group: 'Main', lastModified: fetched, priority: 1 },
    { path: '/projects', name: 'All projects', group: 'Main', lastModified: fetched, priority: 0.9 },
    { path: `/${config.community.slug}`, name: 'All areas', group: 'Main', lastModified: fetched, priority: 0.9 },
    { path: '/developers', name: 'Developers', group: 'Main', priority: 0.8 },
    { path: '/why-dubai', name: 'Why Dubai', group: 'Main', priority: 0.7 },
    { path: '/golden-visa', name: 'Golden Visa guide', group: 'Guides', priority: 0.6 },
    { path: '/faq', name: 'FAQ', group: 'Guides', priority: 0.6 },
    { path: '/about', name: 'About', group: 'Company', priority: 0.5 },
    { path: '/contact', name: 'Contact', group: 'Company', priority: 0.6 },
    ...(['privacy', 'terms', 'disclaimer', 'cookie-policy'] as const).map((s) => ({ path: `/${s}`, name: s === 'cookie-policy' ? 'Cookie policy' : s.charAt(0).toUpperCase() + s.slice(1), group: 'Legal', priority: 0.2 })),
    ...typeRoutes,
    ...bedroomRoutes,
    ...Array.from({ length: Math.max(0, (await pageCount()) - 1) }, (_, i) => ({ path: pagePath(i + 2), name: `All projects, page ${i + 2}`, group: 'Project pages', priority: 0.3 })),
    ...(await getAreas()).map((a) => ({ path: `/areas/${a.slug}`, name: a.name, group: 'Areas', lastModified: a.projects.reduce((m, p) => (p.updatedAt > m ? p.updatedAt : m), ''), priority: 0.8 })),
    ...projects.map((p) => ({ path: `/projects/${p.slug}`, name: p.name, group: 'Projects', lastModified: p.updatedAt, priority: p.status === 'sold-out' ? 0.4 : 0.8 })),
    ...developers.map((d) => ({ path: `/developers/${d.slug}`, name: d.name, group: 'Developers', priority: 0.5 })),
  ];
  if (posts.length) {
    const newest = (list: PostCardView[]) => list.reduce((m, p) => (p.updatedAt > m ? p.updatedAt : m), '');
    r.push({ path: '/blog', name: 'Blog', group: 'Guides', lastModified: newest(posts), priority: 0.6 });
    const news = posts.filter((p) => p.isNews);
    if (news.length) r.push({ path: '/news', name: 'News', group: 'Guides', lastModified: newest(news), priority: 0.6 });
    for (const c of categories.filter((c) => c.count > 0)) r.push({ path: `/category/${c.slug}`, name: c.name, group: 'Topics', priority: 0.4 });
    // Each article uses the address the desk gave it (/blog/... or /news/...).
    for (const p of posts) r.push({ path: p.path, name: p.title, group: 'Articles', lastModified: p.updatedAt, priority: 0.5 });
  }
  r.push({ path: '/site-map', name: 'Sitemap', group: 'Company', priority: 0.2 });
  return r;
}
