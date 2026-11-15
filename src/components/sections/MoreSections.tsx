import Link from 'next/link';
import { copy, contact } from '@/site';
import { marketFaqsFor } from '@/data/faq';
import { planPresets, planStats, selling } from '@/data/insights';
import { featuredProjects } from '@/data';
import { LatestPosts } from '../content/LatestPosts';
import { mailHref, telHref } from '@/lib/contact';
import { Calculator } from '../forms/Calculator';
import { EnquiryForm } from '../forms/EnquiryForm';
import { Quiz } from '../forms/Quiz';
import { Disclaimer } from '../ui/Disclaimer';
import { Faq } from '../ui/Faq';
import { Flag } from '../ui/Flag';
import { Icon } from '../ui/Icon';
import { LiteVideo } from '../ui/LiteVideo';
import { Section } from '../ui/Section';
import videos from '../../../data/videos.json';

/** A headline with its one gold word (the first match of `word`); plain when the word is not in it. */
export function Accent({ text, word }: { text: string; word?: string }) {
  const at = word ? text.indexOf(word) : -1;
  if (!word || at < 0) return <>{text}</>;
  return <>{text.slice(0, at)}<span className="text-strong">{word}</span>{text.slice(at + word.length)}</>;
}

/**
 * Home band heading: gold micro label between hairlines, H2 with one gold word, optional lede. Used inside a
 * title-less <Section> (Section takes a plain string title), so the band keeps its tone, padding and container.
 */
export function Head({ id, label, title, accent, intro, center = false, className = '' }: {
  id: string;
  label?: string;
  title: string;
  accent?: string;
  intro?: React.ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <div data-reveal className={`mb-10 max-w-2xl md:mb-14 ${center ? 'mx-auto text-center' : ''} ${className}`}>
      {label ? <p className="mb-4"><span className={center ? 'eyebrow-line' : 'eyebrow-line-start'}>{label}</span></p> : null}
      <h2 id={id} className="text-h2"><Accent text={title} word={accent} /></h2>
      {intro ? <p className="text-lede mt-4 text-muted">{intro}</p> : null}
    </div>
  );
}

/** The band's "see all" button, centred under the content (same place Section puts its action). */
export function More({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="section-more">
      <Link href={href} className="btn btn-secondary">{children} <Icon name="arrow-right" className="size-4" /></Link>
    </div>
  );
}

/** Gold check in a small square tile, for checklists. */
export function Check() {
  return (
    <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center border border-gold/25 bg-gold-tint text-gold">
      <Icon name="check" className="size-4" />
    </span>
  );
}

/** Investment angle: questions, not promises, with the standard disclaimer. */
export function InvestmentAngle() {
  const v = copy.home.investment;
  return (
    <Section id="investing" labelledBy="h-investing" tone="sand">
      <Head id="h-investing" label={v.label} title={v.title} accent={v.accent} />
      <ol className="grid gap-4 md:grid-cols-2">
        {v.points.map((p, i) => (
          <li key={p.title} data-reveal style={{ '--i': i % 2 } as React.CSSProperties} className="card card-lift grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 p-6 md:p-8">
            <span className="text-figure row-span-2 text-[40px] leading-none text-gold">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="text-h3">{p.title}</h3>
            <p className="text-[15px] leading-relaxed text-muted">{p.body}</p>
          </li>
        ))}
      </ol>
      <Disclaimer className="mt-6">{v.disclaimer}</Disclaimer>
    </Section>
  );
}

