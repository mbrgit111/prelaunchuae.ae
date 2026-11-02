/**
 * Sentence templates that turn data into PrelaunchUAE's own text. Only facts present in the data are used.
 * The developers' own long descriptions are never published: they are marketing copy that promises returns.
 * The wording differs from Dubai South Capital's templates, so the two sites never show the same text.
 */
import type { Developer, Project } from '../../../src/data/types.ts';

const aed = (n: number) => `AED ${Math.round(n).toLocaleString('en-US')}`;
export const list = (xs: string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "studio to 3 bedroom", "1 and 2 bedroom": the adjective form used before "apartments". */
export function bedroomsAdjective(bedrooms: string[]): string | null {
  if (!bedrooms.length) return null;
  const names = bedrooms.map((b) => (b === '0' ? 'studio' : b));
  const nums = bedrooms.map(Number);
  const contiguous = names.length >= 3 && nums.every((n, i) => Number.isInteger(n) && (i === 0 || n - nums[i - 1]! === 1));
  const last = names.at(-1)!;
  const tail = last === 'studio' ? '' : ' bedroom';
  if (names.length === 1) return `${last}${tail}`;
  if (contiguous) return `${names[0]} to ${last}${tail}`;
  return `${list(names)}${tail}`;
}

const TYPE_WORD: Record<string, [string, string]> = {
  apartment: ['apartment', 'apartments'],
  townhouse: ['townhouse', 'townhouses'],
  villa: ['villa', 'villas'],
  commercial: ['commercial unit', 'commercial units'],
};

export function homesPhrase(p: Project): string | null {
  const types = p.propertyTypes.map((t) => TYPE_WORD[t]![1]);
  if (!types.length) return null;
  const beds = bedroomsAdjective(p.bedrooms);
  if (beds && p.propertyTypes.length === 1) return `${beds} ${types[0]}`;
  return beds ? `${list(types)} (${beds})` : list(types);
}

const STAGE: Record<Project['status'], string> = {
  'new-launch': 'newly launched',
  available: 'selling off-plan',
  'coming-soon': 'announced and due to launch',
  'sold-out': 'sold out',
};
const stage = (p: Project) => (p.status === 'available' && p.completion === 'ready' ? 'complete and still selling' : STAGE[p.status]);
const sellingNow = (p: Project) => p.status === 'available' || p.status === 'new-launch';

export function projectIntro(p: Project): string[] {
  const homes = homesPhrase(p);
  if (p.isTeaser) {
    return [`${p.developerName} has announced ${p.name} in ${p.communityName}, ${p.emirate}. The unit mix, prices and payment plan are not released yet; register your interest and we will send them when they are.`];
  }
  const first = `${p.name} in ${p.communityName}, ${p.emirate}, is ${stage(p)}, developed by ${p.developerName}${homes ? `. It ${p.status === 'sold-out' ? 'offered' : 'offers'} ${homes}` : ''}.`;
  const facts: string[] = [];
  if (p.status === 'sold-out') facts.push('The developer reports every unit as sold. Ask us about resale units here, or similar projects nearby that are still selling.');
  else if (p.priceFrom) facts.push(`The lowest published price is ${aed(p.priceFrom)}${p.priceSource === 'available' ? ' for a unit available now' : ''}, subject to availability.`);
  else facts.push('The developer shares prices on request.');
  if (p.completion === 'ready') facts.push('Construction is complete.');
  else if (p.handover.label) facts.push(`Completion is scheduled for ${p.handover.label}.`);
  if (p.paymentPlans.length === 1) facts.push(`Payments follow a ${p.paymentPlanLabel} plan${p.hasPostHandover ? ' that continues after handover' : ''}.`);
  else if (p.paymentPlans.length > 1) facts.push(`There is a choice of ${p.paymentPlans.length} payment plans${p.hasPostHandover ? ', some running past handover' : ''}.`);
  if (p.totalUnits && p.availableUnits != null && p.status !== 'sold-out') facts.push(`${p.availableUnits} of its ${plural(p.totalUnits, 'unit')} ${p.availableUnits === 1 ? 'is' : 'are'} listed as available.`);
  if (p.amenities.length) facts.push(`On site: ${list(p.amenities.slice(0, 3).map((a) => a.name.toLowerCase()))}${p.amenities.length > 3 ? ' and more' : ''}.`);
  return [first, facts.join(' ')];
}

export function projectDescription(p: Project): string {
  const homes = homesPhrase(p);
  return [
    `${p.name}, ${p.communityName}, by ${p.developerName}.`,
    homes ? `${homes.charAt(0).toUpperCase()}${homes.slice(1)}.` : null,
    p.priceFrom ? `Prices from ${aed(p.priceFrom)}.` : null,
    p.handover.label ? (p.completion === 'ready' ? 'Ready to move.' : `Completion ${p.handover.label}.`) : null,
    p.paymentPlanLabel ? `${p.paymentPlanLabel.includes('/') ? `${p.paymentPlanLabel} payment plan` : p.paymentPlanLabel}.` : null,
  ]
    .filter(Boolean)
    .join(' ');
}

export function projectFaqs(p: Project): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  out.push({ q: `Which developer is building ${p.name}?`, a: `${p.developerName}. Other ${p.developerName} projects listed on PrelaunchUAE are linked from the developer page.` });
  out.push({
    q: `Where is ${p.name}?`,
    a: `In ${p.communityName}, ${p.emirate}.${p.nearby.length ? ` The developer lists ${list(p.nearby.slice(0, 3).map((n) => (n.time ? `${n.name} (around ${n.time})` : n.name)))} nearby.` : ''}`,
  });
  if (p.status === 'sold-out') out.push({ q: `Can I still buy at ${p.name}?`, a: 'The developer reports it as sold out. Resale units sometimes come up; tell us what you are looking for and we will check, or suggest similar projects that are still selling.' });
  else out.push({
    q: `How much does ${p.name} cost?`,
    a: p.priceFrom ? `From ${aed(p.priceFrom)}, subject to availability. Prices change as units sell, so we confirm the figure with the developer before you reserve.` : 'No price has been published yet. Register your interest and an advisor will send it when the developer releases it.',
  });
  if (p.bedroomsLabel || p.propertyTypeLabels.length)
    out.push({ q: `What can I buy at ${p.name}?`, a: `${homesPhrase(p) ? `${homesPhrase(p)!.charAt(0).toUpperCase()}${homesPhrase(p)!.slice(1)}` : p.propertyTypeLabels.join(', ')}.${p.units.length ? ' The table on this page lists sizes and prices by unit type.' : ''}` });
  out.push({
    q: `When will ${p.name} be completed?`,
    a: p.completion === 'ready' ? 'It is already complete.' : p.handover.label ? `The developer’s scheduled completion is ${p.handover.label}. Schedules can move; we check the latest date for you.` : 'The developer has not published a completion date yet.',
  });
  if (p.paymentPlans.length)
    out.push({
      q: `How do the payments work at ${p.name}?`,
      a: p.paymentPlans.length === 1 ? `The plan is ${p.paymentPlanLabel}: paid across booking, construction${p.hasPostHandover ? ', handover and the period after handover' : ' and handover'}. Each stage is set out on this page.` : `${p.paymentPlans.length} plans are published, each set out on this page with its stages and fees.`,
    });
  return out;
}

