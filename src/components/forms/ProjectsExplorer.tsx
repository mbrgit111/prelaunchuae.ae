'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Select } from '../ui/Select';
import { applyFilters, EMPTY_FILTERS, filtersToQuery, isFiltered, readFilters, type Filters, type IndexItem } from './explorer-types';

interface Option { value: string; label: string }

const BEDS: Option[] = [
  { value: 'studio', label: 'Studio' },
  { value: '1-bedroom', label: '1 bed' },
  { value: '2-bedroom', label: '2 beds' },
  { value: '3-bedroom', label: '3 beds' },
  { value: '4-bedroom-plus', label: '4+ beds' },
];
const BUDGETS: Option[] = [
  { value: 'under-1m', label: 'Under 1M' },
  { value: '1m-2m', label: '1M to 2M' },
  { value: '2m-3m', label: '2M to 3M' },
  { value: '3m-5m', label: '3M to 5M' },
  { value: '5m-plus', label: '5M+' },
];
const AVAIL: Option[] = [
  { value: 'new-launch', label: 'New launches' },
  { value: 'coming-soon', label: 'Coming soon' },
];
const SORTS: Option[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'handover', label: 'Completion: soonest' },
  { value: 'newest', label: 'Newest listed' },
];
const STATUS: Record<IndexItem['st'], [string, string]> = {
  'new-launch': ['New launch', 'bg-survey text-datum'],
  available: ['Selling', 'bg-white text-ink'],
  'coming-soon': ['Coming soon', 'bg-plot text-datum'],
  'sold-out': ['Sold out', 'bg-datum text-sand'],
};
const STEP = 24;
const aed = (n: number) => `AED ${Math.round(n).toLocaleString('en-US')}`;

