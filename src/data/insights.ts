/** Numbers and groupings computed from the data. Nothing here is typed in by hand. */
import 'server-only';
import { getData, getDevelopers, getProjects } from './index.ts';
import type { PaymentPlan, Project, PropertyType } from './types.ts';

export const selling = (p: Project) => p.status === 'available' || p.status === 'new-launch';

export async function siteStats() {
  const data = await getData();
  const ps = data.projects;
  const areas = new Set(ps.map((p) => p.communityName));
  const byEmirate = new Map<string, number>();
  for (const p of ps) byEmirate.set(p.emirate, (byEmirate.get(p.emirate) ?? 0) + 1);
  const years = ps.filter((p) => p.completion !== 'ready' && p.handover.year).map((p) => p.handover.year!);
  const sellingPrices = ps.filter((p) => p.status !== 'sold-out' && p.priceFrom).map((p) => p.priceFrom!);
  const bedroomKinds = new Set(ps.flatMap((p) => p.bedrooms.map((b) => (Number(b) >= 4 ? '4+' : String(Math.floor(Number(b)))))));
  const typeKinds = new Set(ps.flatMap((p) => p.propertyTypes));
  return {
    projects: ps.length,
    selling: ps.filter(selling).length,
    comingSoon: ps.filter((p) => p.status === 'coming-soon').length,
    soldOut: ps.filter((p) => p.status === 'sold-out').length,
    ready: ps.filter((p) => p.completion === 'ready').length,
    developers: data.developers.length,
    areas: areas.size,
    /** Emirates with projects, the most first. */
    emirates: [...byEmirate.entries()].sort((a, b) => b[1] - a[1]).map(([e]) => e),
    unitTypes: bedroomKinds.size + [...typeKinds].filter((t) => t !== 'apartment').length,
    handoverFrom: years.length ? Math.min(...years) : null,
    handoverTo: years.length ? Math.max(...years) : null,
    lowestPrice: sellingPrices.length ? Math.min(...sellingPrices) : null,
    withPlans: ps.filter((p) => p.paymentPlans.length).length,
    withPostHandover: ps.filter((p) => p.hasPostHandover).length,
    fetchedAt: data.fetchedAt,
  };
}

// ---- connectivity: one row per named place, ranges across the projects that list it
const num = (s: string | null) => (s ? Number.parseFloat(s.replace(/[^\d.]/g, '')) : Number.NaN);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export interface PlaceRow {
  name: string;
  category: string | null;
  categoryCode: string | null;
  projects: number;
  minTime: number | null;
  maxTime: number | null;
  minKm: number | null;
  maxKm: number | null;
}

export async function connectivity(projects?: Project[]): Promise<PlaceRow[]> {
  const list = projects ?? (await getProjects());
  const rows = new Map<string, PlaceRow & { seen: Set<string> }>();
  for (const p of list) {
    for (const n of p.nearby) {
      const key = norm(n.name);
      const r = rows.get(key) ?? { name: n.name, category: n.category, categoryCode: n.categoryCode, projects: 0, minTime: null, maxTime: null, minKm: null, maxKm: null, seen: new Set<string>() };
      if (!r.seen.has(p.slug)) {
        r.seen.add(p.slug);
        r.projects++;
      }
      r.category ??= n.category;
      r.categoryCode ??= n.categoryCode;
      const t = num(n.time);
      const d = num(n.distance);
      if (Number.isFinite(t)) {
        r.minTime = r.minTime == null ? t : Math.min(r.minTime, t);
        r.maxTime = r.maxTime == null ? t : Math.max(r.maxTime, t);
      }
      if (Number.isFinite(d)) {
        r.minKm = r.minKm == null ? d : Math.min(r.minKm, d);
        r.maxKm = r.maxKm == null ? d : Math.max(r.maxKm, d);
      }
      rows.set(key, r);
    }
  }
  return [...rows.values()]
    .filter((r) => r.minTime != null || r.minKm != null)
    .map(({ seen: _seen, ...r }) => r)
    .sort((a, b) => b.projects - a.projects || a.name.localeCompare(b.name));
}

export const range = (a: number | null, b: number | null, unit: string) =>
  a == null ? null : b == null || a === b ? `${a} ${unit}` : `${a} to ${b} ${unit}`;

// ---- unit-type tabs
export interface UnitTab {
  key: string;
  label: string;
  projects: Project[];
  priceFrom: number | null;
  /** The middle 80% of listed sizes (10th to 90th percentile), so a few odd portal entries do not set the range. */
  areaFrom: number | null;
  areaTo: number | null;
}