/** Golden Visa teaser: a warm split band. General wording only; the rules are checked, never stated as figures. */
export function GoldenVisaTeaser() {
  const g = copy.home.goldenVisa;
  return (
    <section id="golden-visa" aria-labelledby="h-golden-visa" className="on-dark warm-band relative overflow-hidden border-y border-line text-body">
      <div aria-hidden="true" className="gold-glow pointer-events-none absolute inset-0" />
      <div className="container-site relative grid lg:grid-cols-2">
        <div data-reveal className="relative grid content-center gap-5 py-16 md:py-24 lg:pr-16">
          <div aria-hidden="true" className="gold-grid grid-fade pointer-events-none absolute inset-0" />
          <span aria-hidden="true" className="relative grid size-16 place-items-center bg-gold text-on-gold">
            <Icon name="key" className="size-7" />
          </span>
          <p className="relative"><span className="eyebrow-line-start">{g.label}</span></p>
          <h2 id="h-golden-visa" className="text-h2 relative"><Accent text={g.title} word={g.accent} /></h2>
          <p className="text-lede relative text-body">{g.body}<Flag>{g.flag}</Flag></p>
          <Link href="/golden-visa" className="btn btn-primary relative mt-2 justify-self-start">{g.action} <Icon name="arrow-right" className="size-4" /></Link>
        </div>
        <div className="relative -mx-4 grid content-center gap-6 border-t border-line bg-[linear-gradient(160deg,#141008,#1e1a0a)] px-4 py-14 sm:-mx-6 sm:px-6 md:py-20 lg:mx-0 lg:border-l lg:border-t-0 lg:px-14">
          <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 size-64 bg-[radial-gradient(circle_at_top_right,rgb(201_168_76/0.16),transparent_70%)]" />
          <p className="text-label relative">{g.checkLabel}</p>
          <ul className="relative grid gap-4">
            {g.points.map((p, i) => (
              <li key={p} data-reveal style={{ '--i': i } as React.CSSProperties} className="flex items-center gap-4 border-b border-line pb-4 text-[17px] text-body last:border-0 last:pb-0">
                <Check />{p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** How it works: four numbered steps joined by a gold line. */
export function HowItWorks() {
  const s = copy.home.steps;
  return (
    <Section id="how-it-works" labelledBy="h-how-it-works" tone="white">
      <Head id="h-how-it-works" label={s.label} title={s.title} accent={s.accent} center />
      <div className="relative">
        <span aria-hidden="true" className="absolute inset-x-[12.5%] top-[38px] hidden h-px bg-gradient-to-r from-gold/0 via-gold/60 to-gold/0 lg:block" />
        <ol className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {s.items.map((st, i) => (
            <li key={st.title} data-reveal style={{ '--i': i } as React.CSSProperties} className="group grid content-start justify-items-center gap-3 text-center">
              <span className="text-figure grid size-[76px] place-items-center rounded-full border-2 border-gold/25 bg-surface text-[1.6rem] text-gold transition-colors duration-300 group-hover:border-gold/60 group-hover:bg-gold-tint">
                <span className="sr-only">Step </span>{String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-h3 mt-3">{st.title}</h3>
              <p className="max-w-xs text-[15px] leading-relaxed text-muted">{st.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/** Payment and mortgage helper (illustrative, in the browser only). Plan presets are the commonest splits in the data. */
export async function CalculatorSection() {
  const c = copy.home.calculator;
  const presets = await planPresets();
  if (!presets.length) return null;
  // A short pick of current launches keeps the page light; any other price can be typed in.
  const projects = (await featuredProjects())
    .filter((p) => selling(p) && p.priceFrom && p.paymentPlans.length)
    .slice(0, 40)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      developer: p.developerName,
      price: p.priceFrom!,
      plans: p.paymentPlans.map((pl) => ({ label: pl.title, booking: pl.split.booking, construction: pl.split.construction, handover: pl.split.handover, postHandover: pl.split.postHandover })),
    }));
  return (
    <Section id="calculator" labelledBy="h-calculator" tone="white">
      <Head id="h-calculator" label={c.label} title={c.title} accent={c.accent} intro={c.note} />
      <Calculator projects={projects} presets={presets} dldPercent={(await planStats()).dldPercent} />
    </Section>
  );
}

/** Quiz: four questions, ends in the enquiry form. */
export function QuizSection() {
  const q = copy.home.quiz;
  return (
    <Section id="quiz" labelledBy="h-quiz" tone="sand">
      <Head id="h-quiz" label={q.label} title={q.title} accent={q.accent} intro={q.intro} />
      <Quiz />
    </Section>
  );
}

/** Video strip: only when data/videos.json has entries. Click to load, no autoplay. */
export function Videos() {
  const v = copy.home.videos;
  const list = videos as { title: string; youtubeId: string }[];
  if (!list.length) return null;
  return (
    <Section id="videos" labelledBy="h-videos" tone="white">
      <Head id="h-videos" label={v.label} title={v.title} accent={v.accent} />
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {list.map((x) => <li key={x.youtubeId} className="card grid content-start gap-4 p-3 pb-5"><LiteVideo title={x.title} youtubeId={x.youtubeId} /><h3 className="text-h3 px-2">{x.title}</h3></li>)}
      </ul>
    </Section>
  );
}

/** Latest articles from the desk (and any older ones). Hidden while there are none. */
export async function NewsPreview() {
  const n = copy.home.news;
  return <LatestPosts id="news" label={n.label} title={n.title} highlight={n.accent} action={n.action} tone="white" />;
}

/** FAQ: new-launch questions, answers built from the data, with FAQPage schema. */
export async function FaqSection() {
  const f = copy.home.faq;
  const items = (await marketFaqsFor()).slice(0, 10);
  return (
    <Section id="faq" labelledBy="h-faq" tone="sand">
      <Head id="h-faq" label={f.label} title={f.title} accent={f.accent} center />
      <div className="mx-auto max-w-4xl"><Faq items={items} /></div>
      <More href="/faq">{f.action}</More>
    </Section>
  );
}

/** Final call to action with the enquiry form. Every "Register interest" button lands here (#register). */
export function RegisterBand({ projectSlug, title, source = 'register' }: { projectSlug?: string; title?: string; source?: 'register' | 'project' }) {
  const r = copy.home.register;
  return (
    <section id="register" aria-labelledby="h-register" className="on-dark warm-band relative overflow-hidden border-t border-line py-16 text-body md:py-24">
      <div aria-hidden="true" className="gold-glow pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="gold-grid grid-fade pointer-events-none absolute inset-0" />
      <div className="container-site relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="grid gap-5">
          <p><span className="eyebrow-line-start">{r.label}</span></p>
          <h2 id="h-register" className="text-display !text-[clamp(2.25rem,1.6rem+2.4vw,3.5rem)]">
            {title ? title : <Accent text={r.title} word={r.accent} />}
          </h2>
          <p className="text-lede max-w-lg text-muted">{r.lede}</p>
          <p className="flex flex-wrap gap-x-6 gap-y-2">
            {telHref() ? <a href={telHref()!} className="link-accent"><Icon name="phone" className="size-5" />{contact.phone.display}</a> : null}
            {mailHref() ? <a href={mailHref()!} className="link-accent break-all"><Icon name="mail" className="size-5" />{contact.email}</a> : null}
          </p>
        </div>
        <EnquiryForm
          source={source}
          projectSlug={projectSlug ?? null}
          title={r.formTitle}
          withMessage
          tone="dark"
          className="!border-t-[3px] !border-t-gold bg-band/95 shadow-[0_32px_80px_rgb(0_0_0/0.5)]"
        />
      </div>
    </section>
  );
}