export function developerIntro(d: Developer, projects: Project[]): string {
  const years = projects.filter((p) => p.completion !== 'ready' && p.handover.year).map((p) => p.handover.year!);
  const prices = projects.filter((p) => p.priceFrom).map((p) => p.priceFrom!);
  const areas = [...new Set(projects.map((p) => p.communityName))];
  const selling = projects.filter(sellingNow).length;
  const emirates = [...new Set(projects.map((p) => p.emirate))];
  const parts = [
    `${d.name} has ${projects.length === 1 ? 'one project' : `${projects.length} projects`} listed${emirates.length === 1 ? ` in ${emirates[0]}` : ` across ${list(emirates)}`}${areas.length === 1 ? `, in ${areas[0]}` : areas.length <= 4 ? `, in ${list(areas)}` : `, in ${areas.length} areas`}${projects.length > 1 ? `; ${selling ? `${selling} ${selling === 1 ? 'is' : 'are'} selling now` : 'none is selling now'}` : ''}.`,
    years.length ? (Math.min(...years) === Math.max(...years) ? `Completion is scheduled for ${years[0]}.` : `Scheduled completions run from ${Math.min(...years)} to ${Math.max(...years)}.`) : null,
    prices.length ? `The lowest published price is ${aed(Math.min(...prices))}, subject to availability.` : null,
  ];
  return parts.filter(Boolean).join(' ');
}

