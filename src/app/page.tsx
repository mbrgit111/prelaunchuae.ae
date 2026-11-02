import type { Metadata } from 'next';
import { copy } from '@/site';
import { siteStats } from '@/data/insights';
import { pageMetadata } from '@/lib/seo';
import { Hero } from '@/components/sections/Hero';
import { FeaturedProjects } from '@/components/sections/FeaturedProjects';
import { DevelopersSection } from '@/components/sections/DevelopersSection';
import { UnitTypesPlans } from '@/components/sections/UnitTypesPlans';
import { ClientStories } from '@/components/sections/ClientStories';
import { AlertsBand, AreasSection, HandoverSection, StatsStrip, TypesSection, WhyDubai } from '@/components/sections/HomeSections';
import {
  CalculatorSection, FaqSection, GoldenVisaTeaser, HowItWorks, InvestmentAngle, NewsPreview, QuizSection, RegisterBand,
  Videos,
} from '@/components/sections/MoreSections';

export async function generateMetadata(): Promise<Metadata> {
  const stats = await siteStats();
  return pageMetadata({
    ...copy.seo.home({ projects: stats.projects, selling: stats.selling, minPrice: stats.lowestPrice, areas: stats.areas }),
    absoluteTitle: true,
    path: '/',
  });
}

/** Home (header and footer come from the layout). Empty sections hide themselves. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <FeaturedProjects />
      <AlertsBand />
      <AreasSection />
      <TypesSection />
      <DevelopersSection />
      <UnitTypesPlans />
      <WhyDubai />
      <HandoverSection />
      <InvestmentAngle />
      <GoldenVisaTeaser />
      <HowItWorks />
      <ClientStories />
      <CalculatorSection />
      <QuizSection />
      <Videos />
      <NewsPreview />
      <FaqSection />
      <RegisterBand />
    </>
  );
}
