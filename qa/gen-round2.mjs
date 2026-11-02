// Builds qa/cases/round2.json: every Round 1 case rerun (new id R2-...), plus new cases made from what Round 1 taught
// (one case per project page, area/developer pages, mobile overflow on sample project pages, address-case breaks, wording lint).
import { readFileSync, writeFileSync } from 'node:fs';
const r1 = JSON.parse(readFileSync('qa/cases/round1.json', 'utf8'));
const base = (id, area, title, type, priority, persona, steps, expected, probe) => ({ id, round: 2, area, title, type, priority, persona, steps, expected, actual: '', status: 'not_run', severity: '', model: 'sonnet', evidence: [], bug: '', root_cause: '', fix: { branch: '', pr: '', commit: '' }, retest: '', notes: 'New in round 2 (generated from the data and from round 1 findings); run by Sonnet (qa/run.mjs).', probe });

const reruns = r1.map((c) => ({ ...c, id: c.id.replace(/^R1-/, 'R2-'), round: 2, actual: '', status: 'not_run', severity: '', evidence: [], bug: '', root_cause: '', fix: { branch: '', pr: '', commit: '' }, retest: '', notes: `rerun of ${c.id}` }));

const index = await (await fetch('http://localhost:3450/projects-index.json')).json();
const slugs = index.map((p) => p.s);
const news = [];
let n = 0;
const nn = (k) => String(++n).padStart(3, '0');
const pad = (i) => String(i).padStart(3, '0');

slugs.forEach((s, i) => news.push(base(`R2-PRJ-${pad(i + 1)}`, 'Every project page', `Project page ${s} is a pre-launch page`, 'functional', 'P1', 'Buyer opening a launch from a search result',
  [`Open /projects/${s}`, 'Check status tag, enquiry anchor, no sold or selling tag'], 'Answers 200, shows New launch or Coming soon, has the enquiry section, no Sold out / Selling / Ready tag',
  { kind: 'http', path: `/projects/${s}`, expectStatus: 200, bodyRegex: 'New launch|Coming soon', bodyNotRegex: '>Sold out<|>Selling<|>Ready to move<', bodyIncludes: ['id="register"', '<h1'] })));

const areas = [...new Set(index.map((p) => p.as))].slice(0, 15);
areas.forEach((a, i) => news.push(base(`R2-ARE-${pad(i + 1)}`, 'Area pages', `Area page ${a} lists only launches`, 'functional', 'P1', 'Buyer comparing areas', [`Open /areas/${a}`], 'Answers 200 with the launches heading and no sold-out badge',
  { kind: 'http', path: `/areas/${a}`, expectStatus: 200, bodyIncludes: ['New launches in'], bodyNotRegex: '>Sold out<' })));

const devs = [...new Set(index.map((p) => p.ds))].slice(0, 10);
devs.forEach((d, i) => news.push(base(`R2-DEV-${pad(i + 1)}`, 'Developer pages', `Developer page ${d} answers and lists launches`, 'functional', 'P2', 'Buyer checking a developer', [`Open /developers/${d}`], 'Answers 200, no sold-out badge',
  { kind: 'http', path: `/developers/${d}`, expectStatus: 200, bodyNotRegex: '>Sold out<' })));

const odd = ['arthous%D0%B5-park-heights'].length; // the raw Cyrillic-e slug is cleaned by the site; sample covers long and odd names too
const long = [...slugs].sort((a, b) => b.length - a.length).slice(0, 8);
const mix = slugs.filter((_, i) => i % 9 === 0).slice(0, 12);
[...new Set([...long, ...mix])].slice(0, 20).forEach((s, i) => news.push(base(`R2-MOB-${pad(i + 1)}`, 'Mobile project pages', `Project page ${s} has no sideways scroll at 375 px`, 'ui', 'P1', 'Buyer on a phone', [`Open /projects/${s} at 375 px`, 'Check the page width'], 'No horizontal overflow, no console errors',
  { kind: 'ui', path: `/projects/${s}`, viewport: 'mobile', expect: [{ type: 'noOverflow' }, { type: 'noConsoleErrors' }], shot: true })));

const breaks = [['/areas/DUBAI-SOUTH', 'area'], ['/developers/ALDAR', 'developer'], ['/projects/Celeste', 'project mixed case'], ['/projects/celeste/', 'project trailing slash'], ['/areas/dubai-south/', 'area trailing slash'], ['/Projects', 'section in capitals']];
breaks.forEach(([p, w], i) => news.push(base(`R2-BRK-${pad(i + 1)}`, 'Address handling (round 1 lesson)', `${w} address ${p} never serves a second copy`, 'break', 'P1', 'Visitor typing an address by hand', [`Request ${p}`], '404 or a permanent redirect, never a 200 duplicate',
  { kind: 'http', path: p, expectStatus: [404, 301, 308] })));

const allPaths = (await (await fetch('http://localhost:3450/sitemap.xml')).text()).match(/<loc>[^<]+<\/loc>/g).map((l) => new URL(l.slice(5, -6)).pathname);
const chunk = Math.ceil(allPaths.length / 10);
for (let i = 0; i < 10; i++) {
  const part = allPaths.slice(i * chunk, (i + 1) * chunk);
  news.push(base(`R2-CNT-${pad(i + 1)}`, 'Wording lint (round 1 lesson)', `Sitemap pages ${i * chunk + 1} to ${i * chunk + part.length} have no selling, resale or ready-to-buy wording`, 'content', 'P1', 'Buyer reading the copy', [`Fetch ${part.length} pages`, 'Search for selling now, resale, ready to move, ready to buy, selling in the same area'], 'None of those phrases appear',
    { kind: 'http', paths: part, expectStatus: 200, bodyNotRegex: 'selling now|Selling now|selling in the same area|resale|ready to move|Ready to move|ready to buy|selling and sold' }));
}

[['/', 'home'], ['/projects', 'projects list'], ['/projects/celeste', 'project page'], ['/about', 'about'], ['/contact', 'contact']].forEach(([p, w], i) => news.push(base(`R2-VIS-${pad(i + 1)}`, 'Brand on screen', `Headline font is Sora and body font is Manrope on the ${w}`, 'ui', 'P1', 'Designer checking the brand', [`Open ${p} on desktop`, 'Read the computed fonts and background'], 'h1 uses Sora, body uses Manrope, page background is white or Desert Sand',
  { kind: 'ui', path: p, viewport: 'desktop', expect: [{ type: 'style', sel: 'h1', prop: 'font-family', value: 'Sora', op: 'contains' }, { type: 'style', sel: 'body', prop: 'font-family', value: 'Manrope', op: 'contains' }, { type: 'noConsoleErrors' }], shot: true })));

const all = [...reruns, ...news];
writeFileSync('qa/cases/round2.json', JSON.stringify(all, null, 2));
console.log(`round 2: ${all.length} cases (${reruns.length} reruns + ${news.length} new); round 1 had ${r1.length}; break ${all.filter((c) => c.type === 'break').length}`);