function Chips({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (v: string) => void }) {
  return (
    <fieldset className="grid content-start gap-2">
      <legend className="text-label mb-2 !text-ink">{label}</legend>
      <div className="flex flex-wrap content-start items-start gap-2">
        {[{ value: '', label: 'Any' }, ...options].map((o) => (
          <button key={o.value || 'any'} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)} className="chip">
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** The same card as the server's ProjectCard, drawn from an index row. */
function Card({ it }: { it: IndexItem }) {
  const [status, tone] = STATUS[it.st];
  const price = it.st === 'sold-out' ? ['Availability', 'Sold out'] : it.p ? ['From', aed(it.p)] : ['Price', 'On request'];
  return (
    <article className="card card-lift group flex h-full min-w-0 flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-[inherit] bg-plot">
        {it.i ? <Image src={it.i} alt={`${it.n} by ${it.d}, ${it.a}`} fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 ease-brand group-hover:scale-[1.04]" /> : <div aria-hidden="true" className="survey-grid absolute inset-0 opacity-70" />}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className={`tag ${tone}`}>{status}</span>
          {it.ph && it.st !== 'sold-out' ? <span className="tag bg-white/90 text-ink">Post-handover plan</span> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        <p className="text-label truncate">{it.d}</p>
        <h2 className="text-h3 -mt-1">
          <Link href={`/projects/${it.s}`} className="after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none">{it.n}</Link>
        </h2>
        <p className="-mt-1.5 text-sm text-muted">{it.a}</p>
        <dl className="grid grid-cols-3 gap-3 border-y border-line py-3 text-[13px] leading-snug">
          <div><dt className="text-muted">Unit types</dt><dd className="mt-0.5 font-semibold">{it.bl ?? (it.tl || 'Details soon')}</dd></div>
          <div><dt className="text-muted">Completion</dt><dd className="mt-0.5 font-semibold">{it.hl ?? 'To be announced'}</dd></div>
          <div><dt className="text-muted">Payment plan</dt><dd className="mt-0.5 font-semibold">{it.pl ?? 'On request'}</dd></div>
        </dl>
        <p className="mt-auto grid pt-1">
          <span className="text-xs text-muted">{price[0]}</span>
          <strong className="text-figure text-[26px] font-medium leading-tight">{price[1]}</strong>
        </p>
      </div>
    </article>
  );
}

/**
 * Search, filters and sorting over every project. With no filter set, the server's own cards and page links show
 * (fast, and every project is reachable for crawlers). The first filter loads /projects-index.json once and the
 * results are drawn here, 24 at a time. The address keeps the filters, so a filtered list can be shared.
 */
export function ProjectsExplorer({ total, emirateOptions, areaOptions, developerOptions, typeOptions, handoverOptions, children }: {
  total: number;
  emirateOptions: Option[];
  areaOptions: Option[];
  developerOptions: Option[];
  typeOptions: Option[];
  handoverOptions: Option[];
  /** The server-rendered first page: cards and page links. */
  children: React.ReactNode;
}) {
  const [f, setF] = useState<Filters>(EMPTY_FILTERS);
  const [index, setIndex] = useState<IndexItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState(STEP);
  // Phones: the filters fold away so the projects are not two screens down. Always open from 768px.
  const [open, setOpen] = useState(false);
  const loading = useRef(false);
  const filtered = isFiltered(f);

  const load = () => {
    if (index || loading.current) return;
    loading.current = true;
    fetch('/projects-index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((rows: IndexItem[]) => setIndex(rows))
      .catch(() => setFailed(true))
      .finally(() => { loading.current = false; });
  };

  useEffect(() => {
    const start = readFilters(window.location.search);
    if (isFiltered(start)) {
      setF(start);
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (k: keyof Filters, v: string) => {
    const next = { ...f, [k]: v };
    setF(next);
    setShown(STEP);
    load();
    window.history.replaceState(null, '', `${window.location.pathname}${filtersToQuery(next)}`);
  };
  const clear = () => {
    setF({ ...EMPTY_FILTERS });
    window.history.replaceState(null, '', window.location.pathname);
  };

  const results = useMemo(() => (index && filtered ? applyFilters(index, f) : null), [index, f, filtered]);
  const count = results ? results.length : total;
  const activeCount = (['emirate', 'area', 'avail', 'type', 'beds', 'budget', 'handover', 'developer'] as const).filter((k) => f[k]).length;

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="grid gap-6 rounded-brand-lg border border-line bg-white p-5 md:p-7">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <label className="grid gap-1.5">
            <span className="text-label !text-ink mb-0.5">Search</span>
            <input
              type="search"
              value={f.q}
              onChange={(e) => update('q', e.target.value)}
              onFocus={load}
              placeholder="Project, developer or area"
              className="min-h-12 w-full rounded-brand-sm border border-line-strong bg-white px-4 text-[15px] outline-none transition-colors placeholder:text-muted/80 hover:border-ink focus-visible:border-survey focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-survey"
            />
          </label>
          <button type="button" aria-expanded={open} aria-controls="explorer-filters" onClick={() => { setOpen((o) => !o); load(); }} className="btn btn-secondary justify-between md:hidden">
            <span>{open ? 'Hide filters' : 'Filters'}{activeCount ? ` (${activeCount} on)` : ''}</span>
            <svg viewBox="0 0 24 24" className={`size-5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <div id="explorer-filters" className={`${open ? 'grid' : 'hidden'} gap-4 md:contents`}>
          <Select name="emirate" label="Emirate" labelClassName="text-label !text-ink mb-0.5" value={f.emirate} onChange={(v) => update('emirate', v)} options={[{ value: '', label: 'All emirates' }, ...emirateOptions]} />
          <Select name="area" label="Area" labelClassName="text-label !text-ink mb-0.5" value={f.area} onChange={(v) => update('area', v)} options={[{ value: '', label: 'All areas' }, ...areaOptions]} />
          <Select name="developer" label="Developer" labelClassName="text-label !text-ink mb-0.5" value={f.developer} onChange={(v) => update('developer', v)} options={[{ value: '', label: 'All developers' }, ...developerOptions]} />
          <Select name="sort" label="Sort" labelClassName="text-label !text-ink mb-0.5" value={f.sort} onChange={(v) => update('sort', v)} options={SORTS} />
          </div>
        </div>
        <div className={`${open ? 'grid' : 'hidden'} gap-6 border-t border-line pt-6 md:grid lg:grid-cols-2`}>
          <Chips label="Availability" value={f.avail} options={AVAIL} onChange={(v) => update('avail', v)} />
          <Chips label="Property type" value={f.type} options={typeOptions} onChange={(v) => update('type', v)} />
          <Chips label="Bedrooms" value={f.beds} options={BEDS} onChange={(v) => update('beds', v)} />
          <Chips label="Budget (AED)" value={f.budget} options={BUDGETS} onChange={(v) => update('budget', v)} />
          <Chips label="Completion" value={f.handover} options={handoverOptions} onChange={(v) => update('handover', v)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-[15px] text-muted">
          {filtered && !index && !failed ? 'Loading the project list…' : <>Showing <strong className="font-semibold text-ink">{count.toLocaleString('en-US')}</strong> of {total.toLocaleString('en-US')} projects</>}
        </p>
        {filtered ? <button type="button" onClick={clear} className="link-accent text-sm">Clear filters</button> : null}
      </div>

      {failed && filtered ? (
        <p className="rounded-brand-lg border border-dashed border-line-strong p-8 text-center text-muted">The filters could not load. Check your connection and try again, or browse the pages below.</p>
      ) : null}

      {results ? (
        results.length ? (
          <>
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {results.slice(0, shown).map((it) => <li key={it.s}><Card it={it} /></li>)}
            </ul>
            {results.length > shown ? (
              <p className="text-center">
                <button type="button" onClick={() => setShown((n) => n + STEP)} className="btn btn-dark">Show {Math.min(STEP, results.length - shown)} more of {results.length - shown}</button>
              </p>
            ) : null}
          </>
        ) : (
          <div className="rounded-brand-lg border border-dashed border-line-strong p-10 text-center">
            <p className="text-h3">No projects match these filters.</p>
            <p className="mt-2 text-muted">Try a wider budget or completion year, or ask us: new launches are added as developers release them.</p>
          </div>
        )
      ) : filtered && !failed ? null : (
        children
      )}
    </div>
  );
}
