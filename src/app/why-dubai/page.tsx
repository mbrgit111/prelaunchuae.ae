import Link from 'next/link';
import { copy } from '@/site';
import { planStats, siteStats } from '@/data/insights';
import { pageMetadata } from '@/lib/seo';
import { InvestmentAngle, RegisterBand } from '@/components/sections/MoreSections';
import { WhyDubai } from '@/components/sections/HomeSections';
import { Flag } from '@/components/ui/Flag';
import { Icon } from '@/components/ui/Icon';
import { PageHero } from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';

const w = copy.pages.why;
export const metadata = pageMetadata({ ...copy.seo.why, absoluteTitle: true, path: '/why-dubai' });

/** Why Dubai, and why off-plan: general points (flagged until sourced), then the payment facts counted from the data. */
export default async function WhyDubaiPage() {
  const [s, plans] = await Promise.all([siteStats(), planStats()]);
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'Why Dubai', path: '/why-dubai' }]} label="Why Dubai" title={w.h1} highlight={w.highlight} lede={w.lede} />
      <WhyDubai linkToPage={false} />
      <Section id="off-plan" tone="white" label="Off-plan" title={w.offPlan.title} highlight={w.offPlan.highlight}>
        <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {w.offPlan.points.map((pt, i) => (
            <li key={pt.title} data-reveal style={{ '--i': i } as React.CSSProperties} className="card card-lift grid content-start gap-3 p-6 md:p-7">
              <span aria-hidden="true" className="text-figure text-[44px] leading-none text-gold/25">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="text-h3">{pt.title}</h3>
              <p className="text-body">{pt.body}<Flag>{'flag' in pt ? pt.flag : undefined}</Flag></p>
            </li>
          ))}
        </ol>
        <p className="mt-10 max-w-3xl border-l-2 border-gold pl-5 text-[17px] text-body">
          Of the <strong className="text-heading">{s.projects.toLocaleString('en-US')}</strong> projects listed, <strong className="text-gold">{plans.projectsWithPlans.toLocaleString('en-US')}</strong> publish a payment plan and <strong className="text-gold">{plans.withPostHandover}</strong> include payments after handover.
          {plans.common[0] ? <> The most common split is <strong className="text-heading">{plans.common[0].split}</strong>.</> : null}
        </p>
        <p className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          <Link href="/projects" className="btn btn-secondary btn-sm">Compare the projects <Icon name="arrow-right" className="size-4" /></Link>
          <Link href="/areas" className="btn btn-secondary btn-sm">Browse by area <Icon name="arrow-right" className="size-4" /></Link>
          <Link href="/golden-visa" className="btn btn-secondary btn-sm">Golden Visa guide <Icon name="arrow-right" className="size-4" /></Link>
        </p>
      </Section>
      <InvestmentAngle />
      <RegisterBand />
    </>
  );
}
