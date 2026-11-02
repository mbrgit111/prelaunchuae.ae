// npm run check:data  — runs the same checks as the build and prints a plain-English summary.
// Optional: --dir <folder> to check a different copy of the data files.
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadSiteData } from '../src/data/read.ts';
import { DataError } from '../src/data/normalise.ts';

const site = process.env.NEXT_PUBLIC_SITE ?? 'prelaunchuae';
const { config } = await import(`../sites/${site}/site.config.ts`);
const dirArg = process.argv.indexOf('--dir');
const dir = dirArg > -1 ? process.argv[dirArg + 1] : undefined;

try {
  const data = loadSiteData({ scope: config.scope, communityName: config.community.name, alsoDistricts: config.community.alsoDistricts, renameAreas: config.community.renameAreas, dir });
  const by = <T,>(xs: T[], f: (x: T) => string) => xs.reduce<Record<string, number>>((m, x) => ((m[f(x)] = (m[f(x)] ?? 0) + 1), m), {});
  const ps = data.projects;
  console.log(`Data OK (exported ${data.fetchedAt.slice(0, 10)})`);
  console.log(`  Projects: ${ps.length}  ${JSON.stringify(by(ps, (p) => p.status))}`);
  console.log(`  Developers: ${data.developers.length} | Posts: ${data.posts.length}`);
  console.log(`  With a "From" price: ${ps.filter((p) => p.priceFrom).length} | with a payment plan: ${ps.filter((p) => p.paymentPlans.length).length} | with unit rows: ${ps.filter((p) => p.units.length).length}`);
  console.log(`  Pictures ready: covers ${ps.filter((p) => p.cover).length}/${ps.length}, gallery ${ps.reduce((n, p) => n + p.gallery.length, 0)}, floor plans ${ps.reduce((n, p) => n + p.units.filter((u) => u.floorPlan).length, 0)}, amenities ${ps.reduce((n, p) => n + p.amenities.filter((a) => a.image).length, 0)}, logos ${data.developers.filter((d) => d.logo).length}/${data.developers.length}`);
  // Notes describe how the portal data was handled. Only "attention" items need someone to do something.
  const LABEL: Record<string, string> = {
    'price-mismatch': 'Headline price differs from the cheapest available unit (the site shows the cheapest available)',
    'price-implausible': 'Portal price is a typing error (the site uses the developer\'s unit table instead)',
    'plan-total': 'Payment plan does not add up to 100% in the portal (hidden)',
    teaser: 'Announced without dates or units (shown as "Coming soon")',
    'no-price': 'No price published (shown as "On request")',
    'no-property-type': 'No property type in the portal (left out of the type filters)',
    'multi-district': 'Linked to more than one district in the portal (filed under the first)',
    'media-unavailable': 'Pictures removed or replaced at the portal since the export (left out)',
    'media-missing': 'Pictures that could not be downloaded this time',
  };
  const ATTENTION = new Set(['media-missing', 'out-of-scope', 'no-permit']);
  const groups = by(data.issues, (i) => i.code);
  const attention = data.issues.filter((i) => ATTENTION.has(i.code));
  const notes = data.issues.filter((i) => !ATTENTION.has(i.code));

  const md = [
    '# Data notes',
    '',
    `Made by the data check from the portal export of ${data.fetchedAt.slice(0, 10)}. **None of these stops the site or needs fixing in the code.**`,
    'They record how odd entries in the portal were handled, so MBR can correct them in the portal if it wants to.',
    '',
    `## Needs attention (${attention.length})`,
    '',
    ...(attention.length ? attention.map((i) => `- ${i.message}`) : ['Nothing.']),
    '',
    ...Object.entries(groups).filter(([code]) => !ATTENTION.has(code)).flatMap(([code, n]) => [
      `## ${LABEL[code] ?? code} (${n})`,
      '',
      ...data.issues.filter((x) => x.code === code).map((i) => `- ${i.message}`),
      '',
    ]),
  ];
  mkdirSync('reports', { recursive: true });
  writeFileSync('reports/data-notes.md', md.join('\n'));

  if (process.argv.includes('--build')) {
    // The build log stays short: a pass line, and anything that really needs a person.
    console.log(`  Data check passed. ${attention.length ? `${attention.length} item(s) need attention:` : 'Nothing needs fixing.'}`);
    for (const i of attention) console.log(`     - ${i.message}`);
    console.log(`  ${notes.length} notes on how portal entries were handled (not errors) are in reports/data-notes.md.`);
  } else {
    console.log(`\nNeeds attention (${attention.length}):${attention.length ? '' : ' nothing.'}`);
    for (const i of attention) console.log(`  - ${i.message}`);
    console.log(`\nNotes on how portal entries were handled (${notes.length}; not errors, full list in reports/data-notes.md):`);
    for (const [code, n] of Object.entries(groups)) {
      if (ATTENTION.has(code)) continue;
      console.log(`  ${n} x ${LABEL[code] ?? code}`);
      for (const i of data.issues.filter((x) => x.code === code).slice(0, 2)) console.log(`     e.g. ${i.message}`);
    }
  }
} catch (e) {
  if (e instanceof DataError) {
    console.error(e.message);
    process.exit(1);
  }
  throw e;
}
