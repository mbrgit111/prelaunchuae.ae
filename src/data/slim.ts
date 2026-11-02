/**
 * PrelaunchUAE's own cut of the REM project list.
 *
 * The MBR desk keeps every project whole (the same copy the Offplan site reads, about 2,400 projects). PrelaunchUAE shows
 * only the pre-launch ones (see isPrelaunch), so the list is cut down and made lighter here before the site uses it, the
 * same way wherever the list comes from:
 *   scripts/pull-catalogue.ts    before every build, from the MBR API (the list "Update properties" keeps in step with REM)
 *   scripts/build-catalogue.ts   by hand, from a full REM export
 *   src/data/index.ts            while the site runs, only when site.config.ts says catalogue.runtime 'api'
 * scripts/sync-images.mjs downloads exactly the pictures left in the saved result, so a page never asks for a picture
 * that was not downloaded.
 *
 * What the cut does:
 * - keeps only REM's pre-launch projects: status 'launch' (New launch) or 'pending' (Coming soon). Projects already on
 *   general sale ('available', the ones ready to buy) and sold out ones are left out (MBR, 2 Nov 2026);
 * - leaves out projects marked private on the portal;
 * - blanks the description: it is the developer's marketing copy (it promises returns), and Net Capital writes its own;
 * - keeps the cover, 4 gallery pictures and 4 floor plans for a project still selling, and the cover only for one that
 *   is sold out. No amenity photos, no nearby-place photos (the site never showed them);
 * - keeps only the fields the site reads (so REM's sales staff contacts and other-language copies never travel);
 * - leaves out a project the site's checks would reject, with the reason, so one bad portal record never stops the
 *   whole site from building.
 */
import { RawListItem, RawProject } from './schema.ts';

/**
 * The pre-launch projects on REM: 'launch' = New launch, 'pending' = Coming soon. 'available' (on sale now, ready to
 * buy) and 'sold_out' are not pre-launch and never reach this site.
 */
export const PRELAUNCH_STATUSES: readonly string[] = ['launch', 'pending'];
export const isPrelaunch = (p: { status?: unknown }): boolean => PRELAUNCH_STATUSES.includes(String(p.status));

export const MAX_GALLERY = 4;
export const MAX_PLANS = 4;
const GROUPS = ['exterior', 'interior', 'lobby', 'architecture', 'amenities', 'general', 'other'] as const;

type Row = Record<string, unknown>;
const row = (v: unknown): Row => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Row) : {});
const rows = (v: unknown): Row[] => (Array.isArray(v) ? v.map(row) : []);

export interface SlimCatalogue {
  /** The projects kept, in the order they came. */
  projects: Row[];
  /** One entry per kept project: the "available now" prices and unit counts. */
  list: Row[];
  /** Why projects were left out: reason -> project names. */
  leftOut: Record<string, string[]>;
}

/** Up to `max` pictures, taken in turn from each group so a project shows a mix of views. */
function capGallery(images: Row, max: number): Row {
  const featured = images.featured as string;
  const seen = new Set([featured]);
  const queues = GROUPS.map((g) => (Array.isArray(images[g]) ? (images[g] as unknown[]) : []).filter((u): u is string => typeof u === 'string'));
  const kept: Record<string, string[]> = Object.fromEntries(GROUPS.map((g) => [g, []]));
  let total = 0;
  for (let round = 0; total < max && queues.some((q) => q.length); round++) {
    GROUPS.forEach((g, i) => {
      while (total < max && queues[i]!.length) {
        const url = queues[i]!.shift()!;
        if (seen.has(url)) continue;
        seen.add(url);
        kept[g]!.push(url);
        total++;
        break;
      }
    });
  }
  return { featured, ...kept };
}

const url = (u: unknown) => {
  if (typeof u !== 'string' || !u) return '';
  try { return new URL(u).protocol.startsWith('http') ? u : ''; } catch { return ''; }
};

