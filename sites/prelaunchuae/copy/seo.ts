/**
 * Search titles and descriptions. Titles are used exactly (no brand suffix added).
 * Counts, the lowest price and the year are filled in from the data at build time, so they never go stale.
 */
const year = () => new Date().getFullYear();
const aed = (n: number) => `AED ${n.toLocaleString('en-US')}`;

export const seo = {
  home: (f: { projects: number; selling: number; minPrice: number | null; areas?: number }) => ({
    title: `New Launch Projects in Dubai and the UAE: ${f.projects.toLocaleString('en-US')} Pre-Launches`,
    description: `See ${f.projects.toLocaleString('en-US')} pre-launch and new-launch projects in ${f.areas ?? 'every'} UAE areas${f.minPrice ? `, from ${aed(f.minPrice)}` : ''}. Payment plans, handover dates and floor plans from the developers, before the market sees them.`,
  }),
  projects: (f: { projects: number; developers: number }) => ({
    title: `All New Launch Projects in Dubai and the UAE (${year()})`,
    description: `Browse ${f.projects.toLocaleString('en-US')} launches from ${f.developers} developers across the UAE. Filter by emirate, area, unit type, budget and handover, then compare payment plans.`,
  }),
  areas: (f: { areas: number; projects: number }) => ({
    title: `UAE New Launch Areas: ${f.areas} Communities Compared`,
    description: `Projects in ${f.areas} communities across Dubai and the UAE, ${f.projects.toLocaleString('en-US')} in all. Compare each area by price, developer, payment plan and handover year.`,
  }),
  area: (f: { area: string; projects: number; minPrice: number | null }) => ({
    titles: [`Off-Plan Projects in ${f.area} (${year()})`, `Off-Plan in ${f.area}`, f.area],
    description: `${f.projects} project${f.projects === 1 ? '' : 's'} in ${f.area}${f.minPrice ? `, from ${aed(f.minPrice)}` : ''}. Compare developers, unit types, payment plans and handover dates.`,
  }),
  /** Developer pages with their own wording; used only while the named projects are on the page. */
  developers: {} as Record<string, { needs: string[]; title: string; description: string }>,
  goldenVisa: {
    title: 'UAE Golden Visa Through Property: Rules and Guide',
    description: 'How property can support a UAE Golden Visa, and what to check before buying off-plan. Rules change, so confirm them with the official source first.',
  },
  why: {
    title: 'Why Buy Off-Plan Property in Dubai',
    description: 'The general case for buying off-plan in Dubai: regulation, escrow, payment plans and planning, kept factual and checked.',
  },
};
