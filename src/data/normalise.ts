/**
 * Turns the raw portal JSON into the typed records in types.ts. Pure function, no file access, so the build,
 * the dev server and `npm run check:data` all run exactly the same checks. Nothing is invented: a value the
 * portal does not supply stays null and the page shows nothing (or "Contact us for details").
 */
import { z } from 'zod';
import { MediaManifest, RawDetailFile, RawListItem, RawPosts, RawProject } from './schema.ts';
import type {
  Amenity, DataIssue, Developer, DocumentKind, GalleryImage, MediaImage, NearbyPlace, PaymentPlan, Post, Project,
  ProjectStatus, PropertyType, SiteData, UnitRow,
} from './types.ts';

export class DataError extends Error {
  constructor(problems: string[]) {
    super(`The project data did not pass the build checks (${problems.length} problem${problems.length === 1 ? '' : 's'}):\n\n${problems.join('\n\n')}\n`);
    this.name = 'DataError';
  }
}

export interface NormaliseInput {
  detail: unknown;
  list: unknown;
  manifest: unknown | null;
  posts: unknown;
  scope: 'dubai-south-only' | 'all';
  communityName: string; // "Dubai South"
  /** Portal districts that lie inside the community and are published with it (e.g. "Emaar South"). */
  alsoDistricts?: string[];
  /** When given, only projects it accepts are published (e.g. those with an advertising permit). */
  publish?: (slug: string) => boolean;
  /** Portal district names shown under another name (spelling fixes, two spellings of one area). */
  renameAreas?: Record<string, string>;
  /** Picture addresses the portal no longer serves (written by scripts/sync-images.mjs). They are left out, not waited for. */
  unavailable?: unknown;
}