const percentile = (sorted: number[], q: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))]!;

const bedMatch = (p: Project, keys: string[]) => p.bedrooms.some((b) => keys.includes(b));
const bedKey = (bedrooms: string | null) => (bedrooms === 'Studio' ? '0' : (bedrooms ?? ''));
export const UNIT_TABS: { key: string; label: string; bedrooms?: string[]; types?: PropertyType[] }[] = [
  { key: 'studio', label: 'Studio', bedrooms: ['0'] },
  { key: '1-bedroom', label: '1 bedroom', bedrooms: ['1', '1.5'] },
  { key: '2-bedroom', label: '2 bedrooms', bedrooms: ['2', '2.5'] },
  { key: '3-bedroom', label: '3 bedrooms', bedrooms: ['3', '3.5'] },
  { key: 'townhouses-villas', label: 'Townhouses and villas', types: ['townhouse', 'villa'] },
];

export function unitsFor(p: Project, tab: (typeof UNIT_TABS)[number]) {
  return p.units.filter((u) =>
    tab.bedrooms ? tab.bedrooms.includes(bedKey(u.bedrooms)) : /town|villa|mansion/i.test(u.type),
  );
}

/** Cheapest listed price for this unit type. Null when that type has no price. */
export function unitPriceFrom(p: Project, tab: (typeof UNIT_TABS)[number]) {
  const prices = unitsFor(p, tab).map((u) => u.priceFrom).filter((n): n is number => !!n);
  return prices.length ? Math.min(...prices) : null;
}

export async function unitTabs(): Promise<UnitTab[]> {
  const ps = (await getProjects());
  return UNIT_TABS.map((t) => {
    const matches = ps.filter((p) => (t.bedrooms ? bedMatch(p, t.bedrooms) : p.propertyTypes.some((x) => t.types!.includes(x))));
    const rows = matches.filter((p) => p.status !== 'sold-out').flatMap((p) => unitsFor(p, t));
    const prices = rows.map((u) => u.priceFrom).filter((n): n is number => !!n);
    const areas = rows.flatMap((u) => [u.areaFrom, u.areaTo]).filter((n): n is number => !!n).sort((a, b) => a - b);
    const order = (p: Project) => (selling(p) ? 0 : p.status === 'coming-soon' ? 1 : 2);
    return {
      key: t.key,
      label: t.label,
      projects: [...matches].sort((a, b) => order(a) - order(b) || (unitPriceFrom(a, t) ?? 9e12) - (unitPriceFrom(b, t) ?? 9e12)),
      priceFrom: prices.length ? Math.min(...prices) : null,
      areaFrom: areas.length ? Math.round(percentile(areas, 0.1)) : null,
      areaTo: areas.length ? Math.round(percentile(areas, 0.9)) : null,
    };
  }).filter((t) => t.projects.length);
}

// ---- payment plans
export const planSplit = (pl: PaymentPlan) =>
  [pl.split.booking, pl.split.construction, pl.split.handover, pl.split.postHandover].filter((n) => n > 0).map(Math.round).join('/');

export async function planStats(projects?: Project[]) {
  const ps = projects ?? (await getProjects());
  const splits = new Map<string, number>();
  let dldPlans = 0;
  const dldPercents = new Map<number, number>();
  for (const p of ps) {
    for (const pl of p.paymentPlans) {
      const s = planSplit(pl);
      splits.set(s, (splits.get(s) ?? 0) + 1);
      const dld = pl.milestones.flatMap((m) => m.steps).find((st) => st.isFee && /dld|land department/i.test(st.title));
      if (dld?.percent) {
        dldPlans++;
        dldPercents.set(dld.percent, (dldPercents.get(dld.percent) ?? 0) + 1);
      }
    }
  }
  const common = [...splits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([split, count]) => ({ split, count }));
  const dldPercent = [...dldPercents.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    projectsWithPlans: ps.filter((p) => p.paymentPlans.length).length,
    plans: ps.reduce((n, p) => n + p.paymentPlans.length, 0),
    withPostHandover: ps.filter((p) => p.hasPostHandover).length,
    common,
    dldPlans,
    dldPercent,
  };
}

/** Plan presets for the calculator: the most common splits in the data, as stage percentages. */
export async function planPresets() {
  const seen = new Map<string, PaymentPlan['split'] & { count: number }>();
  for (const p of (await getProjects())) {
    for (const pl of p.paymentPlans) {
      const k = planSplit(pl);
      const cur = seen.get(k);
      if (cur) cur.count++;
      else seen.set(k, { ...pl.split, count: 1 });
    }
  }
  return [...seen.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 4).map(([label, s]) => ({ label, ...s }));
}

