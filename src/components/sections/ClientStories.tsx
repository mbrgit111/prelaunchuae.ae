import type { Testimonial } from '@sites/types';
import { copy, testimonials } from '@/site';
import { showPlaceholders } from '@/lib/contact';
import { Ph } from '../ui/Placeholder';

function Stars({ rating }: { rating: number }) {
  return (
    <p className="flex gap-1.5 text-survey" role="img" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={`size-4 ${i < rating ? 'fill-current' : 'fill-white/15'}`} aria-hidden="true">
          <path d="M10 1.5l2.6 5.5 6 .7-4.5 4.1 1.2 5.9L10 14.8 4.7 17.7l1.2-5.9L1.4 7.7l6-.7z" />
        </svg>
      ))}
    </p>
  );
}

function Story({ t, i }: { t: Testimonial | null; i: number }) {
  return (
    <li data-reveal style={{ '--i': i } as React.CSSProperties} className="h-full">
      <figure className="flex h-full flex-col rounded-brand-lg border border-sage/25 bg-white/[0.04] p-8 md:p-10">
        <span aria-hidden="true" className="h-12 text-[72px] font-bold leading-[0.9] text-sage/60">&quot;</span>
        <div className="mt-8 grid flex-1 content-start gap-5">
          {t?.rating ? <Stars rating={t.rating} /> : null}
          <blockquote className="text-[17px] leading-[1.9] text-white/85">
            <p>{t ? t.quote : <Ph label="Client quote" />}</p>
          </blockquote>
        </div>
        <figcaption className="mt-8 flex items-center gap-4 border-t border-white/10 pt-8">
          <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-survey/45 text-xl font-semibold text-plot">
            {t ? t.name.trim().charAt(0).toUpperCase() : '·'}
          </span>
          <span className="grid gap-1">
            <strong className="font-semibold text-white">{t ? t.name : <Ph label="Client name" />}</strong>
            <span className="text-sm text-sand/80">{t ? t.role : <Ph label="Role and country" />}</span>
          </span>
        </figcaption>
      </figure>
    </li>
  );
}

/** Client stories: real quotes from sites/<site>/testimonials.ts. Hidden while that list is empty (preview shows placeholders). */
export function ClientStories() {
  const c = copy.home.stories;
  const items = testimonials.filter((t) => t.consent).slice(0, 3);
  if (!items.length && !showPlaceholders) return null;
  const cards: (Testimonial | null)[] = items.length ? items : [null, null, null];
  return (
    <section id="client-stories" aria-labelledby="h-client-stories" className="on-dark bg-datum py-16 text-white md:py-24">
      <div className="container-site">
        <div data-reveal className="mb-12 grid justify-items-center gap-5 text-center md:mb-16">
          <p className="text-label flex items-center gap-4">
            <span aria-hidden="true" className="h-px w-10 bg-plot/50" />
            {c.label}
            <span aria-hidden="true" className="h-px w-10 bg-plot/50" />
          </p>
          <h2 id="h-client-stories" className="text-h2 !text-[clamp(2.25rem,1.6rem+2.2vw,3.5rem)]">
            {c.title.before}<span className="text-plot">{c.title.accent}</span>{c.title.after}
          </h2>
        </div>
        <ul className={`grid gap-6 ${cards.length >= 3 ? 'md:grid-cols-2 lg:grid-cols-3' : cards.length === 2 ? 'md:grid-cols-2' : 'mx-auto max-w-2xl'}`}>
          {cards.map((t, i) => <Story key={t ? t.name : i} t={t} i={i} />)}
        </ul>
      </div>
    </section>
  );
}
