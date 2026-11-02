'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { MediaImage } from '@/data/types';
import { LogoMark } from '../ui/LogoMark';

export interface DirectoryItem {
  slug: string;
  name: string;
  projects: number;
  selling: number;
  from: number | null;
  logo: MediaImage | null;
}

const FIRST = 48;
const fold = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
const aed = (n: number) => `AED ${Math.round(n).toLocaleString('en-US')}`;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const letterOf = (name: string) => {
  const c = fold(name).replace(/[^a-z0-9]/g, '').charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
};

/**
 * Every developer, largest first. The first 48 show; a letter A to Z, the search box or "All" brings up the rest. A letter lists
 * its developers alphabetically. All of them are in the page's HTML from the start (hidden ones too), so search engines follow
 * every link, and a phone is not handed a list sixty screens long.
 */
export function DevelopersDirectory({ items }: { items: DirectoryItem[] }) {
  const [q, setQ] = useState('');
  const [pick, setPick] = useState<'top' | 'all' | string>('top');
  const words = useMemo(() => fold(q).split(/\s+/).filter(Boolean), [q]);
  const letters = useMemo(() => items.map((it) => letterOf(it.name)), [items]);
  const present = useMemo(() => new Set(letters), [letters]);
  // Alphabetical rank, used as the display order while a letter is chosen.
  const rank = useMemo(() => {
    const sorted = items.map((_, i) => i).sort((x, y) => items[x]!.name.localeCompare(items[y]!.name, 'en', { sensitivity: 'base' }));
    const r = new Array<number>(items.length);
    sorted.forEach((idx, pos) => { r[idx] = pos; });
    return r;
  }, [items]);
  const isLetter = pick !== 'top' && pick !== 'all';
  const matches = (it: DirectoryItem) => words.every((w) => fold(it.name).includes(w));
  const visible = items.map((it, i) => {
    if (words.length && !matches(it)) return false;
    if (isLetter) return letters[i] === pick;
    if (words.length) return true;
    return pick === 'all' || i < FIRST;
  });
  const count = visible.filter(Boolean).length;
  const chip = (active: boolean) =>
    `inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-brand-sm border px-3 text-[15px] font-semibold transition-colors ${active ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink hover:border-ink'} disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line-strong`;
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="grid w-full max-w-md gap-1.5">
          <span className="text-label !text-ink mb-0.5">Find a developer</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${items.length} developers`}
            className="min-h-12 w-full rounded-brand-sm border border-line-strong bg-white px-4 text-[16px] outline-none transition-colors placeholder:text-muted/80 hover:border-ink focus-visible:border-survey focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-survey"
          />
        </label>
        <p role="status" aria-live="polite" className="text-[15px] text-muted">
          Showing <strong className="font-semibold text-ink">{count}</strong> of {items.length}
        </p>
      </div>
      <nav aria-label="Browse developers by letter" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        <button type="button" aria-pressed={pick === 'top'} onClick={() => setPick('top')} className={chip(pick === 'top')}>Largest</button>
        <button type="button" aria-pressed={pick === 'all'} onClick={() => setPick('all')} className={chip(pick === 'all')}>All</button>
        {[...LETTERS, '#'].map((l) => (
          <button key={l} type="button" aria-pressed={pick === l} disabled={!present.has(l)} onClick={() => setPick(l)} className={chip(pick === l)}>{l}</button>
        ))}
      </nav>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((d, i) => (
          <li key={d.slug} hidden={!visible[i]} style={isLetter ? { order: rank[i] } : undefined} className="min-w-0">
            <Link href={`/developers/${d.slug}`} className="card card-lift flex h-full items-center gap-4 p-4 sm:p-5">
              <LogoMark logo={d.logo} name={d.name} frame="card" labelled={false} />
              <span className="grid min-w-0 gap-0.5">
                <span className="font-semibold leading-snug">{d.name}</span>
                <span className="text-sm text-muted">
                  {d.projects} launch{d.projects === 1 ? '' : 'es'}{d.from ? ` · from ${aed(d.from)}` : ''}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {count === 0 ? <p className="rounded-brand-lg border border-dashed border-line-strong p-8 text-center text-muted">No developer matches “{q}”. Check the spelling, or clear the search.</p> : null}
    </div>
  );
}
