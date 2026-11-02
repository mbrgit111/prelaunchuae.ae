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
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'Why Dubai', path: '/why-dubai' }]} label="Why Dubai" title={w.h1} lede={w.lede} />
      <WhyDubai linkToPage={false} />
      <Section id="off-plan" tone="white" label="Off-plan" title={w.offPlan.title}>
        <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {w.offPlan.points.map((pt, i) => (
            <li key={pt.title} data-reveal style={{ '--i': i } as React.CSSProperties} className="relative grid content-start gap-3 border-t border-line-strong pt-6">
              <span aria-hidden="true" className="absolute -top-[5px] left-0 size-[9px] bg-survey" />
              <h3 className="text-h3">{pt.title}</h3>
              <p className="text-muted">{pt.body}<Flag>{'flag' in pt ? pt.flag : undefined}</Flag></p>
            </li>
          ))}
        </ol>
        <p className="mt-10 max-w-3xl text-[17px]">
          Of the {s.projects.toLocaleString('en-US')} projects listed, {plans.projectsWithPlans.toLocaleString('en-US')} publish a payment plan and {plans.withPostHandover} include payments after handover.
          {plans.common[0] ? ` The most common split is ${plans.common[0].split}.` : ''}
        </p>
        <p className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          <Link href="/projects" className="link-accent">Compare the projects <Icon name="arrow-right" className="size-4" /></Link>
          <Link href="/areas" className="link-accent">Browse by area <Icon name="arrow-right" className="size-4" /></Link>
          <Link href="/golden-visa" className="link-accent">Golden Visa guide <Icon name="arrow-right" className="size-4" /></Link>
        </p>
      </Section>
      <InvestmentAngle />
      <RegisterBand />
    </>
  );
}
