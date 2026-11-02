import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadSiteData } from '../src/data/read';
import { tidyArea } from '../src/data/normalise';
import { config } from '../sites/prelaunchuae/site.config';
import imageLoader from '../src/lib/image-loader';
import { applyFilters, EMPTY_FILTERS, filtersToQuery, readFilters, type IndexItem } from '../src/components/forms/explorer-types';

const data = loadSiteData({ scope: 'all', communityName: 'Dubai', renameAreas: config.community.renameAreas, dir: path.resolve(__dirname, '../data') });

describe('PrelaunchUAE catalogue', () => {
  it('lists the REM pre-launch projects across the emirates', () => {
    expect(data.projects.length).toBeGreaterThan(50);
    expect(new Set(data.projects.map((p) => p.emirate)).size).toBeGreaterThan(2);
  });

  it('shows only pre-launch projects: no sold-out and no ready-to-buy ones', () => {
    for (const p of data.projects) expect(['new-launch', 'coming-soon']).toContain(p.status);
    expect(data.projects.some((p) => p.status === 'sold-out' || p.status === 'available')).toBe(false);
  });

  it('never shows a price a home could not sell for', () => {
    for (const p of data.projects) {
      if (p.priceFrom != null) expect(p.priceFrom).toBeGreaterThanOrEqual(100_000);
      for (const u of p.units) if (u.priceFrom != null) expect(u.priceFrom).toBeGreaterThanOrEqual(100_000);
    }
  });

  it('shows each area under one tidy name', () => {
    const names = new Set(data.projects.map((p) => p.communityName));
    for (const n of names) {
      expect(n).not.toMatch(/[А-Яа-я]/);
      expect(n).not.toMatch(/\s{2}/);
      expect(n === n.toLowerCase() || n === n.toUpperCase()).toBe(false);
    }
    expect(names.has('Bu kadra')).toBe(false);
  });

  it('tidies portal spellings', () => {
    expect(tidyArea('UMM SUQEIM')).toBe('Umm Suqeim');
    expect(tidyArea('warsan 4')).toBe('Warsan 4');
    expect(tidyArea('Nadd Al Нamar')).toBe('Nadd Al Hamar');
    expect(tidyArea('Meydan (Nad Al Sheba  1)')).toBe('Meydan (Nad Al Sheba 1)');
    expect(tidyArea('Bu kadra', { 'Bu kadra': 'Bukadra' })).toBe('Bukadra');
  });

  it('gives a project another of its pictures when the portal no longer serves its cover', () => {
    const base = { scope: 'all' as const, communityName: 'UAE', dir: path.resolve(__dirname, '../data') };
    const withCover = data.projects.find((p) => p.cover && p.gallery.length >= 2)!;
    const raw = JSON.parse(readFileSync(path.resolve(__dirname, '../data/remapp-projects.json'), 'utf8')).projects.find((r: { id: string }) => r.id === withCover.id);
    const known = existsSync(path.resolve(__dirname, '../data/media-unavailable.json')) ? JSON.parse(readFileSync(path.resolve(__dirname, '../data/media-unavailable.json'), 'utf8')) : [];
    const again = loadSiteData({ ...base, unavailable: [...known, raw.images.featured], manifest: Object.fromEntries(Object.entries(JSON.parse(readFileSync(path.resolve(__dirname, '../data/media-manifest.json'), 'utf8'))).filter(([u]) => u !== raw.images.featured)) });
    const p = again.projects.find((x) => x.id === withCover.id)!;
    expect(p.cover?.src).toBe(withCover.gallery[0]!.image.src);
    expect(p.gallery.length).toBe(withCover.gallery.length - 1);
    expect(again.issues.some((i) => i.code === 'media-unavailable' && i.project === p.name)).toBe(true);
  });
});

describe('project explorer', () => {
  const row = (o: Partial<IndexItem>): IndexItem => ({
    s: 'x', n: 'X', d: 'Dev', ds: 'dev', a: 'JVC', as: 'jvc', e: 'dubai', t: ['apartment'], b: ['1'], st: 'available', p: 900_000, y: 2027,
    hl: 'June 2027', r: false, c: '2026-01-01', k: 0, i: null, bl: '1 bedroom', tl: 'Apartments', pl: '20/80', ph: false, ...o,
  });
  const items = [
    row({ s: 'a', n: 'Alpha Tower', as: 'jvc', p: 800_000, k: 2 }),
    row({ s: 'b', n: 'Beta Villas', as: 'yas-island', e: 'abu-dhabi', t: ['villa'], b: ['4'], p: 4_000_000, y: 2028, k: 1 }),
    row({ s: 'c', n: 'Gamma', as: 'jvc', st: 'sold-out', p: null, k: 0 }),
  ];

  it('filters by area, type, budget and words', () => {
    expect(applyFilters(items, { ...EMPTY_FILTERS, area: 'jvc' }).map((i) => i.s)).toEqual(['c', 'a']);
    expect(applyFilters(items, { ...EMPTY_FILTERS, type: 'villa' }).map((i) => i.s)).toEqual(['b']);
    expect(applyFilters(items, { ...EMPTY_FILTERS, budget: 'under-1m' }).map((i) => i.s)).toEqual(['a']);
    expect(applyFilters(items, { ...EMPTY_FILTERS, q: 'beta' }).map((i) => i.s)).toEqual(['b']);
    expect(applyFilters(items, { ...EMPTY_FILTERS, handover: '2028+' }).map((i) => i.s)).toEqual(['b']);
    expect(applyFilters(items, { ...EMPTY_FILTERS, emirate: 'abu-dhabi' }).map((i) => i.s)).toEqual(['b']);
    expect(applyFilters(items, { ...EMPTY_FILTERS, avail: 'selling' }).map((i) => i.s)).toEqual(['b', 'a']);
    expect(applyFilters(items, { ...EMPTY_FILTERS, avail: 'sold-out' }).map((i) => i.s)).toEqual(['c']);
  });

  it('sorts by price with unpriced projects last', () => {
    expect(applyFilters(items, { ...EMPTY_FILTERS, sort: 'price-asc' }).map((i) => i.s)).toEqual(['a', 'b', 'c']);
  });

  it('keeps filters in the address and ignores unknown ones', () => {
    const f = readFilters('?area=jvc&type=apartment&evil=1&sort=featured');
    expect(f.area).toBe('jvc');
    expect(filtersToQuery(f)).toBe('?area=jvc&type=apartment');
  });
});

describe('image loader', () => {
  it('serves the small cover copy to cards and the large one to wide screens', () => {
    const src = '/media/cover/0123456789abcdef.webp';
    expect(imageLoader({ src, width: 640 })).toBe('/media/cover/0123456789abcdef-sm.webp');
    expect(imageLoader({ src, width: 1920 })).toBe(src);
    expect(imageLoader({ src: '/media/gallery/0123456789abcdef.webp', width: 640 })).toBe('/media/gallery/0123456789abcdef.webp');
  });
});