function slimProject(p: Row): Row {
  let plans = 0;
  const soldOut = p.status === 'sold_out';
  const maxPlans = soldOut ? 0 : MAX_PLANS;
  const developer = row(p.developer);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    status: p.status,
    completionStatus: p.completionStatus,
    districtId: p.districtId,
    districtIds: p.districtIds,
    districtName: p.districtName,
    emirateName: p.emirateName,
    developer: { id: developer.id, name: developer.name, logo: url(developer.logo) },
    location: { coordinates: row(p.location).coordinates },
    currency: p.currency,
    priceUponRequest: p.priceUponRequest,
    priceStart: p.priceStart,
    priceEnd: p.priceEnd,
    images: capGallery(row(p.images), soldOut ? 0 : MAX_GALLERY),
    // The portal text is the developer's marketing copy (it promises returns). PrelaunchUAE writes its own intro.
    description: '',
    expectedCompletionDate: p.expectedCompletionDate,
    attachments: rows(p.attachments).map((a) => ({ title: a.title, url: a.url, fileType: a.fileType })),
    amenities: rows(p.amenities).map((a) => ({ name: a.name, description: a.description ?? null, image: '' })),
    paymentPlans: p.paymentPlans,
    unitTypes: p.unitTypes,
    propertyTypes: p.propertyTypes,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    totalUnits: p.totalUnits,
    unitStructures: rows(p.unitStructures).map((u) => ({
      name: u.name,
      unitType: u.unitType,
      bedroom: u.bedroom,
      priceStart: u.priceStart,
      priceEnd: u.priceEnd,
      areaStart: u.areaStart,
      areaEnd: u.areaEnd,
      image: url(u.image) && plans < maxPlans ? (plans++, url(u.image)) : '',
    })),
    hasPostHandover: p.hasPostHandover,
    nearbyLocations: rows(p.nearbyLocations).map((n) => ({
      name: n.name,
      distance: n.distance,
      time: n.time,
      picture: '',
      category: n.category ? { code: row(n.category).code, name: { en: row(row(n.category).name).en } } : null,
    })),
    isPublic: p.isPublic,
    isPrivate: p.isPrivate,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/**
 * A list from the MBR API put in the order REM itself lists projects (by name, then REM id), whatever order the database
 * sent it in. So the same list always makes the same files and pages, and matches the order of a REM export.
 */
export function inRemOrder(projects: unknown[]): unknown[] {
  const text = (p: unknown, field: string) => String(row(p)[field] ?? '');
  const order = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  return [...projects].sort((a, b) => order(text(a, 'title'), text(b, 'title')) || order(text(a, 'id'), text(b, 'id')));
}

/**
 * Makes PrelaunchUAE's cut of a project list.
 * `list` is REM's own list, which carries the "available now" figures; a REM export has it as a separate file. The MBR
 * API keeps those figures inside each project instead, so there the list is left out and they are read from the project.
 */
export function slimCatalogue(projects: unknown[], list?: unknown[]): SlimCatalogue {
  const leftOut: Record<string, string[]> = {};
  const skip = (why: string, title: unknown) => (leftOut[why] ??= []).push(String(title ?? '?').trim());
  const listById = list ? new Map(rows(list).map((l) => [l.id, l])) : null;
  const out: SlimCatalogue = { projects: [], list: [], leftOut };
  for (const p of rows(projects)) {
    if (!isPrelaunch(p)) { skip(p.status === 'sold_out' ? 'sold out (not pre-launch)' : 'on general sale (not pre-launch)', p.title); continue; }
    if (p.isPrivate || p.isPublic === false) { skip('private on the portal', p.title); continue; }
    const slim = slimProject(p);
    const check = RawProject.safeParse(slim);
    if (!check.success) {
      skip(`portal data fails the site checks (${check.error.issues[0]?.path.join('.')}: ${check.error.issues[0]?.message})`, p.title);
      continue;
    }
    const l = listById ? listById.get(p.id) : p;
    const listRow = { id: p.id, minAvailablePrice: l?.minAvailablePrice ?? null, maxAvailablePrice: l?.maxAvailablePrice ?? null, availableUnits: l?.availableUnits ?? null, totalUnits: l?.totalUnits ?? null };
    if (!RawListItem.safeParse(listRow).success) { skip('list entry fails the site checks', p.title); continue; }
    out.projects.push(slim);
    out.list.push(listRow);
  }
  return out;
}