export async function topAmenities(n = 12, projects?: Project[]) {
  const counts = new Map<string, { name: string; count: number }>();
  for (const p of projects ?? (await getProjects())) {
    for (const a of p.amenities) {
      const k = norm(a.name);
      const c = counts.get(k) ?? { name: a.name, count: 0 };
      c.count++;
      counts.set(k, c);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, n);
}

export async function handoverTimeline(projects?: Project[]) {
  const ps = projects ?? (await getProjects());
  const byYear = new Map<number, number>();
  for (const p of ps) if (p.completion !== 'ready' && p.handover.year) byYear.set(p.handover.year, (byYear.get(p.handover.year) ?? 0) + 1);
  return {
    ready: ps.filter((p) => p.completion === 'ready').length,
    unknown: ps.filter((p) => p.completion !== 'ready' && !p.handover.year).length,
    years: [...byYear.entries()].sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count })),
  };
}

export const BUDGETS = [
  { key: 'under-1m', label: 'Under AED 1M', min: 0, max: 1_000_000 },
  { key: '1m-2m', label: 'AED 1M to 2M', min: 1_000_000, max: 2_000_000 },
  { key: '2m-3m', label: 'AED 2M to 3M', min: 2_000_000, max: 3_000_000 },
  { key: '3m-plus', label: 'AED 3M and above', min: 3_000_000, max: Number.POSITIVE_INFINITY },
] as const;

export async function typeCounts(projects?: Project[]) {
  const ps = projects ?? (await getProjects());
  return (['apartment', 'townhouse', 'villa', 'commercial'] as const).map((t) => ({ type: t, count: ps.filter((p) => p.propertyTypes.includes(t)).length }));
}

/** Related projects: same area first, then same developer, shared type and bedrooms, then nearest price. */
export async function relatedProjects(p: Project, n = 3) {
  const score = (o: Project) =>
    (o.communityName === p.communityName ? 120 : 0) +
    (o.developerSlug === p.developerSlug ? 60 : 0) +
    (o.propertyTypes.some((t) => p.propertyTypes.includes(t)) ? 20 : 0) +
    o.bedrooms.filter((b) => p.bedrooms.includes(b)).length * 5 +
    (o.status === 'sold-out' ? -50 : 0) -
    (p.priceFrom && o.priceFrom ? Math.abs(p.priceFrom - o.priceFrom) / 200_000 : 10);
  return (await getProjects()).filter((o) => o.slug !== p.slug).sort((a, b) => score(b) - score(a)).slice(0, n);
}


/** Facts behind the market FAQ answers. */
export async function faqFacts() {
  const s = await siteStats();
  const ps = (await getProjects());
  const byArea = new Map<string, number>();
  for (const p of ps) byArea.set(p.communityName, (byArea.get(p.communityName) ?? 0) + 1);
  const plans = await planStats();
  const beds = ps.flatMap((p) => p.bedrooms.map(Number)).filter((n) => Number.isFinite(n));
  return {
    projects: s.projects,
    selling: s.selling,
    comingSoon: s.comingSoon,
    soldOut: s.soldOut,
    ready: s.ready,
    areas: s.areas,
    emirates: s.emirates,
    topAreas: [...byArea.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name),
    developers: (await getDevelopers()).map((d) => d.name),
    developerCount: s.developers,
    maxBedrooms: beds.length ? Math.floor(Math.max(...ps.filter((p) => p.propertyTypes.includes('apartment')).flatMap((p) => p.bedrooms.map(Number)))) : null,
    townhouseVillaProjects: ps.filter((p) => p.propertyTypes.some((t) => t === 'townhouse' || t === 'villa')).length,
    lowestPrice: s.lowestPrice,
    withPlans: s.withPlans,
    withPostHandover: s.withPostHandover,
    commonSplits: plans.common.slice(0, 3).map((c) => c.split),
    handoverFrom: s.handoverFrom,
    handoverTo: s.handoverTo,
    dldPercent: plans.dldPercent,
    dldPlans: plans.dldPlans,
    asOf: new Date(s.fetchedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
  };
}

/** Drive-time range from the data for a place matching the pattern, e.g. the airport. */
export async function placeRange(pattern: RegExp) {
  const row = (await connectivity()).find((r) => pattern.test(r.name));
  return row && row.minTime != null ? { name: row.name, text: range(row.minTime, row.maxTime, 'min')!, projects: row.projects } : null;
}
