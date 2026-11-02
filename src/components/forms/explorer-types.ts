/**
 * The project index the explorer loads (/projects-index.json) and the filters it applies. Shared by the server (which
 * writes the index) and the browser (which filters it). Short keys keep the file small.
 */
export interface IndexItem {
  s: string; // slug
  n: string; // name
  d: string; // developer
  ds: string; // developer slug
  a: string; // area
  as: string; // area slug
  e: string; // emirate slug
  t: string[]; // property types
  b: string[]; // bedrooms ("0" = studio)
  st: 'new-launch' | 'available' | 'coming-soon' | 'sold-out';
  p: number | null; // "From" price, AED
  y: number | null; // completion year
  hl: string | null; // completion label, e.g. "June 2028"
  r: boolean; // ready
  c: string; // created, YYYY-MM-DD
  k: number; // featured rank
  i: string | null; // cover picture
  bl: string | null; // bedrooms label
  tl: string; // property type labels
  pl: string | null; // payment plan label
  ph: boolean; // payments after handover
}

export interface Filters {
  q: string;
  emirate: string;
  area: string;
  avail: string;
  type: string;
  beds: string;
  budget: string;
  handover: string;
  developer: string;
  sort: string;
}

export const EMPTY_FILTERS: Filters = { q: '', emirate: '', area: '', avail: '', type: '', beds: '', budget: '', handover: '', developer: '', sort: 'featured' };
export const FILTER_KEYS = Object.keys(EMPTY_FILTERS) as (keyof Filters)[];

export const BUDGET: Record<string, [number, number]> = {
  'under-1m': [0, 1e6],
  '1m-2m': [1e6, 2e6],
  '2m-3m': [2e6, 3e6],
  '3m-5m': [3e6, 5e6],
  '5m-plus': [5e6, Infinity],
  // Older links from the home finder
  '3m-plus': [3e6, Infinity],
};

export const isFiltered = (f: Filters) => FILTER_KEYS.some((k) => (k === 'sort' ? f.sort !== 'featured' : Boolean(f[k])));

function matchesBeds(it: IndexItem, beds: string) {
  if (beds === 'studio') return it.b.includes('0');
  if (beds === '1-bedroom') return it.b.some((b) => b === '1' || b === '1.5');
  if (beds === '2-bedroom') return it.b.some((b) => b === '2' || b === '2.5');
  if (beds === '3-bedroom') return it.b.some((b) => b === '3' || b === '3.5');
  if (beds === '4-bedroom-plus') return it.b.some((b) => Number(b) >= 4);
  if (beds === 'townhouses-villas') return it.t.includes('townhouse') || it.t.includes('villa');
  return true;
}

const fold = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function applyFilters(items: IndexItem[], f: Filters): IndexItem[] {
  const words = fold(f.q).split(/\s+/).filter(Boolean);
  const out = items.filter((it) => {
    if (words.length) {
      const hay = fold(`${it.n} ${it.d} ${it.a}`);
      if (!words.every((w) => hay.includes(w))) return false;
    }
    if (f.emirate && it.e !== f.emirate) return false;
    if (f.area && it.as !== f.area) return false;
    if (f.avail === 'selling' && it.st !== 'available' && it.st !== 'new-launch') return false;
    if (f.avail === 'new-launch' && it.st !== 'new-launch') return false;
    if (f.avail === 'ready' && (!it.r || it.st === 'sold-out')) return false;
    if (f.avail === 'coming-soon' && it.st !== 'coming-soon') return false;
    if (f.avail === 'sold-out' && it.st !== 'sold-out') return false;
    if (f.type && !it.t.includes(f.type)) return false;
    if (f.beds && !matchesBeds(it, f.beds)) return false;
    if (f.developer && it.ds !== f.developer) return false;
    if (f.budget && BUDGET[f.budget]) {
      const [lo, hi] = BUDGET[f.budget]!;
      if (it.p == null || it.p < lo || it.p >= hi) return false;
    }
    if (f.handover === 'ready' && !it.r) return false;
    if (f.handover && f.handover !== 'ready') {
      const y = Number(f.handover.replace('+', ''));
      if (it.r || it.y == null) return false;
      if (f.handover.endsWith('+') ? it.y < y : it.y !== y) return false;
    }
    return true;
  });
  const big = Number.MAX_SAFE_INTEGER;
  if (f.sort === 'price-asc') out.sort((a, b) => (a.p ?? big) - (b.p ?? big));
  else if (f.sort === 'price-desc') out.sort((a, b) => (b.p ?? -1) - (a.p ?? -1));
  else if (f.sort === 'handover') out.sort((a, b) => (a.r ? 0 : (a.y ?? big)) - (b.r ? 0 : (b.y ?? big)) || a.k - b.k);
  else if (f.sort === 'newest') out.sort((a, b) => b.c.localeCompare(a.c));
  else out.sort((a, b) => a.k - b.k);
  return out;
}

/** Filters from a query string, ignoring anything unknown. */
export function readFilters(search: string): Filters {
  const q = new URLSearchParams(search);
  const f = { ...EMPTY_FILTERS };
  for (const k of FILTER_KEYS) {
    const v = q.get(k)?.trim();
    if (v) f[k] = v.slice(0, 80);
  }
  return f;
}

export function filtersToQuery(f: Filters): string {
  const q = new URLSearchParams();
  for (const k of FILTER_KEYS) if (f[k] && !(k === 'sort' && f[k] === 'featured')) q.set(k, f[k]);
  return q.size ? `?${q}` : '';
}
