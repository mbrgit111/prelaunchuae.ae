import Image from 'next/image';
import Link from 'next/link';
import { config, copy, imagery } from '@/site';
import { getProject } from '@/data';
import { getAreas } from '@/data/areas';
import { BUDGETS, siteStats, typeCounts } from '@/data/insights';
import { aed } from '@/lib/format';
import { Icon } from '../ui/Icon';
import { Select } from '../ui/Select';

const TYPE_LABEL = { apartment: 'Apartments', townhouse: 'Townhouses', villa: 'Villas', commercial: 'Commercial' } as const;

/**
 * 2 · Hero on sand with the survey grid: the two-weight headline, a project finder (a plain GET form to /projects),
 * the busiest areas, and one developer render with the live counts. Text first, so phones paint it at once.
 */
export async function Hero() {
  const h = copy.home.hero;
  const [shot, s, areas, types] = await Promise.all([getProject(imagery.hero), siteStats(), getAreas(), typeCounts()]);
  const popular = areas.slice(0, 6);
  // Phones show the first sentence of the intro, so the finder and its button sit higher on the first screen.
  const cut = h.lede.indexOf('. ') + 1;
  const lede = cut > 0 ? [h.lede.slice(0, cut), h.lede.slice(cut)] : [h.lede, ''];
  return (
    <section aria-labelledby="hero-title" className="on-sand relative overflow-hidden bg-sand">
      <div aria-hidden="true" className="survey-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="container-site relative grid items-center gap-10 pb-12 pt-8 md:pt-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14 lg:pb-20 lg:pt-14">
        <div className="grid min-w-0 content-center gap-6">
          <p className="text-label flex items-center gap-2.5"><span aria-hidden="true" className="size-2 bg-survey" />{h.label}</p>
          <h1 id="hero-title" className="text-display">
            <span className="block">{h.titleLight}</span>
            <span className="text-strong block">
              {h.titleStrong}
              <span aria-hidden="true" className="plot-mark plot-rise ml-2 !h-[0.42em] !w-[0.42em]" />
            </span>
          </h1>
          <p className="text-lede max-w-xl text-muted">{lede[0]}<span className="hidden sm:inline">{lede[1]}</span></p>

          <form action="/projects" method="get" aria-labelledby="h-finder" className="grid min-w-0 gap-4 rounded-brand-lg border border-line bg-white p-4 shadow-[0_24px_48px_-32px_rgb(14_20_18/0.35)] sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] sm:p-5">
            <h2 id="h-finder" className="sr-only">{h.finderTitle}</h2>
            <Select name="area" label="Area" options={[{ value: '', label: `All ${s.areas} areas` }, ...areas.slice(0, 40).map((a) => ({ value: a.slug, label: `${a.name} (${a.projects.length})` }))]} />
            <Select name="type" label="Property type" options={[{ value: '', label: 'Any type' }, ...types.filter((t) => t.count).map((t) => ({ value: t.type, label: TYPE_LABEL[t.type] }))]} />
            <Select name="budget" label="Budget" options={[{ value: '', label: 'Any budget' }, ...BUDGETS.map((b) => ({ value: b.key, label: b.label }))]} />
            <button type="submit" className="btn btn-primary sm:col-span-3"><Icon name="search" className="size-[18px]" />{h.finderSubmit}</button>
          </form>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span className="font-semibold text-muted">Busiest areas:</span>
            {popular.map((a) => (
              <Link key={a.slug} href={`/areas/${a.slug}`} className="inline-flex min-h-9 items-center rounded-full border border-line-strong/60 bg-white/70 px-3 font-semibold text-ink transition-colors hover:border-survey hover:text-survey-deep">
                {a.name.replace(/\s*\(.*\)$/, '')}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative">
          <div aria-hidden="true" className="absolute -right-3 -top-3 size-20 bg-survey md:-right-5 md:-top-5 md:size-28" />
          <div className="relative aspect-[16/11] overflow-hidden rounded-brand-lg bg-plot lg:aspect-[4/5]">
            {shot?.cover ? (
              <div className="parallax absolute inset-0">
                {/* Not preloaded: on phones the picture sits below the finder, so the text paints first. */}
                <Image src={shot.cover.src} alt={shot.cover.alt} fill sizes="(min-width: 1024px) 46vw, 100vw" className="object-cover" />
              </div>
            ) : null}
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-datum/70 to-transparent" />
            {shot ? (
              <Link href={`/projects/${shot.slug}`} className="absolute left-4 top-4 inline-flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-brand-sm bg-white/90 px-3 py-2 text-ink backdrop-blur transition-colors hover:bg-white">
                <span className="truncate text-[13px] font-semibold leading-snug">{shot.name}, {shot.communityName}</span>
                <span className="hidden shrink-0 text-[11px] text-muted sm:inline">Developer render</span>
                <Icon name="arrow-up-right" className="size-4 shrink-0" />
              </Link>
            ) : null}
          </div>
          <dl className="relative -mt-10 ml-4 mr-4 grid grid-cols-3 divide-x divide-line rounded-brand-lg border border-line bg-white px-2 py-4 shadow-[0_24px_48px_-28px_rgb(14_20_18/0.4)] sm:ml-auto sm:mr-6 sm:w-[min(100%,460px)] lg:-ml-10 lg:mr-auto">
            {[
              [s.selling.toLocaleString('en-US'), 'launching now'],
              [s.projects.toLocaleString('en-US'), `launches, ${s.emirates.length} emirates`],
              [s.lowestPrice ? (s.lowestPrice >= 1e6 ? `${(s.lowestPrice / 1e6).toFixed(2)}M` : `${Math.round(s.lowestPrice / 1000)}K`) : '—', 'AED, lowest from'],
            ].map(([n, l]) => (
              <div key={l} className="grid px-3 text-center sm:px-4">
                <dd className="text-figure text-[30px] leading-none text-datum md:text-[36px]">{n}</dd>
                <dt className="mt-1.5 text-[12px] leading-tight text-muted">{l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <p className="sr-only">{config.name} is operated by {config.operatedBy}. Prices are subject to availability{s.lowestPrice ? `; the lowest published starting price is ${aed(s.lowestPrice)}` : ''}.</p>
    </section>
  );
}
