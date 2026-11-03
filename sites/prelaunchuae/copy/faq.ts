/** UAE off-plan FAQ. Answers that state numbers are built from the data at build time. */
import { list } from './templates.ts';

export interface FaqFacts {
  projects: number;
  selling: number;
  comingSoon: number;
  soldOut: number;
  ready: number;
  areas: number;
  emirates: string[];
  topAreas: string[];
  developers: string[];
  developerCount: number;
  maxBedrooms: number | null;
  townhouseVillaProjects: number;
  lowestPrice: number | null;
  withPlans: number;
  withPostHandover: number;
  commonSplits: string[];
  handoverFrom: number | null;
  handoverTo: number | null;
  dldPercent: number | null;
  dldPlans: number;
  asOf: string; // "4 October 2026"
}

export interface FaqItem { q: string; a: string; flag?: string }

const aed = (n: number) => `AED ${Math.round(n).toLocaleString('en-US')}`;

export function marketFaqs(f: FaqFacts): FaqItem[] {
  const items: FaqItem[] = [
    {
      q: 'What does off-plan mean?',
      a: 'Buying off-plan means buying a home before it is built, or while it is being built, usually on a payment plan spread across construction. You receive the keys at handover.',
    },
    {
      q: 'How many launches does PrelaunchUAE list?',
      a: `${f.projects.toLocaleString('en-US')} pre-launch and new-launch projects in ${f.areas} areas across ${f.emirates.length === 1 ? f.emirates[0] : list(f.emirates)}: ${f.selling.toLocaleString('en-US')} launching now and ${f.comingSoon} announced (project data as of ${f.asOf}). Projects that are already on sale or sold out are not listed.`,
    },
    {
      q: 'Which areas have the most projects?',
      a: `By number of projects listed: ${list(f.topAreas.slice(0, 5))}. Each area has its own page comparing its projects.`,
    },
    {
      q: 'Which developers are building in the UAE?',
      a: `The listed projects come from ${f.developerCount} developers, including ${list(f.developers.slice(0, 6))}.`,
    },
    {
      q: 'What types of home can I buy off-plan?',
      a: `Apartments${f.maxBedrooms ? ` from studios up to ${f.maxBedrooms} bedrooms` : ''}${f.townhouseVillaProjects ? `, plus townhouses and villas in ${f.townhouseVillaProjects} projects` : ''}. Each project page lists the unit types, sizes and prices the developer has published.`,
    },
  ];
  if (f.lowestPrice)
    items.push({
      q: 'What do off-plan prices start from?',
      a: `The lowest published starting price among the launches listed is ${aed(f.lowestPrice)}, subject to availability. Prices move as units sell, so we confirm the current figure with the developer before you commit.`,
    });
  items.push({
    q: 'How do off-plan payment plans work?',
    a: `Payments are split across booking, construction and handover, and some plans continue after handover. ${f.withPlans} of the listed projects publish a plan.${f.commonSplits.length ? ` Common splits include ${list(f.commonSplits)} (booking / construction / handover, then any payments after handover).` : ''}${f.withPostHandover ? ` ${f.withPostHandover} projects offer payments after handover.` : ''}`,
  });
  if (f.handoverFrom)
    items.push({
      q: 'When are the listed projects due to complete?',
      a: `Scheduled completions run from ${f.handoverFrom} to ${f.handoverTo}. Dates can change, and each project page shows the developer’s latest.`,
    });
  if (f.dldPercent)
    items.push({
      q: 'What fees apply when buying off-plan?',
      a: `In the payment schedules that list fees, a Dubai Land Department (DLD) registration fee of ${f.dldPercent}% is due at booking (${f.dldPlans} plans). Other fees vary by developer; we list them before you reserve.`,
    });
  items.push(
    {
      q: 'Can buying off-plan lead to a Golden Visa?',
      a: 'Some property owners qualify for a UAE Golden Visa, depending on the property value and the current rules, including how off-plan property is treated. We check the rules that apply on the day you reserve.',
      flag: 'VERIFY CURRENT RULES',
    },
    {
      q: 'How do I register my interest?',
      a: 'Use any “Register interest” form on this site. An advisor replies with current availability, floor plans and payment plans.',
    },
  );
  return items;
}
