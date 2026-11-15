import Image, { getImageProps, type ImageProps } from 'next/image';
import Link from 'next/link';
import { config, copy, imagery } from '@/site';
import { getProject } from '@/data';
import { areasByEmirate, getAreas } from '@/data/areas';
import { siteStats, typeCounts } from '@/data/insights';
import { aed } from '@/lib/format';
import { Icon } from '../ui/Icon';
import { Select } from '../ui/Select';
import { HeroSlides } from './HeroSlides';
import './hero.css';

const TYPE_LABEL = { apartment: 'Apartments', townhouse: 'Townhouses', villa: 'Villas', commercial: 'Commercial' } as const;
/** The explorer's own budget keys (explorer-types.ts BUDGET and its chips), so the chosen budget shows as picked on /projects. */
const BUDGET_OPTIONS = [
  { value: 'under-1m', label: 'Under AED 1M' },
  { value: '1m-2m', label: 'AED 1M to 2M' },
  { value: '2m-3m', label: 'AED 2M to 3M' },
  { value: '3m-5m', label: 'AED 3M to 5M' },
  { value: '5m-plus', label: 'AED 5M and above' },
];

/** "1.25M", "379K": short prices for the figures row. */
const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 2).replace(/\.?0+$/, '')}M` : `${Math.round(n / 1000)}K`);

/** The picture is about half the window from 1024 px up, the whole width below it. */
const STAGE_SIZES = '(min-width: 1024px) 50vw, 100vw';
const FIELD_LABEL = 'text-[11px] font-bold uppercase leading-tight tracking-[0.18em] text-muted';

/**
 * 2 · Hero, split stage on black with the faded gold grid: the pill eyebrow, the two-weight headline with its one gold line,
 * the search and the busiest areas on the left; on the right one large developer render (a new launch every 4.5 s,
 * cross-fading) with a rail of thumbnails under it that is also the slider's menu. The search is a plain GET form to
 * /projects using the explorer's own keys: q, emirate (areaSlug of the emirate), type and budget. No "selling now" switch:
 * every project here is a launch. On phones the picture comes straight after the headline and the search follows it.
 */
export async function Hero() {
  const h = copy.home.hero;
  // The lead picture first, then the others; a project listed twice shows once.
  const listed = [{ slug: imagery.hero, focus: undefined as string | undefined }, ...(imagery.heroes ?? []).map((e) => (typeof e === 'string' ? { slug: e, focus: undefined } : e))];
  const entries = listed.filter((e, i) => listed.findIndex((x) => x.slug === e.slug) === i);
  const [s, areas, emirates, types, found] = await Promise.all([siteStats(), getAreas(), areasByEmirate(), typeCounts(), Promise.all(entries.map((e) => getProject(e.slug)))]);
  const slides = found.flatMap((p, i) => (p?.cover ? [{ p, cover: p.cover, focus: entries[i]!.focus }] : []));

  // Plain <img> props for every picture after the first (the browser part adds them once the page has loaded).
  // The site-wide loader (src/lib/image-loader.ts) picks the stored copy for each width.
  const props = (src: string, focus: string | undefined, extra: Partial<ImageProps>) => {
    const img = getImageProps({ src, alt: '', fill: true, ...extra } as ImageProps).props;
    return focus ? { ...img, style: { ...img.style, objectPosition: focus } } : img;
  };
  const first = slides[0];
  const rest = slides.slice(1).map((x) => props(x.cover.src, x.focus, { alt: `${x.p.name}, ${x.p.communityName}: developer render`, sizes: STAGE_SIZES, className: 'object-cover' }));
  // Small versions for the thumbnails under the picture.
  const thumbs = slides.map((x) => props(x.cover.src, x.focus, { sizes: '160px', className: 'object-cover' }));
  const captions = slides.map((x) => ({ slug: x.p.slug, name: x.p.name, place: x.p.communityName }));

  // Phones show the first sentence of the intro, so the search sits higher on the screen.
  const cut = h.lede.indexOf('. ') + 1;
  const lede = cut > 0 ? [h.lede.slice(0, cut), h.lede.slice(cut)] : [h.lede, ''];

  return (
    <section aria-labelledby="hero-title" className="hero on-dark relative overflow-hidden bg-page">
      {/* Two layers: gold-grid and gold-glow both set background-image, so one element cannot carry both */}
      <div aria-hidden="true" className="gold-grid grid-fade pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="gold-glow pointer-events-none absolute inset-0" />
      <div className="hero-grid relative">
        <div className="hero-copy">
          <div className="hero-head">
            <p className="eyebrow-pill m-0"><span aria-hidden="true" className="eyebrow-dot" />{h.label}</p>
            <h1 id="hero-title" className="text-display hero-title">
              <span className="block font-light">{h.titleLight}</span>
              <span className="block font-extrabold"><span className="text-gold-underline">{h.titleStrong}</span></span>
            </h1>
          </div>

          <div className="hero-body">
            <p className="hero-lede">{lede[0]}<span className="hidden sm:inline">{lede[1]}</span></p>

            <form id="hero-finder" action="/projects" method="get" role="search" aria-labelledby="h-finder" className="hero-finder">
              <h2 id="h-finder" className="sr-only">{h.finderTitle}</h2>
              <div className="hero-q">
                <label htmlFor="hero-q" className="sr-only">Project, developer or area</label>
                <Icon name="search" className="hero-q-icon" />
                <input id="hero-q" name="q" type="search" maxLength={80} autoComplete="off" enterKeyHint="search" placeholder="Project, developer or area" className="field hero-q-input" />
              </div>
              <Select name="emirate" label="Emirate" labelClassName={FIELD_LABEL} className="hero-f-emirate" options={[{ value: '', label: `All ${emirates.length} emirates` }, ...emirates.map((e) => ({ value: e.slug, label: `${e.emirate} (${e.projects})` }))]} />
              <Select name="type" label="Property type" labelClassName={FIELD_LABEL} className="hero-f-type" options={[{ value: '', label: 'Any type' }, ...types.filter((t) => t.count).map((t) => ({ value: t.type, label: TYPE_LABEL[t.type] }))]} />
              <Select name="budget" label="Budget" labelClassName={FIELD_LABEL} className="hero-f-budget" options={[{ value: '', label: 'Any budget' }, ...BUDGET_OPTIONS]} />
              <button type="submit" className="btn btn-primary hero-go"><Icon name="search" className="size-[18px]" />{h.finderSubmit}</button>
            </form>

            <dl className="hero-stats">
              {[
                [s.selling.toLocaleString('en-US'), 'launching now'],
                [s.projects.toLocaleString('en-US'), `launches, ${s.emirates.length} emirates`],
                [s.lowestPrice ? short(s.lowestPrice) : '—', 'AED, lowest from'],
              ].map(([n, l]) => (
                <div key={l} className="hero-stat">
                  <dd className="hero-stat-n text-figure">{n}</dd>
                  <dt className="hero-stat-l">{l}</dt>
                </div>
              ))}
            </dl>

            <nav aria-label="Busiest areas" className="hero-areas">
              <span aria-hidden="true" className="eyebrow-line-start mr-1.5 max-sm:w-full">Busiest areas</span>
              {areas.slice(0, 4).map((a, i) => (
                <Link key={a.slug} href={`/areas/${a.slug}`} className={i === 3 ? 'chip hero-chip hero-extra' : 'chip hero-chip'}>
                  {a.name.replace(/\s*\(.*\)$/, '')}
                </Link>
              ))}
              <Link href="/areas" className="chip hero-chip hero-chip-all">
                All areas
                <Icon name="arrow-right" className="size-4" />
              </Link>
            </nav>
          </div>
        </div>

        <div className="hero-stage-cell">
          {first ? (
            <HeroSlides
              first={
                /* The first thing under the headline on every device, so it is preloaded. */
                <Image src={first.cover.src} alt={first.cover.alt} fill preload sizes={STAGE_SIZES} className="object-cover" style={first.focus ? { objectPosition: first.focus } : undefined} />
              }
              rest={rest}
              thumbs={thumbs}
              captions={captions}
            />
          ) : null}
        </div>
      </div>
      <p className="sr-only">{config.name} is operated by {config.operatedBy}. Prices are subject to availability{s.lowestPrice ? `; the lowest published starting price is ${aed(s.lowestPrice)}` : ''}.</p>
    </section>
  );
}
