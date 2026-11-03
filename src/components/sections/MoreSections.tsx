import Link from 'next/link';
import { config, copy, contact } from '@/site';
import { marketFaqsFor } from '@/data/faq';
import { planPresets, planSplit, planStats, selling } from '@/data/insights';
import { featuredProjects } from '@/data';
import { LatestPosts } from '../content/LatestPosts';
import { mailHref, telHref } from '@/lib/contact';
import { Calculator } from '../forms/Calculator';
import { EnquiryForm } from '../forms/EnquiryForm';
import { Quiz } from '../forms/Quiz';
import { BrandMark } from '../ui/BrandMark';
import { Disclaimer } from '../ui/Disclaimer';
import { Faq } from '../ui/Faq';
import { Flag } from '../ui/Flag';
import { Icon } from '../ui/Icon';
import { LiteVideo } from '../ui/LiteVideo';
import { Section } from '../ui/Section';
import videos from '../../../data/videos.json';

/** 11 · Investment angle: questions, not promises, with the standard disclaimer. */
export function InvestmentAngle() {
  const v = copy.home.investment;
  return (
    <Section id="investing" tone="sand" label={v.label} title={v.title}>
      <ol className="grid gap-4 md:grid-cols-2">
        {v.points.map((p, i) => (
          <li key={p.title} data-reveal style={{ '--i': i % 2 } as React.CSSProperties} className="card grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 p-6">
            <span className="text-figure row-span-2 text-[40px] leading-none text-survey">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="text-h3">{p.title}</h3>
            <p className="text-[15px] text-muted">{p.body}</p>
          </li>
        ))}
      </ol>
      <Disclaimer className="mt-6">{v.disclaimer}</Disclaimer>
    </Section>
  );
}

/** 12 · Golden Visa teaser: general wording, rules to be verified. */
export function GoldenVisaTeaser() {
  const g = copy.home.goldenVisa;
  return (
    <section id="golden-visa" aria-labelledby="h-golden-visa" className="on-dark relative overflow-hidden bg-datum py-16 text-sand md:py-24">
      <BrandMark variant="outline" id="gv-mark" animate={false} className="pointer-events-none absolute -right-10 top-1/2 h-[120%] w-auto -translate-y-1/2 text-sage opacity-[0.08]" />
      <div className="container-site relative grid gap-10 lg:grid-cols-2 lg:items-center">
        <div data-reveal className="grid gap-4">
          <p className="text-label">{g.label}</p>
          <h2 id="h-golden-visa" className="text-h2">{g.title}</h2>
          <p className="text-lede text-sand/85">{g.body}<Flag>{g.flag}</Flag></p>
          <Link href="/golden-visa" className="btn btn-plot mt-2 justify-self-start">{g.action}</Link>
        </div>
        <ul className="grid gap-3">
          {g.points.map((p, i) => (
            <li key={p} data-reveal style={{ '--i': i } as React.CSSProperties} className="flex items-center gap-4 rounded-brand border border-sage/25 bg-white/[0.04] p-5">
              <Icon name="check" className="size-5 shrink-0 text-plot" />{p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** 13 · How it works: four steps. */
export function HowItWorks() {
  const s = copy.home.steps;
  return (
    <Section id="how-it-works" tone="white" label={s.label} title={s.title}>
      <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {s.items.map((st, i) => (
          <li key={st.title} data-reveal style={{ '--i': i } as React.CSSProperties} className="relative grid content-start gap-3 border-t border-line-strong pt-6">
            <span aria-hidden="true" className="absolute -top-[5px] left-0 size-[9px] bg-survey" />
            <span className="text-label">Step {String(i + 1).padStart(2, '0')}</span>
            <h3 className="text-h3">{st.title}</h3>
            <p className="text-[15px] text-muted">{st.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/** 14 · Payment and mortgage helper (illustrative, in the browser only). Plan presets are the commonest splits in the data. */
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
    <Section id="calculator" tone="sand" label={c.label} title={c.title} intro={c.note}>
      <Calculator projects={projects} presets={presets} dldPercent={(await planStats()).dldPercent} />
    </Section>
  );
}

/** 15 · Quiz: four questions, ends in the enquiry form. */
export function QuizSection() {
  const q = copy.home.quiz;
  return (
    <Section id="quiz" tone="white" label={q.label} title={q.title} intro={q.intro}>
      <Quiz />
    </Section>
  );
}

/** 17 · Video strip: only when data/videos.json has entries. Click to load, no autoplay. */
export function Videos() {
  const v = copy.home.videos;
  const list = videos as { title: string; youtubeId: string }[];
  if (!list.length) return null;
  return (
    <Section id="videos" tone="white" label={v.label} title={v.title}>
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {list.map((x) => <li key={x.youtubeId} className="grid gap-3"><LiteVideo title={x.title} youtubeId={x.youtubeId} /><h3 className="text-h3">{x.title}</h3></li>)}
      </ul>
    </Section>
  );
}

/** 19 · Latest articles from the desk (and any older ones). Hidden while there are none. */
export async function NewsPreview() {
  const n = copy.home.news;
  return <LatestPosts id="news" label={n.label} title={n.title} action={n.action} tone="white" />;
}

/** 20 · FAQ: Dubai off-plan questions, answers built from the data, with FAQPage schema. */
export async function FaqSection() {
  const f = copy.home.faq;
  const items = (await marketFaqsFor()).slice(0, 10);
  return (
    <Section id="faq" tone="sand" label={f.label} title={f.title} action={<Link href="/faq" className="btn btn-secondary btn-sm">{f.action} <Icon name="arrow-right" className="size-4" /></Link>}>
      <div className="max-w-4xl"><Faq items={items} /></div>
    </Section>
  );
}

/** 21 · Final call to action with the enquiry form. Every "Register interest" button lands here (#register). */
export function RegisterBand({ projectSlug, title, source = 'register' }: { projectSlug?: string; title?: string; source?: 'register' | 'project' }) {
  const r = copy.home.register;
  return (
    <section id="register" aria-labelledby="h-register" className="on-dark relative overflow-hidden bg-datum py-16 text-sand md:py-24">
      <div aria-hidden="true" className="survey-grid pointer-events-none absolute inset-0 opacity-[0.1]" />
      <BrandMark variant="outline" id="rb-mark" animate={false} className="pointer-events-none absolute -left-16 bottom-0 h-[90%] w-auto text-sage opacity-[0.08]" />
      <div className="container-site relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="grid gap-5">
          <p className="text-label">{r.label}</p>
          <h2 id="h-register" className="text-display !text-[clamp(2.25rem,1.6rem+2.4vw,3.5rem)]">{title ?? r.title}</h2>
          <p className="text-lede max-w-lg text-sand/80">{r.lede}</p>
          <p className="flex flex-wrap gap-x-6 gap-y-2">
            {telHref() ? <a href={telHref()!} className="link-accent"><Icon name="phone" className="size-5" />{contact.phone.display}</a> : null}
            {mailHref() ? <a href={mailHref()!} className="link-accent break-all"><Icon name="mail" className="size-5" />{contact.email}</a> : null}
          </p>
        </div>
        <EnquiryForm source={source} projectSlug={projectSlug ?? null} title={r.formTitle} withMessage tone="dark" />
      </div>
    </section>
  );
}