/** The opening paragraph of an area page, from that area's projects only. */
export function areaIntro(area: string, projects: Project[]): string {
  const devs = [...new Set(projects.map((p) => p.developerName))];
  const selling = projects.filter(sellingNow).length;
  const prices = projects.filter((p) => p.priceFrom).map((p) => p.priceFrom!);
  const years = projects.filter((p) => p.completion !== 'ready' && p.handover.year).map((p) => p.handover.year!);
  const types = [...new Set(projects.flatMap((p) => p.propertyTypes))].map((t) => TYPE_WORD[t]![1]);
  return [
    `${area} has ${plural(projects.length, 'project')} listed, from ${devs.length <= 3 ? list(devs) : `${devs.length} developers`}: ${selling} launching now.`,
    types.length ? `${types.length === 1 ? `All are ${types[0]}` : `Homes on offer: ${list(types)}`}.` : null,
    prices.length ? `Published prices start at ${aed(Math.min(...prices))}.` : null,
    years.length ? (Math.min(...years) === Math.max(...years) ? `Completion is scheduled for ${years[0]}.` : `Scheduled completions run from ${Math.min(...years)} to ${Math.max(...years)}.`) : null,
  ].filter(Boolean).join(' ');
}

export function areaFaqs(area: string, projects: Project[]): { q: string; a: string }[] {
  const devs = [...new Set(projects.map((p) => p.developerName))];
  const prices = projects.filter((p) => p.priceFrom).map((p) => p.priceFrom!);
  const withPlans = projects.filter((p) => p.paymentPlans.length);
  const post = projects.filter((p) => p.hasPostHandover).length;
  const years = projects.filter((p) => p.completion !== 'ready' && p.handover.year).map((p) => p.handover.year!);
  const out = [
    { q: `How many projects are selling in ${area}?`, a: `${projects.filter(sellingNow).length} of the ${plural(projects.length, 'project')} listed here, from ${plural(devs.length, 'developer')}. The list on this page shows each one with its price, plan and completion date.` },
    { q: `Who is building in ${area}?`, a: `${list(devs.slice(0, 6))}${devs.length > 6 ? `, and ${devs.length - 6} more` : ''}.` },
  ];
  if (prices.length) out.push({ q: `What do new homes in ${area} cost?`, a: `Published starting prices range from ${aed(Math.min(...prices))} to ${aed(Math.max(...prices))}, depending on the project and unit. All prices are subject to availability.` });
  if (withPlans.length) out.push({ q: `Are there payment plans in ${area}?`, a: `${plural(withPlans.length, 'project')} publish a payment plan${post ? `, and ${post} include payments after handover` : ''}.` });
  if (years.length) out.push({ q: `When do projects in ${area} complete?`, a: Math.min(...years) === Math.max(...years) ? `Scheduled completion is ${years[0]}.` : `Scheduled completions run from ${Math.min(...years)} to ${Math.max(...years)}. Dates can move; each project page shows the developer’s latest.` });
  return out;
}
