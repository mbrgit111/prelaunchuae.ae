/**
 * The site's single entry point to project data. Pages read this on the server.
 *
 * The project list is the one the MBR desk's "Update properties" keeps in step with REM. It reaches the site through the
 * files in data/: scripts/pull-catalogue.ts copies it from the MBR API before every build, slimmed by ./slim.ts, and the
 * pictures are downloaded from that same copy. site.config.ts (catalogue.runtime) says whether the running site also
 * reads the API between builds; Net Capital does (see sites/types.ts), so the daily update shows without a rebuild.
 */
import { cache } from 'react';
import { apiSettings } from '@/lib/content/settings';
import { compliance, config } from '@/site';
import { DataError } from './normalise.ts';
import { loadSiteData } from './read.ts';
import { inRemOrder, slimCatalogue } from './slim.ts';
import { askVersion } from './version.ts';
import type { SiteData } from './types.ts';

const hidden = new Set(compliance.hiddenSlugs ?? []);
const publish =
  hidden.size || compliance.publishOnlyWithPermit
    ? (slug: string) =>
        !hidden.has(slug) && (!compliance.publishOnlyWithPermit || Boolean(compliance.projectPermits[slug]?.trakheesiPermit))
    : undefined;

const fileOptions = () => ({ scope: config.scope, communityName: config.community.name, alsoDistricts: config.community.alsoDistricts, renameAreas: config.community.renameAreas, publish });

/**
 * The checked catalogue is kept for the life of the process. Reading and checking the project files takes about half a
 * second, so doing it once per page made a build of some 3,000 pages take 40 minutes on a one-worker build machine.
 * Now a build worker, or a warm server, does it once. (Not kept while developing, so edits to the files show at once.)
 */
const keep = process.env.NODE_ENV === 'production';
let fromFiles: SiteData | null = null;

function filesData(): SiteData {
  if (keep && fromFiles) return fromFiles;
  const data = loadSiteData(fileOptions());
  if (keep) fromFiles = data;
  return data;
}

// Only for catalogue.runtime 'api'. The whole list is far more than the Next.js data cache keeps (2 MB), so the checked
// result is held here, once per server process. Every time a page is made, it first asks the API for the list's
// version (a few bytes): pages are made rarely now, and asking every time means a page made just after a change never
// uses the list from before it. Only a new version is downloaded again: after the daily update, a desk edit, or new
// pictures. Pages stay cached until the API's refresh call after such a change (or a day at the latest), and visitors
// keep getting the cached page while the new one is made in the background.
/** While the site is being built, thousands of pages are made from one list: the version is asked at most once a minute. */
const BUILD_CHECK_EVERY = 60_000;
/** Without a version from the API (an older API), the list is downloaded again every ten minutes. */
const FALLBACK_EVERY = 10 * 60_000;
const TAGS = ['posts', `catalogue:${config.contentKey}`];
const building = () => process.env.NEXT_PHASE === 'phase-production-build';
let held: { version: string; data: Promise<SiteData | null> } | null = null;
let checkedAt = 0;
let checking: Promise<string | null> | null = null;

/** Makes the next page check the list's version at once (called when the API says the list changed). */
export function forgetCatalogue() {
  checkedAt = 0;
}

async function currentVersion(url: string, key: string): Promise<string> {
  if (held && building() && Date.now() - checkedAt < BUILD_CHECK_EVERY) return held.version;
  checking ??= askVersion(url, key).finally(() => {
    checking = null;
  });
  const version = await checking;
  checkedAt = Date.now();
  return version ?? `t${Math.floor(Date.now() / FALLBACK_EVERY)}`;
}