/** Portal district names as people read them: single spaces, Latin letters only, no ALL CAPS or all lower case. */
export function tidyArea(raw: string, renames: Record<string, string> = {}): string {
  const lookalike: Record<string, string> = { 'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X', 'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x' };
  let s = raw.replace(/[А-Яа-я]/g, (c) => lookalike[c] ?? c).replace(/\s+/g, ' ').trim();
  if (renames[s]) return renames[s]!;
  if (s === s.toLowerCase() || s === s.toUpperCase()) s = s.toLowerCase().replace(/(^|[\s(])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());
  return renames[s] ?? s;
}

export const slugify = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const round1 = (n: number) => Math.round(n * 10) / 10;
const positive = (n: number | null | undefined) => (typeof n === 'number' && n > 0 ? n : null);
/** No home in the UAE sells for less than this; a lower figure in the portal is a typing error, so it is not shown. */
const MIN_PRICE = 100_000;
const price = (n: number | null | undefined) => (typeof n === 'number' && n >= MIN_PRICE ? n : null);
const PLUS_CODE = /[A-Z0-9]{4}\+[A-Z0-9]{2,}/;

const STATUS: Record<RawProject['status'], ProjectStatus> = { launch: 'new-launch', available: 'available', pending: 'coming-soon', sold_out: 'sold-out' };
const TYPE: Record<string, PropertyType> = {
  apartment: 'apartment', apartments: 'apartment', townhouse: 'townhouse', townhouses: 'townhouse',
  villa: 'villa', villas: 'villa', mansion: 'villa', mansions: 'villa', commerce: 'commercial', commercial: 'commercial',
};
const GALLERY: [keyof RawProject['images'], string][] = [
  ['exterior', 'Exterior'], ['interior', 'Interior'], ['lobby', 'Lobby'], ['architecture', 'Architecture'],
  ['amenities', 'Amenities'], ['general', 'Location and site plans'], ['other', 'Other'],
];
const DOCS: Record<string, DocumentKind> = { brochure: 'brochure', floor_plan: 'floor-plans' };

function zodProblems(where: string, error: z.ZodError) {
  return `${where}\n${z.prettifyError(error).split('\n').map((l) => `   ${l}`).join('\n')}`;
}

export function bedroomsLabel(raw: string[]): string | null {
  if (!raw.length) return null;
  const names = raw.map((v) => (v === '0' ? 'Studio' : v));
  const last = names.at(-1)!;
  const suffix = last === '1' ? 'bedroom' : 'bedrooms';
  if (names.length === 1) return last === 'Studio' ? 'Studio' : `${last} ${suffix}`;
  const nums = raw.map(Number);
  const contiguous = names.length >= 3 && nums.every((n, i) => Number.isInteger(n) && (i === 0 || n - nums[i - 1]! === 1));
  if (contiguous) return `${names[0]} to ${last} ${suffix}`;
  return `${names.slice(0, -1).join(', ')} and ${last} ${suffix}`;
}

export function normalise(input: NormaliseInput): SiteData {
  const problems: string[] = [];
  const issues: DataIssue[] = [];

  // ---- files
  const detailFile = RawDetailFile.safeParse(input.detail);
  if (!detailFile.success) throw new DataError([zodProblems('data/remapp-projects.json (file layout)', detailFile.error)]);
  const listFile = z.array(z.unknown()).safeParse(input.list);
  if (!listFile.success) throw new DataError(['data/remapp-projects-list.json must be a list of projects']);
  if (detailFile.data.count !== detailFile.data.projects.length) {
    problems.push(`data/remapp-projects.json says count = ${detailFile.data.count} but holds ${detailFile.data.projects.length} projects`);
  }

  const raws: RawProject[] = [];
  detailFile.data.projects.forEach((p, i) => {
    const r = RawProject.safeParse(p);
    const rec = p as { title?: string; id?: string } | null;
    const name = rec?.title?.trim() || (rec?.id ? `id ${rec.id}` : `#${i + 1}`);
    if (r.success) raws.push(r.data);
    else problems.push(zodProblems(`data/remapp-projects.json, project "${name}" (position ${i + 1})`, r.error));
  });
  const listById = new Map<string, RawListItem>();
  listFile.data.forEach((p, i) => {
    const r = RawListItem.safeParse(p);
    if (r.success) listById.set(r.data.id, r.data);
    else problems.push(zodProblems(`data/remapp-projects-list.json, record ${i + 1}`, r.error));
  });
  const ids = new Set(detailFile.data.projects.map((p) => (p as { id?: string } | null)?.id).filter(Boolean));
  for (const id of listById.keys()) if (!ids.has(id)) problems.push(`The list file has project id ${id}, which is missing from the detail file`);
  const listIds = new Set(listFile.data.map((p) => (p as { id?: string } | null)?.id).filter(Boolean));
  for (const r of raws) if (!listIds.has(r.id)) problems.push(`Project "${r.title}" is missing from the list file`);

  let manifest: MediaManifest = {};
  if (input.manifest != null) {
    const m = MediaManifest.safeParse(input.manifest);
    if (m.success) manifest = m.data;
    else problems.push(zodProblems('data/media-manifest.json', m.error));
  }
  const postsParsed = RawPosts.safeParse(input.posts ?? []);
  if (!postsParsed.success) problems.push(zodProblems('data/posts.json', postsParsed.error));

  if (problems.length) throw new DataError(problems);

  // ---- media
  let missingMedia = 0;
  const gone = new Set(Array.isArray(input.unavailable) ? input.unavailable.filter((u): u is string => typeof u === 'string') : []);
  const goneProjects = new Set<string>();
  let current = '';
  const media = (url: string | null | undefined, alt: string): MediaImage | null => {
    if (!url) return null;
    const m = manifest[url];
    if (!m) {
      // Deleted or replaced at the portal since the export: nothing to download, so it is simply left out.
      if (gone.has(url)) goneProjects.add(current);
      else missingMedia++;
      return null;
    }
    return { src: m.src, width: m.width, height: m.height, alt, ...(m.weak ? { weak: true } : {}) };
  };

  // ---- projects
  const slugs = new Set<string>();
  const projects: Project[] = [];
  for (const r of raws) {
    if (r.isPrivate || !r.isPublic) continue;
    if (input.scope === 'dubai-south-only' && r.districtName !== input.communityName && !input.alsoDistricts?.includes(r.districtName)) {
      issues.push({ code: 'out-of-scope', project: r.title, message: `${r.title} is in ${r.districtName}: checked, but hidden (scope is ${[input.communityName, ...(input.alsoDistricts ?? [])].join(' and ')} only)` });
      continue;
    }
    const l = listById.get(r.id)!;
    const name = r.title.trim();
    current = name;
    const area = tidyArea(r.districtName, input.renameAreas);
    const developerName = r.developer.name.trim();
    let slug = slugify(r.slug) || slugify(name);
    if (slugs.has(slug)) slug = `${slug}-${r.id.slice(-4)}`;
    slugs.add(slug);
    if (input.publish && !input.publish(slug)) {
      issues.push({ code: 'no-permit', project: name, message: `${name}: hidden until its advertising permit is added (sites/<site>/compliance.ts)` });
      continue;
    }

    const status: ProjectStatus = r.status === 'launch' && r.completionStatus === 'upcoming' ? 'coming-soon' : STATUS[r.status];
    const isTeaser = r.completionStatus === 'upcoming' && !r.expectedCompletionDate;
    if (isTeaser) issues.push({ code: 'teaser', project: name, message: `${name}: announced without dates or units, shown as "Coming soon"` });
    if (r.districtIds.length > 1) issues.push({ code: 'multi-district', project: name, message: `${name} is linked to ${r.districtIds.length} districts in the portal` });

    // prices: the cheapest unit available now beats the headline price; with neither, the cheapest price in the
    // developer's own unit table (the same figures the page shows under "Sizes and prices")
    const soldOut = status === 'sold-out';
    const available = price(l.minAvailablePrice);
    const headline = price(r.priceStart);
    const unitPrices = r.unitStructures.map((u) => price(u.priceStart)).filter((n): n is number => n != null);
    const fromUnits = unitPrices.length ? Math.min(...unitPrices) : null;
    const priceFrom = soldOut ? null : (available ?? headline ?? fromUnits);
    const priceSource = priceFrom == null ? null : available != null ? 'available' : headline != null ? 'headline' : 'units';
    for (const [label, n] of [['headline', r.priceStart], ['cheapest available', l.minAvailablePrice]] as const) {
      if (typeof n === 'number' && n > 0 && n < MIN_PRICE) {
        issues.push({ code: 'price-implausible', project: name, message: `${name}: ${label} price AED ${Math.round(n).toLocaleString('en-US')} is a typing error in the portal; ${priceFrom ? `the site shows AED ${Math.round(priceFrom).toLocaleString('en-US')} from the developer's unit table instead` : 'no price is shown'}` });
      }
    }
    if (available && headline && Math.abs(available - headline) > 1) {
      issues.push({ code: 'price-mismatch', project: name, message: `${name}: headline price AED ${Math.round(headline).toLocaleString('en-US')} vs cheapest available AED ${Math.round(available).toLocaleString('en-US')} (site shows the cheapest available)` });
    }
    if (!soldOut && priceFrom == null) issues.push({ code: 'no-price', project: name, message: `${name}: no price in the data, shown as "On request"` });

    // handover
    const ready = r.completionStatus === 'completed' || r.completionStatus === 'ready_to_move';
    const date = r.expectedCompletionDate ?? null;
    const d = date ? new Date(date) : null;
    const handover = {
      label: ready ? 'Ready' : d ? `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` : null,
      date,
      year: d ? d.getUTCFullYear() : null,
    };

    // types and bedrooms
    const typeLabels = [...new Set([...r.propertyTypes, ...r.unitTypes].map((t) => t.trim()).filter(Boolean))];
    const propertyTypes = [...new Set(typeLabels.map((t) => TYPE[t.toLowerCase()]).filter((t): t is PropertyType => !!t))];
    if (!propertyTypes.length) issues.push({ code: 'no-property-type', project: name, message: `${name}: no property type in the data, left out of type filters` });
    const bedrooms = [...new Set([...r.bedrooms, ...r.unitStructures.map((u) => u.bedroom ?? '')].filter((b) => b !== '').map(String))]
      .sort((a, b) => parseFloat(a) - parseFloat(b));

    // units
    const units: UnitRow[] = r.unitStructures
      .filter((u) => positive(u.priceStart) || positive(u.areaStart))
      .map((u) => {
        const beds = u.bedroom == null || u.bedroom === '' ? null : u.bedroom === '0' ? 'Studio' : u.bedroom;
        const type = (u.unitType || u.name).trim();
        return {
          type,
          bedrooms: beds,
          priceFrom: price(u.priceStart) ? Math.round(u.priceStart!) : null,
          priceTo: price(u.priceEnd) ? Math.round(u.priceEnd!) : null,
          areaFrom: positive(u.areaStart) ? Math.round(u.areaStart!) : null,
          areaTo: positive(u.areaEnd) ? Math.round(u.areaEnd!) : null,
          floorPlan: media(u.image, `${name}, ${type}${beds ? `, ${beds === 'Studio' ? 'studio' : `${beds} bedroom`}` : ''} floor plan`),
        };
      });

    // payment plans: only plans that add up to 100%
    const paymentPlans: PaymentPlan[] = [];
    for (const pl of r.paymentPlans) {
      const h = pl.headingPercentages;
      const total = h.onBooking + h.onConstruction + h.onHandover + (h.postHandover ?? 0);
      if (Math.abs(total - 100) > 0.5) {
        issues.push({ code: 'plan-total', project: name, message: `${name}: payment plan "${pl.title.trim()}" adds up to ${round1(total)}%, so it is hidden` });
        continue;
      }
      paymentPlans.push({
        title: pl.title.replace(/\s+/g, ' ').trim(),
        isDefault: !!pl.isDefault,
        split: { booking: round1(h.onBooking), construction: round1(h.onConstruction), handover: round1(h.onHandover), postHandover: round1(h.postHandover ?? 0) },
        instalments: {
          booking: pl.summary?.onBookingPaymentsCount ?? null,
          construction: pl.summary?.onConstructionPaymentsCount ?? null,
          handover: pl.summary?.onHandoverPaymentsCount ?? null,
          postHandover: pl.summary?.postHandoverPaymentsCount ?? null,
        },
        milestones: pl.milestones.map((m) => ({
          title: m.milestoneTitle.trim(),
          percent: m.percentage == null ? null : round1(m.percentage),
          payments: m.paymentsCount ?? null,
          steps: m.subSteps.map((s) => ({
            title: s.milestoneTitle.trim(),
            percent: s.percentage == null ? null : round1(s.percentage),
            isFee: !!s.isFee,
            fixedAmount: positive(s.fixedAmount),
          })),
        })),
      });
    }
    paymentPlans.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
    const first = paymentPlans[0];
    const paymentPlanLabel = !first
      ? null
      : paymentPlans.length > 1
        ? 'Several payment plans'
        : [first.split.booking, first.split.construction, first.split.handover, first.split.postHandover].filter((n) => n > 0).map(Math.round).join('/');

    // pictures
    const coverAlt = `${name} by ${developerName}, ${area}`;
    const seen = new Set<string>([r.images.featured]);
    const gallery: GalleryImage[] = [];
    for (const [key, group] of GALLERY) {
      for (const url of r.images[key] as string[]) {
        if (seen.has(url)) continue;
        seen.add(url);
        const img = media(url, `${name}, ${group.toLowerCase()}`);
        if (img) gallery.push({ group, image: img });
      }
    }
    // A cover the portal no longer serves: the project's first other picture stands in, so its cards are never blank.
    let cover = media(r.images.featured, coverAlt);
    if (!cover && gallery.length) cover = { ...gallery.shift()!.image, alt: coverAlt };

    const amenities: Amenity[] = [];
    const amenityNames = new Set<string>();
    for (const a of r.amenities) {
      const n = a.name.trim();
      if (!n || amenityNames.has(n.toLowerCase())) continue;
      amenityNames.add(n.toLowerCase());
      amenities.push({ name: n, description: a.description?.trim() || null, image: media(a.image, `${n} at ${name}`) });
    }

    const nearby: NearbyPlace[] = r.nearbyLocations.map((n) => {
      const placeName = PLUS_CODE.test(n.name) ? n.name.split(' - ')[0]!.trim() : n.name.trim();
      return {
        name: placeName,
        category: n.category?.name.en ?? null,
        categoryCode: n.category?.code ?? null,
        distance: n.distance?.trim() || null,
        time: n.time?.trim() || null,
        picture: media(n.picture, placeName),
      };
    });

    const totalUnits = l.totalUnits ?? r.totalUnits ?? null;
    projects.push({
      id: r.id,
      slug,
      name,
      status,
      completion: ready ? 'ready' : r.completionStatus === 'upcoming' ? 'upcoming' : 'under-construction',
      isTeaser,
      developerSlug: slugify(developerName),
      developerName,
      communityName: area,
      emirate: r.emirateName,
      location: { lng: r.location.coordinates[0], lat: r.location.coordinates[1] },
      currency: 'AED',
      priceFrom: priceFrom == null ? null : Math.round(priceFrom),
      priceTo: soldOut ? null : price(l.maxAvailablePrice) ? Math.round(l.maxAvailablePrice!) : null,
      priceSource,
      handover,
      propertyTypes,
      propertyTypeLabels: typeLabels,
      bedrooms,
      bedroomsLabel: bedroomsLabel(bedrooms),
      bathrooms: r.bathrooms,
      totalUnits: totalUnits && totalUnits > 0 ? totalUnits : null,
      availableUnits: totalUnits && totalUnits > 0 ? (l.availableUnits ?? null) : null,
      units,
      paymentPlans,
      paymentPlanLabel,
      hasPostHandover: !!r.hasPostHandover || paymentPlans.some((p) => p.split.postHandover > 0),
      cover,
      gallery,
      amenities,
      nearby,
      documents: [...new Set(r.attachments.map((a) => DOCS[a.fileType] ?? 'other'))],
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    });
  }

  // ---- developers
  const devs = new Map<string, Developer>();
  for (const p of projects) {
    const raw = raws.find((r) => r.id === p.id)!;
    const d = devs.get(p.developerSlug) ?? { slug: p.developerSlug, name: p.developerName, logo: media(raw.developer.logo, `${p.developerName} logo`), projectSlugs: [] };
    d.projectSlugs.push(p.slug);
    devs.set(p.developerSlug, d);
  }
  const developers = [...devs.values()].sort((a, b) => b.projectSlugs.length - a.projectSlugs.length || a.name.localeCompare(b.name));

  if (missingMedia) {
    issues.push({ code: 'media-missing', project: null, message: `${missingMedia} picture(s) are not downloaded yet: run "npm run sync:images"` });
  }
  for (const title of goneProjects) {
    const p = projects.find((x) => x.name === title);
    issues.push({ code: 'media-unavailable', project: title, message: `${title}: the portal has removed or replaced some of this project's pictures since the export${p && !p.cover ? ', so it shows without a picture' : ''}. A fresh portal download (npm run fetch:data) brings the new ones` });
  }

  const posts: Post[] = (postsParsed.data ?? []).map((p) => ({ ...p, image: p.image ?? null, imageAlt: p.imageAlt ?? null }));
  return { fetchedAt: detailFile.data.fetchedAt, projects, developers, posts, issues };
}
