import { copy } from '@/site';
import { marketFaqsFor } from '@/data/faq';
import { pageMetadata } from '@/lib/seo';
import { RegisterBand } from '@/components/sections/MoreSections';
import { Faq } from '@/components/ui/Faq';
import { PageHero } from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';

const f = copy.pages.faq;
export const metadata = pageMetadata({ title: f.metaTitle, description: 'Answers on buying new launches in Dubai and the UAE: how many projects and areas, which developers, prices, payment plans, completion dates, fees and the Golden Visa.', path: '/faq' });

export default async function FaqPage() {
  return (
    <>
      <PageHero crumbs={[{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq' }]} label="FAQ" title={f.h1} lede="Answers built from the current project data. Each project page also has its own questions." />
      <Section id="faq" tone="sand"><div className="max-w-4xl"><Faq items={await marketFaqsFor()} /></div></Section>
      <RegisterBand />
    </>
  );
}