async function downloadCatalogue(url: string, key: string, version: string): Promise<SiteData | null> {
  let body: { fetchedAt?: unknown; projects?: unknown; media?: unknown };
  try {
    // ?media=1: the REM pictures the API has ready, so new projects show their pictures without a rebuild.
    // &v=: one address per version, so a cached copy of an older list is never used.
    const res = await fetch(`${url}/v1/public/catalogue?media=1&v=${encodeURIComponent(version)}`, {
      headers: { 'X-Site-Key': key, Accept: 'application/json' },
      next: { revalidate: 86_400, tags: TAGS },
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) return null;
    body = (await res.json()) as typeof body;
  } catch {
    return null;
  }
  if (!Array.isArray(body.projects) || body.projects.length === 0) return null;
  // The API sends every project whole: the same cut the build makes is made here before anything is used.
  const cut = slimCatalogue(inRemOrder(body.projects));
  try {
    return loadSiteData({
      ...fileOptions(),
      detail: { fetchedAt: body.fetchedAt, source: 'mbr-api', count: cut.projects.length, projects: cut.projects },
      list: cut.list,
      pictures: body.media,
    });
  } catch (error) {
    if (!(error instanceof DataError)) throw error;
    return null;
  }
}

async function dataFromApi(): Promise<SiteData | null> {
  if (process.env.CATALOGUE_SOURCE === 'files' || config.catalogue.runtime === 'files') return null;
  const { url, key } = apiSettings();
  if (!url || !key) return null;
  // Every page that shows projects carries the list's tags, so the API's refresh call after a change reaches it. This
  // small request is cached; only its tags matter (Next.js adds a request's tags to the page that makes it).
  await fetch(`${url}/v1/public/catalogue/version`, { headers: { 'X-Site-Key': key }, next: { revalidate: 86_400, tags: TAGS } }).catch(() => null);
  const version = await currentVersion(url, key);
  if (!held || held.version !== version) held = { version, data: downloadCatalogue(url, key, version) };
  const data = await held.data;
  // A failed download is not kept: the next page tries again.
  if (!data) held = null;
  return data;
}

export const getData = cache(async (): Promise<SiteData> => (await dataFromApi()) ?? filesData());

/** Work derived from one catalogue (orderings, lookups, area groups) is done once per catalogue, not once per page. */
const derived = new WeakMap<SiteData, Map<string, unknown>>();
export function once<T>(data: SiteData, key: string, make: () => T): T {
  let m = derived.get(data);
  if (!m) derived.set(data, (m = new Map()));
  if (!m.has(key)) m.set(key, make());
  return m.get(key) as T;
}

export const getProjects = async () => (await getData()).projects;
export const getProject = async (slug: string) => {
  const data = await getData();
  return once(data, 'project-by-slug', () => new Map(data.projects.map((p) => [p.slug, p]))).get(slug);
};
export const getDevelopers = async () => (await getData()).developers;
export const getDeveloper = async (slug: string) => {
  const data = await getData();
  return once(data, 'developer-by-slug', () => new Map(data.developers.map((d) => [d.slug, d]))).get(slug);
};
export const getPosts = async () => (await getData()).posts;
export type * from './types.ts';

const STATUS_RANK = { 'new-launch': 1, 'coming-soon': 2, available: 3, 'sold-out': 9 } as const;
/**
 * The site's default order: new launches first, then newest, with pictures before none. The first places are spread
 * across developers (one each, then two each), so the front pages never show six projects from one developer.
 */
export const featuredProjects = cache(async (): Promise<import('./types.ts').Project[]> => {
  const data = await getData();
  return once(data, 'featured', () => featuredOrder(data.projects));
});

function featuredOrder(all: import('./types.ts').Project[]): import('./types.ts').Project[] {
  const sorted = [...all].sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      Number(!a.cover) - Number(!b.cover) ||
      Number(!a.propertyTypes.some((t) => t !== 'commercial')) - Number(!b.propertyTypes.some((t) => t !== 'commercial')) ||
      Number(a.isTeaser) - Number(b.isTeaser) ||
      b.createdAt.localeCompare(a.createdAt),
  );
  const out: typeof sorted = [];
  const used = new Set<string>();
  const taken = new Map<string, number>();
  for (const perDeveloper of [1, 2]) {
    for (const p of sorted) {
      if (used.has(p.slug) || out.length >= 24 || (taken.get(p.developerSlug) ?? 0) >= perDeveloper) continue;
      taken.set(p.developerSlug, (taken.get(p.developerSlug) ?? 0) + 1);
      out.push(p);
      used.add(p.slug);
    }
  }
  return [...out, ...sorted.filter((p) => !used.has(p.slug))];
}
