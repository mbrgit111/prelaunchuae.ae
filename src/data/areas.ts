/** Areas (communities across the emirates) grouped from the project data. Every number here is counted, never typed in. */
import 'server-only';
import { cache } from 'react';
import { featuredProjects, getData, getProjects, once } from './index.ts';
import { slugify } from './normalise.ts';
import type { MediaImage, Project } from './types.ts';

export interface Area {
  slug: string;
  name: string;
  emirate: string;
  /** Projects selling now (new launch or available). */
  selling: number;
  soldOut: number;
  /** Projects in the area, in the site's featured order. */
  projects: Project[];
  developers: string[];
  priceFrom: number | null;
  handoverFrom: number | null;
  handoverTo: number | null;
  /** The cover of the area's first featured project that has one. */
  cover: MediaImage | null;
}

export const areaSlug = (name: string) => slugify(name);

export const getAreas = cache(async (): Promise<Area[]> => {
  const [data, featured] = await Promise.all([getData(), featuredProjects()]);
  return once(data, 'areas', () => groupAreas(featured));
});

function groupAreas(featured: Project[]): Area[] {
  const byName = new Map<string, Project[]>();
  for (const p of featured) {
    const list = byName.get(p.communityName);
    if (list) list.push(p);
    else byName.set(p.communityName, [p]);
  }
  return [...byName.entries()]
    .map(([name, projects]) => {
      const prices = projects.filter((p) => p.priceFrom).map((p) => p.priceFrom!);
      const emirates = projects.reduce((m, p) => m.set(p.emirate, (m.get(p.emirate) ?? 0) + 1), new Map<string, number>());
      const years = projects.filter((p) => p.completion !== 'ready' && p.handover.year).map((p) => p.handover.year!);
      return {
        slug: areaSlug(name),
        name,
        emirate: [...emirates.entries()].sort((a, b) => b[1] - a[1])[0]![0],
        selling: projects.filter((p) => p.status === 'available' || p.status === 'new-launch').length,
        soldOut: projects.filter((p) => p.status === 'sold-out').length,
        projects,
        developers: [...new Set(projects.map((p) => p.developerName))],
        priceFrom: prices.length ? Math.min(...prices) : null,
        handoverFrom: years.length ? Math.min(...years) : null,
        handoverTo: years.length ? Math.max(...years) : null,
        cover: projects.find((p) => p.cover)?.cover ?? null,
      };
    })
    // Most projects selling now first, then most projects listed.
    .sort((a, b) => b.selling - a.selling || b.projects.length - a.projects.length || a.name.localeCompare(b.name));
}

export const getArea = async (slug: string) => (await areaBySlug()).get(slug);

/** The area page a project belongs to. */
export const areaOf = (p: Project) => areaSlug(p.communityName);

/** Other areas to suggest from an area page: the busiest in the same emirate first. */
export async function otherAreas(slug: string, n = 12) {
  const all = await getAreas();
  const here = all.find((a) => a.slug === slug);
  const rest = all.filter((a) => a.slug !== slug);
  return [...rest.filter((a) => a.emirate === here?.emirate), ...rest.filter((a) => a.emirate !== here?.emirate)].slice(0, n);
}

/** Emirates with their areas, the emirate with most projects first. */
export async function areasByEmirate() {
  const m = new Map<string, Area[]>();
  for (const a of await getAreas()) m.set(a.emirate, [...(m.get(a.emirate) ?? []), a]);
  return [...m.entries()].map(([emirate, areas]) => ({ emirate, slug: areaSlug(emirate), areas, projects: areas.reduce((n, a) => n + a.projects.length, 0) })).sort((a, b) => b.projects - a.projects);
}

/** Every area keyed by slug, for quick lookups when building cards and lists. */
export const areaBySlug = cache(async () => {
  const [data, areas] = await Promise.all([getData(), getAreas()]);
  return once(data, 'area-by-slug', () => new Map(areas.map((a) => [a.slug, a])));
});

export { getProjects };
