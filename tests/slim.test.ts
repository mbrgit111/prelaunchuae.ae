import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSiteData } from '../src/data/read';
import { inRemOrder, MAX_GALLERY, MAX_PLANS, slimCatalogue } from '../src/data/slim';

type Row = Record<string, unknown>;
const pic = (name: string) => `https://files.example.com/${name}.jpg`;
const pics = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => pic(`${prefix}-${i + 1}`));

/** A project the way the MBR API sends it: whole, with the "available now" figures inside. */
function whole(id: string, overrides: Row = {}): Row {
  return {
    id,
    slug: `project-${id}`,
    title: `Project ${id}`,
    status: 'launch',
    completionStatus: 'under_construction',
    districtId: 'd1',
    districtIds: ['d1'],
    districtName: 'Business Bay',
    emirateName: 'Dubai',
    developer: { id: 'dev-1', name: 'Example Developer', logo: pic('logo'), website: 'https://developer.example.com' },
    location: { type: 'Point', coordinates: [55.27, 25.19] },
    currency: 'AED',
    priceUponRequest: false,
    priceStart: 1_200_000,
    priceEnd: 3_000_000,
    minAvailablePrice: 1_100_000,
    maxAvailablePrice: 2_900_000,
    availableUnits: 12,
    images: { featured: pic('cover'), exterior: [pic('cover'), ...pics('ext', 6)], interior: pics('int', 5), lobby: [], architecture: pics('arch', 2), amenities: pics('am', 3), general: [], other: [] },
    description: 'The developer promises a 9% return every year.',
    expectedCompletionDate: '2028-06-30T00:00:00.000Z',
    attachments: [{ title: 'Brochure', url: 'https://files.example.com/brochure.pdf', fileType: 'brochure', size: 1234 }],
    amenities: [{ name: 'Pool', description: 'A pool', image: pic('pool') }],
    paymentPlans: [],
    unitTypes: ['Apartments'],
    propertyTypes: ['Apartments'],
    bedrooms: ['1', '2'],
    bathrooms: ['1'],
    totalUnits: 200,
    unitStructures: Array.from({ length: 7 }, (_, i) => ({ name: `Type ${i + 1}`, unitType: 'Apartments', bedroom: '1', priceStart: 1_200_000, priceEnd: 1_300_000, areaStart: 700, areaEnd: 750, image: pic(`plan-${i + 1}`) })),
    hasPostHandover: false,
    nearbyLocations: [{ name: 'Dubai Mall', distance: '2 km', time: '5 min', picture: pic('mall'), category: { code: 'mall', name: { en: 'Malls', ar: 'مراكز' } } }],
    salesExecutives: [{ name: 'A Person', phone: '+971500000000' }],
    isPublic: true,
    isPrivate: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}
const images = (p: Row) => p.images as Record<string, string | string[]>;
const gallery = (p: Row) => Object.entries(images(p)).filter(([k]) => k !== 'featured').flatMap(([, v]) => v as string[]);

describe("PrelaunchUAE's cut of the project list", () => {
  it('keeps a selling project light: cover, 4 mixed gallery pictures, 4 floor plans, no description, nothing else', () => {
    const { projects, list, leftOut } = slimCatalogue([whole('a')]);
    const p = projects[0]!;
    expect(leftOut).toEqual({});
    expect(images(p).featured).toBe(pic('cover'));
    // One from each group in turn, and never the cover again.
    expect(gallery(p)).toEqual([pic('ext-1'), pic('int-1'), pic('arch-1'), pic('am-1')]);
    expect(gallery(p).length).toBe(MAX_GALLERY);
    expect((p.unitStructures as Row[]).filter((u) => u.image).map((u) => u.image)).toEqual([1, 2, 3, 4].map((n) => pic(`plan-${n}`)));
    expect((p.unitStructures as Row[]).length).toBe(7);
    expect(MAX_PLANS).toBe(4);
    expect(p.description).toBe('');
    expect((p.amenities as Row[])[0]).toEqual({ name: 'Pool', description: 'A pool', image: '' });
    expect((p.nearbyLocations as Row[])[0]).toMatchObject({ name: 'Dubai Mall', picture: '', category: { code: 'mall', name: { en: 'Malls' } } });
    expect(JSON.stringify(p)).not.toMatch(/salesExecutives|\+971500000000|promises|developer\.example\.com|مراكز/);
    // The "available now" figures the API keeps inside the project become the list entry.
    expect(list).toEqual([{ id: 'a', minAvailablePrice: 1_100_000, maxAvailablePrice: 2_900_000, availableUnits: 12, totalUnits: 200 }]);
  });

  it('keeps only the pre-launch projects: New launch and Coming soon. Ready-to-buy and sold-out ones are left out', () => {
    const cut = slimCatalogue([
      whole('a'),
      whole('b', { status: 'pending', completionStatus: 'under_construction', title: 'Soon one' }),
      whole('c', { status: 'available', title: 'On sale now' }),
      whole('d', { status: 'available', completionStatus: 'ready_to_move', title: 'Ready to buy' }),
      whole('e', { status: 'sold_out', title: 'Sold one' }),
    ]);
    expect(cut.projects.map((p) => p.id)).toEqual(['a', 'b']);
    expect(cut.leftOut['on general sale (not pre-launch)']).toEqual(['On sale now', 'Ready to buy']);
    expect(cut.leftOut['sold out (not pre-launch)']).toEqual(['Sold one']);
  });

  it('keeps a project MBR added by hand in the desk whatever its status, and shows its pictures as they are', () => {
    const own = whole('project-5f1c', { status: 'available', title: 'Our own villa', slug: 'our-own-villa', images: { featured: 'https://media.example.com/mine/cover.jpg', exterior: ['https://media.example.com/mine/two.jpg'], interior: [], lobby: [], architecture: [], amenities: [], general: [], other: [] } });
    const cut = slimCatalogue([own, whole('x', { status: 'available', title: 'REM on sale' })]);
    expect(cut.projects.map((p) => p.id)).toEqual(['project-5f1c']);
    const base = { scope: 'all' as const, communityName: 'UAE', manifest: {}, unavailable: [] };
    const shown = loadSiteData({ ...base, detail: { fetchedAt: '2026-11-03T00:00:00.000Z', source: 'test', count: 1, projects: cut.projects }, list: cut.list }).projects[0]!;
    expect(shown.cover?.src).toBe('https://media.example.com/mine/cover.jpg');
    expect(shown.gallery.length).toBe(1);
  });

  it('leaves out private projects and ones the site checks would reject, names them, and keeps the rest', () => {
    const cut = slimCatalogue([
      whole('a'),
      whole('b', { isPrivate: true, title: 'Private one' }),
      whole('c', { isPublic: false, title: 'Hidden one' }),
      whole('d', { location: { coordinates: [0, 0] }, title: 'Wrong map position' }),
      whole('e', { images: null, title: 'No pictures at all' }),
      whole('f', { availableUnits: 2.5, title: 'Half a unit' }),
      'not a project',
      whole('g'),
    ]);
    expect(cut.projects.map((p) => p.id)).toEqual(['a', 'g']);
    expect(cut.list.map((l) => l.id)).toEqual(['a', 'g']);
    expect(cut.leftOut['private on the portal']).toEqual(['Private one', 'Hidden one']);
    expect(cut.leftOut['list entry fails the site checks']).toEqual(['Half a unit']);
    const rejected = Object.entries(cut.leftOut).filter(([why]) => why.startsWith('portal data fails the site checks')).flatMap(([, names]) => names);
    expect(rejected.sort()).toEqual(['No pictures at all', 'Wrong map position']);
    expect(cut.leftOut['on general sale (not pre-launch)']).toEqual(['?']); // not a project at all
  });

  it('reads the "available now" figures from REM\'s own list when one is given (a REM export)', () => {
    const cut = slimCatalogue([whole('a')], [{ id: 'a', minAvailablePrice: 900_000, maxAvailablePrice: null, availableUnits: 3, totalUnits: 180 }]);
    expect(cut.list).toEqual([{ id: 'a', minAvailablePrice: 900_000, maxAvailablePrice: null, availableUnits: 3, totalUnits: 180 }]);
  });

  it('puts a list from the API in REM\'s own order (name, then id), the order of the saved files', () => {
    const shuffled = [whole('b', { title: 'Beta' }), whole('z', { title: 'Alpha' }), whole('a', { title: 'Alpha' }), whole('c', { title: '105 Residences' })];
    expect(inRemOrder(shuffled).map((p) => (p as Row).id)).toEqual(['c', 'a', 'z', 'b']);
    const saved = JSON.parse(readFileSync(path.resolve(__dirname, '../data/remapp-projects.json'), 'utf8')) as { projects: Row[] };
    expect(inRemOrder([...saved.projects].reverse()).map((p) => (p as Row).id)).toEqual(saved.projects.map((p) => p.id));
  });

  it('changes nothing when it is run again on its own result, such as the saved files', () => {
    const detail = JSON.parse(readFileSync(path.resolve(__dirname, '../data/remapp-projects.json'), 'utf8')) as { projects: Row[] };
    const list = JSON.parse(readFileSync(path.resolve(__dirname, '../data/remapp-projects-list.json'), 'utf8')) as Row[];
    const again = slimCatalogue(detail.projects, list);
    expect(again.leftOut).toEqual({});
    expect(again.projects.length).toBe(detail.projects.length);
    expect(JSON.stringify(again.projects) === JSON.stringify(detail.projects)).toBe(true);
    expect(JSON.stringify(again.list) === JSON.stringify(list)).toBe(true);
  });

  it('gives the site the same project whether the list came whole from the API or already cut', () => {
    const base = { scope: 'all' as const, communityName: 'UAE', manifest: {}, unavailable: [] };
    const load = (projects: Row[], list: Row[]) => loadSiteData({ ...base, detail: { fetchedAt: '2026-10-13T00:00:00.000Z', source: 'test', count: projects.length, projects }, list }).projects;
    const once = slimCatalogue([whole('a'), whole('b', { status: 'pending' })]);
    const twice = slimCatalogue(once.projects, once.list);
    expect(load(twice.projects, twice.list)).toEqual(load(once.projects, once.list));
  });
});

describe('where the running site reads the project list', () => {
  const env = process.env as Record<string, string | undefined>;
  // The list's version, as the API would answer it (src/data/version.ts asks with Node's own http client).
  let version = 'aaaa1111';
  const answer = () => new Response(JSON.stringify({ fetchedAt: '2026-10-13T00:00:00.000Z', source: 'off-plan.remapp.ae', count: 3, projects: [whole('a'), whole('b', { isPrivate: true }), whole('c', { status: 'pending' })] }), { status: 200 });
  const setRuntime = (runtime: 'api' | 'files') =>
    vi.doMock('@/site', async (original) => {
      const real = await original<typeof import('../src/site')>();
      return { ...real, config: { ...real.config, catalogue: { runtime } } };
    });

  beforeEach(() => {
    vi.resetModules();
    version = 'aaaa1111';
    vi.doMock('../src/data/version.ts', () => ({ askVersion: async () => version }));
    env.CONTENT_API_URL = 'https://api.example.com';
    env.CONTENT_SITE_KEY = 'pk_x';
    delete env.CATALOGUE_SOURCE;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('@/site');
    vi.doUnmock('../src/data/version.ts');
  });
  const downloads = (fetchMock: ReturnType<typeof vi.fn>) => fetchMock.mock.calls.filter(([url]) => String(url).includes('/v1/public/catalogue?'));

  it('PrelaunchUAE reads the API while it runs, so the daily update shows without a build', async () => {
    const { config } = await import('../sites/prelaunchuae/site.config');
    expect(config.catalogue.runtime).toBe('api');
  });

  it('with catalogue.runtime "api", the whole list from the API is cut the same way, and downloaded again only for a new version', async () => {
    setRuntime('api');
    const fetchMock = vi.fn(async (url: string) => (String(url).includes('/catalogue/version') ? new Response(JSON.stringify({ version }), { status: 200 }) : answer()));
    vi.stubGlobal('fetch', fetchMock);
    const { getData } = await import('../src/data');
    const data = await getData();
    expect(data.projects.map((p) => p.id)).toEqual(['a', 'c']);
    expect(downloads(fetchMock).map(([url]) => String(url))).toEqual(['https://api.example.com/v1/public/catalogue?media=1&v=aaaa1111']);
    // Held for the next page while the version stays the same: no second download.
    await getData();
    expect(downloads(fetchMock)).toHaveLength(1);
    // The list changed on the API: the next page downloads it once more.
    version = 'bbbb2222';
    await getData();
    expect(downloads(fetchMock).map(([url]) => String(url)).at(-1)).toBe('https://api.example.com/v1/public/catalogue?media=1&v=bbbb2222');
    expect(downloads(fetchMock)).toHaveLength(2);
  });

  it('with catalogue.runtime "api", an API that is down or empty means the saved files', async () => {
    setRuntime('api');
    vi.stubGlobal('fetch', async () => { throw new Error('connection refused'); });
    const { getData } = await import('../src/data');
    expect((await getData()).projects.length).toBeGreaterThan(50);
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ projects: [] }), { status: 200 }));
    expect((await getData()).projects.length).toBeGreaterThan(50);
  });

  it('CATALOGUE_SOURCE=files switches the API off whatever the setting', async () => {
    setRuntime('api');
    env.CATALOGUE_SOURCE = 'files';
    const fetchMock = vi.fn(async () => answer());
    vi.stubGlobal('fetch', fetchMock);
    const { getData } = await import('../src/data');
    expect((await getData()).projects.length).toBeGreaterThan(50);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
